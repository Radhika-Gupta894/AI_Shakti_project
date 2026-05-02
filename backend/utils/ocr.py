import pytesseract
from PIL import Image
import pdfplumber
import os
import cv2
import numpy as np

# Configure Tesseract Path from .env
tesseract_path = os.getenv("TESSERACT_CMD_PATH", r"C:\Program Files\Tesseract-OCR\tesseract.exe")
if os.path.exists(tesseract_path):
    pytesseract.pytesseract.tesseract_cmd = tesseract_path

def preprocess_image(image_path):
    """
    Preprocess image for better OCR results.
    """
    image = cv2.imread(image_path)
    if image is None:
        return None
    
    # Convert to grayscale
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    # Apply thresholding to remove noise
    threshold = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU)[1]
    
    # Save processed image temporarily
    processed_path = f"processed_{os.path.basename(image_path)}"
    cv2.imwrite(processed_path, threshold)
    return processed_path

def extract_image_text(image_path):
    """
    Extract text from an image using Tesseract OCR.
    """
    try:
        # Preprocess first
        processed_path = preprocess_image(image_path)
        if not processed_path:
            return ""
            
        text = pytesseract.image_to_string(Image.open(processed_path))
        
        # Cleanup
        if os.path.exists(processed_path):
            os.remove(processed_path)
            
        return text
    except Exception as e:
        print(f"Error in image OCR: {e}")
        return ""

def extract_pdf_text(pdf_path):
    """
    Optimized 'Digital-First' extraction. 
    Prevents memory crashes by skipping OCR if digital text exists.
    """
    if not os.path.exists(pdf_path):
        return ""
        
    all_text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            # First Pass: Check if the document has digital text
            has_digital_text = False
            for page in pdf.pages:
                text = page.extract_text()
                if text and len(text.strip()) > 10:
                    has_digital_text = True
                    break
            
            # Second Pass: Extract based on type
            for i, page in enumerate(pdf.pages):
                try:
                    if has_digital_text:
                        # Fast digital extraction
                        all_text += (page.extract_text() or "") + "\n"
                    else:
                        # Heavy OCR only as last resort
                        print(f"OCR Fallback for page {i}...")
                        image = page.to_image(resolution=150).original # Lower res to save RAM
                        all_text += pytesseract.image_to_string(image) + "\n"
                except Exception as e:
                    print(f"Skipping page {i} due to error: {e}")
                    
        return all_text
    except Exception as e:
        print(f"PDF Extraction Failed: {e}")
        return ""

def get_ocr_confidence(image_path):
    """
    Get OCR confidence levels for the extracted text.
    """
    try:
        data = pytesseract.image_to_data(Image.open(image_path), output_type=pytesseract.Output.DICT)
        # Filter out low confidence scores
        confidences = [int(conf) for conf in data['conf'] if conf != '-1']
        if not confidences:
            return 0
        return sum(confidences) / len(confidences)
    except Exception:
        return 0
