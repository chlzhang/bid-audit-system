from typing import Dict, Any, List
import json
from app.services.document.parser import DocumentParser
from app.services.llm.service import llm_service


class AuditService:
    def __init__(self):
        self.parser = DocumentParser()
    
    async def perform_audit(
        self,
        template_path: str,
        project_path: str,
        context: str = None
    ) -> Dict[str, Any]:
        template_data = self.parser.parse_docx(template_path)
        project_data = self.parser.parse_docx(project_path)
        
        template_text = self.parser.get_full_text(template_path)
        project_text = self.parser.get_full_text(project_path)
        
        diff_result = await self._analyze_differences(template_text, project_text, context)
        
        compliance_result = await self._check_compliance(project_text)
        
        result = self._merge_results(diff_result, compliance_result)
        
        return result
    
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
        except json.JSONDecodeError:
            return {
                "differences": [],
                "summary": "分析结果解析失败",
                "risk_level": "medium",
                "raw_response": response
            }
        except Exception as e:
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
        except:
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
        
        report.append(f"总体风险等级: {audit_result.get('overall_risk_level', 'N/A').upper()}")
        report.append(f"差异总数: {audit_result.get('total_differences', 0)}")
        report.append(f"高风险: {audit_result.get('high_risk_count', 0)}")
        report.append(f"中风险: {audit_result.get('medium_risk_count', 0)}")
        report.append(f"低风险: {audit_result.get('low_risk_count', 0)}")
        report.append("")
        
        report.append("审核摘要:")
        report.append(audit_result.get("summary", ""))
        report.append("")
        
        report.append("-" * 60)
        report.append("详细差异清单")
        report.append("-" * 60)
        
        for i, diff in enumerate(audit_result.get("differences", []), 1):
            report.append(f"\n{i}. [{diff.get('risk_level', 'N/A').upper()}] {diff.get('category', '未分类')}")
            report.append(f"   类型: {diff.get('type', 'N/A')}")
            report.append(f"   位置: {diff.get('location', 'N/A')}")
            report.append(f"   模板内容: {diff.get('template_content', 'N/A')}")
            report.append(f"   项目内容: {diff.get('project_content', 'N/A')}")
            report.append(f"   描述: {diff.get('description', 'N/A')}")
            report.append(f"   建议: {diff.get('suggestion', 'N/A')}")
        
        return "\n".join(report)


audit_service = AuditService()
