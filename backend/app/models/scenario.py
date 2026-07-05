# app/models/scenario.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class Project(Base):
    __tablename__ = "projeler"

    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String(200), nullable=False)
    aciklama = Column(Text, nullable=True)
    sahibi_id = Column(Integer, ForeignKey("kullanicilar.id"), nullable=False)
    aktif = Column(Boolean, default=True)
    olusturma = Column(DateTime(timezone=True), server_default=func.now())

    uyeler = relationship("ProjectMember", back_populates="proje")
    senaryolar = relationship("TestScenario", back_populates="proje")


class ProjectMember(Base):
    __tablename__ = "proje_uyeleri"

    proje_id = Column(Integer, ForeignKey("projeler.id"), primary_key=True)
    kullanici_id = Column(Integer, ForeignKey("kullanicilar.id"), primary_key=True)
    atanma_tarihi = Column(DateTime(timezone=True), server_default=func.now())

    proje = relationship("Project", back_populates="uyeler")
    kullanici = relationship("User", back_populates="projeler")


class TestScenario(Base):
    __tablename__ = "test_senaryolari"

    id = Column(Integer, primary_key=True, index=True)
    proje_id = Column(Integer, ForeignKey("projeler.id"), nullable=False)
    ad = Column(String(200), nullable=False)
    aciklama = Column(Text, nullable=True)
    json_icerik = Column(JSON, nullable=False)
    versiyon = Column(Integer, default=1)
    durum = Column(String(20), default="taslak")
    olusturan_id = Column(Integer, ForeignKey("kullanicilar.id"), nullable=False)
    olusturma = Column(DateTime(timezone=True), server_default=func.now())

    proje = relationship("Project", back_populates="senaryolar")
    kosumlar = relationship("TestRun", back_populates="senaryo")