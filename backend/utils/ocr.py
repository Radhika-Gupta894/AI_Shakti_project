try:
    import pytesseract
    HAS_TESSERACT_LIB = True
except ImportError:
    HAS_TESSERACT_LIB = False
    logger.warning("⚠️ pytesseract library not found. OCR will run in SIMULATION mode.")

from PIL import Image
import pdfplumber
import os
import cv2
import numpy as np
import uuid
import logging

# Configure logger
logger = logging.getLogger(__name__)

# Configure Tesseract Path from .env
tesseract_path = os.getenv("TESSERACT_PATH") or os.getenv("TESSERACT_CMD_PATH") or r"C:\Program Files\Tesseract-OCR\tesseract.exe"

HAS_TESSERACT_BIN = False
if HAS_TESSERACT_LIB:
    if os.path.exists(tesseract_path):
        pytesseract.pytesseract.tesseract_cmd = tesseract_path
        HAS_TESSERACT_BIN = True
    else:
        logger.warning(f"⚠️ Tesseract binary not found at {tesseract_path}. OCR will run in SIMULATION mode.")

def preprocess_image(image_path):
    """
    Preprocess image for better OCR results.
    """
    try:
        image = cv2.imread(image_path)
        if image is None:
            return None
        
        # Convert to grayscale
        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        
        # Apply thresholding to remove noise
        threshold = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
        
        # Save processed image to a unique temporary path
        temp_id = uuid.uuid4().hex
        processed_path = os.path.join(os.path.dirname(image_path), f"proc_{temp_id}.png")
        cv2.imwrite(processed_path, threshold)
        return processed_path
    except Exception as e:
        logger.error(f"❌ Image preprocessing error: {e}")
        return None

def extract_image_text(image_path):
    """
    Extract text from an image using Tesseract OCR or Simulation.
    """
    if not HAS_TESSERACT_LIB or not HAS_TESSERACT_BIN:
        logger.warning("⚠️ OCR not available for image.")
        return "OCR not available"

    processed_path = None
    try:
        # Preprocess first
        processed_path = preprocess_image(image_path)
        target_path = processed_path if processed_path else image_path
            
        text = pytesseract.image_to_string(Image.open(target_path))
        return text.strip()
    except Exception as e:
        logger.error(f"❌ Error in image OCR: {e}")
        return ""
    finally:
        # Cleanup
        if processed_path and os.path.exists(processed_path):
            try:
                os.remove(processed_path)
            except:
                pass

import concurrent.futures

def extract_pdf_text(pdf_path):
    """
    Optimized 'Digital-First' extraction with Parallel OCR or Simulation.
    """
    if not os.path.exists(pdf_path):
        return ""
        
    if not HAS_TESSERACT_LIB or not HAS_TESSERACT_BIN:
        # Check if it's a digital PDF first anyway (doesn't need tesseract)
        try:
            with pdfplumber.open(pdf_path) as pdf:
                all_text = ""
                for page in pdf.pages:
                    all_text += (page.extract_text() or "") + "\n"
                if len(all_text.strip()) > 50:
                    return all_text.strip()
        except:
            pass
        
        logger.warning("⚠️ OCR not available for scanned PDF.")
        return "OCR not available"
    all_text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            # First Pass: Check if the document has digital text
            has_digital_text = False
            for page in pdf.pages[:3]: # Check first 3 pages
                text = page.extract_text()
                if text and len(text.strip()) > 50:
                    has_digital_text = True
                    break
            
            if has_digital_text:
                logger.info("⚡ Fast Digital Extraction enabled.")
                for page in pdf.pages:
                    all_text += (page.extract_text() or "") + "\n"
                return all_text.strip()
            
            # Second Pass: Parallel OCR for scanned documents
            logger.info(f"🚀 Starting Parallel OCR for {len(pdf.pages)} pages...")
            
            def process_page(page_obj, page_num):
                try:
                    # 150 DPI is significantly faster than 200 and plenty for Gemini
                    image = page_obj.to_image(resolution=150).original
                    text = pytesseract.image_to_string(image)
                    return page_num, text + "\n"
                except Exception as e:
                    logger.error(f"⚠️ Page {page_num} OCR failed: {e}")
                    return page_num, ""

            # Using ThreadPoolExecutor for parallel processing
            with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
                future_to_page = {executor.submit(process_page, page, i+1): i for i, page in enumerate(pdf.pages)}
                
                # Collect results in order
                results = {}
                total_pages = len(pdf.pages)
                for i, future in enumerate(concurrent.futures.as_completed(future_to_page)):
                    page_num, text = future.result()
                    results[page_num] = text
                    if (i + 1) % 5 == 0 or (i + 1) == total_pages:
                        logger.info(f"📑 OCR Progress: {i+1}/{total_pages} pages processed.")
                
                for i in range(1, total_pages + 1):
                    all_text += results.get(i, "")

        return all_text.strip()
    except Exception as e:
        logger.error(f"❌ Parallel PDF Extraction Failed: {e}")
        return ""

def extract_text_from_any_file(file_path):
    """
    Safely extract text from various file types following specific security requirements:
    - PDF: Uses pdfplumber (No .decode())
    - Images: Uses Tesseract (OCR)
    - Text: Uses safe .decode("utf-8", errors="ignore") with null checks
    """
    if not file_path or not os.path.exists(file_path):
        logger.error(f"❌ File not found or path is None: {file_path}")
        return ""

    try:
        ext = os.path.splitext(file_path)[1].lower()
        
        # 1. Handle PDF (Requirement: DO NOT use .decode())
        if ext == '.pdf':
            return extract_pdf_text(file_path)
            
        # 2. Handle Images (OCR)
        elif ext in ['.png', '.jpg', '.jpeg', '.tiff', '.bmp']:
            return extract_image_text(file_path)
            
        # 3. Handle Text files (Requirement: safe decode with errors="ignore")
        elif ext in ['.txt', '.csv', '.json']:
            try:
                with open(file_path, "rb") as f:
                    content = f.read()
                
                if content is None:
                    logger.error(f"⚠️ File content is None for {file_path}")
                    return ""
                
                if len(content) == 0:
                    logger.warning(f"⚠️ File {file_path} is empty.")
                    return ""
                    
                # Safe decoding as per requirement
                return content.decode("utf-8", errors="ignore")
            except Exception as e:
                logger.error(f"❌ Failed to decode text file {file_path}: {e}")
                return ""
        
        else:
            logger.warning(f"⚠️ Unsupported file extension: {ext}")
            return ""
            
    except Exception as e:
        logger.error(f"❌ Critical error in extract_text_from_any_file: {e}")
        return ""

def get_ocr_confidence(image_path):
    if not image_path or not os.path.exists(image_path):
        return 0
    if not HAS_TESSERACT_LIB or not HAS_TESSERACT_BIN:
        return 0.95
    try:
        data = pytesseract.image_to_data(Image.open(image_path), output_type=pytesseract.Output.DICT)
        confidences = [int(conf) for conf in data['conf'] if conf != '-1']
        if not confidences:
            return 0
        return sum(confidences) / len(confidences)
    except Exception:
        return 0
