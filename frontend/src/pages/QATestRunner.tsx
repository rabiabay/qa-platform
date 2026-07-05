// src/pages/QATestRunner.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../services/api';

const skorBilgileri: Record<string, { tr: string; aciklama: string }> = {
  'Performance': { tr: 'Performans', aciklama: 'Sayfanın yükleme hızı' },
  'Accessibility': { tr: 'Erişilebilirlik', aciklama: 'Engelli kullanıcı desteği' },
  'Best Practices': { tr: 'En İyi Pratikler', aciklama: 'Güvenlik ve kod kalitesi' },
  'SEO': { tr: 'Arama Motoru (SEO)', aciklama: 'Google sıralama etkisi' },
};

const ScoreCircle: React.FC<{ label: string; score: number | null }> = ({ label, score }) => {
  const renk = score === null ? '#ccc' : score >= 90 ? '#3B6D11' : score >= 50 ? '#854F0B' : '#A32D2D';
  const bg = score === null ? '#f5f5f5' : score >= 90 ? '#EAF3DE' : score >= 50 ? '#FEF9C3' : '#FCEBEB';
  const bilgi = skorBilgileri[label];
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{
        width: '52px', height: '52px', borderRadius: '50%',
        background: bg, border: `3px solid ${renk}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 6px', fontSize: '13px', fontWeight: 500, color: renk
      }}>
        {score !== null ? score : '—'}
      </div>
      <div style={{ fontSize: '10px', fontWeight: 500, color: '#333', fontFamily: 'Arial, sans-serif' }}>{bilgi?.tr || label}</div>
      <div style={{ fontSize: '9px', color: '#999', marginTop: '2px', lineHeight: 1.3, fontFamily: 'Arial, sans-serif' }}>
        {bilgi?.aciklama}<br />90+ iyi · 50-89 orta
      </div>
    </div>
  );
};

const QATestRunner: React.FC = () => {
  const [projeler, setProjeler] = useState<any[]>([]);
  const [senaryolar, setSenaryolar] = useState<any[]>([]);
  const [secilenProje, setSecilenProje] = useState<string>('');
  const [secilenSenaryo, setSecilenSenaryo] = useState<string>('');
  const [headless, setHeadless] = useState('true');
  const [kosturuluyor, setKosturuluyor] = useState(false);
  const [sonuc, setSonuc] = useState<any>(null);
  const [adimSonuclari, setAdimSonuclari] = useState<any[]>([]);
  const [aiReceteler, setAiReceteler] = useState<any[]>([]);
  const [lighthouseYukleniyor, setLighthouseYukleniyor] = useState(false);
  const [lighthouseSonuc, setLighthouseSonuc] = useState<any>(null);

  useEffect(() => {
    const fetchProjeler = async () => {
      try {
        const projRes = await api.get('/api/v1/projects/');
        setProjeler(projRes.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjeler();
  }, []);

  useEffect(() => {
    if (!secilenProje) {
      setSenaryolar([]);
      setSecilenSenaryo('');
      return;
    }
    const fetchSenaryolar = async () => {
      try {
        const senRes = await api.get(`/api/v1/scenarios/proje/${secilenProje}`);
        setSenaryolar(senRes.data);
        setSecilenSenaryo('');
      } catch (err) {
        console.error(err);
      }
    };
    fetchSenaryolar();
  }, [secilenProje]);

  const handleKostur = async () => {
    if (!secilenSenaryo) { alert('Lütfen bir senaryo seçin'); return; }
    setKosturuluyor(true);
    setSonuc(null);
    setAdimSonuclari([]);
    setAiReceteler([]);
    setLighthouseSonuc(null);
    try {
      const res = await api.post(`/api/v1/runner/koştur/${secilenSenaryo}?headless=${headless === 'false' ? 'false' : 'true'}`);
      setSonuc(res.data);
      const detayRes = await api.get(`/api/v1/runner/kosum/${res.data.kosum_id}/detay`);
      setAdimSonuclari(detayRes.data.adimlar || []);
      setAiReceteler(detayRes.data.ai_receteler || []);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Test koşumu başarısız');
    } finally {
      setKosturuluyor(false);
    }
  };

  const handleLighthouse = async () => {
    if (!sonuc?.kosum_id) return;
    setLighthouseYukleniyor(true);
    try {
      const res = await api.post(`/api/v1/runner/lighthouse/${sonuc.kosum_id}`);
      setLighthouseSonuc(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Lighthouse analizi başarısız');
    } finally {
      setLighthouseYukleniyor(false);
    }
  };

  const getDurumRenk = (durum: string) => {
    if (durum === 'basarili') return { bg: '#E1F5EE', color: '#0F6E56' };
    if (durum === 'basarisiz') return { bg: '#FCEBEB', color: '#A32D2D' };
    return { bg: '#F4F3F0', color: '#888' };
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F3F0' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="Test Koşturucu" subtitle="Senaryo çalıştır ve sonuçları izle" />
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '16px' }}>

            {/* Sol Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Koşum Ayarları */}
              <div style={{
                background: 'white', borderRadius: '12px',
                border: '1px solid #EDEBE5', padding: '18px'
              }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '16px', fontFamily: 'Arial, sans-serif' }}>
                  Koşum Ayarları
                </div>

                {/* Proje Seçimi */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px', fontFamily: 'Arial, sans-serif' }}>
                    Proje
                  </label>
                  <select
                    value={secilenProje}
                    onChange={(e) => setSecilenProje(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 10px',
                      border: '1px solid #EDEBE5', borderRadius: '8px',
                      fontSize: '12px', fontFamily: 'Arial, sans-serif',
                      outline: 'none', background: 'white'
                    }}
                  >
                    <option value="">Proje seçin...</option>
                    {projeler.map((p) => (
                      <option key={p.id} value={p.id}>{p.ad}</option>
                    ))}
                  </select>
                </div>

                {/* Senaryo Seçimi */}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px', fontFamily: 'Arial, sans-serif' }}>
                    Senaryo
                  </label>
                  <select
                    value={secilenSenaryo}
                    onChange={(e) => setSecilenSenaryo(e.target.value)}
                    disabled={!secilenProje}
                    style={{
                      width: '100%', padding: '8px 10px',
                      border: '1px solid #EDEBE5', borderRadius: '8px',
                      fontSize: '12px', fontFamily: 'Arial, sans-serif',
                      outline: 'none', background: secilenProje ? 'white' : '#FAFAF8',
                      color: secilenProje ? '#111' : '#aaa'
                    }}
                  >
                    <option value="">Senaryo seçin...</option>
                    {senaryolar.map((s) => (
                      <option key={s.id} value={s.id}>{s.ad}</option>
                    ))}
                  </select>
                </div>

                {/* Headless Mod */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '11px', color: '#aaa', display: 'block', marginBottom: '4px', fontFamily: 'Arial, sans-serif' }}>
                    Headless Mod
                  </label>
                  <select
                    value={headless}
                    onChange={(e) => setHeadless(e.target.value)}
                    style={{
                      width: '100%', padding: '8px 10px',
                      border: '1px solid #EDEBE5', borderRadius: '8px',
                      fontSize: '12px', fontFamily: 'Arial, sans-serif',
                      outline: 'none', background: 'white'
                    }}
                  >
                    <option value="true">Açık (Arka planda)</option>
                    <option value="false">Kapalı (Tarayıcı görünür)</option>
                  </select>
                </div>

                {/* Testi Başlat */}
                <button
                  onClick={handleKostur}
                  disabled={kosturuluyor || !secilenSenaryo}
                  style={{
                    width: '100%', padding: '11px',
                    background: kosturuluyor || !secilenSenaryo ? '#EDEBE5' : '#4F46E5',
                    color: kosturuluyor || !secilenSenaryo ? '#aaa' : 'white',
                    border: 'none', borderRadius: '8px',
                    fontSize: '13px', cursor: kosturuluyor || !secilenSenaryo ? 'not-allowed' : 'pointer',
                    fontWeight: 600, fontFamily: 'Arial, sans-serif'
                  }}
                >
                  {kosturuluyor ? 'Test Çalışıyor...' : 'Testi Başlat'}
                </button>

                {/* Sonuç */}
                {sonuc && (
                  <div style={{
                    marginTop: '12px', padding: '12px',
                    background: sonuc.durum === 'basarili' ? '#E1F5EE' : '#FCEBEB',
                    borderRadius: '8px', border: `1px solid ${sonuc.durum === 'basarili' ? '#9FE1CB' : '#F09595'}`
                  }}>
                    <div style={{
                      fontSize: '13px', fontWeight: 600, fontFamily: 'Arial, sans-serif',
                      color: sonuc.durum === 'basarili' ? '#0F6E56' : '#A32D2D'
                    }}>
                      {sonuc.durum === 'basarili' ? 'Test Başarılı' : 'Test Başarısız'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#888', marginTop: '4px', fontFamily: 'Arial, sans-serif' }}>
                      Süre: {sonuc.sure_ms ? `${(sonuc.sure_ms / 1000).toFixed(1)}s` : '-'}
                    </div>
                  </div>
                )}
              </div>

              {/* Lighthouse */}
              {sonuc && (
                <div style={{
                  background: 'white', borderRadius: '12px',
                  border: '1px solid #EDEBE5', padding: '18px'
                }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '6px', fontFamily: 'Arial, sans-serif' }}>
                    Lighthouse Analizi
                  </div>
                  <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '12px', fontFamily: 'Arial, sans-serif' }}>
                    Performance, SEO, Accessibility skorlarını al
                  </div>
                  <button
                    onClick={handleLighthouse}
                    disabled={lighthouseYukleniyor}
                    style={{
                      width: '100%', padding: '10px',
                      background: lighthouseYukleniyor ? '#EDEBE5' : '#1E3A5F',
                      color: lighthouseYukleniyor ? '#aaa' : 'white',
                      border: 'none', borderRadius: '8px',
                      fontSize: '12px', cursor: lighthouseYukleniyor ? 'not-allowed' : 'pointer',
                      fontWeight: 600, fontFamily: 'Arial, sans-serif'
                    }}
                  >
                    {lighthouseYukleniyor ? 'Analiz Yapılıyor (~60sn)...' : 'Lighthouse Analizi Yap'}
                  </button>

                  {lighthouseSonuc && (
                    <div style={{ marginTop: '16px' }}>
                      <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '12px', textAlign: 'center', fontFamily: 'Arial, sans-serif' }}>
                        Lighthouse Skorları
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <ScoreCircle label="Performance" score={lighthouseSonuc.performance} />
                        <ScoreCircle label="Accessibility" score={lighthouseSonuc.accessibility} />
                        <ScoreCircle label="Best Practices" score={lighthouseSonuc.best_practice} />
                        <ScoreCircle label="SEO" score={lighthouseSonuc.seo} />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Sağ Panel */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* Adım Sonuçları */}
              <div style={{
                background: 'white', borderRadius: '12px',
                border: '1px solid #EDEBE5', overflow: 'hidden'
              }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #EDEBE5' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', fontFamily: 'Arial, sans-serif' }}>
                    Adım Sonuçları {adimSonuclari.length > 0 && `(${adimSonuclari.length} adım)`}
                  </div>
                </div>

                <div style={{ padding: '12px 18px' }}>
                  {kosturuluyor && (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#888', fontFamily: 'Arial, sans-serif' }}>
                      Test çalışıyor, lütfen bekleyin...
                    </div>
                  )}

                  {adimSonuclari.length === 0 && !kosturuluyor && (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#aaa', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
                      Test başlatıldığında adım sonuçları burada görünecek
                    </div>
                  )}

                  {adimSonuclari.map((adim) => {
                    const renk = getDurumRenk(adim.durum);
                    return (
                      <div key={adim.id} style={{
                        display: 'flex', alignItems: 'flex-start', gap: '10px',
                        padding: '10px 0', borderBottom: '1px solid #F4F3F0'
                      }}>
                        <div style={{
                          width: '24px', height: '24px', borderRadius: '50%',
                          background: renk.bg, color: renk.color,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 700, flexShrink: 0,
                          fontFamily: 'Arial, sans-serif'
                        }}>
                          {adim.adim_no}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '12px', fontWeight: 500, color: '#222', fontFamily: 'Arial, sans-serif' }}>
                            {adim.aciklama || adim.islem_turu}
                          </div>
                          <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', fontFamily: 'Arial, sans-serif' }}>
                            {adim.islem_turu} · {adim.sure_ms}ms
                          </div>
                          {adim.hata_mesaji && (
                            <div style={{
                              marginTop: '6px', padding: '8px 10px',
                              background: '#FCEBEB', borderRadius: '8px',
                              fontSize: '11px', color: '#A32D2D', fontFamily: 'Arial, sans-serif'
                            }}>
                              {adim.hata_mesaji.substring(0, 200)}
                            </div>
                          )}
                          {adim.screenshot_yol && sonuc && (
                            <div style={{ marginTop: '8px' }}>
                              <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '4px', fontFamily: 'Arial, sans-serif' }}>
                                Hata Anı Ekran Görüntüsü:
                              </div>
                              <img
                                src={`http://127.0.0.1:8000/api/v1/runner/screenshot/${sonuc.kosum_id}/${adim.adim_no}`}
                                alt="Hata ekran görüntüsü"
                                style={{ width: '100%', borderRadius: '8px', border: '1px solid #EDEBE5', marginTop: '4px' }}
                              />
                            </div>
                          )}
                        </div>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px',
                          fontSize: '10px', fontWeight: 500,
                          background: renk.bg, color: renk.color,
                          fontFamily: 'Arial, sans-serif', flexShrink: 0
                        }}>
                          {adim.durum === 'basarili' ? 'başarılı' : adim.durum === 'basarisiz' ? 'başarısız' : adim.durum}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* AI Reçeteler */}
              {aiReceteler.length > 0 && (
                <div style={{
                  background: 'white', borderRadius: '12px',
                  border: '1px solid #EDEBE5', overflow: 'hidden'
                }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #EDEBE5' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', fontFamily: 'Arial, sans-serif' }}>
                      AI Reçeteler ({aiReceteler.length})
                    </div>
                  </div>
                  <div style={{ padding: '12px 18px' }}>
                    {aiReceteler.map((recete, index) => (
                      <div key={index} style={{
                        padding: '14px', background: '#FAFAF8',
                        borderRadius: '10px', marginBottom: '10px',
                        border: '1px solid #EDEBE5'
                      }}>
                        <div style={{
                          padding: '8px 10px', background: '#FCEBEB',
                          borderRadius: '8px', marginBottom: '10px'
                        }}>
                          <div style={{ fontSize: '11px', fontWeight: 600, color: '#A32D2D', marginBottom: '3px', fontFamily: 'Arial, sans-serif' }}>
                            Hata
                          </div>
                          <div style={{ fontSize: '11px', color: '#791F1F', fontFamily: 'Arial, sans-serif' }}>
                            {recete.hata_ozeti?.substring(0, 150)}
                          </div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#555', lineHeight: 1.7, fontFamily: 'Arial, sans-serif', marginBottom: '10px' }}>
                          {recete.ai_analiz?.substring(0, 300)}
                        </div>
                        {recete.cozum_adimlari?.length > 0 && (
                          <div style={{ padding: '8px 10px', background: '#E1F5EE', borderRadius: '8px' }}>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: '#0F6E56', marginBottom: '6px', fontFamily: 'Arial, sans-serif' }}>
                              Çözüm Adımları
                            </div>
                            {recete.cozum_adimlari.map((adim: string, i: number) => (
                              <div key={i} style={{ fontSize: '11px', color: '#085041', padding: '2px 0', fontFamily: 'Arial, sans-serif', display: 'flex', gap: '6px' }}>
                                <span style={{ fontWeight: 700 }}>{i + 1}.</span>
                                <span>{adim}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        <div style={{ marginTop: '8px', fontSize: '11px', color: '#aaa', fontFamily: 'Arial, sans-serif' }}>
                          Güven skoru: %{Math.round((recete.ozguven_skoru || 0) * 100)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default QATestRunner;