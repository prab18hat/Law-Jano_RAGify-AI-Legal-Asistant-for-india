from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi import Query as FastAPIQuery
from pydantic import BaseModel, constr, EmailStr
from dotenv import load_dotenv
from typing import Optional, List

from app.rag_chain import ask_grok
from app.legal_citation import find_citations
from app.related_questions import get_related_questions
from app.resources_api import router as resources_router
from app.indictrans2_translate import translate_text
from app.google_auth import router as google_auth_router
from app.database import get_user_collection
from app.tts_service import synthesize_speech

# New authentication import
from app.auth import UserAuth

load_dotenv()

app = FastAPI(title="Legal Question Answering API")
app.include_router(resources_router, prefix="/api")
app.include_router(google_auth_router)

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory chat history (optional use)
chat_history = []

# Authentication Models
class OTPRequest(BaseModel):
    contact: EmailStr  # Email validation only
    role: str = "user"  # 'user' or 'lawyer'

class OTPVerification(BaseModel):
    contact: EmailStr
    otp: constr(min_length=6, max_length=6)
    role: str = "user"

# Root endpoint
@app.get("/")
async def root():
    return {"message": "Legal Question Answering API is up and running "}

# Authentication Endpoints
@app.post("/generate-otp")
async def generate_otp(request: OTPRequest):
    """Generate and send OTP (email only)"""
    otp = UserAuth.generate_otp(request.contact, email=request.contact)
    print(f"[DEBUG] Generated OTP for {request.contact}: {otp}")
    return {
        "message": "OTP generated successfully", 
        "contact": request.contact,
        "role": request.role
    }

@app.post("/verify-otp")
async def verify_otp(request: OTPVerification):
    """Verify OTP and login/register user"""
    token = UserAuth.verify_otp(request.contact, request.otp)
    
    if token:
        return {
            "message": "Login successful", 
            "token": token,
            "contact": request.contact,
            "role": request.role
        }
    else:
        raise HTTPException(
            status_code=400, 
            detail="Invalid or expired OTP"
        )

# Request schema (Updated to include optional token)
class QuestionRequest(BaseModel):
    question: str
    language: Optional[str] = "english"  # Default to English
    token: Optional[str] = None  # Optional authentication token

# Ask route for JSON input (Updated with optional authentication)
@app.post("/api/ask")
async def ask_question(request: QuestionRequest):
    # Optional token validation
    if request.token:
        user_id = UserAuth.decode_jwt_token(request.token)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    language = request.language.lower() if request.language else "en"
    print(f"[DEBUG] Received question: {request.question}")
    print(f"[DEBUG] Received language: {language}")
    
    # Existing language normalization logic
    lang_map = {
        "english": "en", "en": "en", "eng": "en",
        "hindi": "hi", "hi": "hi", "hin": "hi",
        "gujarati": "gu", "gu": "gu", "guj": "gu",
        "bengali": "bn", "bangla": "bn", "bn": "bn", "ben": "bn",
        "marathi": "mr", "mr": "mr", "mar": "mr",
        "tamil": "ta", "ta": "ta", "tam": "ta",
        "kannada": "kn", "kn": "kn", "kan": "kn",
        "telugu": "te", "te": "te", "tel": "te",
        "malayalam": "ml", "ml": "ml", "mal": "ml",
        "punjabi": "pa", "pa": "pa", "pan": "pa",
        "oriya": "or", "or": "or", "ori": "or",
        "assamese": "as", "as": "as", "asm": "as",
        "urdu": "ur", "ur": "ur", "urd": "ur"
    }
    language = lang_map.get(language, "en")
    print(f"[DEBUG] Normalized language: {language}")
    
    translated_question = request.question
    if language != "en":
        translated_question = translate_text(request.question, language, "en")
        print(f"[DEBUG] Translated question to English: {translated_question}")
    else:
        print(f"[DEBUG] Question is already in English.")

    legal_keywords = [
        'law', 'legal', 'ipc', 'crpc', 'act', 'section', 'court', 'judge', 'judgment',
        'bail', 'fir', 'arrest', 'rights', 'petition', 'offence', 'divorce', 'aid',
        'notice', 'charge', 'complaint', 'writ', 'criminal', 'civil', 'evidence', 'trial',
        'appeal', 'sentence', 'conviction', 'acquittal', 'prosecution', 'defence', 'suit',
        'decree', 'order', 'summons', 'warrant', 'magistrate', 'advocate', 'lawyer', 'plaintiff',
        'defendant', 'respondent', 'appellant', 'tribunal', 'bench', 'bar', 'constitution', 'statute',
        'regulation', 'rule', 'procedure', 'code', 'penal', 'judiciary', 'justice', 'litigation', 'plea',
        'evidence', 'testimony', 'affidavit', 'hearing', 'cross-examination', 'submission', 'injunction',
        'remedy', 'damages', 'compensation', 'liability', 'negligence', 'contract', 'agreement',
        'settlement', 'arbitration', 'mediation', 'conciliation', 'enforcement', 'execution', 'summons',
        'warrant', 'charge sheet', 'bailable', 'non-bailable', 'anticipatory', 'remand', 'custody', 'parole',
        'probation', 'sentence', 'acquittal', 'conviction', 'appeal', 'revision', 'review', 'reference',
        'jurisdiction', 'venue', 'forum', 'cause of action', 'relief', 'interim', 'stay', 'interlocutory',
        'final', 'decree', 'judgment', 'order', 'award', 'costs', 'fees', 'stamp', 'court fee', 'process',
        'service', 'summons', 'notice', 'publication', 'subpoena', 'production', 'inspection', 'discovery',
        'interrogatory', 'admission', 'denial', 'pleading', 'written statement', 'replication', 'rejoinder',
        'counterclaim', 'set-off', 'cross-claim', 'third party', 'implead', 'joinder', 'misjoinder', 'non-joinder',
        'amendment', 'withdrawal', 'compromise', 'abandonment', 'dismissal', 'default', 'ex parte', 'restoration',
        'restitution', 'execution', 'attachment', 'sale', 'proclamation', 'delivery', 'possession', 'res judicata',
        'sub judice', 'lis pendens', 'estoppel', 'waiver', 'acquiescence', 'limitation', 'prescription', 'bar',
        'lapse', 'condonation', 'delay', 'sufficient cause', 'good faith', 'bona fide', 'malafide', 'fraud',
        'misrepresentation', 'mistake', 'error', 'omission', 'irregularity', 'defect', 'nullity', 'void', 'illegal',
        'unlawful', 'ultra vires', 'intra vires', 'competent', 'incompetent', 'authority', 'power', 'jurisdiction',
        'mandate', 'direction', 'order', 'command', 'injunction', 'prohibition', 'certiorari', 'mandamus',
        'quo warranto', 'habeas corpus', 'contempt', 'punishment', 'fine', 'imprisonment', 'sentence', 'release',
        'bail', 'bond', 'surety', 'recognizance', 'undertaking', 'guarantee', 'security', 'seizure', 'confiscation',
        'forfeiture', 'penalty', 'sanction', 'prosecution', 'complaint', 'charge', 'information', 'indictment',
        'summons', 'warrant', 'arrest', 'search', 'seizure', 'remand', 'custody', 'parole', 'probation', 'sentence',
        'acquittal', 'conviction', 'appeal', 'revision', 'review', 'reference', 'jurisdiction', 'venue', 'forum',
        'cause of action', 'relief', 'interim', 'stay', 'interlocutory', 'final', 'decree', 'judgment', 'order',
        'award', 'costs', 'fees', 'stamp', 'court fee', 'process', 'service', 'summons', 'notice', 'publication',
        'subpoena', 'production', 'inspection', 'discovery', 'interrogatory', 'admission', 'denial', 'pleading',
        'written statement', 'replication', 'rejoinder', 'counterclaim', 'set-off', 'cross-claim', 'third party',
        'implead', 'joinder', 'misjoinder', 'non-joinder', 'amendment', 'withdrawal', 'compromise', 'abandonment',
        'dismissal', 'default', 'ex parte', 'restoration', 'restitution', 'execution', 'attachment', 'sale',
        'proclamation', 'delivery', 'possession', 'res judicata', 'sub judice', 'lis pendens', 'estoppel', 'waiver',
        'acquiescence', 'limitation', 'prescription', 'bar', 'lapse', 'condonation', 'delay', 'sufficient cause',
        'good faith', 'bona fide', 'malafide', 'fraud', 'misrepresentation', 'mistake', 'error', 'omission',
        'irregularity', 'defect', 'nullity', 'void', 'illegal', 'unlawful', 'ultra vires', 'intra vires',
        'competent', 'incompetent', 'authority', 'power', 'jurisdiction', 'mandate', 'direction', 'order',
        'command', 'injunction', 'prohibition', 'certiorari', 'mandamus', 'quo warranto', 'habeas corpus',
        'contempt', 'punishment', 'fine', 'imprisonment', 'sentence', 'release', 'bail', 'bond', 'surety',
        'recognizance', 'undertaking', 'guarantee', 'security', 'seizure', 'confiscation', 'forfeiture', 'penalty',
        'sanction', 'prosecution', 'complaint', 'hacked', 'charge', 'information', 'indictment',
    ]
    # Only check keywords on translated_question (in English)
    question_lower = translated_question.lower()
    if not any(keyword in question_lower for keyword in legal_keywords):
        return {"answer": "Sorry, please ask a legal question related to Indian law.", "citations": []}

    # --- Continue with LLM and translation logic as before ---
    # Always answer in English, then translate the answer to the user's requested language
    modified_question = f"Answer this question in English: {translated_question}"
    answer_en = ask_grok(modified_question)
    print(f"[DEBUG] Answer from LLM (English): {answer_en}")

    if language != "en":
        answer = translate_text(answer_en, "en", language)
        print(f"[DEBUG] Translated answer to {language}: {answer}")
    else:
        answer = answer_en
        print(f"[DEBUG] Answer is already in English.")

    citations = find_citations(request.question)
    return {"answer": answer, "citations": citations}

# Existing routes remain unchanged
@app.post("/api/ask_form")
async def ask_question_form(
    question: str = Form(...),
    language: Optional[str] = Form("english")
):
    # Existing implementation
    language = language.lower() if language else "english"
    modified_question = (
        f"Translate this question to Hindi and answer in Hindi: {question}"
        if language == "hindi"
        else f"Answer this question in English: {question}"
    )
    answer = ask_grok(modified_question)
    return {"answer": answer}

@app.get("/api/related_questions")
async def related_questions(query: str = FastAPIQuery("", description="User's question"), top_k: int = 6) -> List[str]:
    """Returns related legal questions for a given query."""
    return get_related_questions(query, top_k)

@app.post("/api/clear")
async def clear_chat():
    chat_history.clear()
    return {"message": "Chat history cleared."}

# --- User History Endpoints ---
class UserHistoryRequest(BaseModel):
    email: EmailStr
    question: str

@app.post("/api/user/history")
def add_user_history(item: UserHistoryRequest):
    users = get_user_collection()
    if users is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    users.update_one(
        {"email": item.email},
        {"$push": {"history": item.question}},
        upsert=True
    )
    return {"message": "History updated"}

@app.get("/api/user/history")
def get_user_history(email: EmailStr):
    users = get_user_collection()
    if users is None:
        raise HTTPException(status_code=500, detail="Database unavailable")
    user = users.find_one({"email": email})
    if user and "history" in user:
        return {"history": user["history"]}
    return {"history": []}

# --- Lawyer Profile Endpoints ---
from pydantic import BaseModel, EmailStr

# TTS Endpoint
@app.post("/api/tts")
async def text_to_speech(text: str = Form(...), language_code: str = Form("hi-IN")):
    """Convert text to speech audio"""
    try:
        # Set the API key in the environment
        os.environ['GOOGLE_API_KEY'] = "AIzaSyD9x6BVDTyWZbWxWQVoSO_yZROFwt4y6Ro"
        
        audio_content = synthesize_speech(text, language_code)
        
        # Convert audio content to base64 string
        import base64
        audio_base64 = base64.b64encode(audio_content).decode('utf-8')
        
        return JSONResponse(
            content={
                "success": True, 
                "audio_content": audio_base64,
                "language": language_code
            },
            media_type="application/json"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# --- Lawyer Profile Endpoints ---
from pydantic import BaseModel, EmailStr

class LawyerProfile(BaseModel):
    email: EmailStr
    name: str
    degree: str
    experience: str
    specialization: str = ""
    bio: str = ""
    contact_email: EmailStr = None
    phone: str = ""

lawyer_profiles = {}

@app.post("/api/lawyer/profile")
def create_or_update_lawyer_profile(profile: LawyerProfile):
    lawyer_profiles[profile.email] = profile.dict()
    return {"message": "Profile updated", "profile": profile}

@app.get("/api/lawyer/profiles")
def get_lawyer_profiles():
    return list(lawyer_profiles.values())