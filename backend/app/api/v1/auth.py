# app/api/v1/auth.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import timedelta
from app.db.database import get_db
from app.models.user import User, Role
from app.schemas.user import LoginRequest, TokenResponse
from app.core.security import verify_password, create_access_token
from app.config import get_settings

settings = get_settings()
router = APIRouter()

@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    kullanici = db.query(User).filter(User.email == request.email).first()
    if not kullanici:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı"
        )
    if not verify_password(request.sifre, kullanici.sifre_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-posta veya şifre hatalı"
        )
    if not kullanici.aktif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız pasif durumda, yöneticinizle iletişime geçin"
        )
    rol = db.query(Role).filter(Role.id == kullanici.rol_id).first()
    token = create_access_token(
        data={
            "sub": str(kullanici.id),
            "email": kullanici.email,
            "rol": rol.ad
        }
    )
    return TokenResponse(
        access_token=token,
        kullanici_id=kullanici.id,
        ad_soyad=kullanici.ad_soyad,
        email=kullanici.email,
        rol=rol.ad
    )

@router.get("/me")
def get_me(db: Session = Depends(get_db)):
    return {"mesaj": "Bu endpoint yakında aktif olacak"}