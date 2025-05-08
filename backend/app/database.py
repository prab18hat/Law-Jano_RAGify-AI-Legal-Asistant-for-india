from pymongo import MongoClient
import urllib.parse

def get_mongodb_client():
    """
    Create a secure MongoDB client connection with proper error handling.
    """
    username = urllib.parse.quote_plus('prabhatmdi8953')
    password = urllib.parse.quote_plus('Vishu3000@')
    
    mongo_uri = f'mongodb+srv://{username}:{password}@prabhat.fqdej2z.mongodb.net/?retryWrites=true&w=majority&appName=prabhat'
    
    try:
        client = MongoClient(mongo_uri, serverSelectionTimeoutMS=5000)
        # Verify connection
        client.admin.command('ping')
        print('[DATABASE] MongoDB connection successful!')
        return client
    except Exception as e:
        print(f'[DATABASE] Connection error: {e}')
        return None

def get_user_collection():
    """Get the user collection from the database."""
    client = get_mongodb_client()
    if client:
        db = client['ragify_bharat']  # Database name
        return db['users']  # Collection name
    return None

def get_otp_collection():
    """Get the OTP collection from the database."""
    client = get_mongodb_client()
    if client:
        db = client['ragify_bharat']
        return db['otps']
    return None