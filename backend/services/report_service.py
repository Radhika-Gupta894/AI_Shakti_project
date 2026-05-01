import os
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from utils.logger import get_logger

logger = get_logger(__name__)

def generate_pdf_report(evaluation_id: int, bidder_name: str, results: list) -> str:
    """Generates a downloadable PDF report for a bidder."""
    report_path = f"reports/evaluation_report_{evaluation_id}.pdf"
    
    try:
        c = canvas.Canvas(report_path, pagesize=letter)
        c.drawString(100, 750, f"SHAKTI AI - Evaluation Report")
        c.drawString(100, 730, f"Bidder: {bidder_name}")
        c.drawString(100, 710, "-"*50)
        
        y = 680
        for res in results:
            c.drawString(100, y, f"Criterion: {res['criterion_name']}")
            c.drawString(100, y-15, f"Status: {res['status']} | Confidence: {res['confidence_score']}%")
            c.drawString(100, y-30, f"Reason: {res['reason']}")
            y -= 60
            
            if y < 100:
                c.showPage()
                y = 750
        
        c.save()
        logger.info(f"Report generated at {report_path}")
        return report_path
    except Exception as e:
        logger.error(f"Error generating report: {e}")
        return ""
