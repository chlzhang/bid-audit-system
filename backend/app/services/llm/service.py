from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
import openai
import anthropic
from app.core.config import settings


class LLMProvider(ABC):
    @abstractmethod
    async def analyze(self, prompt: str, system_prompt: str = None) -> str:
        pass


class OpenAIProvider(LLMProvider):
    def __init__(self, model: str = None):
        self.client = openai.AsyncOpenAI(
            api_key=settings.OPENAI_API_KEY,
            base_url=settings.OPENAI_API_BASE
        )
        self.model = model or settings.DEFAULT_LLM_MODEL
    
    async def analyze(self, prompt: str, system_prompt: str = None) -> str:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})
        
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=messages,
            temperature=0.1
        )
        return response.choices[0].message.content


class AnthropicProvider(LLMProvider):
    def __init__(self, model: str = "claude-3-sonnet-20240229"):
        self.client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
        self.model = model
    
    async def analyze(self, prompt: str, system_prompt: str = None) -> str:
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system_prompt or "",
            messages=[{"role": "user", "content": prompt}]
        )
        return response.content[0].text


class LLMService:
    def __init__(self):
        self.providers = {}
        self._init_providers()
    
    def _init_providers(self):
        if settings.OPENAI_API_KEY:
            default_model = settings.DEFAULT_LLM_MODEL
            self.providers["openai"] = OpenAIProvider(model=default_model)
            self.providers[default_model] = OpenAIProvider(model=default_model)
        
        if settings.ANTHROPIC_API_KEY:
            self.providers["anthropic"] = AnthropicProvider()
            self.providers["claude"] = AnthropicProvider()
    
    def get_provider(self, model: str = None) -> LLMProvider:
        if model and model in self.providers:
            return self.providers[model]
        
        default_model = settings.DEFAULT_LLM_MODEL
        if default_model in self.providers:
            return self.providers[default_model]
        
        if self.providers:
            return list(self.providers.values())[0]
        
        raise ValueError("没有可用的LLM provider，请配置API key")
    
    async def analyze_document_diff(
        self,
        template_content: str,
        project_content: str,
        context: str = None
    ) -> str:
        system_prompt = """你是一个专业的招标技术文件审核专家。你的任务是对比分析标准化技术文件模板和项目招标技术文件的差异。

请从以下几个方面进行分析：
1. 技术参数差异：检查参数值是否超出模板范围
2. 设备选型变更：检查设备型号、品牌是否变更
3. 技术条款变更：检查技术条款是否修改、新增或删除
4. 合规性问题：检查是否符合国家标准和行业规范

请以JSON格式返回分析结果，包含以下字段：
{
    "differences": [
        {
            "type": "param_diff|equipment_change|clause_change|compliance_issue",
            "category": "类别",
            "location": "位置描述",
            "template_content": "模板内容",
            "project_content": "项目内容",
            "risk_level": "high|medium|low",
            "description": "差异描述",
            "suggestion": "修改建议"
        }
    ],
    "summary": "总体评估",
    "risk_level": "high|medium|low"
}"""
        
        prompt = f"""请对比分析以下两个技术文件的差异：

【标准化技术文件模板】
{template_content[:3000]}

【项目招标技术文件】
{project_content[:3000]}
"""
        
        if context:
            prompt += f"\n\n【补充信息】\n{context}"
        
        provider = self.get_provider()
        return await provider.analyze(prompt, system_prompt)
    
    async def check_compliance(
        self,
        content: str,
        standards: list = None
    ) -> str:
        system_prompt = """你是一个合规性检查专家。请检查技术文件内容是否符合相关标准规范。

检查标准包括：
- GB国家标准
- DL/T电力行业标准
- 企业内部标准

请以JSON格式返回检查结果。"""
        
        standards_str = "、".join(standards) if standards else "GB国家标准、DL/T电力行业标准"
        prompt = f"""请检查以下技术文件内容是否符合{standards_str}的要求：

{content[:4000]}

请指出不符合项并给出修改建议。"""
        
        provider = self.get_provider()
        return await provider.analyze(prompt, system_prompt)


llm_service = LLMService()
