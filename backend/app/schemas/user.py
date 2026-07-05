# app/schemas/user.py
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    kullanici_id: int
    ad_soyad: str
    email: str
    rol: str


class LoginRequest(BaseModel):
    email: EmailStr
    sifre: str


class UserCreate(BaseModel):
    ad_soyad: str
    email: EmailStr
    sifre: str
    rol_id: int


class UserUpdate(BaseModel):
    ad_soyad: Optional[str] = None
    email: Optional[EmailStr] = None
    rol_id: Optional[int] = None
    aktif: Optional[bool] = None


class UserResponse(BaseModel):
    id: int
    ad_soyad: str
    email: str
    rol_id: int
    aktif: bool
    olusturma: datetime

    class Config:
        from_attributes = True