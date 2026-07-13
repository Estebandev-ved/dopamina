import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * WhatsAppButton — Botón flotante global de contacto por WhatsApp.
 * Aparece después de 3 segundos de que el usuario lleva en la página.
 * Muestra un tooltip de conversación para generar confianza y CTA a compra.
 * 
 * Seguridad: No almacena datos del usuario ni hace requests externos.
 * Solo abre una URL de WhatsApp con texto pre-armado.
 */
export default function WhatsAppButton() {
  const [visible, setVisible] = useState(false);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  // Muestra el botón después de 3s y el tooltip después de 5s
  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 3000);
    const t2 = setTimeout(() => {
      if (!dismissed) setTooltipOpen(true);
    }, 5500);
    // Auto-cierra el tooltip después de 8s para no molestar
    const t3 = setTimeout(() => setTooltipOpen(false), 15000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, []);

  const handleOpen = () => {
    const msg = encodeURIComponent(
      '¡Hola! 👋 Vi el evento en dopaminaeventos.shop y quiero más información sobre las boletas 🎟️'
    );
    // Número de WhatsApp de Dopamina — cambiar por el número real
    window.open(`https://wa.me/573209410168?text=${msg}`, '_blank', 'noopener,noreferrer');
    setTooltipOpen(false);
  };

  const handleDismissTooltip = (e) => {
    e.stopPropagation();
    setTooltipOpen(false);
    setDismissed(true);
  };

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        gap: '10px',
      }}
    >
      {/* Tooltip / Burbuja de conversación */}
      <AnimatePresence>
        {tooltipOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            style={{
              background: '#1A1A24',
              border: '1px solid rgba(177,78,255,0.25)',
              borderRadius: '16px',
              borderBottomLeftRadius: '4px',
              padding: '14px 16px',
              maxWidth: '240px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(177,78,255,0.1)',
              position: 'relative',
              cursor: 'pointer',
            }}
            onClick={handleOpen}
          >
            {/* Botón cerrar */}
            <button
              onClick={handleDismissTooltip}
              style={{
                position: 'absolute',
                top: '8px',
                right: '10px',
                background: 'none',
                border: 'none',
                color: '#555',
                cursor: 'pointer',
                fontSize: '14px',
                lineHeight: 1,
                padding: '2px',
              }}
              aria-label="Cerrar"
            >
              ✕
            </button>

            {/* Avatar + nombre */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #B14EFF, #7B2FBE)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', flexShrink: 0,
              }}>🎶</div>
              <div>
                <p style={{ margin: 0, fontSize: '11px', fontWeight: 800, color: '#fff', letterSpacing: '0.05em' }}>
                  DOPAMINA
                </p>
                <p style={{ margin: 0, fontSize: '9px', color: '#25D366', fontWeight: 700 }}>
                  ● En línea
                </p>
              </div>
            </div>

            {/* Mensaje */}
            <p style={{ margin: 0, fontSize: '12px', color: '#D0D0E0', lineHeight: 1.5 }}>
              ¡Hola! 🎟️ ¿Tienes dudas sobre las boletas o el evento?
              <br />
              <strong style={{ color: '#B14EFF' }}>Escríbenos por WhatsApp</strong>, te respondemos al instante.
            </p>

            <div style={{
              marginTop: '10px',
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#25D366', borderRadius: '8px',
              padding: '6px 12px', width: 'fit-content',
            }}>
              <WhatsAppIcon size={12} color="#fff" />
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Chatear ahora
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón principal */}
      <motion.button
        onClick={handleOpen}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #25D366, #128C7E)',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37, 211, 102, 0.45), 0 0 0 0 rgba(37, 211, 102, 0.4)',
          animation: 'whatsapp-pulse 2.5s infinite',
          position: 'relative',
        }}
        aria-label="Contactar por WhatsApp"
        id="whatsapp-floating-btn"
      >
        <WhatsAppIcon size={28} color="#fff" />

        {/* Notificación badge */}
        <span style={{
          position: 'absolute',
          top: '-2px',
          right: '-2px',
          width: '16px',
          height: '16px',
          borderRadius: '50%',
          background: '#FF3E3E',
          border: '2px solid #0A0A0F',
          fontSize: '9px',
          fontWeight: 800,
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          1
        </span>
      </motion.button>

      {/* CSS para el pulso */}
      <style>{`
        @keyframes whatsapp-pulse {
          0% { box-shadow: 0 4px 20px rgba(37,211,102,0.45), 0 0 0 0 rgba(37,211,102,0.4); }
          70% { box-shadow: 0 4px 20px rgba(37,211,102,0.45), 0 0 0 12px rgba(37,211,102,0); }
          100% { box-shadow: 0 4px 20px rgba(37,211,102,0.45), 0 0 0 0 rgba(37,211,102,0); }
        }
      `}</style>
    </div>
  );
}

/**
 * Ícono SVG nativo de WhatsApp (sin dependencias externas).
 */
function WhatsAppIcon({ size = 24, color = '#fff' }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}
