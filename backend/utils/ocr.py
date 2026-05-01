import pytesseract
from PIL import Image
import pdfplumber
import os
import cv2
import numpy as np

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
    Extract text from a PDF. Tries digital text first, falls back to OCR for scanned pages.
    """
    all_text = ""
    try:
        with pdfplumber.open(pdf_path) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    all_text += page_text + "\n"
                else:
                    # If no text found, it might be a scanned page
                    # Convert page to image and OCR
                    image = page.to_image(resolution=300).original
                    page_text = pytesseract.image_to_string(image)
                    all_text += page_text + "\n"
        return all_text
    except Exception as e:
        print(f"Error in PDF text extraction: {e}")
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
