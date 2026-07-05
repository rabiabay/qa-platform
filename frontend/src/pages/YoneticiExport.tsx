// src/pages/YoneticiExport.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../services/api';

const YoneticiExport: React.FC = () => {
  const [projeler, setProjeler] = useState<any[]>([]);
  const [secilenProje, setSecilenProje] = useState<string>('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const [mesaj, setMesaj] = useState<string>('');

  useEffect(() => {
    const fetchProjeler = async () => {
      try {
        const res = await api.get('/api/v1/projects/');
        setProjeler(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProjeler();
  }, []);

  const handleCSV = async () => {
    setYukleniyor(true);
    setMesaj('');
    try {
      const projRes = await api.get('/api/v1/projects/');
      let tumKosumlar: any[] = [];
      for (const proje of projRes.data) {
        if (secilenProje && proje.id.toString() !== secilenProje) continue;
        const senRes = await api.get(`/api/v1/scenarios/proje/${proje.id}`);
        for (const sen of senRes.data) {
          const kosumRes = await api.get(`/api/v1/runner/kosumlar/${sen.id}`);
          tumKosumlar = [...tumKosumlar, ...kosumRes.data.map((k: any) => ({
            senaryo: sen.ad,
            proje: proje.ad,
            durum: k.durum,
            sure_saniye: k.sure_ms ? (k.sure_ms / 1000).toFixed(1) : '-',
            tarih: new Date(k.baslangic_zamani).toLocaleString('tr-TR'),
          }))];
        }
      }
      const baslik = ['Senaryo', 'Proje', 'Durum', 'Süre (sn)', 'Tarih'].join(',');
      const satirlar = tumKosumlar.map(k =>
        [k.senaryo, k.proje, k.durum, k.sure_saniye, k.tarih].join(',')
      );
      const csv = [baslik, ...satirlar].join('\n');
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qa-rapor-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setMesaj(`✓ ${tumKosumlar.length} koşum başarıyla dışa aktarıldı.`);
    } catch (err) {
      setMesaj('Dışa aktarma sırasında hata oluştu.');
    } finally {
      setYukleniyor(false);
    }
  };

  const handlePDF = async () => {
    setYukleniyor(true);
    setMesaj('');
    try {
      const url = secilenProje
        ? `/api/v1/runner/pdf-rapor?proje_id=${secilenProje}`
        : '/api/v1/runner/pdf-rapor';
      const response = await api.get(url, {
        responseType: 'blob'
      });
      const blobUrl = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `qa-rapor-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(blobUrl);
      setMesaj('✓ PDF başarıyla indirildi.');
    } catch (err) {
      setMesaj('PDF oluşturma sırasında hata oluştu.');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F3F0' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="Dışa Aktar" subtitle="Test raporlarını indir" />
        <div style={{ padding: '24px' }}>
          <div style={{
            background: 'white', borderRadius: '12px',
            border: '1px solid #EDEBE5', padding: '28px',
            maxWidth: '520px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, color: '#111', marginBottom: '20px', fontFamily: 'Arial, sans-serif' }}>
              Rapor Dışa Aktar
            </div>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px', fontFamily: 'Arial, sans-serif' }}>
                Proje Filtresi
              </div>
              <select
                value={secilenProje}
                onChange={(e) => setSecilenProje(e.target.value)}
                style={{
                  width: '100%', padding: '9px 12px', borderRadius: '8px',
                  border: '1px solid #EDEBE5', fontSize: '12px',
                  fontFamily: 'Arial, sans-serif', outline: 'none', background: 'white'
                }}
              >
                <option value="">Tüm Projeler</option>
                {projeler.map((p) => (
                  <option key={p.id} value={p.id}>{p.ad}</option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '10px', fontFamily: 'Arial, sans-serif' }}>
              Format Seç
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={handleCSV}
                disabled={yukleniyor}
                style={{
                  flex: 1, padding: '14px', borderRadius: '10px',
                  background: '#E1F5EE', color: '#0F6E56',
                  border: '1px solid #9FE1CB', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600, fontFamily: 'Arial, sans-serif'
                }}
              >
                CSV İndir
              </button>
              <button
                onClick={handlePDF}
                disabled={yukleniyor}
                style={{
                  flex: 1, padding: '14px', borderRadius: '10px',
                  background: '#FCEBEB', color: '#A32D2D',
                  border: '1px solid #F09595', cursor: 'pointer',
                  fontSize: '13px', fontWeight: 600, fontFamily: 'Arial, sans-serif'
                }}
              >
                PDF İndir
              </button>
            </div>

            {yukleniyor && (
              <div style={{ marginTop: '16px', textAlign: 'center', color: '#888', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
                Hazırlanıyor...
              </div>
            )}

            {mesaj && (
              <div style={{
                marginTop: '16px', padding: '12px 16px', borderRadius: '8px',
                background: mesaj.startsWith('✓') ? '#E1F5EE' : '#FCEBEB',
                color: mesaj.startsWith('✓') ? '#0F6E56' : '#A32D2D',
                fontSize: '12px', fontFamily: 'Arial, sans-serif'
              }}>
                {mesaj}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default YoneticiExport;