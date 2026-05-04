from services.ai_service import AIService
from utils.ocr import extract_text_from_any_file
import os
import logging

logger = logging.getLogger(__name__)

# AIService is now instantiated locally within functions to avoid blocking imports

async def process_tender_upload(file_path: str):
    """
    Full pipeline for tender upload: OCR/Extraction -> AI Extraction.
    """
    # 1. Extract Text using safe handler
    text = extract_text_from_any_file(file_path)
    
    if not text:
        logger.warning(f"⚠️ No text extracted from {file_path}")
    
    # 2. AI Extraction
    criteria = await AIService().extract_tender_criteria(text)
    
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
        if not file_path:
            logger.warning(f"⚠️ Document {doc.get('type')} has no file path.")
            continue
            
        text = extract_text_from_any_file(file_path)
        
        if text:
            aggregated_text += f"\n--- Document: {doc.get('type')} ---\n"
            aggregated_text += text
        else:
            logger.warning(f"⚠️ Could not extract text from document {doc.get('type')} ({file_path})")
    
    # 2. AI Evaluate
    evaluation_result = await AIService().evaluate_bidder_docs(tender_criteria, aggregated_text)
    
    # 3. Apply post-AI rules (Confidence scoring)
    # If AI confidence is low, force status to REVIEW
    for item in evaluation_result.get('results', []):
        if item.get('confidence', 1.0) < 0.6:
            item['status'] = 'REVIEW'
            item['reasoning'] = f"Low confidence match ({item.get('confidence')}). " + item.get('reasoning', '')
            
    if any(item['status'] == 'REVIEW' for item in evaluation_result.get('results', [])):
        evaluation_result['overall_status'] = 'REVIEW'
        
    return evaluation_result
