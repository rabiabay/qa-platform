// src/components/Topbar.tsx
import React from 'react';
import { useAuthStore } from '../store/authStore';

interface TopbarProps {
  title: string;
  subtitle?: string;
}

const Topbar: React.FC<TopbarProps> = ({ title, subtitle }) => {
  const { user } = useAuthStore();
  const firstName = user?.ad_soyad?.split(' ')[0] || '';

  return (
    <div style={{
      background: 'white',
      borderBottom: '1px solid #EDEBE5',
      padding: '14px 28px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      flexShrink: 0,
    }}>
      <div>
        <div style={{
          fontSize: '18px',
          fontWeight: 700,
          color: '#111',
          fontFamily: 'Arial, sans-serif',
        }}>
          Merhaba, {firstName}
        </div>
        {subtitle && (
          <div style={{ fontSize: '11px', color: '#bbb', marginTop: '2px', fontFamily: 'Arial, sans-serif' }}>
            {subtitle}
          </div>
        )}
      </div>

      <div style={{ fontSize: '12px', color: '#bbb', fontFamily: 'Arial, sans-serif' }}>
        {new Date().toLocaleDateString('tr-TR', {
          day: 'numeric', month: 'long', year: 'numeric'
        })}
      </div>
    </div>
  );
};

export default Topbar;