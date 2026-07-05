// src/pages/YoneticiEkip.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../services/api';

const YoneticiEkip: React.FC = () => {
  const [ekip, setEkip] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const kulRes = await api.get('/api/v1/users/ekip');
        const kullanicilar = kulRes.data;

        const projRes = await api.get('/api/v1/projects/');
        const projeler = projRes.data;

        // Tüm senaryoları çek
        let tumSenaryolar: any[] = [];
        for (const proje of projeler) {
          try {
            const senRes = await api.get(`/api/v1/scenarios/proje/${proje.id}`);
            tumSenaryolar = [...tumSenaryolar, ...senRes.data.map((s: any) => ({ ...s, proje_ad: proje.ad }))];
          } catch {}
        }

        // Her kullanıcı için senaryo ve koşum verisi
        const ekipVerisi = await Promise.all(
          kullanicilar.map(async (k: any) => {
            const kulSenaryolar = tumSenaryolar.filter((s: any) => s.olusturan_id === k.id);
            let toplamKosum = 0;
            let basariliKosum = 0;

            for (const sen of kulSenaryolar) {
              try {
                const kosumRes = await api.get(`/api/v1/runner/kosumlar/${sen.id}`);
                toplamKosum += kosumRes.data.length;
                basariliKosum += kosumRes.data.filter((ko: any) => ko.durum === 'basarili').length;
              } catch {}
            }

            const basariOrani = toplamKosum > 0 ? Math.round((basariliKosum / toplamKosum) * 100) : 0;

            return {
              ...k,
              toplamSenaryo: kulSenaryolar.length,
              toplamKosum,
              basariliKosum,
              basarisizKosum: toplamKosum - basariliKosum,
              basariOrani,
            };
          })
        );

        setEkip(ekipVerisi);
      } catch (err) {
        console.error(err);
      } finally {
        setYukleniyor(false);
      }
    };
    fetchData();
  }, []);

  const toplamKosum = ekip.reduce((a, k) => a + k.toplamKosum, 0);
  const ortBasari = ekip.length > 0 ? Math.round(ekip.reduce((a, k) => a + k.basariOrani, 0) / ekip.length) : 0;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F3F0' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="Ekip Performansı" subtitle="Takım üyelerinin test aktiviteleri" />
        <div style={{ padding: '24px' }}>
          {yukleniyor ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Yükleniyor...</div>
          ) : (
            <>
              {/* Özet Kartlar */}
              <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '14px', marginBottom: '24px'
              }}>
                {[
                  { label: 'Ekip Üyesi', value: ekip.length, bg: '#EEEDFE', color: '#3C3489' },
                  { label: 'Toplam Koşum', value: toplamKosum, bg: '#E6F1FB', color: '#185FA5' },
                  { label: 'Ort. Başarı', value: `%${ortBasari}`, bg: '#E1F5EE', color: '#0F6E56' },
                ].map((k) => (
                  <div key={k.label} style={{
                    background: k.bg, borderRadius: '12px', padding: '20px',
                    border: `1px solid ${k.color}22`
                  }}>
                    <div style={{ fontSize: '11px', color: k.color, fontFamily: 'Arial, sans-serif', opacity: 0.8 }}>{k.label}</div>
                    <div style={{ fontSize: '36px', fontWeight: 700, margin: '6px 0', color: k.color, fontFamily: 'Arial, sans-serif' }}>{k.value}</div>
                  </div>
                ))}
              </div>

              {/* Ekip Kartları */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                {ekip.map((k, i) => (
                  <div key={k.id} style={{
                    background: 'white', borderRadius: '12px',
                    border: '1px solid #EDEBE5', padding: '20px'
                  }}>
                    {/* Üst: Avatar + İsim */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{
                        width: '44px', height: '44px', borderRadius: '50%',
                        background: i % 2 === 0 ? '#EEEDFE' : '#E1F5EE',
                        color: i % 2 === 0 ? '#3C3489' : '#0F6E56',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '16px', fontWeight: 700, fontFamily: 'Arial, sans-serif',
                        flexShrink: 0
                      }}>
                        {k.ad_soyad?.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontSize: '14px', fontWeight: 600, color: '#111', fontFamily: 'Arial, sans-serif' }}>
                          {k.ad_soyad}
                        </div>
                        <div style={{ fontSize: '11px', color: '#aaa', fontFamily: 'Arial, sans-serif' }}>
                          {k.email}
                        </div>
                      </div>
                      <span style={{
                        marginLeft: 'auto', padding: '3px 10px', borderRadius: '20px',
                        fontSize: '11px', fontWeight: 500, fontFamily: 'Arial, sans-serif',
                        background: '#E1F5EE', color: '#0F6E56'
                      }}>
                        {k.rol_id === 5 ? 'QA Uzmanı' : 'Yönetici'}
                      </span>
                    </div>

                    {/* Metrikler */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginBottom: '14px' }}>
                      {[
                        { label: 'Senaryo', value: k.toplamSenaryo, color: '#3C3489', bg: '#EEEDFE' },
                        { label: 'Koşum', value: k.toplamKosum, color: '#185FA5', bg: '#E6F1FB' },
                        { label: 'Başarılı', value: k.basariliKosum, color: '#0F6E56', bg: '#E1F5EE' },
                        { label: 'Başarısız', value: k.basarisizKosum, color: '#A32D2D', bg: '#FCEBEB' },
                      ].map((m) => (
                        <div key={m.label} style={{
                          background: m.bg, borderRadius: '8px', padding: '10px',
                          textAlign: 'center',
                        }}>
                          <div style={{ fontSize: '20px', fontWeight: 700, color: m.color, fontFamily: 'Arial, sans-serif' }}>
                            {m.value}
                          </div>
                          <div style={{ fontSize: '10px', color: m.color, marginTop: '2px', fontFamily: 'Arial, sans-serif', opacity: 0.8 }}>
                            {m.label}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Başarı Çubuğu */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <span style={{ fontSize: '10px', color: '#aaa', fontFamily: 'Arial, sans-serif' }}>Başarı Oranı</span>
                        <span style={{ fontSize: '10px', fontFamily: 'Arial, sans-serif',
                          color: k.basariOrani >= 70 ? '#0F6E56' : k.basariOrani >= 40 ? '#BA7517' : '#A32D2D'
                        }}>%{k.basariOrani}</span>
                      </div>
                      <div style={{ background: '#EDEBE5', borderRadius: '10px', height: '6px' }}>
                        <div style={{
                          width: `${k.basariOrani}%`, height: '6px',
                          background: k.basariOrani >= 70 ? '#0F6E56' : k.basariOrani >= 40 ? '#BA7517' : '#A32D2D',
                          borderRadius: '10px',
                        }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default YoneticiEkip;