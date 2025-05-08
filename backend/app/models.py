from sqlalchemy import Column, Integer, String, Boolean, Enum
from sqlalchemy.ext.declarative import declarative_base
import enum

Base = declarative_base()

class UserType(enum.Enum):
    user = "user"
    lawyer = "lawyer"
    admin = "admin"

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    user_type = Column(Enum(UserType), default=UserType.user, nullable=False)
    is_active = Column(Boolean, default=True)
    name = Column(String, nullable=True)
    # Add more fields as needed (e.g. profile for lawyers)
