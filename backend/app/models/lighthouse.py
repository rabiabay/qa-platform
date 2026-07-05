
# app/models/lighthouse.py
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class LighthouseResult(Base):
    __tablename__ = "lighthouse_sonuclari"

    id = Column(Integer, primary_key=True, index=True)
    kosum_id = Column(Integer, ForeignKey("test_kosumlari.id"), nullable=False)
    performance = Column(Float, nullable=True)
    accessibility = Column(Float, nullable=True)
    best_practice = Column(Float, nullable=True)
    seo = Column(Float, nullable=True)
    pwa = Column(Float, nullable=True)
    tam_rapor = Column(JSON, nullable=True)
    mod = Column(String(20), default="otomatik")
    olusturma = Column(DateTime(timezone=True), server_default=func.now())

    kosum = relationship("TestRun", back_populates="lighthouse_sonuclari")