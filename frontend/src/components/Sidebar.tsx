// src/components/Sidebar.tsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface MenuItem {
  label: string;
  path: string;
  icon: string;
}

const adminMenu: MenuItem[] = [
  { label: 'Dashboard', path: '/admin', icon: '⊞' },
  { label: 'Kullanıcılar', path: '/admin/kullanicilar', icon: '◎' },
  { label: 'Projeler', path: '/admin/projeler', icon: '▣' },
  { label: 'Tüm Testler', path: '/admin/testler', icon: '◈' },
  { label: 'AI Reçeteler', path: '/admin/ai-receteler', icon: '◇' },
];

const qaMenu: MenuItem[] = [
  { label: 'Dashboard', path: '/qa', icon: '⊞' },
  { label: 'Senaryolarım', path: '/qa/senaryolar', icon: '▤' },
  { label: 'Test Koştur', path: '/qa/runner', icon: '▶' },
  { label: 'AI Reçeteler', path: '/qa/ai-receteler', icon: '◇' },
  { label: 'Raporlarım', path: '/qa/raporlar', icon: '◈' },
];

const yoneticiMenu: MenuItem[] = [
  { label: 'Genel Bakış', path: '/yonetici', icon: '⊞' },
  { label: 'Ekip Performansı', path: '/yonetici/ekip', icon: '◎' },
  { label: 'AI Reçeteler', path: '/yonetici/ai-receteler', icon: '◇' },
  { label: 'Dışa Aktar', path: '/yonetici/export', icon: '▥' },
];

const getAccentColor = (rol?: string) => {
  if (rol === 'Admin') return '#4F46E5';
  if (rol === 'QA Uzmanı') return '#0F6E56';
  return '#854F0B';
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const getMenu = () => {
    if (user?.rol === 'Admin') return adminMenu;
    if (user?.rol === 'QA Uzmanı') return qaMenu;
    return yoneticiMenu;
  };

  const accent = getAccentColor(user?.rol);
  const initials = user?.ad_soyad?.split(' ').map((n: string) => n[0]).join('') || 'U';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div style={{
      width: '220px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      background: 'white',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      borderRight: '1px solid #EDEBE5',
    }}>

      {/* Logo */}
      <div style={{
        padding: '24px 20px 18px',
        borderBottom: '1px solid #EDEBE5',
        textAlign: 'center',
      }}>
        <div style={{
          fontFamily: "'Times New Roman', Times, serif",
          fontSize: '28px',
          fontWeight: '700',
          letterSpacing: '8px',
          color: '#111',
          lineHeight: 1,
        }}>
          QARA
        </div>
        <div style={{
          fontSize: '9px',
          color: '#bbb',
          letterSpacing: '2px',
          marginTop: '5px',
          fontFamily: 'Arial, sans-serif',
        }}>
          TEST · AI · OTOMASYON
        </div>
      </div>

      {/* Menü */}
      <div style={{ flex: 1, padding: '10px 10px', overflowY: 'auto' }}>
        {getMenu().map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <div
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                padding: '10px 14px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                fontSize: '13px',
                borderRadius: '8px',
                marginBottom: '2px',
                fontFamily: 'Arial, sans-serif',
                fontWeight: isActive ? 600 : 400,
                color: isActive ? accent : '#777',
                background: isActive ? `${accent}14` : 'transparent',
              }}
            >
              <span style={{
                fontSize: '16px',
                color: isActive ? accent : '#ccc',
                width: '18px',
                textAlign: 'center',
              }}>
                {item.icon}
              </span>
              <span>{item.label}</span>
              {isActive && (
                <span style={{ marginLeft: 'auto', color: accent, fontSize: '14px' }}>›</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Alt kullanıcı + çıkış */}
      <div style={{
        padding: '14px',
        borderTop: '1px solid #EDEBE5',
        background: 'white',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '10px 12px',
          borderRadius: '8px',
          background: '#FAFAF8',
          border: '1px solid #EDEBE5',
          marginBottom: '10px',
        }}>
          <div style={{
            width: '34px',
            height: '34px',
            borderRadius: '50%',
            background: accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '12px',
            fontWeight: 700,
            color: 'white',
            flexShrink: 0,
            fontFamily: 'Arial, sans-serif',
          }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{
              fontSize: '12px',
              fontWeight: 600,
              color: '#222',
              fontFamily: 'Arial, sans-serif',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {user?.ad_soyad}
            </div>
            <div style={{ fontSize: '10px', color: '#999', fontFamily: 'Arial, sans-serif' }}>
              {user?.rol}
            </div>
          </div>
        </div>

        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '8px',
            background: 'white',
            color: '#999',
            border: '1px solid #EDEBE5',
            borderRadius: '8px',
            fontSize: '12px',
            cursor: 'pointer',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          Çıkış Yap
        </button>
      </div>
    </div>
  );
};

export default Sidebar;