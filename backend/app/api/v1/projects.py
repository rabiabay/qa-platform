# app/api/v1/projects.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.user import User
from app.models.scenario import Project, ProjectMember
from app.core.dependencies import require_admin, require_yonetici, get_current_user

router = APIRouter()

@router.get("/")
def get_projects(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.rol.ad in ["Admin", "Yönetici"]:
        projeler = db.query(Project).all()
    else:
        uyelikler = db.query(ProjectMember).filter(ProjectMember.kullanici_id == current_user.id).all()
        proje_idler = [u.proje_id for u in uyelikler]
        projeler = db.query(Project).filter(Project.id.in_(proje_idler)).all()
    return projeler

@router.post("/")
def create_project(
    ad: str,
    aciklama: str = "",
    db: Session = Depends(get_db),
    current_user: User = Depends(require_yonetici)
):
    proje = Project(
        ad=ad,
        aciklama=aciklama,
        sahibi_id=current_user.id,
        aktif=True
    )
    db.add(proje)
    db.commit()
    db.refresh(proje)
    return proje

@router.post("/{proje_id}/uyeler")
def add_member(
    proje_id: int,
    kullanici_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_yonetici)
):
    proje = db.query(Project).filter(Project.id == proje_id).first()
    if not proje:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")
    kullanici = db.query(User).filter(User.id == kullanici_id).first()
    if not kullanici:
        raise HTTPException(status_code=404, detail="Kullanıcı bulunamadı")
    mevcut = db.query(ProjectMember).filter(
        ProjectMember.proje_id == proje_id,
        ProjectMember.kullanici_id == kullanici_id
    ).first()
    if mevcut:
        raise HTTPException(status_code=400, detail="Kullanıcı zaten bu projenin üyesi")
    uye = ProjectMember(proje_id=proje_id, kullanici_id=kullanici_id)
    db.add(uye)
    db.commit()
    return {"mesaj": "Üye eklendi"}

@router.delete("/{proje_id}")
def delete_project(
    proje_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_yonetici)
):
    proje = db.query(Project).filter(Project.id == proje_id).first()
    if not proje:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")
    db.delete(proje)
    db.commit()
    return {"mesaj": "Proje silindi"}

@router.get("/{proje_id}")
def get_project(
    proje_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    proje = db.query(Project).filter(Project.id == proje_id).first()
    if not proje:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")

    uyeler = db.query(ProjectMember).filter(ProjectMember.proje_id == proje_id).all()
    uye_listesi = []
    for uye in uyeler:
        kullanici = db.query(User).filter(User.id == uye.kullanici_id).first()
        if kullanici:
            uye_listesi.append({"id": kullanici.id, "ad_soyad": kullanici.ad_soyad})

    return {
        "id": proje.id,
        "ad": proje.ad,
        "aciklama": proje.aciklama,
        "aktif": proje.aktif,
        "uyeler": uye_listesi
    }