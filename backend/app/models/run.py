# app/models/run.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class TestRun(Base):
    __tablename__ = "test_kosumlari"

    id = Column(Integer, primary_key=True, index=True)
    senaryo_id = Column(Integer, ForeignKey("test_senaryolari.id"), nullable=False)
    kosturan_kullanici = Column(Integer, ForeignKey("kullanicilar.id"), nullable=False)
    tetikleyici = Column(String(20), default="manuel")
    durum = Column(String(20), default="kuyrukta")
    baslangic_zamani = Column(DateTime(timezone=True), server_default=func.now())
    bitis_zamani = Column(DateTime(timezone=True), nullable=True)
    sure_ms = Column(Integer, nullable=True)
    tarayici_bilgisi = Column(String(100), nullable=True)
    ortam = Column(String(50), nullable=True)

    senaryo = relationship("TestScenario", back_populates="kosumlar")
    adim_sonuclari = relationship("StepResult", back_populates="kosum")
    ai_receteler = relationship("AIRecipe", back_populates="kosum")
    lighthouse_sonuclari = relationship("LighthouseResult", back_populates="kosum")


class StepResult(Base):
    __tablename__ = "adim_sonuclari"

    id = Column(Integer, primary_key=True, index=True)
    kosum_id = Column(Integer, ForeignKey("test_kosumlari.id"), nullable=False)
    adim_no = Column(Integer, nullable=False)
    islem_turu = Column(String(50), nullable=False)
    aciklama = Column(Text, nullable=True)
    durum = Column(String(20), nullable=False)
    hata_mesaji = Column(Text, nullable=True)
    screenshot_yol = Column(String(500), nullable=True)
    sure_ms = Column(Integer, nullable=True)

    kosum = relationship("TestRun", back_populates="adim_sonuclari")
    ai_receteler = relationship("AIRecipe", back_populates="adim_sonucu")