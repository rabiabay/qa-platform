// src/pages/AdminAIReceteler.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../services/api';

const hataOzetiTemizle = (hata: string): string => {
  if (!hata) return '-';
  if (hata.includes('chromedriver') || hata.includes('GetHandleVerifier')) {
    return 'Element bulunamadı veya sayfa yüklenemedi';
  }
  if (hata.includes('invalid selector')) {
    return 'Geçersiz element seçici';
  }
  if (hata.includes('TimeoutException') || hata.includes('timeout')) {
    return 'Sayfa zaman aşımına uğradı';
  }
  if (hata.includes('NoSuchElement')) {
    return 'Element sayfada bulunamadı';
  }
  if (hata.includes('locked_out_user') || hata.includes('locked out')) {
    return 'Kilitli kullanıcı ile giriş denemesi';
  }
  return hata.substring(0, 60) + '...';
};

const AdminAIReceteler: React.FC = () => {
  const [receteler, setReceteler] = useState<any[]>([]);
  const [projeler, setProjeler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secilenRecete, setSecilenRecete] = useState<any | null>(null);
  const [secilenProje, setSecilenProje] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projRes = await api.get('/api/v1/projects/');
        setProjeler(projRes.data);
        let tumReceteler: any[] = [];
        for (const proje of projRes.data) {
          const senRes = await api.get(`/api/v1/scenarios/proje/${proje.id}`);
          for (const sen of senRes.data) {
            const kosumRes = await api.get(`/api/v1/runner/kosumlar/${sen.id}`);
            for (const kosum of kosumRes.data) {
              if (kosum.durum === 'basarisiz') {
                const receteRes = await api.get(`/api/v1/runner/ai-receteler/${kosum.id}`);
                for (const r of receteRes.data) {
                  tumReceteler.push({
                    ...r,
                    senaryo_ad: sen.ad,
                    proje_ad: proje.ad,
                    proje_id: proje.id,
                    kosum_tarihi: kosum.baslangic_zamani
                  });
                }
              }
            }
          }
        }
        tumReceteler.sort((a, b) => new Date(b.kosum_tarihi).getTime() - new Date(a.kosum_tarihi).getTime());
        setReceteler(tumReceteler);
      } catch (err) {
        console.error(err);
      } finally {
        setYukleniyor(false);
      }
    };
    fetchData();
  }, []);

  const filtreliReceteler = secilenProje
    ? receteler.filter(r => r.proje_id === parseInt(secilenProje))
    : receteler;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="AI Reçeteler" subtitle="Tüm AI hata analizleri" />
        <div style={{ padding: '20px' }}>

          {/* Proje Filtresi */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button onClick={() => setSecilenProje('')}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                background: secilenProje === '' ? '#534AB7' : 'white',
                color: secilenProje === '' ? 'white' : '#555',
                border: secilenProje === '' ? 'none' : '1px solid #ddd'
              }}>
              Tüm Projeler
            </button>
            {projeler.map(p => (
              <button key={p.id} onClick={() => setSecilenProje(String(p.id))}
                style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                  background: secilenProje === String(p.id) ? '#534AB7' : 'white',
                  color: secilenProje === String(p.id) ? 'white' : '#555',
                  border: secilenProje === String(p.id) ? 'none' : '1px solid #ddd'
                }}>
                {p.ad}
              </button>
            ))}
          </div>

          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #eee', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>AI Reçeteler ({filtreliReceteler.length})</div>
            </div>
            {yukleniyor ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Yükleniyor...</div>
            ) : filtreliReceteler.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontSize: '13px' }}>
                Henüz AI reçete yok.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Senaryo</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Proje</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Hata Özeti</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Tarih</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filtreliReceteler.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: '#333' }}>{r.senaryo_ad}</td>
                      <td style={{ padding: '12px 16px', color: '#555' }}>{r.proje_ad}</td>
                      <td style={{ padding: '12px 16px', color: '#555', fontSize: '11px' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: '4px',
                          background: '#FCEBEB', color: '#A32D2D', fontSize: '11px'
                        }}>
                          {hataOzetiTemizle(r.hata_ozeti)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: '#888', fontSize: '11px' }}>
                        {new Date(r.kosum_tarihi).toLocaleString('tr-TR')}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <button onClick={() => setSecilenRecete(r)}
                          style={{
                            padding: '5px 10px', borderRadius: '6px',
                            background: '#EEF2FF', color: '#3730A3',
                            border: '1px solid #C7D2FE', cursor: 'pointer', fontSize: '11px'
                          }}>
                          Detay Gör
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {secilenRecete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '12px', padding: '24px',
            width: '600px', maxHeight: '80vh', overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#333' }}>AI Reçete Detayı</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>{secilenRecete.senaryo_ad} · {secilenRecete.proje_ad}</div>
              </div>
              <button onClick={() => setSecilenRecete(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#888' }}>✕</button>
            </div>
            <div style={{ marginBottom: '12px', padding: '10px', background: '#FCEBEB', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, color: '#A32D2D', marginBottom: '4px' }}>Hata Özeti</div>
              <div style={{ fontSize: '12px', color: '#791F1F' }}>{secilenRecete.hata_ozeti}</div>
            </div>
            <div style={{ marginBottom: '12px', padding: '10px', background: '#f9f9f9', borderRadius: '8px' }}>
              <div style={{ fontSize: '11px', fontWeight: 500, color: '#333', marginBottom: '4px' }}>AI Analizi</div>
              <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{secilenRecete.ai_analiz}</div>
            </div>
            {secilenRecete.cozum_adimlari?.length > 0 && (
              <div style={{ padding: '10px', background: '#EAF3DE', borderRadius: '8px' }}>
                <div style={{ fontSize: '11px', fontWeight: 500, color: '#3B6D11', marginBottom: '6px' }}>Çözüm Adımları</div>
                {secilenRecete.cozum_adimlari.map((adim: string, i: number) => (
                  <div key={i} style={{ fontSize: '11px', color: '#27500A', padding: '3px 0' }}>
                    {i + 1}. {adim}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAIReceteler;