// src/pages/QAAIReceteler.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../services/api';

const temizleHataOzeti = (ozet: string): string => {
  if (!ozet) return '-';
  if (ozet.includes('GetHandleVerifier') || ozet.includes('chromedriver')) return 'Element bulunamadı veya sayfa yüklenemedi';
  if (ozet.includes('invalid selector')) return 'Geçersiz element seçici';
  if (ozet.includes('timeout') || ozet.includes('Timeout')) return 'Zaman aşımı - element bulunamadı';
  if (ozet.includes('no such element')) return 'Element sayfada mevcut değil';
  if (ozet.includes('stale')) return 'Element artık sayfada yok';
  return ozet.substring(0, 80) + '...';
};

const QAAIReceteler: React.FC = () => {
  const [receteler, setReceteler] = useState<any[]>([]);
  const [projeler, setProjeler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secilenRecete, setSecilenRecete] = useState<any | null>(null);
  const [aramaMetni, setAramaMetni] = useState('');
  const [secilenProje, setSecilenProje] = useState<string>('');
  const [siralama, setSiralama] = useState<'tarih_desc' | 'tarih_asc' | 'senaryo_asc'>('tarih_desc');

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

  const filtreliReceteler = receteler
    .filter(r => secilenProje ? r.proje_id === parseInt(secilenProje) : true)
    .filter(r => aramaMetni.trim() === '' ? true : r.senaryo_ad.toLowerCase().includes(aramaMetni.toLowerCase()))
    .sort((a, b) => {
      if (siralama === 'tarih_desc') return new Date(b.kosum_tarihi).getTime() - new Date(a.kosum_tarihi).getTime();
      if (siralama === 'tarih_asc') return new Date(a.kosum_tarihi).getTime() - new Date(b.kosum_tarihi).getTime();
      if (siralama === 'senaryo_asc') return a.senaryo_ad.localeCompare(b.senaryo_ad, 'tr');
      return 0;
    });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F3F0' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="AI Reçeteler" subtitle="OpenAI hata analiz sonuçları" />
        <div style={{ padding: '24px' }}>

          {/* Filtreler */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Senaryo adı ara..."
              value={aramaMetni}
              onChange={e => setAramaMetni(e.target.value)}
              style={{
                padding: '7px 12px', borderRadius: '8px', border: '1px solid #EDEBE5',
                fontSize: '12px', outline: 'none', minWidth: '200px',
                fontFamily: 'Arial, sans-serif', background: 'white'
              }}
            />
            <select
              value={secilenProje}
              onChange={e => setSecilenProje(e.target.value)}
              style={{
                padding: '7px 12px', borderRadius: '8px', border: '1px solid #EDEBE5',
                fontSize: '12px', outline: 'none', cursor: 'pointer',
                background: 'white', fontFamily: 'Arial, sans-serif'
              }}
            >
              <option value="">Tüm Projeler</option>
              {projeler.map(p => (
                <option key={p.id} value={p.id}>{p.ad}</option>
              ))}
            </select>
            <select
              value={siralama}
              onChange={e => setSiralama(e.target.value as any)}
              style={{
                padding: '7px 12px', borderRadius: '8px', border: '1px solid #EDEBE5',
                fontSize: '12px', outline: 'none', cursor: 'pointer',
                background: 'white', fontFamily: 'Arial, sans-serif'
              }}
            >
              <option value="tarih_desc">Tarih (Yeni - Eski)</option>
              <option value="tarih_asc">Tarih (Eski - Yeni)</option>
              <option value="senaryo_asc">Senaryo Adı (A - Z)</option>
            </select>
          </div>

          {/* Tablo */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #EDEBE5', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #EDEBE5' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', fontFamily: 'Arial, sans-serif' }}>
                AI Reçeteler ({filtreliReceteler.length})
              </div>
            </div>
            {yukleniyor ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontFamily: 'Arial, sans-serif' }}>Yükleniyor...</div>
            ) : filtreliReceteler.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontSize: '13px', fontFamily: 'Arial, sans-serif' }}>Sonuç bulunamadı.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #EDEBE5' }}>
                    <th style={{ padding: '10px 18px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Senaryo</th>
                    <th style={{ padding: '10px 18px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Proje</th>
                    <th style={{ padding: '10px 18px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Hata Özeti</th>
                    <th style={{ padding: '10px 18px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Tarih</th>
                    <th style={{ padding: '10px 18px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filtreliReceteler.map((r, i) => (
                    <tr key={i} style={{ borderTop: '1px solid #F4F3F0' }}>
                      <td style={{ padding: '12px 18px', fontWeight: 500, color: '#222', fontFamily: 'Arial, sans-serif' }}>{r.senaryo_ad}</td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', background: '#EEEDFE', color: '#3C3489', fontFamily: 'Arial, sans-serif' }}>
                          {r.proje_ad}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '11px', background: '#FCEBEB', color: '#A32D2D', fontFamily: 'Arial, sans-serif' }}>
                          {temizleHataOzeti(r.hata_ozeti)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', color: '#aaa', fontSize: '11px', fontFamily: 'Arial, sans-serif' }}>
                        {new Date(r.kosum_tarihi).toLocaleString('tr-TR')}
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <button onClick={() => setSecilenRecete(r)} style={{
                          padding: '5px 12px', borderRadius: '20px',
                          background: '#EEEDFE', color: '#3C3489',
                          border: 'none', cursor: 'pointer', fontSize: '11px',
                          fontFamily: 'Arial, sans-serif'
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

      {/* Modal */}
      {secilenRecete && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '28px',
            width: '620px', maxHeight: '80vh', overflow: 'auto',
            border: '1px solid #EDEBE5'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111', fontFamily: 'Arial, sans-serif' }}>
                  AI Reçete Detayı
                </div>
                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', fontFamily: 'Arial, sans-serif' }}>
                  {secilenRecete.senaryo_ad} - {secilenRecete.proje_ad}
                </div>
              </div>
              <button onClick={() => setSecilenRecete(null)} style={{
                background: '#F4F3F0', border: 'none', borderRadius: '50%',
                width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', color: '#888'
              }}>x</button>
            </div>

            <div style={{ marginBottom: '12px', padding: '14px', background: '#FCEBEB', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#A32D2D', marginBottom: '6px', fontFamily: 'Arial, sans-serif' }}>Hata Özeti</div>
              <div style={{ fontSize: '12px', color: '#791F1F', fontFamily: 'Arial, sans-serif' }}>{temizleHataOzeti(secilenRecete.hata_ozeti)}</div>
            </div>

            <div style={{ marginBottom: '12px', padding: '14px', background: '#FAFAF8', borderRadius: '10px', border: '1px solid #EDEBE5' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#333', marginBottom: '6px', fontFamily: 'Arial, sans-serif' }}>AI Analizi</div>
              <div style={{ fontSize: '12px', color: '#555', lineHeight: 1.8, whiteSpace: 'pre-wrap', fontFamily: 'Arial, sans-serif' }}>{secilenRecete.ai_analiz}</div>
            </div>

            {secilenRecete.cozum_adimlari?.length > 0 && (
              <div style={{ padding: '14px', background: '#E1F5EE', borderRadius: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 600, color: '#0F6E56', marginBottom: '8px', fontFamily: 'Arial, sans-serif' }}>Çözüm Adımları</div>
                {secilenRecete.cozum_adimlari.map((adim: string, i: number) => (
                  <div key={i} style={{ fontSize: '12px', color: '#085041', padding: '3px 0', display: 'flex', gap: '8px', fontFamily: 'Arial, sans-serif' }}>
                    <span style={{ fontWeight: 700 }}>{i + 1}.</span>
                    <span>{adim}</span>
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

export default QAAIReceteler;