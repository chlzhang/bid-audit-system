from typing import Dict, Any, List, Optional
import json
import logging
from docx import Document
from app.services.document.parser import DocumentParser
from app.services.llm.service import llm_service

logger = logging.getLogger(__name__)

MAX_LLM_CHARS = 180000


class AuditService:
    def __init__(self):
        self.parser = DocumentParser()

    async def perform_audit(
        self,
        template_path: str,
        project_path: str,
        context: str = None
    ) -> Dict[str, Any]:
        # Open documents once and reuse
        template_doc = Document(template_path)
        project_doc = Document(project_path)

        template_text = self.parser.get_full_text(doc=template_doc)
        project_text = self.parser.get_full_text(doc=project_doc)

        diff_result = await self._analyze_differences(template_text, project_text, context)
        compliance_result = await self._check_compliance(project_text)

        result = self._merge_results(diff_result, compliance_result)
        return result

    def _truncate_text(self, text: str, max_chars: int) -> str:
        if len(text) <= max_chars:
            return text
        truncated = text[:max_chars]
        last_break = max(
            truncated.rfind("\n\n"),
            truncated.rfind("。"),
            truncated.rfind(". "),
            truncated.rfind("\n"),
        )
        if last_break > max_chars // 2:
            truncated = truncated[:last_break + 1]
        return truncated + "\n\n[内容已截断，全文共 %d 字符]" % len(text)

    async def _analyze_differences(
        self,
        template_content: str,
        project_content: str,
        context: str = None
    ) -> Dict[str, Any]:
        try:
            response = await llm_service.analyze_document_diff(
                template_content,
                project_content,
                context
            )
            result = json.loads(response)
            return result
        except json.JSONDecodeError as e:
            logger.warning("LLM JSON parse failed: %s", e)
            return {
                "differences": [],
                "summary": "分析结果解析失败",
                "risk_level": "medium",
                "raw_response": response
            }
        except Exception as e:
            logger.exception("LLM analysis failed")
            return {
                "differences": [],
                "summary": f"分析失败: {str(e)}",
                "risk_level": "medium"
            }

    async def _check_compliance(self, content: str) -> Dict[str, Any]:
        try:
            response = await llm_service.check_compliance(content)
            result = json.loads(response)
            return result
        except json.JSONDecodeError:
            logger.warning("Compliance JSON parse failed")
            return {"compliance_issues": []}
        except Exception:
            logger.exception("Compliance check failed")
            return {"compliance_issues": []}

    def _merge_results(
        self,
        diff_result: Dict[str, Any],
        compliance_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        differences = diff_result.get("differences", [])

        compliance_issues = compliance_result.get("compliance_issues", [])
        for issue in compliance_issues:
            issue["type"] = "compliance_issue"
            differences.append(issue)

        high_count = sum(1 for d in differences if d.get("risk_level") == "high")
        medium_count = sum(1 for d in differences if d.get("risk_level") == "medium")
        low_count = sum(1 for d in differences if d.get("risk_level") == "low")

        if high_count > 0:
            overall_risk = "high"
        elif medium_count > 0:
            overall_risk = "medium"
        else:
            overall_risk = "low"

        return {
            "differences": differences,
            "total_differences": len(differences),
            "high_risk_count": high_count,
            "medium_risk_count": medium_count,
            "low_risk_count": low_count,
            "overall_risk_level": overall_risk,
            "summary": diff_result.get("summary", "")
        }

    def generate_report(self, audit_result: Dict[str, Any]) -> str:
        report = []
        report.append("=" * 60)
        report.append("招标技术文件审核报告")
        report.append("=" * 60)
        report.append("")

        report.append("总体风险等级: %s" % audit_result.get("overall_risk_level", "N/A").upper())
        report.append("差异总数: %d" % audit_result.get("total_differences", 0))
        report.append("高风险: %d" % audit_result.get("high_risk_count", 0))
        report.append("中风险: %d" % audit_result.get("medium_risk_count", 0))
        report.append("低风险: %d" % audit_result.get("low_risk_count", 0))
        report.append("")

        report.append("审核摘要:")
        report.append(audit_result.get("summary", ""))
        report.append("")

        report.append("-" * 60)
        report.append("详细差异清单")
        report.append("-" * 60)

        for i, diff in enumerate(audit_result.get("differences", []), 1):
            report.append("\n%d. [%s] %s" % (i, diff.get("risk_level", "N/A").upper(), diff.get("category", "未分类")))
            report.append("   类型: %s" % diff.get("type", "N/A"))
            report.append("   位置: %s" % diff.get("location", "N/A"))
            report.append("   模板内容: %s" % diff.get("template_content", "N/A"))
            report.append("   项目内容: %s" % diff.get("project_content", "N/A"))
            report.append("   描述: %s" % diff.get("description", "N/A"))
            report.append("   建议: %s" % diff.get("suggestion", "N/A"))

        return "\n".join(report)


audit_service = AuditService()
