// src/pages/AdminDashboard.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../services/api';

const AdminDashboard: React.FC = () => {
  const [kullanicilar, setKullanicilar] = useState<any[]>([]);
  const [projeler, setProjeler] = useState<any[]>([]);
  const [kosumlar, setKosumlar] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kulRes, projRes] = await Promise.all([
          api.get('/api/v1/users/'),
          api.get('/api/v1/projects/')
        ]);
        setKullanicilar(kulRes.data);
        setProjeler(projRes.data);

        let tumKosumlar: any[] = [];
        for (const proje of projRes.data) {
          const senRes = await api.get(`/api/v1/scenarios/proje/${proje.id}`);
          for (const sen of senRes.data) {
            const kosumRes = await api.get(`/api/v1/runner/kosumlar/${sen.id}`);
            tumKosumlar = [...tumKosumlar, ...kosumRes.data];
          }
        }
        setKosumlar(tumKosumlar);
      } catch (err) {
        console.error(err);
      } finally {
        setYukleniyor(false);
      }
    };
    fetchData();
  }, []);

  const aktifKullanici = kullanicilar.filter(k => k.aktif).length;
  const basariliKosum = kosumlar.filter(k => k.durum === 'basarili').length;
  const basarisizKosum = kosumlar.filter(k => k.durum === 'basarisiz').length;
  const basariOrani = kosumlar.length > 0 ? Math.round((basariliKosum / kosumlar.length) * 100) : 0;

  const statKartlar = [
    { label: 'Toplam Kullanıcı', value: kullanicilar.length, sub: `${aktifKullanici} aktif`, bg: '#EEEDFE', color: '#3C3489', icon: '◎' },
    { label: 'Toplam Proje', value: projeler.length, sub: 'aktif projeler', bg: '#E1F5EE', color: '#0F6E56', icon: '▣' },
    { label: 'Toplam Koşum', value: kosumlar.length, sub: `${basariliKosum} başarılı · ${basarisizKosum} hata`, bg: '#E6F1FB', color: '#185FA5', icon: '◈' },
    { label: 'Hata Tespit', value: basarisizKosum, sub: `%${basariOrani} başarı oranı`, bg: '#FCEBEB', color: '#A32D2D', icon: '◉' },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F3F0' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="Dashboard" subtitle="Genel Bakış" />
        <div style={{ padding: '24px' }}>
          {yukleniyor ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>Yükleniyor...</div>
          ) : (
            <>
              {/* Stat Kartlar */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '14px',
                marginBottom: '24px'
              }}>
                {statKartlar.map((k) => (
                  <div key={k.label} style={{
                    background: k.bg,
                    borderRadius: '12px',
                    padding: '20px',
                    position: 'relative',
                    overflow: 'hidden',
                    border: `1px solid ${k.color}22`,
                  }}>
                    <div style={{
                      position: 'absolute', right: '16px', top: '14px',
                      fontSize: '26px', opacity: 0.15, color: k.color,
                    }}>{k.icon}</div>
                    <div style={{ fontSize: '11px', color: k.color, fontFamily: 'Arial, sans-serif', opacity: 0.8, letterSpacing: '0.5px' }}>
                      {k.label}
                    </div>
                    <div style={{ fontSize: '36px', fontWeight: 700, margin: '6px 0', color: k.color, fontFamily: 'Arial, sans-serif' }}>
                      {k.value}
                    </div>
                    <div style={{ fontSize: '11px', color: k.color, opacity: 0.7, fontFamily: 'Arial, sans-serif' }}>
                      {k.sub}
                    </div>
                  </div>
                ))}
              </div>

              {/* Alt İki Kart */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

                {/* Kullanıcılar */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #EDEBE5',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid #EDEBE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', fontFamily: 'Arial, sans-serif' }}>
                      Kullanıcılar
                    </div>
                    <span style={{
                      fontSize: '11px', padding: '2px 10px',
                      background: '#EEEDFE', color: '#3C3489',
                      borderRadius: '20px', fontFamily: 'Arial, sans-serif',
                    }}>
                      {kullanicilar.length} kişi
                    </span>
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#FAFAF8' }}>
                        <th style={{ textAlign: 'left', padding: '10px 18px', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Ad Soyad</th>
                        <th style={{ textAlign: 'left', padding: '10px 18px', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Rol</th>
                        <th style={{ textAlign: 'left', padding: '10px 18px', color: '#aaa', fontWeight: 500, fontFamily: 'Arial, sans-serif' }}>Durum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kullanicilar.map((k) => (
                        <tr key={k.id} style={{ borderTop: '1px solid #F4F3F0' }}>
                          <td style={{ padding: '12px 18px', color: '#222', fontFamily: 'Arial, sans-serif', fontWeight: 500 }}>
                            {k.ad_soyad}
                          </td>
                          <td style={{ padding: '12px 18px' }}>
                            <span style={{
                              padding: '3px 10px', borderRadius: '20px',
                              fontSize: '11px', fontWeight: 500,
                              fontFamily: 'Arial, sans-serif',
                              background: k.rol_id === 4 ? '#EEEDFE' : k.rol_id === 5 ? '#E1F5EE' : '#FAEEDA',
                              color: k.rol_id === 4 ? '#3C3489' : k.rol_id === 5 ? '#0F6E56' : '#854F0B'
                            }}>
                              {k.rol_id === 4 ? 'Admin' : k.rol_id === 5 ? 'QA Uzmanı' : 'Yönetici'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 18px' }}>
                            <span style={{
                              padding: '3px 10px', borderRadius: '20px',
                              fontSize: '11px', fontWeight: 500,
                              fontFamily: 'Arial, sans-serif',
                              background: k.aktif ? '#E1F5EE' : '#F4F3F0',
                              color: k.aktif ? '#0F6E56' : '#999'
                            }}>
                              {k.aktif ? 'Aktif' : 'Pasif'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Projeler */}
                <div style={{
                  background: 'white',
                  borderRadius: '12px',
                  border: '1px solid #EDEBE5',
                  overflow: 'hidden',
                }}>
                  <div style={{
                    padding: '14px 18px',
                    borderBottom: '1px solid #EDEBE5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', fontFamily: 'Arial, sans-serif' }}>
                      Projeler
                    </div>
                    <span style={{
                      fontSize: '11px', padding: '2px 10px',
                      background: '#E1F5EE', color: '#0F6E56',
                      borderRadius: '20px', fontFamily: 'Arial, sans-serif',
                    }}>
                      {projeler.length} aktif
                    </span>
                  </div>
                  <div style={{ padding: '12px 18px' }}>
                    {projeler.length === 0 ? (
                      <div style={{ color: '#aaa', fontSize: '12px', textAlign: 'center', padding: '20px' }}>
                        Henüz proje yok
                      </div>
                    ) : (
                      projeler.map((p, i) => (
                        <div key={p.id} style={{
                          padding: '14px',
                          borderRadius: '10px',
                          marginBottom: '10px',
                          background: i === 0 ? '#EEEDFE' : i === 1 ? '#E1F5EE' : '#FAEEDA',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: `1px solid ${i === 0 ? '#CECBF6' : i === 1 ? '#9FE1CB' : '#FAC775'}`,
                        }}>
                          <div>
                            <div style={{
                              fontSize: '13px', fontWeight: 600, fontFamily: 'Arial, sans-serif',
                              color: i === 0 ? '#3C3489' : i === 1 ? '#0F6E56' : '#854F0B',
                            }}>
                              {p.ad}
                            </div>
                            <div style={{
                              fontSize: '11px', marginTop: '3px', fontFamily: 'Arial, sans-serif',
                              color: i === 0 ? '#6B63C4' : i === 1 ? '#1D9E75' : '#BA7517',
                            }}>
                              {p.aciklama}
                            </div>
                          </div>
                          <span style={{
                            padding: '3px 10px', borderRadius: '20px',
                            fontSize: '11px', fontWeight: 500, fontFamily: 'Arial, sans-serif',
                            background: 'white',
                            color: i === 0 ? '#3C3489' : i === 1 ? '#0F6E56' : '#854F0B',
                          }}>
                            Aktif
                          </span>
                        </div>
                      ))
                    )}
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

export default AdminDashboard;