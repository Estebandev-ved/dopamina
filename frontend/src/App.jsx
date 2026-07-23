import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Splash from './components/Splash';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Login from './pages/Login';
import Register from './pages/Register';
import Policies from './pages/Policies';
import Checkout from './pages/Checkout';
import Dashboard from './pages/Dashboard';
import Perfil from './pages/Perfil';
import Eventos from './pages/Eventos';
import Artistas from './pages/Artistas';
import PagoResultado from './pages/PagoResultado';
import AdminDashboard from './pages/AdminDashboard';
import PromoterDashboard from './pages/PromoterDashboard';
import Terminos from './pages/Terminos';
import Arcade from './pages/Arcade';
import Combos from './pages/Combos';
import Graffiti from './pages/Graffiti';
import { api } from './services/api';
import usePageTracking from './services/usePageTracking';
import CookiesConsent from './components/CookiesConsent';
import FloatingHub from './components/FloatingHub';

/**
 * Route guard: only allows access if user is authenticated.
 */
const ProtectedRoute = ({ children }) => {
  const user = api.getUser();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  if (api.isTokenExpired()) {
    api.clearAuth();
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
};

/**
 * Route guard: only allows access if user has ROLE_ADMIN.
 * Security Note: This is a UX guard. Real security is enforced server-side via @PreAuthorize.
 */
const AdminRoute = ({ children }) => {
  const user = api.getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (api.isTokenExpired()) {
    api.clearAuth();
    return <Navigate to="/login" replace />;
  }
  if (user.rol !== 'ROLE_ADMIN' && user.rol !== 'ROLE_SUBADMIN') return <Navigate to="/" replace />;
  return children;
};

const PromoterRoute = ({ children }) => {
  const user = api.getUser();
  if (!user) return <Navigate to="/login" replace />;
  if (api.isTokenExpired()) {
    api.clearAuth();
    return <Navigate to="/login" replace />;
  }
  if (user.rol !== 'ROLE_PROMOTER') return <Navigate to="/" replace />;
  return children;
};

/**
 * Core Application Layout.
 * The /admin route renders WITHOUT Navbar/Footer (full-screen panel).
 * All other routes render inside the standard layout.
 * Security Note: Client session states are verified via internal state management.
 */
export default function App() {
  const [showSplash, setShowSplash] = useState(() => !sessionStorage.getItem('dopamina_splash_shown'));
  const location = useLocation();
  usePageTracking();

  React.useEffect(() => {
    const params = new URLSearchParams(location.search);
    const cuponParam = params.get('cupon');
    if (cuponParam) {
      localStorage.setItem('dopamina_referral_cupon', cuponParam.trim().toUpperCase());
      console.log('Referral coupon saved:', cuponParam.trim().toUpperCase());
    }
  }, [location.search]);

  React.useEffect(() => {
    const theme = localStorage.getItem('neon-theme') || 'violet';
    const root = document.documentElement;
    if (theme === 'green') {
      root.style.setProperty('--color-neon', '#00FF66');
      root.style.setProperty('--color-neon-light', '#33FF88');
      root.style.setProperty('--color-neon-glow', '#80FFAA');
      root.style.setProperty('--color-neon-shadow-sm', 'rgba(0, 255, 102, 0.3)');
      root.style.setProperty('--color-neon-shadow-md', 'rgba(0, 255, 102, 0.55)');
      root.style.setProperty('--color-neon-shadow-lg', 'rgba(0, 255, 102, 0.8)');
    } else if (theme === 'red') {
      root.style.setProperty('--color-neon', '#FF3E3E');
      root.style.setProperty('--color-neon-light', '#FF6666');
      root.style.setProperty('--color-neon-glow', '#FFA0A0');
      root.style.setProperty('--color-neon-shadow-sm', 'rgba(255, 62, 62, 0.3)');
      root.style.setProperty('--color-neon-shadow-md', 'rgba(255, 62, 62, 0.55)');
      root.style.setProperty('--color-neon-shadow-lg', 'rgba(255, 62, 62, 0.8)');
    } else {
      root.style.setProperty('--color-neon', '#B14EFF');
      root.style.setProperty('--color-neon-light', '#C97FFF');
      root.style.setProperty('--color-neon-glow', '#D9AAFF');
      root.style.setProperty('--color-neon-shadow-sm', 'rgba(177, 78, 255, 0.3)');
      root.style.setProperty('--color-neon-shadow-md', 'rgba(177, 78, 255, 0.55)');
      root.style.setProperty('--color-neon-shadow-lg', 'rgba(177, 78, 255, 0.8)');
    }
  }, []);

  // Admin panel: full screen, no Navbar/Footer, skip splash
  if (location.pathname === '/admin') {
    return (
      <Routes future={{ v7_relativeSplatPath: true }}>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
        </Routes>
    );
  }

  return (
    <div className="bg-black min-h-screen flex flex-col overflow-x-hidden selection:bg-neon-purple selection:text-white">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <Splash key="splash" onComplete={() => { sessionStorage.setItem('dopamina_splash_shown', '1'); setShowSplash(false); }} />
        ) : (
          <div key="app-content" className="flex flex-col min-h-screen">
            <Navbar />
            <main className="flex-grow flex flex-col">
              <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname} future={{ v7_relativeSplatPath: true }}>
                  <Route path="/" element={<Home />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/policies" element={<Policies />} />
                  <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/perfil" element={<ProtectedRoute><Perfil /></ProtectedRoute>} />
                  <Route path="/promotor" element={<PromoterRoute><PromoterDashboard /></PromoterRoute>} />
                  <Route path="/eventos" element={<Eventos />} />
                  <Route path="/artistas" element={<Artistas />} />
                  <Route path="/terminos" element={<Terminos />} />
                  <Route path="/arcade" element={<Arcade />} />
                  <Route path="/combos" element={<Combos />} />
                  <Route path="/graffiti" element={<Graffiti />} />
                  <Route path="/pago-resultado" element={<PagoResultado />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AnimatePresence>
            </main>
            <Footer />
            <FloatingHub />
            <CookiesConsent />
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
