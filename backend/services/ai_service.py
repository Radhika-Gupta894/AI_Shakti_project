import os
import json
import google.generativeai as genai
from typing import Dict, Any

class AIService:
    def __init__(self):
        # Configure Gemini inside init to ensure env vars are loaded
        self.api_key = os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            print("CRITICAL: GEMINI_API_KEY not found in environment variables.")
        genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    async def extract_tender_criteria(self, text: str) -> Dict[str, Any]:
        """
        Analyze tender document text to extract technical, financial, and compliance criteria.
        Uses advanced prompting for high-precision extraction.
        """
        prompt = f"""
        System: You are an expert procurement analyst for the CRPF (Central Reserve Police Force). 
        Task: Extract specific eligibility criteria from the provided tender document text.
        
        Rules:
        1. Only return valid JSON.
        2. Categorize requirements into 'technical', 'financial', and 'compliance'.
        3. For 'financial', look for turnover, liquid assets, and bank guarantees.
        4. For 'technical', look for past experience, project completions, and machinery.
        5. For 'compliance', look for GST, ISO, MSME, blacklisting, and local registration.
        
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
            response = self.model.generate_content(prompt)
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
        """
        Compare bidder documents against tender criteria using advanced reasoning.
        """
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
            response = self.model.generate_content(prompt)
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
            response = self.model.generate_content(prompt)
            content = response.text
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0]
            elif "```" in content:
                content = content.split("```")[1].split("```")[0]
                
            return json.loads(content.strip())
        except Exception as e:
            print(f"Fraud Detection Error: {e}")
            return {"fraud_alerts": [], "overall_collusion_risk": 0}
