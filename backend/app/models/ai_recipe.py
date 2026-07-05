# app/models/ai_recipe.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class AIRecipe(Base):
    __tablename__ = "ai_receteler"

    id = Column(Integer, primary_key=True, index=True)
    kosum_id = Column(Integer, ForeignKey("test_kosumlari.id"), nullable=False)
    adim_sonuc_id = Column(Integer, ForeignKey("adim_sonuclari.id"), nullable=True)
    hata_ozeti = Column(Text, nullable=True)
    screenshot_yol = Column(String(500), nullable=True)
    gemini_modeli = Column(String(100), default="gemini-1.5-pro")
    ai_analiz = Column(Text, nullable=True)
    cozum_adimlari = Column(JSON, default=[])
    ozguven_skoru = Column(Float, nullable=True)
    kullanici_geri_bildirim = Column(String(20), nullable=True)
    olusturma = Column(DateTime(timezone=True), server_default=func.now())

    kosum = relationship("TestRun", back_populates="ai_receteler")
    adim_sonucu = relationship("StepResult", back_populates="ai_receteler")