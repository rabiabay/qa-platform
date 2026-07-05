# app/api/v1/runner.py
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse, Response
from sqlalchemy.orm import Session
from datetime import datetime
import os
from app.db.database import get_db
from app.models.user import User
from app.models.scenario import TestScenario, Project
from app.models.run import TestRun, StepResult
from app.models.ai_recipe import AIRecipe
from app.models.lighthouse import LighthouseResult
from app.core.dependencies import require_qa, get_current_user
from app.core.selenium_engine import run_scenario
from app.core.gemini_service import analyze_error
from app.core.lighthouse_service import run_lighthouse
from app.core.report_builder import build_pdf_report

router = APIRouter()

def execute_test(kosum_id: int, db: Session, json_icerik: dict = None):
    kosum = db.query(TestRun).filter(TestRun.id == kosum_id).first()
    if not kosum:
        return
    kosum.durum = "caliyor"
    kosum.baslangic_zamani = datetime.utcnow()
    db.commit()
    try:
        if json_icerik is None:
            senaryo = db.query(TestScenario).filter(TestScenario.id == kosum.senaryo_id).first()
            json_icerik = senaryo.json_icerik
        adim_sonuclari = run_scenario(json_icerik, kosum_id)
        basarili = True
        for adim in adim_sonuclari:
            sonuc = StepResult(
                kosum_id=kosum_id,
                adim_no=adim["adim_no"],
                islem_turu=adim["islem_turu"],
                aciklama=adim["aciklama"],
                durum=adim["durum"],
                hata_mesaji=adim.get("hata_mesaji"),
                screenshot_yol=adim.get("screenshot_yol"),
                sure_ms=adim.get("sure_ms")
            )
            db.add(sonuc)
            db.flush()
            if adim["durum"] == "basarisiz":
                basarili = False
                ai_sonuc = analyze_error(
                    hata_mesaji=adim.get("hata_mesaji", ""),
                    screenshot_yol=adim.get("screenshot_yol"),
                    adim_aciklama=adim.get("aciklama", ""),
                    islem_turu=adim.get("islem_turu", "")
                )
                recete = AIRecipe(
                    kosum_id=kosum_id,
                    adim_sonuc_id=sonuc.id,
                    hata_ozeti=ai_sonuc["hata_ozeti"],
                    screenshot_yol=adim.get("screenshot_yol"),
                    gemini_modeli=ai_sonuc["gemini_modeli"],
                    ai_analiz=ai_sonuc["ai_analiz"],
                    cozum_adimlari=ai_sonuc["cozum_adimlari"],
                    ozguven_skoru=ai_sonuc["ozguven_skoru"]
                )
                db.add(recete)
        kosum.durum = "basarili" if basarili else "basarisiz"
        kosum.bitis_zamani = datetime.utcnow()
        if kosum.baslangic_zamani:
            bitis = kosum.bitis_zamani.replace(tzinfo=None)
            baslangic = kosum.baslangic_zamani.replace(tzinfo=None)
            sure = (bitis - baslangic).total_seconds() * 1000
            kosum.sure_ms = int(sure)
        db.commit()
    except Exception as e:
        kosum.durum = "basarisiz"
        kosum.bitis_zamani = datetime.utcnow()
        db.commit()
        raise e


@router.post("/koştur/{senaryo_id}")
def run_test(
    senaryo_id: int,
    headless: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_qa)
):
    senaryo = db.query(TestScenario).filter(TestScenario.id == senaryo_id).first()
    if not senaryo:
        raise HTTPException(status_code=404, detail="Senaryo bulunamadı")
    kosum = TestRun(
        senaryo_id=senaryo_id,
        kosturan_kullanici=current_user.id,
        tetikleyici="manuel",
        durum="kuyrukta",
        tarayici_bilgisi="Chrome",
        ortam="test"
    )
    db.add(kosum)
    db.commit()
    db.refresh(kosum)

    import copy
    json_icerik = copy.deepcopy(senaryo.json_icerik)
    if "calisma_ayarlari" not in json_icerik:
        json_icerik["calisma_ayarlari"] = {}
    json_icerik["calisma_ayarlari"]["headless_mod"] = headless

    execute_test(kosum.id, db, json_icerik)
    db.refresh(kosum)
    return {
        "kosum_id": kosum.id,
        "durum": kosum.durum,
        "sure_ms": kosum.sure_ms,
        "mesaj": "Test tamamlandı"
    }


@router.get("/kosumlar/{senaryo_id}")
def get_runs(
    senaryo_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(TestRun).filter(TestRun.senaryo_id == senaryo_id).all()


@router.get("/kosum/{kosum_id}/detay")
def get_run_detail(
    kosum_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    kosum = db.query(TestRun).filter(TestRun.id == kosum_id).first()
    if not kosum:
        raise HTTPException(status_code=404, detail="Koşum bulunamadı")
    adimlar = db.query(StepResult).filter(StepResult.kosum_id == kosum_id).all()
    receteler = db.query(AIRecipe).filter(AIRecipe.kosum_id == kosum_id).all()
    return {
        "kosum": kosum,
        "adimlar": adimlar,
        "ai_receteler": receteler
    }


@router.get("/ai-receteler/{kosum_id}")
def get_ai_recipes(
    kosum_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(AIRecipe).filter(AIRecipe.kosum_id == kosum_id).all()


@router.get("/screenshot/{kosum_id}/{adim_no}")
def get_screenshot(
    kosum_id: int,
    adim_no: int,
    db: Session = Depends(get_db)
):
    adim = db.query(StepResult).filter(
        StepResult.kosum_id == kosum_id,
        StepResult.adim_no == adim_no
    ).first()
    if not adim or not adim.screenshot_yol:
        raise HTTPException(status_code=404, detail="Screenshot bulunamadı")
    if not os.path.exists(adim.screenshot_yol):
        raise HTTPException(status_code=404, detail="Dosya bulunamadı")
    return FileResponse(adim.screenshot_yol, media_type="image/png")


@router.post("/lighthouse/{kosum_id}")
def run_lighthouse_analiz(
    kosum_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    kosum = db.query(TestRun).filter(TestRun.id == kosum_id).first()
    if not kosum:
        raise HTTPException(status_code=404, detail="Koşum bulunamadı")
    senaryo = db.query(TestScenario).filter(TestScenario.id == kosum.senaryo_id).first()
    baslangic_url = senaryo.json_icerik.get("test_metadata", {}).get("baslangic_url", "")
    if not baslangic_url:
        raise HTTPException(status_code=400, detail="Senaryo başlangıç URL'i bulunamadı")
    sonuc = run_lighthouse(baslangic_url, mod="manuel")
    if "hata" in sonuc:
        raise HTTPException(status_code=500, detail=sonuc["hata"])
    kayit = LighthouseResult(
        kosum_id=kosum_id,
        performance=sonuc.get("performance"),
        accessibility=sonuc.get("accessibility"),
        best_practice=sonuc.get("best_practice"),
        seo=sonuc.get("seo"),
        pwa=sonuc.get("pwa"),
        mod="manuel"
    )
    db.add(kayit)
    db.commit()
    db.refresh(kayit)
    return {
        "performance": kayit.performance,
        "accessibility": kayit.accessibility,
        "best_practice": kayit.best_practice,
        "seo": kayit.seo,
        "pwa": kayit.pwa
    }


@router.get("/lighthouse/{kosum_id}")
def get_lighthouse_sonuc(
    kosum_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    sonuc = db.query(LighthouseResult).filter(
        LighthouseResult.kosum_id == kosum_id
    ).order_by(LighthouseResult.olusturma.desc()).first()
    if not sonuc:
        return None
    return {
        "performance": sonuc.performance,
        "accessibility": sonuc.accessibility,
        "best_practice": sonuc.best_practice,
        "seo": sonuc.seo,
        "pwa": sonuc.pwa
    }


@router.get("/pdf-rapor")
def get_pdf_rapor(
    proje_id: int = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.rol.ad in ["Admin", "Yönetici"]:
        if proje_id:
            projeler = db.query(Project).filter(Project.id == proje_id).all()
        else:
            projeler = db.query(Project).all()
    else:
        projeler = []
    projeler_data = []
    for proje in projeler:
        senaryolar_data = []
        senaryolar = db.query(TestScenario).filter(TestScenario.proje_id == proje.id).all()
        for sen in senaryolar:
            kosumlar = db.query(TestRun).filter(TestRun.senaryo_id == sen.id).all()
            receteler = []
            for k in kosumlar:
                r = db.query(AIRecipe).filter(AIRecipe.kosum_id == k.id).all()
                receteler.extend([{
                    'hata_ozeti': rec.hata_ozeti,
                    'ai_analiz': rec.ai_analiz,
                    'cozum_adimlari': rec.cozum_adimlari
                } for rec in r])
            senaryolar_data.append({
                'ad': sen.ad,
                'kosumlar': [{'durum': k.durum, 'sure_ms': k.sure_ms, 'baslangic_zamani': k.baslangic_zamani} for k in kosumlar],
                'receteler': receteler
            })
        projeler_data.append({'ad': proje.ad, 'senaryolar': senaryolar_data})
    pdf_bytes = build_pdf_report(projeler_data)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=qa-rapor-{datetime.utcnow().strftime('%Y%m%d')}.pdf"}
    )