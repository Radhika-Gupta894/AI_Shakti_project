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
            return {
                "technical_criteria": [],
                "financial_criteria": [],
                "compliance_criteria": [],
                "deadlines": [],
                "warning": "No text could be extracted from the document. Please check OCR/Tesseract."
            }
            
        prompt = f"""
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

        Tender Text Content:
        ---
        {text[:15000]}
        ---
        """
        
        try:
            response = await self.model.generate_content_async(prompt)
            content = response.text
            # Clean possible markdown formatting from response
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
                
            return json.loads(content.strip())
        except Exception as e:
            print(f"AI Extraction Error: {e}")
            return {
                "technical_criteria": [],
                "financial_criteria": [],
                "compliance_criteria": [],
                "deadlines": [],
                "error": "Failed to parse AI response"
            }

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

# Final confirmation that the service module loaded without syntax errors
logger.info("✅ AI Service module parsed and loaded successfully.")
