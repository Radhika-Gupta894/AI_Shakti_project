from services.ai_service import AIService
from utils.ocr import extract_text_from_any_file
from utils.normalization import normalize_numeric_value, compare_values
import os
import logging
import asyncio
from datetime import datetime

logger = logging.getLogger(__name__)

def extract_text(file_path):
    """Primary PDF text extractor using pdfplumber (digital PDFs)."""
    import pdfplumber
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text += page.extract_text() or ""
        logger.info(f"📄 pdfplumber extracted {len(text)} chars from {os.path.basename(file_path)}")
    except Exception as e:
        logger.error(f"❌ pdfplumber failed on {file_path}: {e}")
    return text

async def process_tender_upload(file_path: str):
    """Full pipeline: file → text → AI → criteria."""
    logger.info(f"🔍 process_tender_upload called | file: {file_path}")
    logger.info(f"   FILE EXISTS: {os.path.exists(file_path)}")

    # Step 1: Try pdfplumber (fast, works for digital PDFs)
    text = extract_text(file_path)

    # Step 2: Fallback to OCR pipeline if pdfplumber yields nothing
    if not text or len(text.strip()) < 50:
        logger.info("📷 pdfplumber returned little text — trying OCR fallback")
        text = extract_text_from_any_file(file_path)

    logger.info(f"   TEXT LENGTH: {len(text)}")
    if text:
        logger.info(f"   TEXT SAMPLE: {text[:300]}")

    if not text or len(text.strip()) < 50:
        logger.warning(f"⚠️ No usable text extracted from {file_path}")
        return {"text": "", "criteria": {"criteria": []}}

    # Step 3: Send to AI
    logger.info("🤖 Sending text to AI for criteria extraction...")
    criteria = await AIService().extract_tender_criteria(text)
    logger.info(f"✅ AI returned {len(criteria.get('criteria', []))} criteria")
    return {"text": text, "criteria": criteria}

async def process_bidder_evaluation(criteria_list: list, bidder_docs: list):
    """
    Robust Bidder Criteria Matching Engine.
    1. Extracts Bidder Data from documents.
    2. Normalizes values for comparison.
    3. Executes PASS/FAIL/REVIEW logic.
    """
    # 1. Aggregate documents text
    aggregated_text = ""
    for doc in bidder_docs:
        path = doc.get('file_path')
        if path and os.path.exists(path):
            text = extract_text_from_any_file(path)
            if text:
                aggregated_text += f"\n--- DOCUMENT: {doc.get('type')} ---\n{text}\n"

    if not aggregated_text:
        return {
            "overall_status": "REVIEW",
            "confidence": 0.0,
            "results": [{
                "criterion_id": c.id if hasattr(c, 'id') else None,
                "status": "REVIEW",
                "bidder_value": "N/A",
                "source": "None",
                "explanation": "No readable text found in documents.",
                "confidence": 0.0
            } for c in criteria_list]
        }

    # 2. Extract Structured Bidder Data via AI
    # We ask the AI to specifically look for the fields defined in our criteria
    criteria_fields = [c.title for c in criteria_list]
    ai_results = await AIService().evaluate_bidder_docs(
        [{"title": c.title, "description": c.description, "category": c.category} for c in criteria_list],
        aggregated_text
    )
    
    # 3. Normalization & Matching Logic
    final_details = []
    has_fail = False
    has_review = False
    total_score = 0.0
    total_confidence = 0.0

    for i, crit in enumerate(criteria_list):
        # Find matching AI result
        ai_res = None
        if i < len(ai_results.get('results', [])):
            ai_res = ai_results['results'][i]
        
        bidder_val_raw = ai_res.get('extracted_value', 'Not found') if ai_res else 'Not found'
        required_val_raw = crit.description # Often contains the threshold
        
        # Determine Status
        status = ai_res.get('status', 'REVIEW') if ai_res else 'REVIEW'
        conf = ai_res.get('confidence', 0.5) if ai_res else 0.0
        
        # If it's a numeric comparison (Financial/Technical), we can double check with normalization
        if crit.category in ['Financial', 'Technical'] and status != 'REVIEW':
            # Try to extract numbers from both
            b_num = normalize_numeric_value(bidder_val_raw)
            r_num = normalize_numeric_value(required_val_raw) or normalize_numeric_value(crit.title)
            
            if b_num is not None and r_num is not None:
                if b_num >= r_num:
                    status = "PASS"
                    explanation = f"Extracted value {bidder_val_raw} satisfies the requirement of {required_val_raw}."
                else:
                    status = "FAIL"
                    explanation = f"Extracted value {bidder_val_raw} does NOT meet the requirement of {required_val_raw}."
            else:
                # If normalization fails but AI was confident, trust AI or mark for review
                explanation = ai_res.get('reasoning', 'AI processed verification.')
        else:
            explanation = ai_res.get('reasoning', 'Manual verification recommended.')

        # Enforce Review on low confidence
        if conf < 0.65 and status != 'FAIL':
            status = 'REVIEW'
            explanation = f"LOW CONFIDENCE ({conf}): {explanation}"

        if status == 'FAIL' and crit.mandatory:
            has_fail = True
        if status == 'REVIEW':
            has_review = True
            
        # Scoring
        weight = getattr(crit, 'weightage', 0) or 0
        max_s = getattr(crit, 'max_score', 100) or 100
        score = max_s if status == 'PASS' else (max_s / 2 if status == 'REVIEW' else 0)
        total_score += (score * (weight / 100)) if weight > 0 else 0
        total_confidence += conf

        final_details.append({
            "criterion_id": crit.id,
            "status": status,
            "bidder_value": bidder_val_raw,
            "source": ai_res.get('source_snippet', 'N/A') if ai_res else 'N/A',
            "explanation": explanation,
            "confidence": conf,
            "score": score
        })

    # Final Decision
    overall_status = "Eligible"
    if has_fail:
        overall_status = "Not Eligible"
    elif has_review:
        overall_status = "Needs Manual Review"

    return {
        "overall_status": overall_status,
        "confidence": total_confidence / len(criteria_list) if criteria_list else 0,
        "total_score": total_score,
        "results": final_details
    }
