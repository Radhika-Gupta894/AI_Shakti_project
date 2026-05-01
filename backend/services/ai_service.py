import os
import json
import google.generativeai as genai
from typing import Dict, Any

# Configure Gemini (or OpenAI if preferred)
# In a real app, these would be in .env
GENIMI_API_KEY = os.getenv("GEMINI_API_KEY", "YOUR_API_KEY")
genai.configure(api_key=GENIMI_API_KEY)

class AIService:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-1.5-flash')

    async def extract_tender_criteria(self, text: str) -> Dict[str, Any]:
        """
        Analyze tender document text to extract technical, financial, and compliance criteria.
        """
        prompt = f"""
        Analyze the following tender document text and extract the eligibility criteria.
        Return the result as a structured JSON object with the following keys:
        - technical_criteria: List of requirements related to experience, capacity, etc.
        - financial_criteria: List of requirements related to turnover, bank balance, etc.
        - compliance_criteria: List of mandatory certificates like GST, ISO, PAN.
        - deadlines: Key dates found.
        
        For each criterion, specify:
        - name: Short name.
        - description: Full requirement text.
        - mandatory: Boolean.
        - threshold: Any numeric value associated (e.g., turnover amount).

        Tender Text:
        {text[:15000]} # Limiting text size for prompt
        """
        
        try:
            response = self.model.generate_content(prompt)
            # Find the JSON part in the response
            content = response.text
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            return json.loads(content[start_idx:end_idx])
        except Exception as e:
            print(f"AI Extraction Error: {e}")
            return {
                "technical_criteria": [],
                "financial_criteria": [],
                "compliance_criteria": [],
                "error": str(e)
            }

    async def evaluate_bidder_docs(self, criteria: Dict[str, Any], bidder_text: str) -> Dict[str, Any]:
        """
        Compare bidder documents against tender criteria.
        """
        prompt = f"""
        You are an expert procurement officer. Evaluate the bidder's documents against the given tender criteria.
        
        Tender Criteria:
        {json.dumps(criteria, indent=2)}
        
        Bidder Document Content:
        {bidder_text[:15000]}
        
        Evaluate each criterion and return a JSON object with:
        - results: List of objects containing:
            - criterion_name: Name of criterion.
            - status: "PASS", "FAIL", or "REVIEW".
            - extracted_value: What you found in bidder docs.
            - required_value: What was required.
            - reasoning: Why it passed or failed.
            - source_snippet: Short text snippet from bidder docs as proof.
            - confidence: 0 to 1 score.
        - overall_status: "PASS", "FAIL", or "REVIEW".
        - risk_score: 0 to 100.
        - summary: Overall evaluation summary.

        Be strict but fair. If a value is missing or unclear, set status to "REVIEW".
        """
        
        try:
            response = self.model.generate_content(prompt)
            content = response.text
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            return json.loads(content[start_idx:end_idx])
        except Exception as e:
            print(f"AI Evaluation Error: {e}")
            return {"results": [], "overall_status": "REVIEW", "error": str(e)}

    async def detect_fraud(self, bidders_data: list) -> Dict[str, Any]:
        """
        Analyze multiple bidders for suspicious patterns.
        """
        prompt = f"""
        Analyze these bidders for potential collusion or fraud.
        Check for:
        - Similar document structure.
        - Overlapping directors (if data present).
        - Same contact details or address.
        
        Bidders Data:
        {json.dumps(bidders_data, indent=2)}
        
        Return a JSON with fraud_alerts list and overall risk scores.
        """
        try:
            response = self.model.generate_content(prompt)
            content = response.text
            start_idx = content.find('{')
            end_idx = content.rfind('}') + 1
            return json.loads(content[start_idx:end_idx])
        except Exception:
            return {"fraud_alerts": []}
