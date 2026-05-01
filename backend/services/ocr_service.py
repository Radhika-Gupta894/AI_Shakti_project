import pdfplumber
import pytesseract
from PIL import Image
from utils.logger import get_logger
from database.config import settings

logger = get_logger(__name__)

# Configure tesseract if needed for windows
if settings.TESSERACT_CMD_PATH:
    pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD_PATH

def extract_pdf_text(file_path: str) -> str:
    """Extract text from typed PDFs."""
    text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
    except Exception as e:
        logger.error(f"Error extracting PDF text: {e}")
    return text

def extract_image_text(image_path: str) -> str:
    """Extract text from images using OCR."""
    try:
        image = Image.open(image_path)
        text = pytesseract.image_to_string(image)
        return text
    except Exception as e:
        logger.error(f"Error extracting image text: {e}")
        return ""

def calculate_ocr_confidence(text: str) -> float:
    """Mock confidence score based on text quality."""
    # In production, pytesseract.image_to_data can return actual confidences.
    if not text:
        return 0.0
    # Simple heuristic: ratio of alphanumeric chars
    alnum = sum(c.isalnum() for c in text)
    ratio = alnum / len(text)
    return min(ratio * 100, 100.0)
