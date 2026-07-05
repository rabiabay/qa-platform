// extension/background/service_worker.js
let kayitDurumu = false;
let kaydedilenAdimlar = [];
let aktifSekme = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "KAYIT_BASLAT") {
    kayitDurumu = true;
    kaydedilenAdimlar = [];
    aktifSekme = message.sekmeId;
    sendResponse({ basarili: true });
  }

  if (message.type === "KAYIT_DURDUR") {
    kayitDurumu = false;
    sendResponse({ basarili: true, adimlar: kaydedilenAdimlar });
  }

  if (message.type === "ADIM_EKLE") {
    if (kayitDurumu) {
      kaydedilenAdimlar.push({
        adim_no: kaydedilenAdimlar.length + 1,
        ...message.adim
      });
    }
    sendResponse({ basarili: true });
  }

  if (message.type === "DURUM_AL") {
    sendResponse({
      kayitDurumu,
      adimSayisi: kaydedilenAdimlar.length,
      adimlar: kaydedilenAdimlar
    });
  }

  if (message.type === "ADIM_SIL") {
    kaydedilenAdimlar = kaydedilenAdimlar.filter(
      (_, index) => index !== message.index
    );
    kaydedilenAdimlar = kaydedilenAdimlar.map((adim, index) => ({
      ...adim,
      adim_no: index + 1
    }));
    sendResponse({ basarili: true });
  }

  return true;
});