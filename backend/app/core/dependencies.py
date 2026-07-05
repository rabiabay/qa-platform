# app/core/dependencies.py
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.core.security import decode_access_token

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Geçersiz veya süresi dolmuş token"
        )
    kullanici_id = int(payload.get("sub"))
    kullanici = db.query(User).filter(User.id == kullanici_id).first()
    if not kullanici:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Kullanıcı bulunamadı"
        )
    if not kullanici.aktif:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hesabınız pasif durumda"
        )
    return kullanici

def require_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.rol.ad != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için Admin yetkisi gerekiyor"
        )
    return current_user

def require_qa(current_user: User = Depends(get_current_user)) -> User:
    if current_user.rol.ad not in ["Admin", "QA Uzmanı"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için QA Uzmanı yetkisi gerekiyor"
        )
    return current_user

def require_yonetici(current_user: User = Depends(get_current_user)) -> User:
    if current_user.rol.ad not in ["Admin", "Yönetici"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Bu işlem için Yönetici yetkisi gerekiyor"
        )
    return current_user