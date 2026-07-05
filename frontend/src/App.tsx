// src/App.tsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import AdminKullanicilar from './pages/AdminKullanicilar';
import AdminProjeler from './pages/AdminProjeler';
import AdminTestler from './pages/AdminTestler';
import AdminAIReceteler from './pages/AdminAIReceteler';

import QADashboard from './pages/QADashboard';
import QASenaryolar from './pages/QASenaryolar';
import QATestRunner from './pages/QATestRunner';
import QAAIReceteler from './pages/QAAIReceteler';
import QARaporlar from './pages/QARaporlar';
import YoneticiDashboard from './pages/YoneticiDashboard';
import YoneticiEkip from './pages/YoneticiEkip';
import YoneticiAIReceteler from './pages/YoneticiAIReceteler';
import YoneticiExport from './pages/YoneticiExport';

const PrivateRoute: React.FC<{ children: React.ReactNode; roller: string[] }> = ({ children, roller }) => {
  const { isAuthenticated, user } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (!roller.includes(user?.rol || '')) return <Navigate to="/login" />;
  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <PrivateRoute roller={['Admin']}>
            <AdminDashboard />
          </PrivateRoute>
        } />
        <Route path="/admin/kullanicilar" element={
          <PrivateRoute roller={['Admin']}>
            <AdminKullanicilar />
          </PrivateRoute>
        } />
        <Route path="/admin/projeler" element={
          <PrivateRoute roller={['Admin']}>
            <AdminProjeler />
          </PrivateRoute>
        } />
        <Route path="/admin/testler" element={
          <PrivateRoute roller={['Admin']}>
            <AdminTestler />
          </PrivateRoute>
        } />
        <Route path="/admin/ai-receteler" element={
          <PrivateRoute roller={['Admin']}>
            <AdminAIReceteler />
          </PrivateRoute>
        } />
       
        {/* QA Routes */}
        <Route path="/qa" element={
          <PrivateRoute roller={['QA Uzmanı']}>
            <QADashboard />
          </PrivateRoute>
        } />
        <Route path="/qa/senaryolar" element={
          <PrivateRoute roller={['QA Uzmanı']}>
            <QASenaryolar />
          </PrivateRoute>
        } />
        <Route path="/qa/runner" element={
          <PrivateRoute roller={['QA Uzmanı']}>
            <QATestRunner />
          </PrivateRoute>
        } />
        <Route path="/qa/ai-receteler" element={
          <PrivateRoute roller={['QA Uzmanı']}>
            <QAAIReceteler />
          </PrivateRoute>
        } />
        <Route path="/qa/raporlar" element={
          <PrivateRoute roller={['QA Uzmanı']}>
            <QARaporlar />
          </PrivateRoute>
        } />

        {/* Yönetici Routes */}
        <Route path="/yonetici" element={
          <PrivateRoute roller={['Yönetici']}>
            <YoneticiDashboard />
          </PrivateRoute>
        } />
        <Route path="/yonetici/ekip" element={
          <PrivateRoute roller={['Yönetici']}>
            <YoneticiEkip />
          </PrivateRoute>
        } />
        <Route path="/yonetici/ai-receteler" element={
          <PrivateRoute roller={['Yönetici']}>
            <YoneticiAIReceteler />
          </PrivateRoute>
        } />
        <Route path="/yonetici/export" element={
          <PrivateRoute roller={['Yönetici']}>
            <YoneticiExport />
          </PrivateRoute>
        } />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;