// src/pages/AdminProjeler.tsx
import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import Topbar from '../components/Topbar';
import api from '../services/api';

const AdminProjeler: React.FC = () => {
  const [projeler, setProjeler] = useState<any[]>([]);
  const [kullanicilar, setKullanicilar] = useState<any[]>([]);
  const [projeUyeleri, setProjeUyeleri] = useState<{[key: number]: any[]}>({});
  const [yukleniyor, setYukleniyor] = useState(true);
  const [form, setForm] = useState(false);
  const [yeniProje, setYeniProje] = useState({ ad: '', aciklama: '' });
  const [uyeForm, setUyeForm] = useState<number | null>(null);
  const [secilenKullanici, setSecilenKullanici] = useState('');
  const [hata, setHata] = useState('');
  const [basari, setBasari] = useState('');

  const fetchData = async () => {
    try {
      const [projRes, kulRes] = await Promise.all([
        api.get('/api/v1/projects/'),
        api.get('/api/v1/users/')
      ]);
      setProjeler(projRes.data);
      setKullanicilar(kulRes.data);

      const uyelerMap: {[key: number]: any[]} = {};
      for (const proje of projRes.data) {
        try {
          const projDetay = await api.get(`/api/v1/projects/${proje.id}`);
          uyelerMap[proje.id] = projDetay.data.uyeler || [];
        } catch {
          uyelerMap[proje.id] = [];
        }
      }
      setProjeUyeleri(uyelerMap);
    } catch (err) {
      console.error(err);
    } finally {
      setYukleniyor(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOlustur = async () => {
    if (!yeniProje.ad) { setHata('Proje adı zorunludur'); return; }
    try {
      await api.post(`/api/v1/projects/?ad=${encodeURIComponent(yeniProje.ad)}&aciklama=${encodeURIComponent(yeniProje.aciklama)}`);
      setBasari('Proje oluşturuldu');
      setForm(false);
      setYeniProje({ ad: '', aciklama: '' });
      fetchData();
      setTimeout(() => setBasari(''), 3000);
    } catch (err: any) {
      setHata(err.response?.data?.detail || 'Hata oluştu');
    }
  };

  const handleUyeEkle = async (projeId: number) => {
    if (!secilenKullanici) return;
    try {
      await api.post(`/api/v1/projects/${projeId}/uyeler?kullanici_id=${secilenKullanici}`);
      setBasari('Üye eklendi');
      setUyeForm(null);
      setSecilenKullanici('');
      fetchData();
      setTimeout(() => setBasari(''), 3000);
    } catch (err: any) {
      setHata(err.response?.data?.detail || 'Üye eklenemedi');
    }
  };

  const handleUyeSil = async (projeId: number, kullaniciId: number) => {
    if (!window.confirm('Bu üyeyi projeden çıkarmak istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/api/v1/projects/${projeId}/uyeler/${kullaniciId}`);
      setBasari('Üye silindi');
      fetchData();
      setTimeout(() => setBasari(''), 3000);
    } catch (err: any) {
      setHata(err.response?.data?.detail || 'Üye silinemedi');
    }
  };

  const handleSil = async (id: number) => {
    if (!window.confirm('Bu projeyi silmek istediğinize emin misiniz?')) return;
    try {
      await api.delete(`/api/v1/projects/${id}`);
      setProjeler(projeler.filter(p => p.id !== id));
      setBasari('Proje silindi');
      setTimeout(() => setBasari(''), 3000);
    } catch (err: any) {
      setHata(err.response?.data?.detail || 'Silme başarısız');
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F3F0' }}>
      <Sidebar />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Topbar title="Proje Yönetimi" subtitle="Projeleri ve üyeleri yönet" />
        <div style={{ padding: '24px' }}>

          {basari && (
            <div style={{
              padding: '10px 16px', background: '#E1F5EE', color: '#0F6E56',
              borderRadius: '8px', marginBottom: '12px', fontSize: '13px',
              fontFamily: 'Arial, sans-serif'
            }}>{basari}</div>
          )}

          {hata && (
            <div style={{
              padding: '10px 16px', background: '#FCEBEB', color: '#A32D2D',
              borderRadius: '8px', marginBottom: '12px', fontSize: '13px',
              fontFamily: 'Arial, sans-serif'
            }}>{hata}</div>
          )}

          <div style={{
            display: 'flex', justifyContent: 'space-between',
            alignItems: 'center', marginBottom: '16px'
          }}>
            <div style={{ fontSize: '13px', fontWeight: 600, fontFamily: 'Arial, sans-serif' }}>
              Projeler ({projeler.length})
            </div>
            <button onClick={() => setForm(!form)} style={{
              padding: '8px 16px', background: '#4F46E5', color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
              fontFamily: 'Arial, sans-serif'
            }}>+ Yeni Proje</button>
          </div>

          {form && (
            <div style={{
              background: 'white', borderRadius: '12px',
              border: '1px solid #EDEBE5', padding: '20px', marginBottom: '16px'
            }}>
              <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', fontFamily: 'Arial, sans-serif' }}>
                Yeni Proje Oluştur
              </div>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px', fontFamily: 'Arial, sans-serif' }}>Proje Adı</label>
                <input value={yeniProje.ad} onChange={(e) => setYeniProje({ ...yeniProje, ad: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #EDEBE5', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}
                  placeholder="Proje adı" />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '4px', fontFamily: 'Arial, sans-serif' }}>Açıklama</label>
                <input value={yeniProje.aciklama} onChange={(e) => setYeniProje({ ...yeniProje, aciklama: e.target.value })}
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid #EDEBE5', borderRadius: '8px', fontSize: '12px', boxSizing: 'border-box', fontFamily: 'Arial, sans-serif' }}
                  placeholder="Proje açıklaması" />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={handleOlustur} style={{
                  padding: '8px 16px', background: '#4F46E5', color: 'white',
                  border: 'none', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
                  fontFamily: 'Arial, sans-serif'
                }}>Oluştur</button>
                <button onClick={() => setForm(false)} style={{
                  padding: '8px 16px', background: 'white', color: '#555',
                  border: '1px solid #EDEBE5', borderRadius: '8px', fontSize: '12px', cursor: 'pointer',
                  fontFamily: 'Arial, sans-serif'
                }}>İptal</button>
              </div>
            </div>
          )}

          {yukleniyor ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Yükleniyor...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              {projeler.map((p, i) => (
                <div key={p.id} style={{
                  background: 'white', borderRadius: '12px',
                  border: '1px solid #EDEBE5', padding: '18px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div>
                      <div style={{ fontSize: '14px', fontWeight: 600, color: '#111', fontFamily: 'Arial, sans-serif' }}>{p.ad}</div>
                      <div style={{ fontSize: '11px', color: '#aaa', marginTop: '2px', fontFamily: 'Arial, sans-serif' }}>{p.aciklama}</div>
                    </div>
                    <span style={{
                      padding: '3px 10px', borderRadius: '20px', fontSize: '11px',
                      fontWeight: 500, background: '#E1F5EE', color: '#0F6E56',
                      height: 'fit-content', fontFamily: 'Arial, sans-serif'
                    }}>Aktif</span>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', color: '#aaa', marginBottom: '6px', fontFamily: 'Arial, sans-serif' }}>Üyeler</div>
                    {projeUyeleri[p.id] && projeUyeleri[p.id].length > 0 ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {projeUyeleri[p.id].map((u: any) => (
                          <div key={u.id} style={{
                            display: 'flex', alignItems: 'center', gap: '4px',
                            padding: '3px 8px', borderRadius: '20px', fontSize: '11px',
                            background: i === 0 ? '#EEEDFE' : i === 1 ? '#E1F5EE' : '#FAEEDA',
                            color: i === 0 ? '#3C3489' : i === 1 ? '#0F6E56' : '#854F0B',
                            fontFamily: 'Arial, sans-serif'
                          }}>
                            {u.ad_soyad}
                            <span
                              onClick={() => handleUyeSil(p.id, u.id)}
                              style={{ cursor: 'pointer', marginLeft: '2px', opacity: 0.6, fontWeight: 700 }}
                            >×</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#ccc', fontFamily: 'Arial, sans-serif' }}>Henüz üye yok</span>
                    )}
                  </div>

                  {uyeForm === p.id && (
                    <div style={{
                      padding: '10px 12px', background: '#FAFAF8',
                      borderRadius: '8px', marginBottom: '10px',
                      border: '1px solid #EDEBE5'
                    }}>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px', fontFamily: 'Arial, sans-serif' }}>Üye Ekle</div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <select value={secilenKullanici} onChange={(e) => setSecilenKullanici(e.target.value)}
                          style={{ flex: 1, padding: '6px 8px', border: '1px solid #EDEBE5', borderRadius: '6px', fontSize: '12px', fontFamily: 'Arial, sans-serif' }}>
                          <option value="">Kullanıcı seçin</option>
                          {kullanicilar.map(k => (
                            <option key={k.id} value={k.id}>{k.ad_soyad}</option>
                          ))}
                        </select>
                        <button onClick={() => handleUyeEkle(p.id)} style={{
                          padding: '6px 12px', background: '#4F46E5', color: 'white',
                          border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                          fontFamily: 'Arial, sans-serif'
                        }}>Ekle</button>
                        <button onClick={() => setUyeForm(null)} style={{
                          padding: '6px 12px', background: 'white', color: '#555',
                          border: '1px solid #EDEBE5', borderRadius: '6px', fontSize: '12px', cursor: 'pointer',
                          fontFamily: 'Arial, sans-serif'
                        }}>İptal</button>
                      </div>
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => { setUyeForm(p.id); setSecilenKullanici(''); }} style={{
                      flex: 1, padding: '8px', background: '#E6F1FB', color: '#185FA5',
                      border: '1px solid #B5D4F4', borderRadius: '8px', fontSize: '11px', cursor: 'pointer',
                      fontFamily: 'Arial, sans-serif'
                    }}>👥 Üye Ekle</button>
                    <button onClick={() => handleSil(p.id)} style={{
                      flex: 1, padding: '8px', background: '#FCEBEB', color: '#A32D2D',
                      border: '1px solid #F09595', borderRadius: '8px', fontSize: '11px', cursor: 'pointer',
                      fontFamily: 'Arial, sans-serif'
                    }}>🗑 Sil</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminProjeler;