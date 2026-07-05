# app/core/lighthouse_service.py
import subprocess
import json
import os

def run_lighthouse(url: str, mod: str = "otomatik") -> dict:
    try:
        kategoriler = ["performance"]
        if mod == "manuel":
            kategoriler = ["performance", "accessibility", "best-practices", "seo"]

        kategoriler_str = ",".join(kategoriler)
        output_path = r"C:\Users\abayr\qa-platform\backend\lighthouse_output.json"

        if os.path.exists(output_path):
            os.remove(output_path)

        komut = [
            "powershell",
            "-ExecutionPolicy", "Bypass",
            "-File", r"C:\Users\abayr\AppData\Roaming\npm\lighthouse.ps1",
            url,
            "--output=json",
            f"--output-path={output_path}",
            f"--only-categories={kategoriler_str}",
            "--chrome-flags=--headless",
            "--quiet"
        ]

        result = subprocess.run(
            komut,
            capture_output=True,
            text=True,
            timeout=180
        )

        if not os.path.exists(output_path):
            return {"hata": f"Lighthouse çıktı dosyası oluşturulamadı. Stderr: {result.stderr[:200]}"}

        with open(output_path, "r", encoding="utf-8") as f:
            rapor = json.load(f)

        os.remove(output_path)

        kategoriler_sonuc = rapor.get("categories", {})

        return {
            "performance": round(kategoriler_sonuc.get("performance", {}).get("score", 0) * 100, 1) if "performance" in kategoriler_sonuc else None,
            "accessibility": round(kategoriler_sonuc.get("accessibility", {}).get("score", 0) * 100, 1) if "accessibility" in kategoriler_sonuc else None,
            "best_practice": round(kategoriler_sonuc.get("best-practices", {}).get("score", 0) * 100, 1) if "best-practices" in kategoriler_sonuc else None,
            "seo": round(kategoriler_sonuc.get("seo", {}).get("score", 0) * 100, 1) if "seo" in kategoriler_sonuc else None,
            "pwa": None,
            "mod": mod
        }

    except subprocess.TimeoutExpired:
        return {"hata": "Lighthouse zaman aşımına uğradı (180sn)"}
    except Exception as e:
        return {"hata": str(e)}