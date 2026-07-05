// src/pages/QASenaryolar.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../services/api';

const islemTuruTurkce: Record<string, string> = {
  navigate: 'Sayfaya Git',
  click: 'Tıklandı',
  input: 'Değer Girildi',
  select: 'Seçildi',
  wait: 'Beklendi',
  screenshot: 'Ekran Görüntüsü',
};

const QASenaryolar: React.FC = () => {
  const [senaryolar, setSenaryolar] = useState<any[]>([]);
  const [projeler, setProjeler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [siliniyor, setSiliniyor] = useState<number | null>(null);
  const [secilenSenaryo, setSecilenSenaryo] = useState<any | null>(null);
  const [aramaMetni, setAramaMetni] = useState('');
  const [secilenProje, setSecilenProje] = useState<string>('');
  const [siralama, setSiralama] = useState<'ad_asc' | 'ad_desc' | 'adim_asc' | 'adim_desc'>('ad_asc');

  const fetchSenaryolar = async () => {
    try {
      const projRes = await api.get('/api/v1/projects/');
      setProjeler(projRes.data);
      let tumSenaryolar: any[] = [];
      for (const proje of projRes.data) {
        const senRes = await api.get(`/api/v1/scenarios/proje/${proje.id}`);
        tumSenaryolar = [...tumSenaryolar, ...senRes.data.map((s: any) => ({
          ...s, proje_ad: proje.ad, proje_id: proje.id
        }))];
      }
      setSenaryolar(tumSenaryolar);
    } catch (err) {
      console.error(err);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => { fetchSenaryolar(); }, []);

  const handleSil = async (id: number) => {
    if (!window.confirm('Bu senaryoyu silmek istediğinize emin misiniz?')) return;
    setSiliniyor(id);
    try {
      await api.delete(`/api/v1/scenarios/${id}`);
      setSenaryolar(senaryolar.filter(s => s.id !== id));
    } catch (err) {
      alert('Silme işlemi başarısız');
    } finally {
      setSiliniyor(null);
    }
  };

  const filtreliSenaryolar = senaryolar
    .filter(s => secilenProje ? s.proje_id === parseInt(secilenProje) : true)
    .filter(s => aramaMetni.trim() === '' ? true : s.ad.toLowerCase().includes(aramaMetni.toLowerCase()))
    .sort((a, b) => {
      const aAdim = a.json_icerik?.test_adimlari?.length || 0;
      const bAdim = b.json_icerik?.test_adimlari?.length || 0;
      if (siralama === 'ad_asc') return a.ad.localeCompare(b.ad, 'tr');
      if (siralama === 'ad_desc') return b.ad.localeCompare(a.ad, 'tr');
      if (siralama === 'adim_asc') return aAdim - bAdim;
      if (siralama === 'adim_desc') return bAdim - aAdim;
      return 0;
    });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F3F0' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="Test Senaryoları" subtitle="Kayıtlı senaryolarım" />
        <div style={{ padding: '24px' }}>
          {yukleniyor ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Yükleniyor...</div>
          ) : (
            <>
              {/* Filtreler */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Senaryo ara..."
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
                  <option value="ad_asc">Ad (A - Z)</option>
                  <option value="ad_desc">Ad (Z - A)</option>
                  <option value="adim_desc">Adım Sayısı (Çok - Az)</option>
                  <option value="adim_asc">Adım Sayısı (Az - Çok)</option>
                </select>
              </div>

              {/* Tablo */}
              <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #EDEBE5', overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid #EDEBE5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', fontFamily: 'Arial, sans-serif' }}>
                    Senaryolar ({filtreliSenaryolar.length})
                  </div>
                </div>

                {filtreliSenaryolar.length === 0 ? (
                  <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontSize: '13px', fontFamily: 'Arial, sans-serif' }}>
                    Sonuç bulunamadı.
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #EDEBE5' }}>
                        <th style={{ padding: '10px 18px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Senaryo Adı</th>
                        <th style={{ padding: '10px 18px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Proje</th>
                        <th style={{ padding: '10px 18px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Adım</th>
                        <th style={{ padding: '10px 18px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>İşlem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtreliSenaryolar.map((s) => (
                        <tr key={s.id} style={{ borderTop: '1px solid #F4F3F0' }}>
                          <td style={{ padding: '12px 18px' }}>
                            <div style={{ fontWeight: 600, color: '#222', fontFamily: 'Arial, sans-serif' }}>{s.ad}</div>
                          </td>
                          <td style={{ padding: '12px 18px' }}>
                            <span style={{
                              padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                              background: '#EEEDFE', color: '#3C3489', fontFamily: 'Arial, sans-serif'
                            }}>{s.proje_ad}</span>
                          </td>
                          <td style={{ padding: '12px 18px', color: '#888', fontFamily: 'Arial, sans-serif' }}>
                            {s.json_icerik?.test_adimlari?.length || 0} adım
                          </td>
                          <td style={{ padding: '12px 18px' }}>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => setSecilenSenaryo(s)}
                                style={{
                                  padding: '5px 12px', borderRadius: '20px',
                                  background: '#EEEDFE', color: '#3C3489',
                                  border: 'none', cursor: 'pointer',
                                  fontSize: '11px', fontFamily: 'Arial, sans-serif'
                                }}
                              >
                                Adımları Gör
                              </button>
                              <button
                                onClick={() => handleSil(s.id)}
                                disabled={siliniyor === s.id}
                                style={{
                                  padding: '5px 12px', borderRadius: '20px',
                                  background: '#FCEBEB', color: '#A32D2D',
                                  border: 'none', cursor: 'pointer',
                                  fontSize: '11px', fontFamily: 'Arial, sans-serif'
                                }}
                              >
                                {siliniyor === s.id ? '...' : 'Sil'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* MODAL */}
      {secilenSenaryo && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '28px',
            width: '750px', maxHeight: '80vh', overflow: 'auto',
            border: '1px solid #EDEBE5'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111', fontFamily: 'Arial, sans-serif' }}>
                  {secilenSenaryo.ad}
                </div>
                <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', fontFamily: 'Arial, sans-serif' }}>
                  {secilenSenaryo.json_icerik?.test_adimlari?.length || 0} adım · {secilenSenaryo.proje_ad}
                </div>
              </div>
              <button onClick={() => setSecilenSenaryo(null)} style={{
                background: '#F4F3F0', border: 'none', borderRadius: '50%',
                width: '32px', height: '32px', cursor: 'pointer', fontSize: '16px', color: '#888'
              }}>✕</button>
            </div>

            {secilenSenaryo.json_icerik?.test_metadata?.baslangic_url && (
              <div style={{
                background: '#FAFAF8', borderRadius: '8px', padding: '10px 14px',
                marginBottom: '16px', fontSize: '12px', color: '#555',
                border: '1px solid #EDEBE5', fontFamily: 'Arial, sans-serif'
              }}>
                Başlangıç URL: {secilenSenaryo.json_icerik.test_metadata.baslangic_url}
              </div>
            )}

            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #EDEBE5' }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif', width: '40px' }}>#</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>İşlem</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Açıklama</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Hedef</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Değer</th>
                </tr>
              </thead>
              <tbody>
                {secilenSenaryo.json_icerik?.test_adimlari?.map((adim: any) => (
                  <tr key={adim.adim_no} style={{ borderTop: '1px solid #F4F3F0' }}>
                    <td style={{ padding: '10px 12px', color: '#aaa', fontWeight: 600, fontFamily: 'Arial, sans-serif' }}>{adim.adim_no}</td>
                    <td style={{ padding: '10px 12px' }}>
                      <span style={{
                        padding: '3px 8px', borderRadius: '20px',
                        background: '#EEEDFE', color: '#3C3489',
                        fontSize: '11px', fontWeight: 500, fontFamily: 'Arial, sans-serif'
                      }}>
                        {islemTuruTurkce[adim.islem_turu] || adim.islem_turu}
                      </span>
                    </td>
                    <td style={{ padding: '10px 12px', color: '#555', fontFamily: 'Arial, sans-serif' }}>{adim.aciklama}</td>
                    <td style={{ padding: '10px 12px', color: '#888', fontSize: '11px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'Arial, sans-serif' }}>
                      {adim.selector || adim.hedef_url || '-'}
                    </td>
                    <td style={{ padding: '10px 12px', fontFamily: 'Arial, sans-serif' }}>
                      {adim.deger && adim.islem_turu !== 'navigate' ? (
                        <span style={{
                          background: '#E1F5EE', color: '#0F6E56',
                          padding: '2px 8px', borderRadius: '20px', fontSize: '11px'
                        }}>
                          {adim.deger}
                        </span>
                      ) : (
                        <span style={{ color: '#ccc' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default QASenaryolar;