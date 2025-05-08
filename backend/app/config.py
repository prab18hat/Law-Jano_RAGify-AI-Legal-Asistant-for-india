import os

# MongoDB Configuration
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017')
DATABASE_NAME = 'ragify_bharat'
USERS_COLLECTION = 'users'

# OTP Configuration
OTP_EXPIRY_MINUTES = 10  # OTP valid for 10 minutes
MAX_OTP_ATTEMPTS = 3  # Maximum OTP verification attempts
