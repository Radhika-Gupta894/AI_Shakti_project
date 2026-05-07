import re

def normalize_numeric_value(text):
    """
    Converts text like '₹5 Cr', '50,00,000', '5 Crore', '50 Lakh' into a clean float.
    Returns None if no numeric value is found.
    """
    if text is None:
        return None
    
    # Convert to string and clean up
    text = str(text).lower().strip()
    
    # Remove symbols like ₹, $, commas
    text = re.sub(r'[₹$,]', '', text)
    
    # Extract the first number found (handle decimals)
    match = re.search(r'(\d+\.?\d*)', text)
    if not match:
        return None
    
    value = float(match.group(1))
    
    # Multipliers
    if 'crore' in text or ' cr' in text:
        value *= 10000000
    elif 'lakh' in text or ' l' in text:
        value *= 100000
    elif 'thousand' in text or ' k' in text:
        value *= 1000
        
    return value

def compare_values(bidder_val, required_val, criteria_type="numeric"):
    """
    Compares two values and returns PASS, FAIL, or REVIEW.
    """
    # Normalize both
    b_norm = normalize_numeric_value(bidder_val)
    r_norm = normalize_numeric_value(required_val)
    
    if b_norm is None or r_norm is None:
        # If one is not numeric, check for boolean/exact match
        if str(bidder_val).lower() == str(required_val).lower():
            return "PASS", 1.0
        return "REVIEW", 0.5
        
    if b_norm >= r_norm:
        return "PASS", 1.0
    else:
        return "FAIL", 1.0

def normalize_boolean(text):
    """
    Converts text like 'yes', 'no', 'true', 'false', 'available' to boolean.
    """
    text = str(text).lower().strip()
    if text in ['yes', 'true', 'available', 'present', '1', 'y']:
        return True
    if text in ['no', 'false', 'not available', 'absent', '0', 'n']:
        return False
    return None
