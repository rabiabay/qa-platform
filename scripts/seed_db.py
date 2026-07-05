# scripts/seed_db.py
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'backend'))

from app.db.database import SessionLocal
from app.models.user import User, Role
from app.core.security import hash_password

def seed():
    db = SessionLocal()
    try:
        if db.query(Role).count() > 0:
            print("Veriler zaten mevcut, seed atlanıyor.")
            return

        print("Roller oluşturuluyor...")
        admin_rol = Role(ad="Admin", yetkiler={"tam_erisim": True})
        qa_rol = Role(ad="QA Uzmanı", yetkiler={"test_yonet": True, "senaryo_yonet": True})
        yonetici_rol = Role(ad="Yönetici", yetkiler={"rapor_gor": True, "dashboard_gor": True})

        db.add_all([admin_rol, qa_rol, yonetici_rol])
        db.commit()
        db.refresh(admin_rol)
        db.refresh(qa_rol)
        db.refresh(yonetici_rol)
        print("✅ Roller oluşturuldu.")

        print("Kullanıcılar oluşturuluyor...")
        admin = User(
            ad_soyad="Rabia Abay",
            email="admin@qaplatform.com",
            sifre_hash=hash_password("Admin123!"),
            rol_id=admin_rol.id,
            aktif=True
        )
        qa_user = User(
            ad_soyad="Ayşe Kaya",
            email="qa@qaplatform.com",
            sifre_hash=hash_password("QA123!"),
            rol_id=qa_rol.id,
            aktif=True
        )
        yonetici_user = User(
            ad_soyad="Mehmet Demir",
            email="yonetici@qaplatform.com",
            sifre_hash=hash_password("Yonetici123!"),
            rol_id=yonetici_rol.id,
            aktif=True
        )

        db.add_all([admin, qa_user, yonetici_user])
        db.commit()
        print("✅ Kullanıcılar oluşturuldu.")
        print("\n--- Giriş Bilgileri ---")
        print("Admin     → admin@qaplatform.com     / Admin123!")
        print("QA Uzmanı → qa@qaplatform.com        / QA123!")
        print("Yönetici  → yonetici@qaplatform.com  / Yonetici123!")

    except Exception as e:
        print(f"Hata: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed()