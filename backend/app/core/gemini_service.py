# app/core/gemini_service.py
import base64
import os
from openai import OpenAI
from app.config import get_settings

settings = get_settings()

def analyze_error(
    hata_mesaji: str,
    screenshot_yol: str = None,
    adim_aciklama: str = "",
    islem_turu: str = ""
) -> dict:
    try:
        client = OpenAI(api_key=settings.OPENAI_API_KEY)

        prompt = f"""Sen bir kıdemli QA mühendisisin. Aşağıdaki Selenium test hatasını analiz et ve Türkçe çözüm öner.

Test Adımı: {adim_aciklama}
İşlem Türü: {islem_turu}
Hata Mesajı: {hata_mesaji}

Lütfen şu formatta yanıt ver:
1. HATA ÖZETİ: Hatanın kısa açıklaması
2. KÖK NEDEN: Hatanın neden oluştuğu
3. ÇÖZÜM ADIMLARI: Numaralı liste halinde çözüm adımları
4. GÜVEN SKORU: 0-100 arası bu analizin doğruluk tahmini"""

        messages = [
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt}
                ]
            }
        ]

        if screenshot_yol and os.path.exists(screenshot_yol):
            with open(screenshot_yol, "rb") as f:
                img_data = base64.b64encode(f.read()).decode("utf-8")
            messages[0]["content"].append({
                "type": "image_url",
                "image_url": {
                    "url": f"data:image/png;base64,{img_data}"
                }
            })

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=messages,
            max_tokens=1000
        )

        ai_text = response.choices[0].message.content

        ozguven = 85.0
        for line in ai_text.split('\n'):
            if 'GÜVEN SKORU' in line or 'güven skoru' in line.lower():
                import re
                numbers = re.findall(r'\d+', line)
                if numbers:
                    ozguven = float(numbers[0])
                    break

        cozum_adimlari = []
        lines = ai_text.split('\n')
        capture = False
        for line in lines:
            if 'ÇÖZÜM ADIM' in line.upper():
                capture = True
                continue
            if 'GÜVEN SKORU' in line.upper():
                capture = False
            if capture and line.strip() and (line.strip()[0].isdigit() or line.strip().startswith('-')):
                cozum_adimlari.append(line.strip())

        return {
            "ai_analiz": ai_text,
            "cozum_adimlari": cozum_adimlari,
            "ozguven_skoru": ozguven / 100,
            "gemini_modeli": "gpt-4o-mini",
            "hata_ozeti": hata_mesaji[:500]
        }

    except Exception as e:
        return {
            "ai_analiz": f"OpenAI API hatası: {str(e)}",
            "cozum_adimlari": ["API anahtarını kontrol edin", "İnternet bağlantısını kontrol edin"],
            "ozguven_skoru": 0.0,
            "gemini_modeli": "gpt-4o-mini",
            "hata_ozeti": hata_mesaji[:500]
        }