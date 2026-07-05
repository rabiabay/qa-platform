// src/pages/QARaporlar.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../services/api';

const QARaporlar: React.FC = () => {
  const [kosumlar, setKosumlar] = useState<any[]>([]);
  const [projeler, setProjeler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [ozet, setOzet] = useState({ toplam: 0, basarili: 0, basarisiz: 0, ortSure: 0 });
  const [aramaMetni, setAramaMetni] = useState('');
  const [secilenProje, setSecilenProje] = useState<string>('');
  const [durumFiltre, setDurumFiltre] = useState<'hepsi' | 'basarili' | 'basarisiz'>('hepsi');
  const [siralama, setSiralama] = useState<'tarih_desc' | 'tarih_asc' | 'sure_desc' | 'sure_asc'>('tarih_desc');

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
        const ortSure = tumKosumlar.length > 0
          ? Math.round(tumKosumlar.reduce((acc, k) => acc + (k.sure_ms || 0), 0) / tumKosumlar.length / 1000)
          : 0;
        setOzet({ toplam: tumKosumlar.length, basarili, basarisiz, ortSure });
      } catch (err) {
        console.error(err);
      } finally {
        setYukleniyor(false);
      }
    };
    fetchData();
  }, []);

  const filtreliKosumlar = kosumlar
    .filter(k => secilenProje ? k.proje_id === parseInt(secilenProje) : true)
    .filter(k => durumFiltre === 'hepsi' ? true : k.durum === durumFiltre)
    .filter(k => aramaMetni.trim() === '' ? true : k.senaryo_ad.toLowerCase().includes(aramaMetni.toLowerCase()))
    .sort((a, b) => {
      if (siralama === 'tarih_desc') return new Date(b.baslangic_zamani).getTime() - new Date(a.baslangic_zamani).getTime();
      if (siralama === 'tarih_asc') return new Date(a.baslangic_zamani).getTime() - new Date(b.baslangic_zamani).getTime();
      if (siralama === 'sure_desc') return (b.sure_ms || 0) - (a.sure_ms || 0);
      if (siralama === 'sure_asc') return (a.sure_ms || 0) - (b.sure_ms || 0);
      return 0;
    });

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F3F0' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="Raporlarım" subtitle="Test koşum geçmişim ve istatistiklerim" />
        <div style={{ padding: '24px' }}>

          {/* Özet Kartlar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '14px', marginBottom: '24px' }}>
            {[
              { label: 'Toplam Koşum', value: ozet.toplam, bg: '#EEEDFE', color: '#3C3489' },
              { label: 'Başarılı', value: ozet.basarili, bg: '#E1F5EE', color: '#0F6E56' },
              { label: 'Başarısız', value: ozet.basarisiz, bg: '#FCEBEB', color: '#A32D2D' },
              { label: 'Ort. Süre (sn)', value: ozet.ortSure, bg: '#FAEEDA', color: '#854F0B' },
            ].map((kart) => (
              <div key={kart.label} style={{
                background: kart.bg, borderRadius: '12px', padding: '20px',
                border: `1px solid ${kart.color}22`
              }}>
                <div style={{ fontSize: '11px', color: kart.color, fontFamily: 'Arial, sans-serif', opacity: 0.8 }}>{kart.label}</div>
                <div style={{ fontSize: '36px', fontWeight: 700, margin: '6px 0', color: kart.color, fontFamily: 'Arial, sans-serif' }}>{kart.value}</div>
              </div>
            ))}
          </div>

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
              value={durumFiltre}
              onChange={e => setDurumFiltre(e.target.value as any)}
              style={{
                padding: '7px 12px', borderRadius: '8px', border: '1px solid #EDEBE5',
                fontSize: '12px', outline: 'none', cursor: 'pointer',
                background: 'white', fontFamily: 'Arial, sans-serif'
              }}
            >
              <option value="hepsi">Tüm Durumlar</option>
              <option value="basarili">Başarılı</option>
              <option value="basarisiz">Başarısız</option>
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
              <option value="sure_desc">Süre (Uzun - Kısa)</option>
              <option value="sure_asc">Süre (Kısa - Uzun)</option>
            </select>
          </div>

          {/* Tablo */}
          <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #EDEBE5', overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: '1px solid #EDEBE5' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', fontFamily: 'Arial, sans-serif' }}>
                Koşum Geçmişi ({filtreliKosumlar.length})
              </div>
            </div>

            {yukleniyor ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontFamily: 'Arial, sans-serif' }}>Yükleniyor...</div>
            ) : filtreliKosumlar.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontSize: '13px', fontFamily: 'Arial, sans-serif' }}>
                Sonuç bulunamadı.
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#FAFAF8', borderBottom: '1px solid #EDEBE5' }}>
                    <th style={{ padding: '10px 18px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Senaryo</th>
                    <th style={{ padding: '10px 18px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Proje</th>
                    <th style={{ padding: '10px 18px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Durum</th>
                    <th style={{ padding: '10px 18px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Süre</th>
                    <th style={{ padding: '10px 18px', textAlign: 'left', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Tarih</th>
                  </tr>
                </thead>
                <tbody>
                  {filtreliKosumlar.map((k) => (
                    <tr key={k.id} style={{ borderTop: '1px solid #F4F3F0' }}>
                      <td style={{ padding: '12px 18px', fontWeight: 500, color: '#222', fontFamily: 'Arial, sans-serif' }}>{k.senaryo_ad}</td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                          background: '#EEEDFE', color: '#3C3489', fontFamily: 'Arial, sans-serif'
                        }}>{k.proje_ad}</span>
                      </td>
                      <td style={{ padding: '12px 18px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
                          fontFamily: 'Arial, sans-serif',
                          background: k.durum === 'basarili' ? '#E1F5EE' : '#FCEBEB',
                          color: k.durum === 'basarili' ? '#0F6E56' : '#A32D2D'
                        }}>
                          {k.durum === 'basarili' ? 'Başarılı' : 'Başarısız'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 18px', color: '#555', fontFamily: 'Arial, sans-serif' }}>
                        {k.sure_ms ? `${(k.sure_ms / 1000).toFixed(1)}s` : '-'}
                      </td>
                      <td style={{ padding: '12px 18px', color: '#aaa', fontSize: '11px', fontFamily: 'Arial, sans-serif' }}>
                        {new Date(k.baslangic_zamani).toLocaleString('tr-TR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QARaporlar;