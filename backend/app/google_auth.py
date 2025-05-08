from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse
from app.google_oauth_config import GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI
import requests
import jwt
import datetime

router = APIRouter()

@router.get("/google/login")
def google_login(request: Request):
    role = request.query_params.get("role", "user")
    # Redirect user to Google's OAuth 2.0 server
    google_auth_url = (
        "https://accounts.google.com/o/oauth2/v2/auth?"
        f"client_id={GOOGLE_CLIENT_ID}&"
        f"redirect_uri={GOOGLE_REDIRECT_URI}&"
        "response_type=code&"
        "scope=openid%20email%20profile&"
        "access_type=offline&"
        "prompt=consent&"
        f"state={role}"
    )
    return RedirectResponse(google_auth_url)

@router.get("/auth/google/callback")
def google_callback(request: Request):
    code = request.query_params.get("code")
    role = request.query_params.get("state", "user")
    if not code:
        raise HTTPException(status_code=400, detail="No code provided")
    # Exchange code for tokens
    token_url = "https://oauth2.googleapis.com/token"
    token_data = {
        "code": code,
        "client_id": GOOGLE_CLIENT_ID,
        "client_secret": GOOGLE_CLIENT_SECRET,
        "redirect_uri": GOOGLE_REDIRECT_URI,
        "grant_type": "authorization_code"
    }
    token_resp = requests.post(token_url, data=token_data)
    token_json = token_resp.json()
    id_token = token_json.get("id_token")
    access_token = token_json.get("access_token")
    if not id_token:
        raise HTTPException(status_code=400, detail="Failed to get id_token from Google")
    user_info = jwt.decode(id_token, options={"verify_signature": False})
    email = user_info.get("email")
    name = user_info.get("name")
    # --- Issue your own JWT for your app (replace this with your JWT creation logic) ---
    app_jwt = jwt.encode({
        "sub": email,
        "name": name,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=7)
    }, "your_secret_key", algorithm="HS256")
    # ---
    # Redirect to frontend with user info and JWT token in URL
    frontend_url = f"http://localhost:5173?login=success&name={name}&email={email}&role={role}&token={app_jwt}"
    return RedirectResponse(frontend_url)
