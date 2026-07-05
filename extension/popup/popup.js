// extension/popup/popup.js
const API_URL = 'http://127.0.0.1:8000';
let token = null;
let kayitAktif = false;
let adimlar = [];

function showAlert(mesaj, tip = 'success', hedef = 'alert') {
  const el = document.getElementById(hedef);
  el.innerHTML = `<div class="alert alert-${tip}">${mesaj}</div>`;
  setTimeout(() => el.innerHTML = '', 3000);
}

function renderSteps() {
  const liste = document.getElementById('stepsList');
  const sayac = document.getElementById('stepCount');
  sayac.textContent = `${adimlar.length} adım`;

  if (adimlar.length === 0) {
    liste.innerHTML = '<div class="empty-state">Henüz adım kaydedilmedi.<br>Kaydı başlatıp web sitesinde gezinin.</div>';
    return;
  }

  liste.innerHTML = adimlar.map((adim, index) => `
    <div class="step-item">
      <div class="step-num">${adim.adim_no}</div>
      <div class="step-info">
        <div class="step-type">${adim.islem_turu}</div>
        <div class="step-desc">${adim.aciklama}</div>
      </div>
      <span class="step-del" data-index="${index}">×</span>
    </div>
  `).join('');

  document.querySelectorAll('.step-del').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index);
      chrome.runtime.sendMessage({ type: "ADIM_SIL", index }, () => {
        chrome.runtime.sendMessage({ type: "DURUM_AL" }, (res) => {
          adimlar = res.adimlar;
          renderSteps();
        });
      });
    });
  });
}

function setKayitDurumu(aktif) {
  kayitAktif = aktif;
  const badge = document.getElementById('statusBadge');
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const saveBtn = document.getElementById('saveBtn');

  if (aktif) {
    badge.textContent = 'Kayıt Aktif';
    badge.className = 'status-badge status-active';
    startBtn.disabled = true;
    startBtn.className = 'btn btn-start btn-disabled';
    stopBtn.disabled = false;
    stopBtn.className = 'btn btn-stop';
    saveBtn.disabled = true;
    saveBtn.className = 'btn btn-save btn-disabled';
  } else {
    badge.textContent = adimlar.length > 0 ? 'Kayıt Durduruldu' : 'Beklemede';
    badge.className = 'status-badge status-inactive';
    startBtn.disabled = false;
    startBtn.className = 'btn btn-start';
    stopBtn.disabled = true;
    stopBtn.className = 'btn btn-stop btn-disabled';
    if (adimlar.length > 0) {
      saveBtn.disabled = false;
      saveBtn.className = 'btn btn-save';
    }
  }
}

function showLogin() {
  chrome.storage.local.clear();
  token = null;
  document.getElementById('loginSection').style.display = 'block';
  document.getElementById('mainSection').style.display = 'none';
}

function showMain() {
  document.getElementById('loginSection').style.display = 'none';
  document.getElementById('mainSection').style.display = 'block';
}

async function tokenKontrol(t) {
  try {
    const res = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: { 'Authorization': `Bearer ${t}` }
    });
    return res.ok;
  } catch {
    return false;
  }
}

// Başlangıçta token doğrula
chrome.storage.local.get(['token', 'user'], async (result) => {
  if (result.token) {
    const gecerli = await tokenKontrol(result.token);
    if (gecerli) {
      token = result.token;
      showMain();
    } else {
      showLogin();
      showAlert('Oturum suresi doldu, lutfen tekrar giris yapin', 'error', 'loginAlert');
    }
  } else {
    showLogin();
  }

  chrome.runtime.sendMessage({ type: "DURUM_AL" }, (response) => {
    if (response) {
      adimlar = response.adimlar || [];
      setKayitDurumu(response.kayitDurumu);
      renderSteps();
    }
  });
});

document.getElementById('loginBtn').addEventListener('click', async () => {
  const email = document.getElementById('loginEmail').value;
  const sifre = document.getElementById('loginPassword').value;

  if (!email || !sifre) {
    showAlert('E-posta ve şifre gerekli', 'error', 'loginAlert');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, sifre })
    });

    if (!response.ok) {
      const err = await response.json();
      showAlert(err.detail || 'Giriş başarısız', 'error', 'loginAlert');
      return;
    }

    const data = await response.json();
    token = data.access_token;
    chrome.storage.local.set({ token, user: data });
    showMain();
    showAlert(`Hos geldin, ${data.ad_soyad}!`);

  } catch (err) {
    showAlert('Sunucuya baglanılamadı', 'error', 'loginAlert');
  }
});

document.getElementById('startBtn').addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];

    const navigateAdimi = {
      adim_no: 1,
      islem_turu: 'navigate',
      aciklama: `${tab.url} adresine gidildi`,
      hedef_url: tab.url,
      selector: '',
      selector_turu: 'css',
      deger: tab.url,
      bekleme_suresi_ms: 1000,
      screenshot_al: false
    };

    chrome.runtime.sendMessage({ type: "KAYIT_BASLAT", sekmeId: tab.id }, () => {
      chrome.runtime.sendMessage({ type: "ADIM_EKLE", adim: navigateAdimi }, () => {
        chrome.tabs.sendMessage(tab.id, { type: "KAYIT_BASLAT" });
        adimlar = [navigateAdimi];
        setKayitDurumu(true);
        renderSteps();
      });
    });
  });
});

document.getElementById('stopBtn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: "KAYIT_DURDUR" }, (response) => {
    adimlar = response.adimlar;
    setKayitDurumu(false);
    renderSteps();
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { type: "KAYIT_DURDUR" });
    });
  });
});

document.getElementById('saveBtn').addEventListener('click', async () => {
  const ad = document.getElementById('scenarioName').value;
  const projeId = document.getElementById('projectId').value;

  if (!ad) { showAlert('Senaryo adı gerekli', 'error'); return; }
  if (!projeId) { showAlert('Proje ID gerekli', 'error'); return; }
  if (!token) { showLogin(); return; }

  const jsonIcerik = {
    test_metadata: {
      baslangic_url: adimlar[0]?.hedef_url || '',
      tarayici: 'Chrome',
      ekran_genisligi: 1920,
      ekran_yuksekligi: 1080,
      olusturma_tarihi: new Date().toISOString(),
      etiketler: []
    },
    test_adimlari: adimlar,
    calisma_ayarlari: {
      max_bekleme_suresi_sn: 30,
      hata_aninda_devam_et: false,
      headless_mod: true,
      implicit_wait_sn: 10
    }
  };

  try {
    const response = await fetch(
      `${API_URL}/api/v1/scenarios/proje/${projeId}?ad=${encodeURIComponent(ad)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(jsonIcerik)
      }
    );

    if (response.status === 401) {
      showLogin();
      showAlert('Oturum suresi doldu, lutfen tekrar giris yapin', 'error', 'loginAlert');
      return;
    }

    if (!response.ok) {
      const err = await response.json();
      showAlert(err.detail || 'Kayıt başarısız', 'error');
      return;
    }

    showAlert('Senaryo başarıyla kaydedildi!');
    adimlar = [];
    renderSteps();
    setKayitDurumu(false);
    document.getElementById('scenarioName').value = '';

  } catch (err) {
    showAlert('Sunucuya baglanılamadı', 'error');
  }
});

setInterval(() => {
  if (kayitAktif) {
    chrome.runtime.sendMessage({ type: "DURUM_AL" }, (response) => {
      if (response) {
        adimlar = response.adimlar || [];
        renderSteps();
      }
    });
  }
}, 1000);