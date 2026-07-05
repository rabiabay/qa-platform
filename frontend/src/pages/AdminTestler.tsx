// src/pages/AdminTestler.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../services/api';

const AdminTestler: React.FC = () => {
  const [projeler, setProjeler] = useState<any[]>([]);
  const [kosumlar, setKosumlar] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [secilenProje, setSecilenProje] = useState<number | null>(null);
  const [ozet, setOzet] = useState({ toplam: 0, basarili: 0, basarisiz: 0 });
  const [aramaMetni, setAramaMetni] = useState('');
  const [durumFiltre, setDurumFiltre] = useState<'hepsi' | 'basarili' | 'basarisiz'>('hepsi');
  const [siralama, setSiralama] = useState<'tarih_desc' | 'tarih_asc' | 'sure_desc' | 'sure_asc' | 'senaryo_asc'>('tarih_desc');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projRes = await api.get('/api/v1/projects/');
        setProjeler(projRes.data);
        let tumKosumlar: any[] = [];
        for (const proje of projRes.data) {
          const senRes = await api.get(`/api/v1/scenarios/proje/${proje.id}`);
          for (const sen of senRes.data) {
            const kosumRes = await api.get(`/api/v1/runner/kosumlar/${sen.id}`);
            tumKosumlar = [...tumKosumlar, ...kosumRes.data.map((k: any) => ({
              ...k, senaryo_ad: sen.ad, proje_ad: proje.ad, proje_id: proje.id
            }))];
          }
        }
        tumKosumlar.sort((a, b) => new Date(b.baslangic_zamani).getTime() - new Date(a.baslangic_zamani).getTime());
        setKosumlar(tumKosumlar);
        const basarili = tumKosumlar.filter(k => k.durum === 'basarili').length;
        const basarisiz = tumKosumlar.filter(k => k.durum === 'basarisiz').length;
        setOzet({ toplam: tumKosumlar.length, basarili, basarisiz });
      } catch (err) {
        console.error(err);
      } finally {
        setYukleniyor(false);
      }
    };
    fetchData();
  }, []);

  const getDurumRenk = (durum: string) => {
    if (durum === 'basarili') return { bg: '#EAF3DE', color: '#3B6D11' };
    if (durum === 'basarisiz') return { bg: '#FCEBEB', color: '#A32D2D' };
    return { bg: '#F1EFE8', color: '#5F5E5A' };
  };

  const filtreliVeSiralanmis = kosumlar
    .filter(k => secilenProje ? k.proje_id === secilenProje : true)
    .filter(k => durumFiltre === 'hepsi' ? true : k.durum === durumFiltre)
    .filter(k => aramaMetni.trim() === '' ? true : k.senaryo_ad.toLowerCase().includes(aramaMetni.toLowerCase()))
    .sort((a, b) => {
      if (siralama === 'tarih_desc') return new Date(b.baslangic_zamani).getTime() - new Date(a.baslangic_zamani).getTime();
      if (siralama === 'tarih_asc') return new Date(a.baslangic_zamani).getTime() - new Date(b.baslangic_zamani).getTime();
      if (siralama === 'sure_desc') return (b.sure_ms || 0) - (a.sure_ms || 0);
      if (siralama === 'sure_asc') return (a.sure_ms || 0) - (b.sure_ms || 0);
      if (siralama === 'senaryo_asc') return a.senaryo_ad.localeCompare(b.senaryo_ad, 'tr');
      return 0;
    });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="Tüm Testler" subtitle="Sistemdeki tüm test koşumları" />
        <div style={{ padding: '20px' }}>

          {/* Özet Kartlar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Toplam Koşum', value: ozet.toplam, color: '#3730A3' },
              { label: 'Başarılı', value: ozet.basarili, color: '#3B6D11' },
              { label: 'Başarısız', value: ozet.basarisiz, color: '#A32D2D' },
            ].map((kart) => (
              <div key={kart.label} style={{
                background: 'white', borderRadius: '10px', padding: '16px',
                border: '1px solid #eee', textAlign: 'center'
              }}>
                <div style={{ fontSize: '24px', fontWeight: 700, color: kart.color }}>{kart.value}</div>
                <div style={{ fontSize: '11px', color: '#888', marginTop: '4px' }}>{kart.label}</div>
              </div>
            ))}
          </div>

          {/* Proje Filtresi */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setSecilenProje(null)}
              style={{
                padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                background: secilenProje === null ? '#534AB7' : 'white',
                color: secilenProje === null ? 'white' : '#555',
                border: secilenProje === null ? 'none' : '1px solid #ddd'
              }}
            >
              Tüm Projeler
            </button>
            {projeler.map(p => (
              <button
                key={p.id}
                onClick={() => setSecilenProje(p.id)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', fontSize: '12px', cursor: 'pointer',
                  background: secilenProje === p.id ? '#534AB7' : 'white',
                  color: secilenProje === p.id ? 'white' : '#555',
                  border: secilenProje === p.id ? 'none' : '1px solid #ddd'
                }}
              >
                {p.ad}
              </button>
            ))}
          </div>

          {/* Arama + Durum Filtresi + Sıralama */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Arama */}
            <input
              type="text"
              placeholder="Senaryo adı ara..."
              value={aramaMetni}
              onChange={e => setAramaMetni(e.target.value)}
              style={{
                padding: '7px 12px', borderRadius: '8px', border: '1px solid #ddd',
                fontSize: '12px', outline: 'none', minWidth: '200px'
              }}
            />

            {/* Durum Filtresi */}
            <select
              value={durumFiltre}
              onChange={e => setDurumFiltre(e.target.value as any)}
              style={{
                padding: '7px 12px', borderRadius: '8px', border: '1px solid #ddd',
                fontSize: '12px', outline: 'none', cursor: 'pointer', background: 'white'
              }}
            >
              <option value="hepsi">Tüm Durumlar</option>
              <option value="basarili">✓ Başarılı</option>
              <option value="basarisiz">✗ Başarısız</option>
            </select>

            {/* Sıralama */}
            <select
              value={siralama}
              onChange={e => setSiralama(e.target.value as any)}
              style={{
                padding: '7px 12px', borderRadius: '8px', border: '1px solid #ddd',
                fontSize: '12px', outline: 'none', cursor: 'pointer', background: 'white'
              }}
            >
              <option value="tarih_desc">Tarih (Yeni → Eski)</option>
              <option value="tarih_asc">Tarih (Eski → Yeni)</option>
              <option value="sure_desc">Süre (Uzun → Kısa)</option>
              <option value="sure_asc">Süre (Kısa → Uzun)</option>
              <option value="senaryo_asc">Senaryo Adı (A → Z)</option>
            </select>
          </div>

          {/* Tablo */}
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #eee', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>
                Koşumlar ({filtreliVeSiralanmis.length})
              </div>
            </div>
            {yukleniyor ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Yükleniyor...</div>
            ) : filtreliVeSiralanmis.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Sonuç bulunamadı.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Senaryo</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Proje</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Durum</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Süre</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {filtreliVeSiralanmis.map((k) => {
                    const renk = getDurumRenk(k.durum);
                    return (
                      <tr key={k.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 500, color: '#333' }}>{k.senaryo_ad}</td>
                        <td style={{ padding: '12px 16px', color: '#555' }}>{k.proje_ad}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '6px',
                            fontSize: '11px', fontWeight: 500,
                            background: renk.bg, color: renk.color
                          }}>
                            {k.durum === 'basarili' ? '✓ Başarılı' : k.durum === 'basarisiz' ? '✗ Başarısız' : k.durum}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#555' }}>
                          {k.sure_ms ? `${(k.sure_ms / 1000).toFixed(1)}s` : '-'}
                        </td>
                        <td style={{ padding: '12px 16px', color: '#888', fontSize: '11px' }}>
                          {new Date(k.baslangic_zamani).toLocaleString('tr-TR')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminTestler;