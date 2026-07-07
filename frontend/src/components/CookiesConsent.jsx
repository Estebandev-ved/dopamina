import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Cookie, X } from 'lucide-react';

const COOKIES_VERSION = '1.0';

export default function CookiesConsent() {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('dopamina_cookies_consent');
    const version = localStorage.getItem('dopamina_cookies_version');
    if (!stored || version !== COOKIES_VERSION) {
      setTimeout(() => setShow(true), 1500);
    }
  }, []);

  const handleAcceptAll = () => {
    localStorage.setItem('dopamina_cookies_consent', 'all');
    localStorage.setItem('dopamina_cookies_version', COOKIES_VERSION);
    setShow(false);
  };

  const handleReject = () => {
    localStorage.setItem('dopamina_cookies_consent', 'necessary');
    localStorage.setItem('dopamina_cookies_version', COOKIES_VERSION);
    setShow(false);
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          style={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            zIndex: 9998, padding: '16px',
          }}
        >
          <div style={{
            maxWidth: '600px', margin: '0 auto',
            background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
            border: '1px solid rgba(177, 78, 255, 0.2)',
            borderRadius: '16px', padding: '20px',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            backdropFilter: 'blur(20px)',
          }}>
            <div style={{ display: 'flex', gap: '14px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: 'rgba(177, 78, 255, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Cookie size={22} color="#C97FFF" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ color: '#f2f0f5', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                    🍪 Uso de cookies
                  </div>
                  <button
                    onClick={() => setShow(false)}
                    style={{
                      background: 'rgba(255,255,255,0.06)', border: 'none',
                      borderRadius: '50%', width: '26px', height: '26px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', color: '#9a9a9a', flexShrink: 0,
                    }}
                  >
                    <X size={13} />
                  </button>
                </div>
                <p style={{ color: '#9a9a9a', fontSize: '0.75rem', lineHeight: 1.5, margin: '0 0 8px' }}>
                  Usamos cookies propias y de terceros para mejorar tu experiencia, analizar el tráfico y personalizar contenido. 
                  Puedes aceptar todas, rechazar las no esenciales, o configurar tus preferencias.{' '}
                  <Link to="/terminos" style={{ color: '#C97FFF', textDecoration: 'underline' }}>
                    Más información
                  </Link>
                </p>

                {showDetails && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    style={{
                      background: 'rgba(0,0,0,0.3)', borderRadius: '8px',
                      padding: '12px', marginBottom: '10px', fontSize: '0.72rem',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <input type="checkbox" checked disabled style={{ accentColor: '#B14EFF' }} />
                      <span style={{ color: '#f2f0f5', fontWeight: 600 }}>Cookies necesarias (siempre activas)</span>
                    </div>
                    <p style={{ color: '#6b6b80', marginLeft: '24px', marginBottom: '8px' }}>
                      Esenciales para el funcionamiento básico del sitio. Incluyen autenticación, seguridad y preferencias de sesión.
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <input type="checkbox" id="analytics-cookies" style={{ accentColor: '#B14EFF' }} />
                      <label htmlFor="analytics-cookies" style={{ color: '#f2f0f5', fontWeight: 600, cursor: 'pointer' }}>
                        Cookies de análisis y rendimiento
                      </label>
                    </div>
                    <p style={{ color: '#6b6b80', marginLeft: '24px' }}>
                      Nos ayudan a entender cómo usas el sitio para mejorarlo continuamente.
                    </p>
                  </motion.div>
                )}

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                  <button
                    onClick={handleAcceptAll}
                    style={{
                      padding: '9px 20px', borderRadius: '10px', border: 'none',
                      background: 'linear-gradient(135deg, #B14EFF, #7B2FBE)',
                      color: '#fff', fontWeight: 700, fontSize: '0.75rem',
                      cursor: 'pointer', flex: 1, minWidth: '120px',
                    }}
                  >
                    Aceptar todas
                  </button>
                  <button
                    onClick={handleReject}
                    style={{
                      padding: '9px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: '#9a9a9a', fontWeight: 600, fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Solo necesarias
                  </button>
                  <button
                    onClick={() => setShowDetails(!showDetails)}
                    style={{
                      padding: '9px 16px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.1)',
                      background: 'transparent', color: '#9a9a9a', fontWeight: 500, fontSize: '0.72rem',
                      cursor: 'pointer',
                    }}
                  >
                    {showDetails ? 'Ocultar' : 'Configurar'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
