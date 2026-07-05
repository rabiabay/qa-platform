// src/pages/AdminKullanicilar.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../services/api';

const AdminKullanicilar: React.FC = () => {
  const [kullanicilar, setKullanicilar] = useState<any[]>([]);
  const [roller, setRoller] = useState<any[]>([]);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [yeniKullanici, setYeniKullanici] = useState({
    ad_soyad: '', email: '', sifre: '', rol_id: 2
  });
  const [form, setForm] = useState(false);
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  const fetchData = async () => {
    try {
      const [kulRes, rolRes] = await Promise.all([
        api.get('/api/v1/users/'),
        api.get('/api/v1/users/roller')
      ]);
      setKullanicilar(kulRes.data);
      setRoller(rolRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOlustur = async () => {
    setHata('');
    if (!yeniKullanici.ad_soyad || !yeniKullanici.email || !yeniKullanici.sifre) {
      setHata('Tüm alanlar zorunludur');
      return;
    }
    try {
      await api.post('/api/v1/users/', yeniKullanici);
      setBasari('Kullanıcı başarıyla oluşturuldu');
      setForm(false);
      setYeniKullanici({ ad_soyad: '', email: '', sifre: '', rol_id: 2 });
      fetchData();
      setTimeout(() => setBasari(''), 3000);
    } catch (err: any) {
      setHata(err.response?.data?.detail || 'Hata oluştu');
    }
  };

  const handleSil = async (id: number) => {
    if (!window.confirm('Bu kullanıcıyı silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/api/v1/users/${id}`);
      setKullanicilar(kullanicilar.filter(k => k.id !== id));
      setBasari('Kullanıcı silindi');
      setTimeout(() => setBasari(''), 3000);
    } catch (err: any) {
      setHata(err.response?.data?.detail || 'Silme başarısız');
    }
  };

  const handleAktifToggle = async (kullanici: any) => {
    try {
      await api.put(`/api/v1/users/${kullanici.id}`, { aktif: !kullanici.aktif });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const getRolAd = (rol_id: number) => {
    const rol = roller.find(r => r.id === rol_id);
    return rol?.ad || 'Bilinmiyor';
  };

  const getRolRenk = (rol_id: number) => {
    if (rol_id === 1) return { bg: '#EEEDFE', color: '#3C3489' };
    if (rol_id === 2) return { bg: '#E6F1FB', color: '#185FA5' };
    return { bg: '#FAEEDA', color: '#854F0B' };
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f5f5f5' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="Kullanıcı Yönetimi" subtitle="Sistem kullanıcılarını yönet" />
        <div style={{ padding: '20px' }}>

          {basari && (
            <div style={{
              padding: '10px 16px', background: '#EAF3DE', color: '#3B6D11',
              borderRadius: '8px', marginBottom: '12px', fontSize: '13px'
            }}>
              {basari}
            </div>
          )}

          {hata && (
            <div style={{
              padding: '10px 16px', background: '#FCEBEB', color: '#A32D2D',
              borderRadius: '8px', marginBottom: '12px', fontSize: '13px'
            }}>
              {hata}
            </div>
          )}

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '12px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>
              Kullanıcılar ({kullanicilar.length})
            </div>
            <button
              onClick={() => setForm(!form)}
              style={{
                padding: '8px 16px', background: '#534AB7', color: 'white',
                border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer'
              }}
            >
              + Yeni Kullanıcı
            </button>
          </div>

          {form && (
            <div style={{
              background: 'white', borderRadius: '10px',
              border: '1px solid #eee', padding: '16px', marginBottom: '16px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
                Yeni Kullanıcı Oluştur
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>Ad Soyad</label>
                  <input
                    value={yeniKullanici.ad_soyad}
                    onChange={(e) => setYeniKullanici({ ...yeniKullanici, ad_soyad: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                    placeholder="Ad Soyad"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>E-posta</label>
                  <input
                    value={yeniKullanici.email}
                    onChange={(e) => setYeniKullanici({ ...yeniKullanici, email: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                    placeholder="ornek@sirket.com"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>Şifre</label>
                  <input
                    type="password"
                    value={yeniKullanici.sifre}
                    onChange={(e) => setYeniKullanici({ ...yeniKullanici, sifre: e.target.value })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px', boxSizing: 'border-box' }}
                    placeholder="••••••••"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#666', display: 'block', marginBottom: '4px' }}>Rol</label>
                  <select
                    value={yeniKullanici.rol_id}
                    onChange={(e) => setYeniKullanici({ ...yeniKullanici, rol_id: parseInt(e.target.value) })}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ddd', borderRadius: '6px', fontSize: '12px' }}
                  >
                    {roller.map(r => (
                      <option key={r.id} value={r.id}>{r.ad}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleOlustur}
                  style={{
                    padding: '8px 16px', background: '#534AB7', color: 'white',
                    border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  Oluştur
                </button>
                <button
                  onClick={() => setForm(false)}
                  style={{
                    padding: '8px 16px', background: 'white', color: '#555',
                    border: '1px solid #ddd', borderRadius: '8px', fontSize: '12px', cursor: 'pointer'
                  }}
                >
                  İptal
                </button>
              </div>
            </div>
          )}

          <div style={{ background: 'white', borderRadius: '10px', border: '1px solid #eee', overflow: 'hidden' }}>
            {yukleniyor ? (
              <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Yükleniyor...</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: '#f9f9f9', borderBottom: '1px solid #eee' }}>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Ad Soyad</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>E-posta</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Rol</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>Durum</th>
                    <th style={{ padding: '10px 16px', textAlign: 'left', color: '#888', fontWeight: 500 }}>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {kullanicilar.map((k) => {
                    const rolRenk = getRolRenk(k.rol_id);
                    return (
                      <tr key={k.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{
                              width: '28px', height: '28px', borderRadius: '50%',
                              background: rolRenk.bg, color: rolRenk.color,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '10px', fontWeight: 600
                            }}>
                              {k.ad_soyad.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <span style={{ fontWeight: 500, color: '#333' }}>{k.ad_soyad}</span>
                          </div>
                        </td>
                        <td style={{ padding: '12px 16px', color: '#555' }}>{k.email}</td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '6px',
                            fontSize: '11px', fontWeight: 500,
                            background: rolRenk.bg, color: rolRenk.color
                          }}>
                            {getRolAd(k.rol_id)}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span style={{
                            padding: '3px 10px', borderRadius: '6px',
                            fontSize: '11px', fontWeight: 500,
                            background: k.aktif ? '#EAF3DE' : '#F1EFE8',
                            color: k.aktif ? '#3B6D11' : '#5F5E5A',
                            cursor: 'pointer'
                          }}
                            onClick={() => handleAktifToggle(k)}
                          >
                            {k.aktif ? 'Aktif' : 'Pasif'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 16px' }}>
  {k.email !== 'admin@qaplatform.com' && (
    <button
      onClick={() => handleSil(k.id)}
      style={{
        padding: '5px 10px', borderRadius: '6px',
        background: '#FCEBEB', color: '#A32D2D',
        border: '1px solid #F09595', cursor: 'pointer', fontSize: '11px'
      }}
    >
      Sil
    </button>
  )}
</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminKullanicilar;