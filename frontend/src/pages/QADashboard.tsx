// src/pages/QADashboard.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../services/api';
import { useNavigate } from 'react-router-dom';

const QADashboard: React.FC = () => {
  const [projeler, setProjeler] = useState<any[]>([]);
  const [toplamSenaryo, setToplamSenaryo] = useState(0);
  const [toplamKosum, setToplamKosum] = useState(0);
  const [basariliKosum, setBasariliKosum] = useState(0);
  const [basarisizKosum, setBasarisizKosum] = useState(0);
  const [aiRecete, setAiRecete] = useState(0);
  const [yukleniyor, setYukleniyor] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projRes = await api.get('/api/v1/projects/');
        setProjeler(projRes.data);

        let senaryo = 0;
        let kosum = 0;
        let basarili = 0;
        let basarisiz = 0;
        let recete = 0;

        for (const proje of projRes.data) {
          const senRes = await api.get(`/api/v1/scenarios/proje/${proje.id}`);
          senaryo += senRes.data.length;
          for (const sen of senRes.data) {
            const kosumRes = await api.get(`/api/v1/runner/kosumlar/${sen.id}`);
            kosum += kosumRes.data.length;
            basarili += kosumRes.data.filter((k: any) => k.durum === 'basarili').length;
            basarisiz += kosumRes.data.filter((k: any) => k.durum === 'basarisiz').length;
            const receteRes = await api.get(`/api/v1/runner/ai-receteler/${sen.id}`);
            recete += receteRes.data.length;
          }
        }

        setToplamSenaryo(senaryo);
        setToplamKosum(kosum);
        setBasariliKosum(basarili);
        setBasarisizKosum(basarisiz);
        setAiRecete(recete);
      } catch (err) {
        console.error(err);
      } finally {
        setYukleniyor(false);
      }
    };
    fetchData();
  }, []);

  const basariOrani = toplamKosum > 0 ? Math.round((basariliKosum / toplamKosum) * 100) : 0;

  const statKartlar = [
    { label: 'Projelerim', value: projeler.length, sub: 'atanmış projeler', bg: '#EEEDFE', color: '#3C3489' },
    { label: 'Toplam Senaryo', value: toplamSenaryo, sub: 'yazılan senaryolar', bg: '#E6F1FB', color: '#185FA5' },
    { label: 'Toplam Koşum', value: toplamKosum, sub: `${basariliKosum} başarılı · ${basarisizKosum} başarısız`, bg: '#E1F5EE', color: '#0F6E56' },
    { label: 'AI Reçete', value: aiRecete, sub: `%${basariOrani} başarı oranı`, bg: '#FAEEDA', color: '#854F0B' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F3F0' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="Dashboard" subtitle="Test Yönetimi" />
        <div style={{ padding: '24px' }}>
          {yukleniyor ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Yükleniyor...</div>
          ) : (
            <>
              {/* Stat Kartlar */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '14px', marginBottom: '24px'
              }}>
                {statKartlar.map((k) => (
                  <div key={k.label} style={{
                    background: k.bg, borderRadius: '12px', padding: '20px',
                    border: `1px solid ${k.color}22`
                  }}>
                    <div style={{ fontSize: '11px', color: k.color, fontFamily: 'Arial, sans-serif', opacity: 0.8 }}>{k.label}</div>
                    <div style={{ fontSize: '36px', fontWeight: 700, margin: '6px 0', color: k.color, fontFamily: 'Arial, sans-serif' }}>{k.value}</div>
                    <div style={{ fontSize: '11px', color: k.color, opacity: 0.7, fontFamily: 'Arial, sans-serif' }}>{k.sub}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                {/* Projelerim */}
                <div style={{
                  background: 'white', borderRadius: '12px',
                  border: '1px solid #EDEBE5', overflow: 'hidden'
                }}>
                  <div style={{
                    padding: '14px 18px', borderBottom: '1px solid #EDEBE5',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', fontFamily: 'Arial, sans-serif' }}>Projelerim</div>
                    <span style={{
                      fontSize: '11px', padding: '2px 10px',
                      background: '#EEEDFE', color: '#3C3489',
                      borderRadius: '20px', fontFamily: 'Arial, sans-serif'
                    }}>{projeler.length} proje</span>
                  </div>
                  <div style={{ padding: '12px 18px' }}>
                    {projeler.length === 0 ? (
                      <div style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
                        Henüz bir projeye atanmadınız.
                      </div>
                    ) : (
                      projeler.map((p, i) => (
                        <div key={p.id} style={{
                          padding: '12px 14px', borderRadius: '10px', marginBottom: '8px',
                          background: i === 0 ? '#EEEDFE' : i === 1 ? '#E1F5EE' : '#FAEEDA',
                          border: `1px solid ${i === 0 ? '#CECBF6' : i === 1 ? '#9FE1CB' : '#FAC775'}`,
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                          <div>
                            <div style={{
                              fontSize: '13px', fontWeight: 600, fontFamily: 'Arial, sans-serif',
                              color: i === 0 ? '#3C3489' : i === 1 ? '#0F6E56' : '#854F0B'
                            }}>{p.ad}</div>
                            <div style={{
                              fontSize: '11px', marginTop: '2px', fontFamily: 'Arial, sans-serif',
                              color: i === 0 ? '#6B63C4' : i === 1 ? '#1D9E75' : '#BA7517'
                            }}>{p.aciklama}</div>
                          </div>
                          <span style={{
                            padding: '2px 10px', borderRadius: '20px', fontSize: '11px',
                            background: 'white', fontFamily: 'Arial, sans-serif',
                            color: i === 0 ? '#3C3489' : i === 1 ? '#0F6E56' : '#854F0B'
                          }}>Aktif</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Hızlı Erişim */}
                <div style={{
                  background: 'white', borderRadius: '12px',
                  border: '1px solid #EDEBE5', overflow: 'hidden'
                }}>
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid #EDEBE5' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', fontFamily: 'Arial, sans-serif' }}>Hızlı Erişim</div>
                  </div>
                  <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {[
                      { label: 'Test Koştur', path: '/qa/runner', bg: '#4F46E5', color: 'white', desc: 'Senaryolarını çalıştır' },
                      { label: 'Senaryolarım', path: '/qa/senaryolar', bg: '#EEEDFE', color: '#3C3489', desc: 'Test senaryolarını gör ve yönet' },
                      { label: 'AI Reçeteler', path: '/qa/ai-receteler', bg: '#FAEEDA', color: '#854F0B', desc: 'Hata analizlerini incele' },
                      { label: 'Raporlarım', path: '/qa/raporlar', bg: '#E1F5EE', color: '#0F6E56', desc: 'Koşum geçmişini görüntüle' },
                    ].map((btn) => (
                      <div
                        key={btn.label}
                        onClick={() => navigate(btn.path)}
                        style={{
                          padding: '12px 16px', borderRadius: '10px',
                          background: btn.bg, cursor: 'pointer',
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: btn.color, fontFamily: 'Arial, sans-serif' }}>
                            {btn.label}
                          </div>
                          <div style={{ fontSize: '11px', color: btn.color, opacity: 0.7, marginTop: '2px', fontFamily: 'Arial, sans-serif' }}>
                            {btn.desc}
                          </div>
                        </div>
                        <span style={{ color: btn.color, fontSize: '16px', opacity: 0.6 }}>›</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default QADashboard;