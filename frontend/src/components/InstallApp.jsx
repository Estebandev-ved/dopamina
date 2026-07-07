import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Smartphone, Share2 } from 'lucide-react';
import { api } from '../services/api';

const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;

export default function InstallApp() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    if (isStandalone) return;

    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);

    const alreadyClosed = localStorage.getItem('dopamina_pwa_banner_closed');
    if (!alreadyClosed && !isStandalone) {
      setTimeout(() => {
        if (!deferredPrompt && isIOS) {
          setShowBanner(true);
        }
      }, 8000);
    }

    window.addEventListener('appinstalled', () => {
      setShowBanner(false);
      setInstalling(true);
      localStorage.setItem('dopamina_pwa_banner_closed', 'true');
      const platform = isIOS ? 'ios' : /Android/i.test(navigator.userAgent) ? 'android' : 'web';
      api.trackPwaInstall(platform).catch(() => {});
      if (window.gtag) {
        window.gtag('event', 'pwa_install', { method: 'banner', platform });
      }
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (!deferredPrompt) {
      if (isIOS) {
        setShowIOSInstructions(true);
      }
      return;
    }
    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;
    if (result.outcome === 'accepted') {
      setShowBanner(false);
      localStorage.setItem('dopamina_pwa_banner_closed', 'true');
      const platform = /Android/i.test(navigator.userAgent) ? 'android' : 'web';
      api.trackPwaInstall(platform).catch(() => {});
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem('dopamina_pwa_banner_closed', 'true');
  };

  return (
    <>
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            style={{
              position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
              zIndex: 9999, maxWidth: '400px', width: 'calc(100% - 32px)',
            }}
          >
            <div style={{
              background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
              border: '1px solid rgba(177, 78, 255, 0.3)',
              borderRadius: '16px', padding: '16px 20px',
              boxShadow: '0 8px 40px rgba(177, 78, 255, 0.2), 0 0 60px rgba(177, 78, 255, 0.08)',
              backdropFilter: 'blur(20px)',
            }}>
              <button
                onClick={handleDismiss}
                style={{
                  position: 'absolute', top: '8px', right: '8px',
                  background: 'rgba(255,255,255,0.08)', border: 'none',
                  borderRadius: '50%', width: '28px', height: '28px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: '#9a9a9a', fontSize: '14px',
                }}
              >
                <X size={14} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #B14EFF, #7B2FBE)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Download size={22} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#f2f0f5', fontSize: '0.85rem', fontWeight: 700, marginBottom: '2px' }}>
                    {isIOS ? 'Instala Dopamina en tu iPhone' : 'Instala la App Dopamina'}
                  </div>
                  <div style={{ color: '#9a9a9a', fontSize: '0.75rem', lineHeight: 1.3 }}>
                    {isIOS
                      ? 'Toca el botón Compartir y luego "Agregar a pantalla de inicio"'
                      : 'Instálala en tu celular para una experiencia más rápida'
                    }
                  </div>
                </div>
                {!isIOS && (
                  <button
                    onClick={handleInstall}
                    style={{
                      padding: '10px 18px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #B14EFF, #7B2FBE)',
                      color: '#fff', fontWeight: 700, fontSize: '0.78rem',
                      cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
                      boxShadow: '0 4px 15px rgba(177, 78, 255, 0.3)',
                    }}
                  >
                    Instalar
                  </button>
                )}
              </div>

              {isIOS && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setShowIOSInstructions(true)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                      background: 'rgba(177, 78, 255, 0.15)',
                      color: '#C97FFF', fontWeight: 600, fontSize: '0.75rem',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                    }}
                  >
                    <Share2 size={14} /> ¿Cómo instalar?
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showIOSInstructions && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowIOSInstructions(false)}
            style={{
              position: 'fixed', inset: 0, zIndex: 10000,
              background: 'rgba(0,0,0,0.85)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              padding: '24px', backdropFilter: 'blur(4px)',
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{
                background: '#1a1a2e', border: '1px solid rgba(177, 78, 255, 0.3)',
                borderRadius: '20px', padding: '32px 24px',
                maxWidth: '340px', width: '100%', textAlign: 'center',
              }}
            >
              <div style={{
                width: '64px', height: '64px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #B14EFF, #7B2FBE)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px',
              }}>
                <Smartphone size={28} color="#fff" />
              </div>
              <h3 style={{ color: '#f2f0f5', fontSize: '1.1rem', fontWeight: 700, margin: '0 0 8px' }}>
                Instalar en iPhone / iPad
              </h3>
              <p style={{ color: '#9a9a9a', fontSize: '0.82rem', lineHeight: 1.6, margin: '0 0 20px' }}>
                Sigue estos pasos para tener Dopamina en tu pantalla de inicio:
              </p>
              <div style={{ textAlign: 'left', color: '#c9c9c9', fontSize: '0.82rem', lineHeight: 1.8 }}>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#B14EFF', fontWeight: 800, fontSize: '1rem' }}>1</span>
                  <span>Toca el botón <strong style={{ color: '#f2f0f5' }}>Compartir</strong> <span style={{ fontSize: '1.2rem' }}>📤</span> en Safari</span>
                </div>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#B14EFF', fontWeight: 800, fontSize: '1rem' }}>2</span>
                  <span>Desplázate y selecciona <strong style={{ color: '#f2f0f5' }}>"Agregar a pantalla de inicio"</strong></span>
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                  <span style={{ color: '#B14EFF', fontWeight: 800, fontSize: '1rem' }}>3</span>
                  <span>Toca <strong style={{ color: '#f2f0f5' }}>"Agregar"</strong> en la esquina superior derecha ✨</span>
                </div>
              </div>
              <button
                onClick={() => setShowIOSInstructions(false)}
                style={{
                  marginTop: '24px', padding: '12px 32px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #B14EFF, #7B2FBE)',
                  color: '#fff', fontWeight: 700, fontSize: '0.85rem',
                  cursor: 'pointer', width: '100%',
                }}
              >
                Entendido
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {installing && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          style={{
            position: 'fixed', bottom: '20px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 9999, background: 'rgba(74, 222, 128, 0.15)',
            border: '1px solid rgba(74, 222, 128, 0.3)',
            borderRadius: '12px', padding: '12px 20px',
            color: '#4ade80', fontSize: '0.85rem', fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: '8px',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Smartphone size={18} /> App instalada correctamente 🎉
        </motion.div>
      )}
    </>
  );
}
