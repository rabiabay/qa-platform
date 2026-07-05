# app/models/user.py
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base

class Role(Base):
    __tablename__ = "roller"

    id = Column(Integer, primary_key=True, index=True)
    ad = Column(String(50), unique=True, nullable=False)
    yetkiler = Column(JSON, default={})

    kullanicilar = relationship("User", back_populates="rol")


class User(Base):
    __tablename__ = "kullanicilar"

    id = Column(Integer, primary_key=True, index=True)
    ad_soyad = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    sifre_hash = Column(String(255), nullable=False)
    rol_id = Column(Integer, ForeignKey("roller.id"), nullable=False)
    aktif = Column(Boolean, default=True)
    son_giris = Column(DateTime(timezone=True), nullable=True)
    olusturma = Column(DateTime(timezone=True), server_default=func.now())

    rol = relationship("Role", back_populates="kullanicilar")
    projeler = relationship("ProjectMember", back_populates="kullanici")