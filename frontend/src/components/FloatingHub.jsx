import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle } from 'lucide-react';
import ChatbotWidget, { DopaRaverAvatar } from './ChatbotWidget';

/**
 * FloatingHub — Centro de acciones flotante (speed-dial) para la esquina inferior derecha.
 *
 * Reemplaza los antiguos botones flotantes sueltos (WhatsApp, Instagram y el launcher
 * del chatbot) que se enciman entre sí y resultaban invasivos. Por defecto solo se ve
 * un botón (la mascota Dopa-Raver); al tocarlo se despliegan hacia arriba las acciones:
 * Chatear, Instagram y WhatsApp. Las etiquetas aparecen solo al pasar el mouse (hover),
 * sin notificaciones falsas ni tooltips que se abran solos.
 *
 * Seguridad: no almacena datos ni hace requests externos; solo abre URLs conocidas.
 */

const WA_NUMBER = '573209410168';
const WA_MESSAGE =
  '¡Hola! 👋 Vi el evento en dopaminaeventos.shop y quiero más información sobre las boletas 🎟️';
const IG_URL = 'https://www.instagram.com/dopaminalab.eventos/';

function WhatsAppIcon({ size = 22, color = '#fff' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill={color} aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon({ size = 22 }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="white" stroke="none" />
    </svg>
  );
}

/**
 * Botón de acción secundario. Muestra su etiqueta a la izquierda solo en hover.
 */
function ActionButton({ label, onClick, background, children, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.8 }}
      transition={{ duration: 0.18, delay: index * 0.05 }}
      className="group flex items-center justify-end gap-2"
    >
      <span className="pointer-events-none select-none rounded-lg bg-zinc-950/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-bone opacity-0 shadow-lg backdrop-blur-sm transition-opacity duration-200 group-hover:opacity-100 border border-white/10">
        {label}
      </span>
      <button
        type="button"
        onClick={onClick}
        aria-label={label}
        className="flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform duration-200 hover:scale-110 active:scale-95"
        style={{ background }}
      >
        {children}
      </button>
    </motion.div>
  );
}

export default function FloatingHub() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  const openChat = () => {
    setMenuOpen(false);
    setChatOpen(true);
  };

  const openInstagram = () => {
    setMenuOpen(false);
    window.open(IG_URL, '_blank', 'noopener,noreferrer');
  };

  const openWhatsApp = () => {
    setMenuOpen(false);
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_MESSAGE)}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Panel del chatbot, controlado por el hub (sin su propio launcher) */}
      <ChatbotWidget open={chatOpen} onOpenChange={setChatOpen} hideLauncher />

      {/* Speed-dial: una sola pieza visible por defecto */}
      {!chatOpen && (
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end gap-3">
          <AnimatePresence>
            {menuOpen && (
              <div className="flex flex-col items-end gap-3">
                <ActionButton
                  index={0}
                  label="Chatear"
                  onClick={openChat}
                  background="linear-gradient(135deg, #B14EFF, #7B2FBE)"
                >
                  <MessageCircle className="h-[22px] w-[22px] text-white" />
                </ActionButton>

                <ActionButton
                  index={1}
                  label="Instagram"
                  onClick={openInstagram}
                  background="linear-gradient(135deg, #F58529, #DD2A7B 55%, #8134AF)"
                >
                  <InstagramIcon />
                </ActionButton>

                <ActionButton
                  index={2}
                  label="WhatsApp"
                  onClick={openWhatsApp}
                  background="linear-gradient(135deg, #25D366, #128C7E)"
                >
                  <WhatsAppIcon />
                </ActionButton>
              </div>
            )}
          </AnimatePresence>

          {/* Botón principal (mascota Dopa-Raver) */}
          <motion.button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            whileTap={{ scale: 0.92 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-industrial-950/90 shadow-lg backdrop-blur-sm transition-shadow duration-300 focus:outline-none"
            style={{ boxShadow: '0 4px 20px var(--color-neon-shadow-sm)' }}
            aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú de contacto'}
            aria-expanded={menuOpen}
          >
            <AnimatePresence mode="wait" initial={false}>
              {menuOpen ? (
                <motion.span
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <X className="h-7 w-7 text-neon-violet" />
                </motion.span>
              ) : (
                <motion.span
                  key="mascot"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                >
                  <DopaRaverAvatar state="idle" size={52} />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      )}
    </>
  );
}
