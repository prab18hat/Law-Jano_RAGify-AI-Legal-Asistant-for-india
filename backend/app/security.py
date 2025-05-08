import secrets
import os

def generate_secure_secret_key(length=64):
    """Generate a secure random secret key."""
    return secrets.token_hex(length)

def get_or_create_secret_key(key_path='secret.key'):
    """
    Retrieve or create a secure secret key.
    Stores the key in a file to maintain consistency across server restarts.
    """
    if os.path.exists(key_path):
        with open(key_path, 'r') as key_file:
            return key_file.read().strip()
    
    # Generate new secret key
    secret_key = generate_secure_secret_key()
    
    # Save the key
    with open(key_path, 'w') as key_file:
        key_file.write(secret_key)
    
    return secret_key

# JWT Token Configuration
JWT_SECRET_KEY = get_or_create_secret_key()
TOKEN_EXPIRE_MINUTES = 30  # Token expiration time
