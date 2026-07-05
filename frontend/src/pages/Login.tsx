// src/pages/Login.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/api';
import { useAuthStore } from '../store/authStore';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [hata, setHata] = useState('');
  const [yukleniyor, setYukleniyor] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHata('');
    setYukleniyor(true);
    try {
      const data = await authService.login(email, sifre);
      login(data);
      if (data.rol === 'Admin') navigate('/admin');
      else if (data.rol === 'QA Uzmanı') navigate('/qa');
      else if (data.rol === 'Yönetici') navigate('/yonetici');
    } catch (err: any) {
      setHata(err.response?.data?.detail || 'Giriş başarısız');
    } finally {
      setYukleniyor(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      background: '#f5f5f5'
    }}>
      {/* Sol taraf - Logo */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column'
      }}>
        <h1 style={{
          margin: 0,
          fontSize: '64px',
          fontWeight: 700,
          letterSpacing: '16px',
          color: '#1a1a1a'
        }}>QARA</h1>
        <p style={{
          margin: '10px 0 0',
          fontSize: '14px',
          letterSpacing: '6px',
          color: '#999'
        }}>
          TEST · AI · OTOMASYON
        </p>
      </div>

      {/* Sağ taraf - Giriş Formu */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 2px 16px rgba(0,0,0,0.10)',
          width: '360px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#1a1a1a' }}>
              Sisteme Giriş
            </h2>
            <p style={{ margin: '6px 0 0', fontSize: '13px', color: '#888' }}>
              Devam etmek için bilgilerinizi giriniz
            </p>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '5px' }}>
              E-posta
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ornek@sirket.com"
              style={{
                width: '100%', padding: '10px 12px',
                border: '1px solid #ddd', borderRadius: '8px',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', color: '#555', display: 'block', marginBottom: '5px' }}>
              Şifre
            </label>
            <input
              type="password"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              placeholder="••••••••"
              style={{
                width: '100%', padding: '10px 12px',
                border: '1px solid #ddd', borderRadius: '8px',
                fontSize: '14px', outline: 'none', boxSizing: 'border-box'
              }}
            />
          </div>

          {hata && (
            <div style={{
              background: '#FCEBEB', color: '#A32D2D',
              padding: '10px 12px', borderRadius: '8px',
              fontSize: '13px', marginBottom: '14px'
            }}>
              {hata}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={yukleniyor}
            style={{
              width: '100%', padding: '11px',
              background: yukleniyor ? '#AFA9EC' : '#534AB7',
              color: 'white', border: 'none',
              borderRadius: '8px', fontSize: '14px',
              cursor: yukleniyor ? 'not-allowed' : 'pointer'
            }}
          >
            {yukleniyor ? 'Giriş yapılıyor...' : 'Giriş Yap'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;