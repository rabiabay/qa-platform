 QARA — Yapay Zeka Destekli Test Otomasyon Sistemi

Kod yazmadan web test senaryoları oluşturun, otomatik koşturun ve yapay zeka ile hata analizi alın.

 Özellikler

- **Chrome Eklentisi** ile kod yazmadan test senaryosu kaydetme
- **Selenium WebDriver** ile otomatik test koşturma
- **OpenAI GPT-4o-mini** ile Türkçe hata analizi ve çözüm önerileri
- **Google Lighthouse** ile performans ve erişilebilirlik analizi
- **Admin, QA Uzmanı, Yönetici** rol bazlı panel sistemi

 Teknoloji Yığını

- **Backend:** Python, FastAPI, PostgreSQL
- **Frontend:** React, TypeScript
- **Test Motoru:** Selenium WebDriver
- **Yapay Zeka:** OpenAI GPT-4o-mini
- **Eklenti:** Chrome Extension (Manifest V3)

 Kurulum

```bash
# Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm start
```

`.env` dosyasını oluşturun:
```
DATABASE_URL=postgresql://postgres:sifre@localhost:5432/qa_platform
SECRET_KEY=gizli-anahtar
OPENAI_API_KEY=sk-...
```

 Kullanım

1. Chrome eklentisini yükleyin (`extension/` klasörü)
2. Giriş yapın ve senaryo kaydedin
3. QA panelinden testi koşturun
4. Başarısız testlerde AI reçete alın

---

