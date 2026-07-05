// extension/content/recorder.js
let kayitAktif = false;

function getSelector(element) {
  if (element.id) return { selector: '#' + element.id, selector_turu: 'css' };
  if (element.name) return { selector: '[name="' + element.name + '"]', selector_turu: 'css' };
  if (element.className) {
    const classes = '.' + element.className.trim().split(/\s+/).join('.');
    return { selector: classes, selector_turu: 'css' };
  }
  const tag = element.tagName.toLowerCase();
  const parent = element.parentElement;
  if (parent) {
    const siblings = Array.from(parent.children).filter(c => c.tagName === element.tagName);
    if (siblings.length > 1) {
      const index = siblings.indexOf(element) + 1;
      return { selector: `${tag}:nth-child(${index})`, selector_turu: 'css' };
    }
  }
  return { selector: tag, selector_turu: 'css' };
}

function adimGonder(adim) {
  chrome.runtime.sendMessage({ type: "ADIM_EKLE", adim }, () => {});
}

document.addEventListener('click', (e) => {
  if (!kayitAktif) return;
  const el = e.target;
  const { selector, selector_turu } = getSelector(el);
  adimGonder({
    islem_turu: 'click',
    aciklama: `${el.tagName.toLowerCase()} elementine tıklandı`,
    selector,
    selector_turu,
    deger: '',
    bekleme_suresi_ms: 500,
    screenshot_al: false
  });
}, true);

document.addEventListener('input', (e) => {
  if (!kayitAktif) return;
  const el = e.target;
  // Sadece text input ve textarea için kaydet, radio/checkbox için kaydetme
  if (el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA') return;
  if (el.type === 'radio' || el.type === 'checkbox') return;
  const { selector, selector_turu } = getSelector(el);
  adimGonder({
    islem_turu: 'input',
    aciklama: `${selector} alanına değer girildi`,
    selector,
    selector_turu,
    deger: el.value,
    bekleme_suresi_ms: 300,
    screenshot_al: false
  });
}, true);

document.addEventListener('change', (e) => {
  if (!kayitAktif) return;
  const el = e.target;
  const { selector, selector_turu } = getSelector(el);

  if (el.tagName === 'SELECT') {
    adimGonder({
      islem_turu: 'select',
      aciklama: `${selector} seçildi`,
      selector,
      selector_turu,
      deger: el.options[el.selectedIndex]?.text || '',
      bekleme_suresi_ms: 300,
      screenshot_al: false
    });
  } else if (el.type === 'radio' || el.type === 'checkbox') {
    // Radio ve checkbox için sadece click kaydedildi, tekrar kaydetme
    return;
  } else if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
    adimGonder({
      islem_turu: 'input',
      aciklama: `${selector} alanına değer girildi`,
      selector,
      selector_turu,
      deger: el.value,
      bekleme_suresi_ms: 300,
      screenshot_al: false
    });
  }
}, true);

chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "KAYIT_BASLAT") kayitAktif = true;
  if (message.type === "KAYIT_DURDUR") kayitAktif = false;
});

chrome.runtime.sendMessage({ type: "DURUM_AL" }, (response) => {
  if (response) kayitAktif = response.kayitDurumu;
});