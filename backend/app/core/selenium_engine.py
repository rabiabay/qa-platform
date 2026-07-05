# app/core/selenium_engine.py
import time
import os
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import (
    TimeoutException, NoSuchElementException, WebDriverException
)
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

SCREENSHOT_DIR = os.path.join(os.path.dirname(__file__), '..', '..', 'screenshots')
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def get_driver(headless: bool = True, tarayici: str = "chrome"):
    options = webdriver.ChromeOptions()
    options.add_experimental_option("prefs", {
        "credentials_enable_service": False,
        "profile.password_manager_enabled": False,
        "profile.default_content_setting_values.notifications": 2,
        "autofill.profile_enabled": False,
        "autofill.credit_card_enabled": False
    })
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option("useAutomationExtension", False)
    if headless:
        options.add_argument('--headless=new')
    options.add_argument('--no-sandbox')
    options.add_argument('--disable-dev-shm-usage')
    options.add_argument('--disable-gpu')
    options.add_argument('--disable-infobars')
    options.add_argument('--disable-notifications')
    options.add_argument('--disable-save-password-bubble')
    options.add_argument('--disable-popup-blocking')
    options.add_argument('--disable-features=PasswordLeakDetection,PasswordCheck,SafeBrowsingEnhancedProtection,AutofillServerCommunication')
    options.add_argument('--incognito')
    if not headless:
        options.add_argument('--start-maximized')
    options.add_argument('--window-size=1920,1080')
    service = Service(ChromeDriverManager().install())
    driver = webdriver.Chrome(service=service, options=options)
    return driver

def wait_for_element(driver, selector: str, selector_turu: str, timeout: int = 10):
    by = By.XPATH if selector_turu == "xpath" else By.CSS_SELECTOR
    return WebDriverWait(driver, timeout).until(
        EC.presence_of_element_located((by, selector))
    )

def take_screenshot(driver, kosum_id: int, adim_no: int) -> str:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"kosum_{kosum_id}_adim_{adim_no}_{timestamp}.png"
    filepath = os.path.join(SCREENSHOT_DIR, filename)
    driver.save_screenshot(filepath)
    return filepath

def temizle_adimlar(adimlar: list) -> list:
    temiz = []
    for i, adim in enumerate(adimlar):
        if adim.get('islem_turu') == 'input':
            sonraki_var = any(
                j > i and
                adimlar[j].get('islem_turu') == 'input' and
                adimlar[j].get('selector') == adim.get('selector')
                for j in range(len(adimlar))
            )
            if sonraki_var:
                continue
        temiz.append(adim)
    return temiz

def kapat_trendyol_popup(driver):
    """Trendyol cinsiyet seçim popup'ını kapatır. Yoksa sessizce geçer."""
    try:
        popup_buton = WebDriverWait(driver, 3).until(
            EC.element_to_be_clickable((By.CSS_SELECTOR, ".rdrpp-gender-btn, [data-testid='gender-btn'], .gender-selection button"))
        )
        popup_buton.click()
        time.sleep(0.5)
    except:
        pass

def run_scenario(json_icerik: dict, kosum_id: int) -> list:
    adimlar = json_icerik.get("test_adimlari", [])
    ayarlar = json_icerik.get("calisma_ayarlari", {})

    headless = ayarlar.get("headless_mod", True)
    hata_devam = ayarlar.get("hata_aninda_devam_et", False)
    implicit_wait = ayarlar.get("implicit_wait_sn", 10)

    adimlar = temizle_adimlar(adimlar)

    driver = get_driver(headless=headless)
    driver.implicitly_wait(implicit_wait)

    sonuclar = []

    for adim in adimlar:
        adim_no = adim.get("adim_no", 0)
        islem = adim.get("islem_turu", "")
        aciklama = adim.get("aciklama", "")
        selector = adim.get("selector", "")
        selector_turu = adim.get("selector_turu", "css")
        deger = adim.get("deger", "")
        hedef_url = adim.get("hedef_url", "")
        bekleme = adim.get("bekleme_suresi_ms", 0)
        screenshot_al = adim.get("screenshot_al", False)

        baslangic = time.time()
        hata_mesaji = None
        durum = "basarili"
        screenshot_yol = None

        try:
            if islem == "navigate":
                driver.get(hedef_url or deger)
                if "trendyol.com" in (hedef_url or deger):
                    kapat_trendyol_popup(driver)

            elif islem == "click":
                el = wait_for_element(driver, selector, selector_turu)
                driver.execute_script("arguments[0].click();", el)

            elif islem == "input":
                el = wait_for_element(driver, selector, selector_turu)
                el.clear()
                el.send_keys(deger)

            elif islem == "select":
                el = wait_for_element(driver, selector, selector_turu)
                Select(el).select_by_visible_text(deger)

            elif islem == "hover":
                el = wait_for_element(driver, selector, selector_turu)
                ActionChains(driver).move_to_element(el).perform()

            elif islem == "scroll":
                driver.execute_script("window.scrollBy(0, arguments[0]);", int(deger or 500))

            elif islem == "assert_text":
                el = wait_for_element(driver, selector, selector_turu)
                assert deger in el.text, f"Beklenen metin '{deger}' bulunamadı. Bulunan: '{el.text}'"

            elif islem == "assert_visible":
                el = wait_for_element(driver, selector, selector_turu)
                assert el.is_displayed(), f"Element görünür değil: {selector}"

            elif islem == "wait":
                time.sleep(int(deger or 1))

            elif islem == "screenshot":
                screenshot_yol = take_screenshot(driver, kosum_id, adim_no)

            if screenshot_al and not screenshot_yol:
                screenshot_yol = take_screenshot(driver, kosum_id, adim_no)

            if bekleme > 0:
                time.sleep(bekleme / 1000)

        except (TimeoutException, NoSuchElementException, AssertionError, WebDriverException) as e:
            durum = "basarisiz"
            hata_mesaji = getattr(e, 'msg', None) or str(e) or f"{type(e).__name__}: '{islem}' islemi '{selector}' selectoru ile basarisiz oldu"
            try:
                screenshot_yol = take_screenshot(driver, kosum_id, adim_no)
            except:
                screenshot_yol = None
            if not hata_devam:
                sonuclar.append({
                    "adim_no": adim_no,
                    "islem_turu": islem,
                    "aciklama": aciklama,
                    "durum": durum,
                    "hata_mesaji": hata_mesaji,
                    "screenshot_yol": screenshot_yol,
                    "sure_ms": int((time.time() - baslangic) * 1000)
                })
                break

        sure_ms = int((time.time() - baslangic) * 1000)
        sonuclar.append({
            "adim_no": adim_no,
            "islem_turu": islem,
            "aciklama": aciklama,
            "durum": durum,
            "hata_mesaji": hata_mesaji,
            "screenshot_yol": screenshot_yol,
            "sure_ms": sure_ms
        })

    driver.quit()
    return sonuclar