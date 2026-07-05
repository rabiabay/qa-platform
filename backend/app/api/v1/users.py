# app/api/v1/users.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User, Role
from app.models.scenario import Project, ProjectMember
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.core.security import hash_password
from app.core.dependencies import require_admin, require_yonetici

router = APIRouter()

@router.get("/", response_model=List[UserResponse])
def get_users(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(User).all()

@router.post("/", response_model=UserResponse)
def create_user(user: UserCreate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    existing = db.query(User).filter(User.email == user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Bu e-posta zaten kayıtlı")
    rol = db.query(Role).filter(Role.id == user.rol_id).first()
    if not rol:
        raise HTTPException(status_code=404, detail="Rol bulunamadı")
    yeni_kullanici = User(
        ad_soyad=user.ad_soyad,
        email=user.email,
        sifre_hash=hash_password(user.sifre),
        rol_id=user.rol_id,
        aktif=True
    )
    db.add(yeni_kullanici)
    db.commit()
    db.refresh(yeni_kullanici)
    return yeni_kullanici

@router.put("/{kullanici_id}", response_model=UserResponse)
def update_user(kullanici_id: int, user: UserUpdate, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    kullanici = db.query(User).filter(User.id == kullanici_id).first()
    if not kullanici:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    if user.ad_soyad: kullanici.ad_soyad = user.ad_soyad
    if user.email: kullanici.email = user.email
    if user.rol_id: kullanici.rol_id = user.rol_id
    if user.aktif is not None: kullanici.aktif = user.aktif
    db.commit()
    db.refresh(kullanici)
    return kullanici

@router.delete("/{kullanici_id}")
def delete_user(kullanici_id: int, db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    kullanici = db.query(User).filter(User.id == kullanici_id).first()
    if not kullanici:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    if kullanici.id == current_user.id:
        raise HTTPException(status_code=400, detail="Kendinizi silemezsiniz")
    db.delete(kullanici)
    db.commit()
    return {"mesaj": "Kullanıcı silindi"}

@router.get("/roller")
def get_roller(db: Session = Depends(get_db), current_user: User = Depends(require_admin)):
    return db.query(Role).all()

@router.get("/ekip", response_model=List[UserResponse])
def get_ekip(db: Session = Depends(get_db), current_user: User = Depends(require_yonetici)):
    yonetici_projeleri = db.query(ProjectMember).filter(
        ProjectMember.kullanici_id == current_user.id
    ).all()
    proje_idler = [p.proje_id for p in yonetici_projeleri]

    if not proje_idler:
        return []

    uye_kayitlari = db.query(ProjectMember).filter(
        ProjectMember.proje_id.in_(proje_idler),
        ProjectMember.kullanici_id != current_user.id
    ).all()
    kullanici_idler = list(set([u.kullanici_id for u in uye_kayitlari]))

    return db.query(User).filter(User.id.in_(kullanici_idler)).all()