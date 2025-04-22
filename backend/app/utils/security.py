import bcrypt
import secrets
import string
from typing import Tuple

def hash_password(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password
    """
    # Generate salt and hash password
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    
    return hashed.decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against a hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password
        
    Returns:
        True if password matches hash, False otherwise
    """
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def generate_random_password(length: int = 12) -> str:
    """
    Generate a random password.
    
    Args:
        length: Length of password (default: 12)
        
    Returns:
        Random password
    """
    # Define character sets
    lowercase = string.ascii_lowercase
    uppercase = string.ascii_uppercase
    digits = string.digits
    special = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    
    # Ensure at least one character from each set
    password = [
        secrets.choice(lowercase),
        secrets.choice(uppercase),
        secrets.choice(digits),
        secrets.choice(special)
    ]
    
    # Fill remaining characters
    remaining_length = length - len(password)
    all_chars = lowercase + uppercase + digits + special
    password.extend(secrets.choice(all_chars) for _ in range(remaining_length))
    
    # Shuffle password
    secrets.SystemRandom().shuffle(password)
    
    return ''.join(password)

def generate_api_key() -> Tuple[str, str]:
    """
    Generate an API key and secret.
    
    Returns:
        Tuple of (api_key, api_secret)
    """
    # Generate API key (public)
    api_key = 'key_' + ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(24))
    
    # Generate API secret (private)
    api_secret = 'sec_' + ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(32))
    
    return api_key, api_secret
