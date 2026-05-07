import os
import json
import logging
from typing import List, Dict, Any
import google.generativeai as genai

logger = logging.getLogger(__name__)

class AIService:
    _instance = None
    _initialized = False

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(AIService, cls).__new__(cls)
        return cls._instance

    def __init__(self):
        # We don't initialize here to prevent blocking imports
        pass

    def _ensure_initialized(self):
        if not self._initialized:
            logger.info("🤖 Initializing AI Service (Lazy)...")
            self.api_key = os.getenv("GEMINI_API_KEY")
            if not self.api_key:
                logger.error("CRITICAL: GEMINI_API_KEY not found!")
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-1.5-flash')
            self._initialized = True
            logger.info("✅ AI Service Initialized.")

    async def extract_tender_criteria_visual(self, image_parts: list, text_context: str = "") -> Dict[str, Any]:
        """
        DUAL-PATH EXTRACTION: Analyzes both visual images and digital text context for max accuracy.
        """
        self._ensure_initialized()
        
        if not image_parts and not text_context:
            return {"error": "No context provided"}

        prompt = f"""
        [ROLE: ELITE PROCUREMENT AUDITOR & INTELLIGENCE AGENT]
        [TASK: DYNAMIC EXTRACTION OF TENDER ELIGIBILITY MATRIX]
        
        ANALYSIS CONTEXT:
        {text_context[:10000]}
        
        REQUIRED INTELLIGENCE:
        1. STATUTORY COMPLIANCE: Find all registrations needed (GST, PAN, EPF, ESI, MSME, COI).
        2. FINANCIAL CAPACITY: Extract specific Turnover (last 3 yrs), Net Worth, and Solvency.
        3. TECHNICAL BENCHMARK: Identify 'Similar Works' experience and necessary certifications (ISO, etc.).
        4. FORMS & ANNEXURES: List every specific Annexure or Form mentioned (Annexure 1, 2, 3, etc.).
        
        EXTRACTION RULES:
        - Identify MANDATORY (Shall/Must/Strictly) vs OPTIONAL requirements.
        - Capture EXACT THRESHOLDS (e.g., "50% of the Estimated Cost").
        - Group results logically by category.
        
        OUTPUT FORMAT (JSON ONLY):
        {{
            "technical_criteria": [{{ "name": "...", "description": "...", "mandatory": true, "confidence": 0.98 }}],
            "financial_criteria": [{{ "name": "...", "description": "...", "mandatory": true, "confidence": 0.98 }}],
            "compliance_criteria": [{{ "name": "...", "description": "...", "mandatory": true, "confidence": 0.98 }}]
        }}
        """
        
        try:
            # Combine prompt and images
            content = [prompt] + image_parts
            response = await self.model.generate_content_async(content)
            
            res_text = response.text
            logger.info(f"🔮 AI RAW RESPONSE (First 200 chars): {res_text[:200]}")
            print(f"DEBUG: RAW AI RESPONSE TEXT: {res_text[:500]}...")
            
            if "```json" in res_text:
                res_text = res_text.split("```json")[1].split("```")[0]
            elif "```" in res_text:
                res_text = res_text.split("```")[1].split("```")[0]
                
            parsed = json.loads(res_text.strip())
            print(f"DEBUG: PARSED AI DATA COUNT: Tech:{len(parsed.get('technical_criteria', []))} Fin:{len(parsed.get('financial_criteria', []))} Comp:{len(parsed.get('compliance_criteria', []))}")
            return parsed
        except Exception as e:
            print(f"DEBUG: AI SERVICE ERROR: {e}")
            logger.error(f"Visual AI Extraction Error: {e}")
            return {"error": str(e), "technical_criteria": [], "financial_criteria": [], "compliance_criteria": []}

    async def extract_tender_criteria(self, text: str) -> Dict[str, Any]:
        self._ensure_initialized()
        """
        Analyze tender document text to extract technical, financial, and compliance criteria.
        Uses advanced prompting for high-precision extraction.
        """
        if not text or len(text.strip()) < 10:
            logger.warning("⚠️ No text provided for criteria extraction. Returning empty structure.")
            return {"criteria": []}
            
        prompt = f"""
<<<<<<< HEAD
        System: You are an expert procurement analyst for the CRPF (Central Reserve Police Force). 
        Task: Extract specific eligibility criteria from the provided tender document text.
        
        Rules:
        1. Only return valid JSON.
        2. Categorize requirements into 'technical', 'financial', and 'compliance'.
        3. For every requirement found, explicitly determine the DOCUMENT name the bidder must upload (e.g., 'GST Certificate', 'ISO Certification', 'Annual Audit Report').
        4. If a threshold is mentioned (e.g., '50 Cr Turnover'), include that in the description.
        5. Use clear, concise titles for the documents.
        
        JSON Structure:
        {{
            "technical_criteria": [
                {{"name": "string", "description": "string", "mandatory": boolean, "threshold": "string or number"}}
            ],
            "financial_criteria": [
                {{"name": "string", "description": "string", "mandatory": boolean, "threshold": "string or number"}}
            ],
            "compliance_criteria": [
                {{"name": "string", "description": "string", "mandatory": boolean}}
            ],
            "deadlines": [
                {{"event": "string", "date": "string"}}
            ]
        }}
=======
You are a government tender analysis expert.
>>>>>>> e45c444 (my local changes)

Analyze the following tender document text and extract ALL eligibility criteria mentioned in it.

Tender Document:
{text[:150000]}

INSTRUCTIONS:
- ONLY extract criteria that are clearly present in the document
- DO NOT assume or invent anything
- Look for:
  - financial requirements (turnover, revenue)
  - technical requirements (projects, experience)
  - compliance (GST, certificates)
  - eligibility conditions

- If criteria are scattered, collect all of them
- If values exist (₹, years, count), include them

OUTPUT STRICT JSON:

{{
  "criteria": [
    {{
      "title": "string",
      "category": "Technical / Financial / Compliance / Other",
      "requirement": "full sentence from document",
      "value": "extracted value if available",
      "mandatory": true/false,
      "confidence": 0.0-1.0
    }}
  ]
}}

IMPORTANT:
- If document has NO clear criteria, return:
{{
  "criteria": []
}}

- DO NOT create fake criteria
- DO NOT explain anything outside JSON
"""
        
        try:
            response = await self.model.generate_content_async(prompt)
            content = response.text
            try:
                # Remove any leading/trailing non-json content (sometimes Gemini prepends text)
                content_clean = content.strip()
                if content_clean.startswith("```json"):
                    content_clean = content_clean[7:]
                if content_clean.endswith("```"):
                    content_clean = content_clean[:-3]
                
                # sometimes it might not have ```json but still have text before the first {
                start_idx = content_clean.find('{')
                end_idx = content_clean.rfind('}')
                if start_idx != -1 and end_idx != -1:
                    content_clean = content_clean[start_idx:end_idx+1]

                parsed = json.loads(content_clean)
                
                # if criteria is not in parsed, wrap it
                if "criteria" not in parsed:
                    if isinstance(parsed, list):
                        parsed = {"criteria": parsed}
                    else:
                        parsed = {"criteria": [parsed]}
            except Exception as e:
                logger.error(f"❌ JSON Parsing failed in extract_tender_criteria. Error: {e}\nContent was: {content}")
                parsed = {"criteria": [], "raw": content.strip()}
            return parsed
        except Exception as e:
            logger.error(f"AI Extraction Error: {e}")
            return {"criteria": [], "raw": str(e)}

    async def evaluate_bidder_docs(self, criteria: Dict[str, Any], bidder_text: str) -> Dict[str, Any]:
        self._ensure_initialized()
        """
        Compare bidder documents against tender criteria using advanced reasoning.
        """
        if not bidder_text or len(bidder_text.strip()) < 10:
            logger.warning("⚠️ No bidder text provided for evaluation. Returning default review status.")
            return {
                "overall_status": "REVIEW",
                "risk_level": "High",
                "results": [
                    {
                        "criterion_name": "General Eligibility",
                        "status": "REVIEW",
                        "reasoning": "No text could be extracted from the uploaded documents. Please check if files are scanned correctly.",
                        "confidence": 0,
                        "extracted_value": "N/A"
                    }
                ]
            }
            
        prompt = f"""
        System: You are an expert CRPF Auditor. Evaluate the bidder's document text against the provided tender criteria.
        
        Tender Criteria:
        {json.dumps(criteria, indent=2)}
        
        Bidder Text Content:
        ---
        {bidder_text[:15000]}
        ---

        Task: Check every item in technical, financial, and compliance criteria.
        
        JSON Response Format:
        {{
            "results": [
                {{
                    "criterion_name": "string",
                    "status": "PASS" | "FAIL" | "REVIEW",
                    "reasoning": "Detailed explanation of why it passed or failed",
                    "source_snippet": "The exact quote from the document used as proof",
                    "confidence": 0.0 to 1.0,
                    "extracted_value": "The specific value found (e.g. 'Turnover was 8 Cr')"
                }}
            ],
            "overall_status": "PASS" | "FAIL" | "REVIEW",
            "risk_score": 0 to 100,
            "summary": "High-level summary of the entire evaluation"
        }}

        Rules:
        1. If a document is missing or the information is unclear, use "REVIEW".
        2. Be strict about threshold values.
        3. Only return JSON.
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            content = response.text
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
                
            return json.loads(content.strip())
        except Exception as e:
            print(f"AI Evaluation Error: {e}")
            return {
                "results": [], 
                "overall_status": "REVIEW", 
                "risk_score": 100, 
                "summary": "Evaluation failed due to system error."
            }

    async def detect_fraud(self, bidders_data: list) -> Dict[str, Any]:
        self._ensure_initialized()
        """
        Analyze multiple bidders for suspicious patterns and collusion.
        """
        prompt = f"""
        System: You are an expert fraud investigator for government procurement.
        Task: Analyze the provided bidder data for signs of collusion, bid-rigging, or document forgery.
        
        Indicators to check:
        1. Identical phrases or typos across different bidders' documents.
        2. Same physical address or contact details.
        3. Overlapping board of directors or owners.
        4. Sequential bank guarantee numbers.
        
        Bidders Data:
        {json.dumps(bidders_data, indent=2)}
        
        Return a JSON object:
        {{
            "fraud_alerts": [
                {{"bidder_name": "string", "risk_level": "LOW" | "MEDIUM" | "HIGH", "reason": "string", "confidence": 0.0 to 1.0}}
            ],
            "overall_collusion_risk": 0 to 100
        }}
        """
        try:
            response = await self.model.generate_content_async(prompt)
            content = response.text
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
                
            return json.loads(content.strip())
        except Exception as e:
            print(f"Fraud Detection Error: {e}")
            return {"fraud_alerts": [], "overall_collusion_risk": 0}

    async def chat_with_context(self, question: str, context: Dict[str, Any], role: str = "admin") -> Dict[str, Any]:
        self._ensure_initialized()
        
        prompt = f"""
You are SHAKTI AI – an advanced AI Procurement Agent for government tender analysis.

Your role is to intelligently analyze tender documents, extract eligibility criteria, evaluate bidders, suggest improvements, and answer user questions in a conversational way like ChatGPT.

==================================================
CORE CAPABILITIES
==================================================

You can:
1. Analyze tender documents
2. Extract eligibility criteria
3. Classify criteria (Technical / Financial / Compliance / Experience)
4. Identify mandatory vs optional conditions
5. Summarize tender documents
6. Suggest missing or improved criteria
7. Evaluate bidder eligibility
8. Explain decisions clearly
9. Answer any user question intelligently

==================================================
AVAILABLE DATA (CONTEXT)
==================================================

Tender Data:
{json.dumps(context.get('tenders', []), indent=2)}

Bidder Data:
{json.dumps(context.get('bidders', []), indent=2)}

Evaluation Results:
{json.dumps(context.get('evaluations', []), indent=2)}

User Role:
{role}

User Question:
{question}

==================================================
INSTRUCTIONS (VERY IMPORTANT)
==================================================

- Always use the provided data to answer
- Do NOT give generic or fixed answers
- Do NOT assume missing information
- If data is missing, say: "Not enough information available"
- Be clear, structured, and professional
- Provide reasoning for every answer
- Compare required vs actual values when evaluating
- Be conversational but accurate

==================================================
TASK DETECTION LOGIC
==================================================

Based on the user question, decide the task:

IF question is about summary:
→ Provide a clear tender summary

IF question is about criteria:
→ Extract and list criteria properly

IF question is about suggestion:
→ Suggest missing/improved criteria

IF question is about evaluation:
→ Explain eligibility decision with reasons

IF question is general:
→ Answer conversationally using available data

==================================================
OUTPUT FORMATS
==================================================

For the "answer" field in your JSON response, format the text according to the task:

1. SUMMARY:
"Summary:
This tender is for...
Key requirements include..."

2. CRITERIA EXTRACTION:
"Extracted Criteria:
1. Financial: ₹5 Cr turnover (Mandatory)
2. Compliance: GST Registration (Mandatory)
3. Technical: 3 similar projects (Mandatory)"

3. SUGGESTED CRITERIA (VERY IMPORTANT FEATURE):
"Suggested Improvements:
- Add ISO certification requirement
- Add past government experience
- Add financial audit condition"

4. EVALUATION EXPLANATION:
"Evaluation Result:
Bidder is NOT eligible because:
- Required turnover: ₹5 Cr
- Bidder turnover: ₹3 Cr (Below requirement)
GST requirement is satisfied."

5. GENERAL CHAT RESPONSE:
Answer naturally like ChatGPT but based ONLY on data.

==================================================
IMPORTANT RULES
==================================================

- Never return empty response
- Never hallucinate fake data
- Always stick to given context
- Always explain reasoning
- Keep answers relevant and useful

==================================================
FINAL GOAL
==================================================

✔ Dynamic AI (not hardcoded)
✔ Works for ANY tender
✔ Gives different results for different data
✔ Fully explainable system
✔ Professional government-grade AI assistant

==================================================
RESPONSE FORMAT
==================================================
Return ONLY a valid JSON object in this exact format:
{{
  "answer": "Your dynamic response based on the rules and formatted according to the TASK DETECTION LOGIC",
  "confidence": 0.95
}}
"""

        try:
            response = self.model.generate_content(prompt)
            content = response.text
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
            
            return json.loads(content.strip())
        except Exception as e:
            logger.error(f"❌ Chat AI Error: {e}")
            return {
                "answer": "Not enough data available to answer this question.",
                "confidence": 0
            }

# Final confirmation that the service module loaded without syntax errors
logger.info("✅ AI Service module parsed and loaded successfully.")
