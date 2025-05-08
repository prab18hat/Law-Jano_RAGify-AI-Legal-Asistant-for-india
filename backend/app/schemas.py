from pydantic import BaseModel, EmailStr
from enum import Enum

class UserType(str, Enum):
    user = "user"
    lawyer = "lawyer"
    admin = "admin"

class UserBase(BaseModel):
    email: EmailStr
    phone: str
    user_type: UserType
    name: str | None = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr | None = None
    phone: str | None = None
    password: str

class UserOut(UserBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True
