from services.ai_service import AIService
from utils.ocr import extract_pdf_text, extract_image_text
import os

ai_service = AIService()

async def process_tender_upload(file_path: str):
    """
    Full pipeline for tender upload: OCR -> AI Extraction.
    """
    # 1. Extract Text
    if file_path.endswith('.pdf'):
        text = extract_pdf_text(file_path)
    else:
        text = extract_image_text(file_path)
    
    # 2. AI Extraction
    criteria = await ai_service.extract_tender_criteria(text)
    
    return {
        "text": text,
        "criteria": criteria
    }

async def process_bidder_evaluation(tender_criteria: dict, bidder_docs: list):
    """
    Full pipeline for bidder evaluation: Aggregate Docs -> AI Evaluation.
    """
    # 1. Extract text from all bidder docs
    aggregated_text = ""
    for doc in bidder_docs:
        file_path = doc.get('file_path')
        if not file_path or not os.path.exists(file_path):
            continue
            
        if file_path.endswith('.pdf'):
            text = extract_pdf_text(file_path)
        else:
            text = extract_image_text(file_path)
        
        aggregated_text += f"\n--- Document: {doc.get('type')} ---\n"
        aggregated_text += text
    
    # 2. AI Evaluate
    evaluation_result = await ai_service.evaluate_bidder_docs(tender_criteria, aggregated_text)
    
    # 3. Apply post-AI rules (Confidence scoring)
    # If AI confidence is low, force status to REVIEW
    for item in evaluation_result.get('results', []):
        if item.get('confidence', 1.0) < 0.6:
            item['status'] = 'REVIEW'
            item['reasoning'] = f"Low confidence match ({item.get('confidence')}). " + item.get('reasoning', '')
            
    if any(item['status'] == 'REVIEW' for item in evaluation_result.get('results', [])):
        evaluation_result['overall_status'] = 'REVIEW'
        
    return evaluation_result
