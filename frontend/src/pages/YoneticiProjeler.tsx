// src/pages/YoneticiProjeler.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../services/api';

const YoneticiProjeler: React.FC = () => {
  const [projeler, setProjeler] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const projRes = await api.get('/api/v1/projects/');
        const projeler = projRes.data;
        const projelerDetay = await Promise.all(
          projeler.map(async (p: any) => {
            const senRes = await api.get(`/api/v1/scenarios/proje/${p.id}`);
            return { ...p, senaryo_sayisi: senRes.data.length };
          })
        );
        setProjeler(projelerDetay);
      } catch (err) {
        console.error(err);
      } finally {
        setYukleniyor(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="Proje Raporları" subtitle="Projelerin test durumu ve özeti" />
        <div style={{ padding: '20px' }}>

          {/* Özet Kartlar */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: 'Toplam Proje', value: projeler.length, color: '#3730A3' },
              { label: 'Toplam Senaryo', value: projeler.reduce((acc, p) => acc + p.senaryo_sayisi, 0), color: '#3B6D11' },
              { label: 'Aktif Proje', value: projeler.filter(p => p.aktif).length, color: '#854D0E' },
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

          {/* Proje Tablosu */}
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #eee', overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee' }}>
              <div style={{ fontSize: '13px', fontWeight: 600 }}>Projeler ({projeler.length})</div>
            </div>
            {yukleniyor ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Yükleniyor...</div>
            ) : projeler.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888', fontSize: '13px' }}>Henüz proje yok.</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Proje Adı</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Açıklama</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Senaryo</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {projeler.map((p) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 500, color: '#333' }}>{p.ad}</td>
                      <td style={{ padding: '12px 16px', color: '#555' }}>{p.aciklama || '-'}</td>
                      <td style={{ padding: '12px 16px', color: '#555' }}>{p.senaryo_sayisi} senaryo</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          padding: '3px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 500,
                          background: p.aktif ? '#EAF3DE' : '#F1EFE8',
                          color: p.aktif ? '#3B6D11' : '#5F5E5A'
                        }}>
                          {p.aktif ? 'Aktif' : 'Pasif'}
                        </span>
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

export default YoneticiProjeler;