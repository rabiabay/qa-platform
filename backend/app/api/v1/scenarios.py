# app/api/v1/scenarios.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.models.user import User
from app.models.scenario import Project, ProjectMember, TestScenario
from app.models.run import TestRun, StepResult
from app.models.ai_recipe import AIRecipe
from app.models.lighthouse import LighthouseResult
from app.core.dependencies import get_current_user, require_qa

router = APIRouter()

def check_proje_erisim(proje_id: int, current_user: User, db: Session):
    if current_user.rol.ad in ["Admin", "Yönetici"]:
        return True
    uyelik = db.query(ProjectMember).filter(
        ProjectMember.proje_id == proje_id,
        ProjectMember.kullanici_id == current_user.id
    ).first()
    if not uyelik:
        raise HTTPException(status_code=403, detail="Bu projeye erişim yetkiniz yok")
    return True

@router.get("/proje/{proje_id}")
def get_scenarios(
    proje_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    check_proje_erisim(proje_id, current_user, db)
    return db.query(TestScenario).filter(TestScenario.proje_id == proje_id).all()

@router.post("/proje/{proje_id}")
def create_scenario(
    proje_id: int,
    ad: str,
    aciklama: str = "",
    json_icerik: dict = {},
    db: Session = Depends(get_db),
    current_user: User = Depends(require_qa)
):
    check_proje_erisim(proje_id, current_user, db)
    proje = db.query(Project).filter(Project.id == proje_id).first()
    if not proje:
        raise HTTPException(status_code=404, detail="Proje bulunamadı")
    senaryo = TestScenario(
        proje_id=proje_id,
        ad=ad,
        aciklama=aciklama,
        json_icerik=json_icerik,
        durum="taslak",
        olusturan_id=current_user.id
    )
    db.add(senaryo)
    db.commit()
    db.refresh(senaryo)
    return senaryo

@router.get("/{senaryo_id}")
def get_scenario(
    senaryo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    senaryo = db.query(TestScenario).filter(TestScenario.id == senaryo_id).first()
    if not senaryo:
        raise HTTPException(status_code=404, detail="Senaryo bulunamadı")
    check_proje_erisim(senaryo.proje_id, current_user, db)
    return senaryo

@router.put("/{senaryo_id}")
def update_scenario(
    senaryo_id: int,
    ad: str = None,
    aciklama: str = None,
    durum: str = None,
    json_icerik: dict = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_qa)
):
    senaryo = db.query(TestScenario).filter(TestScenario.id == senaryo_id).first()
    if not senaryo:
        raise HTTPException(status_code=404, detail="Senaryo bulunamadı")
    check_proje_erisim(senaryo.proje_id, current_user, db)
    if ad: senaryo.ad = ad
    if aciklama: senaryo.aciklama = aciklama
    if durum: senaryo.durum = durum
    if json_icerik: senaryo.json_icerik = json_icerik
    senaryo.versiyon += 1
    db.commit()
    db.refresh(senaryo)
    return senaryo

@router.delete("/{senaryo_id}")
def delete_scenario(
    senaryo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_qa)
):
    senaryo = db.query(TestScenario).filter(TestScenario.id == senaryo_id).first()
    if not senaryo:
        raise HTTPException(status_code=404, detail="Senaryo bulunamadı")
    check_proje_erisim(senaryo.proje_id, current_user, db)

    # Bu senaryoya bağlı tüm test koşumlarını bul
    kosumlar = db.query(TestRun).filter(TestRun.senaryo_id == senaryo_id).all()

    for kosum in kosumlar:
        # Önce AI reçeteleri sil (StepResult ve TestRun'a foreign key'i var)
        db.query(AIRecipe).filter(AIRecipe.kosum_id == kosum.id).delete()
        # Lighthouse sonuçlarını sil
        db.query(LighthouseResult).filter(LighthouseResult.kosum_id == kosum.id).delete()
        # Sonra adım sonuçlarını sil
        db.query(StepResult).filter(StepResult.kosum_id == kosum.id).delete()

    # Koşumları sil
    db.query(TestRun).filter(TestRun.senaryo_id == senaryo_id).delete()

    # Son olarak senaryoyu sil
    db.delete(senaryo)
    db.commit()
    return {"mesaj": "Senaryo ve bağlı tüm veriler silindi"}