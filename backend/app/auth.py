from fastapi import APIRouter, HTTPException, status, Request
from datetime import datetime, timedelta
import os
import random
import jwt
import smtplib
from email.mime.text import MIMEText
import requests
from pydantic import BaseModel, EmailStr

from .database import get_user_collection, get_otp_collection

router = APIRouter()

SECRET_KEY = os.environ.get("JWT_SECRET", "ragify_bharat_secure_secret_key_2025")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24
MAX_OTP_ATTEMPTS = 5
OTP_EXPIRY_MINUTES = 10

class UserAuth:
    @staticmethod
    def generate_otp(contact, email=None):
        otp_collection = get_otp_collection()
        now = datetime.utcnow()
        # Clean up old OTPs for this contact
        if otp_collection is not None:
            otp_collection.delete_many({
                'contact': contact,
                'expires_at': {'$lt': now}
            })
            # Limit OTP generation (rate limiting)
            recent_otps = otp_collection.count_documents({
                'contact': contact,
                'created_at': {'$gt': now - timedelta(minutes=OTP_EXPIRY_MINUTES)}
            })
            if recent_otps >= MAX_OTP_ATTEMPTS:
                raise HTTPException(status_code=429, detail="Too many OTP requests. Please try again later.")
        otp = ''.join([str(random.randint(0, 9)) for _ in range(6)])
        if otp_collection is not None:
            otp_collection.insert_one({
                'contact': contact,
                'otp': otp,
                'created_at': now,
                'expires_at': now + timedelta(minutes=OTP_EXPIRY_MINUTES),
                'attempts': 0,
                'used': False
            })
        # Always send OTP to email only
        if email:
            UserAuth.send_otp_email(email, otp)
        else:
            print('[EMAIL ERROR] No email provided for OTP delivery.')
        return otp

    @staticmethod
    def send_otp_email(recipient_email, otp):
        sender_email = os.environ.get('SENDER_EMAIL')
        sender_password = os.environ.get('SENDER_EMAIL_PASSWORD')
        smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', 587))
        msg = MIMEText(f"Your OTP code for LawJano Dashboard is: {otp}\n\nDo not share this OTP with anyone. If you did not request this, please ignore this email.")
        msg['Subject'] = 'Your OTP for LawJano Dashboard (Do not share)'
        msg['From'] = sender_email
        msg['To'] = recipient_email
        try:
            with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
                server.set_debuglevel(1)  # Enable debug output
                server.starttls()
                server.login(sender_email, sender_password)
                server.send_message(msg)
            print(f'[EMAIL SUCCESS] OTP email sent to {recipient_email}')
        except Exception as e:
            print(f'[EMAIL ERROR] Failed to send OTP email: {e}')
            import traceback
            traceback.print_exc()

    @staticmethod
    def verify_otp(contact, user_otp):
        otp_collection = get_otp_collection()
        user_collection = get_user_collection()
        now = datetime.utcnow()
        if otp_collection is None or user_collection is None:
            return None
        otp_record = otp_collection.find_one({
            'contact': contact,
            'otp': user_otp,
            'expires_at': {'$gt': now},
            'used': False
        })
        if not otp_record:
            # Increment attempts for latest OTP
            last_otp = otp_collection.find_one({'contact': contact}, sort=[('created_at', -1)])
            if last_otp:
                attempts = last_otp.get('attempts', 0) + 1
                otp_collection.update_one({'_id': last_otp['_id']}, {'$set': {'attempts': attempts}})
                if attempts >= MAX_OTP_ATTEMPTS:
                    otp_collection.delete_many({'contact': contact})
                    raise HTTPException(status_code=429, detail="Too many invalid OTP attempts. Please request a new OTP.")
            raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
        # Mark OTP as used
        otp_collection.update_one({'_id': otp_record['_id']}, {'$set': {'used': True}})
        # Check if user already exists
        user = user_collection.find_one({'contact': contact})
        if not user:
            # User does not exist, this is a signup
            # Create the user and require them to login next time
            user_collection.insert_one({
                'contact': contact,
                'created_at': now,
                'last_login': None,
                'login_count': 0
            })
            # Inform frontend to require login after signup
            raise HTTPException(status_code=403, detail="Signup successful. Please login to continue.")
        # If user exists, proceed with login
        # Ensure login_count is a number
        if not isinstance(user.get('login_count', 0), int):
            user_collection.update_one({'contact': contact}, {'$set': {'login_count': 0}})
        user_collection.update_one({'contact': contact}, {'$set': {'last_login': now}, '$inc': {'login_count': 1}})
        return UserAuth.generate_jwt_token(contact)

    @staticmethod
    def generate_jwt_token(user_id):
        payload = {
            'user_id': str(user_id),
            'exp': datetime.utcnow() + timedelta(days=1)
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    @staticmethod
    def decode_jwt_token(token):
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return payload['user_id']
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

class LawyerProfile(BaseModel):
    email: EmailStr
    name: str
    degree: str
    experience: str
    specialization: str = ""
    bio: str = ""
    contact_email: EmailStr = None
    phone: str = ""
    # Add more fields as needed

# In-memory storage for demo (replace with DB logic)
lawyer_profiles = {}

@router.post("/lawyer/profile")
def create_or_update_lawyer_profile(profile: LawyerProfile):
    # In production, use persistent DB
    lawyer_profiles[profile.email] = profile.dict()
    return {"message": "Profile updated", "profile": profile}

@router.get("/lawyer/profiles")
def get_lawyer_profiles():
    # In production, fetch from persistent DB
    return list(lawyer_profiles.values())

@router.post("/generate-otp")
def generate_otp(contact: str, email: str = None):
    """Endpoint to generate OTP and send to email if provided"""
    otp = UserAuth.generate_otp(contact, email)
    return {"message": "OTP generated successfully", "contact": contact}

@router.post("/verify-otp")
def verify_otp(contact: str, otp: str):
    token = UserAuth.verify_otp(contact, otp)
    if token:
        return {"message": "Login successful", "token": token}
    raise HTTPException(status_code=400, detail="Invalid or expired OTP.")

def get_current_user(request: Request):
    token = request.headers.get('Authorization')
    if not token or not token.startswith('Bearer '):
        raise HTTPException(status_code=401, detail="Missing or invalid token.")
    token = token.split(' ')[1]
    user_id = UserAuth.decode_jwt_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid or expired token.")
    return user_id
