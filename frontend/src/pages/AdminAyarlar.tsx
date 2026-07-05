// src/pages/AdminAyarlar.tsx
import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';

const AdminAyarlar: React.FC = () => {
  const [kaydedildi, setKaydedildi] = useState(false);

  const handleKaydet = () => {
    setKaydedildi(true);
    setTimeout(() => setKaydedildi(false), 2000);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="Sistem Ayarları" subtitle="Platform yapılandırması" />
        <div style={{ padding: '20px', maxWidth: '600px' }}>

          {/* Genel Ayarlar */}
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #eee', marginBottom: '16px' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontSize: '13px', fontWeight: 600 }}>
              Genel Ayarlar
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Platform Adı', defaultValue: 'QA Platform' },
                { label: 'Maksimum Test Süresi (sn)', defaultValue: '300' },
                { label: 'Screenshot Klasörü', defaultValue: 'backend/screenshots' },
              ].map((alan) => (
                <div key={alan.label}>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>{alan.label}</div>
                  <input
                    defaultValue={alan.defaultValue}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '6px',
                      border: '1px solid #ddd', fontSize: '12px', boxSizing: 'border-box'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Selenium Ayarları */}
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #eee', marginBottom: '16px' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontSize: '13px', fontWeight: 600 }}>
              Selenium Ayarları
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {[
                { label: 'Varsayılan Tarayıcı', defaultValue: 'Chrome' },
                { label: 'Implicit Wait (sn)', defaultValue: '10' },
                { label: 'Page Load Timeout (sn)', defaultValue: '30' },
              ].map((alan) => (
                <div key={alan.label}>
                  <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>{alan.label}</div>
                  <input
                    defaultValue={alan.defaultValue}
                    style={{
                      width: '100%', padding: '8px 12px', borderRadius: '6px',
                      border: '1px solid #ddd', fontSize: '12px', boxSizing: 'border-box'
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* AI Ayarları */}
          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #eee', marginBottom: '16px' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid #eee', fontSize: '13px', fontWeight: 600 }}>
              AI Ayarları
            </div>
            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>Gemini Model</div>
                <input
                  defaultValue="gemini-2.0-flash"
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '6px',
                    border: '1px solid #ddd', fontSize: '12px', boxSizing: 'border-box'
                  }}
                />
              </div>
              <div>
                <div style={{ fontSize: '12px', color: '#555', marginBottom: '6px' }}>Gemini API Key</div>
                <input
                  defaultValue="••••••••••••••••••••"
                  type="password"
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '6px',
                    border: '1px solid #ddd', fontSize: '12px', boxSizing: 'border-box'
                  }}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handleKaydet}
            style={{
              padding: '10px 24px', borderRadius: '8px',
              background: kaydedildi ? '#3B6D11' : '#26215C',
              color: 'white', border: 'none', cursor: 'pointer',
              fontSize: '13px', fontWeight: 600
            }}
          >
            {kaydedildi ? '✓ Kaydedildi' : 'Ayarları Kaydet'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminAyarlar;