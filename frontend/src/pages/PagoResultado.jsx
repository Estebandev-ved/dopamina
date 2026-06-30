import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import PageTransition from '../components/PageTransition';

// ── Constantes de polling ───────────────────────────────────────────────────
const MAX_INTENTOS = 8;          // Máximo número de verificaciones
const INTERVALO_MS = 2500;       // Cada 2.5 segundos
const ESPERA_INICIAL_MS = 1500;  // Espera inicial antes del primer intento

/**
 * Normaliza cualquier estado de la pasarela/BD a: 'aprobado' | 'rechazado' | 'pendiente'
 * Seguridad: solo lee parámetros de URL del propio backend, no modifica el estado.
 */
const normalizar = (s) => {
  if (!s) return 'pendiente';
  const n = s.toLowerCase().trim();
  if (['aprobado', 'aprobada', 'pagado', 'pagada', 'success', 'approved'].includes(n)) return 'aprobado';
  if (['rechazado', 'rechazada', 'fallido', 'fallida', 'rejected', 'failed', 'cancelled'].includes(n)) return 'rechazado';
  return 'pendiente';
};

export default function PagoResultado() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const estadoUrl = searchParams.get('estado');   // Parámetro que envía Efipay en la URL de retorno
  const compraId  = searchParams.get('compraId');

  // Si Efipay ya dice "aprobado" en la URL, lo mostramos de inmediato
  const estadoInicial = normalizar(estadoUrl);
  const [status, setStatus]           = useState(estadoInicial);
  const [intentos, setIntentos]       = useState(0);
  const [verificando, setVerificando] = useState(estadoInicial !== 'aprobado' && Boolean(compraId));
  const [sinSesion, setSinSesion]     = useState(false);
  const [confettiActive, setConfetti] = useState(false);

  // ── Polling automático contra el backend ─────────────────────────────────
  const verificarEstado = useCallback(async () => {
    if (!compraId) { setVerificando(false); return; }

    try {
      const result = await api.efipayPaymentStatus(compraId);
      const norm   = normalizar(result?.estado);
      setStatus(norm);

      if (norm === 'aprobado') {
        setVerificando(false);
        setConfetti(true);           // Disparar animación de celebración
        return true;                 // Indica que terminamos
      }
      if (norm === 'rechazado') {
        setVerificando(false);
        return true;
      }
    } catch (err) {
      // 401 → sesión expirada
      if (err?.status === 401 || err?.message?.includes('401')) {
        setSinSesion(true);
        setVerificando(false);
        return true;
      }
      // Cualquier otro error: seguir intentando
    }
    return false;
  }, [compraId]);

  useEffect(() => {
    // Si ya llegó "aprobado" desde la URL, disparar celebración y dejar de verificar
    if (estadoInicial === 'aprobado') {
      setVerificando(false);
      setConfetti(true);
      // Aun así verificar 1 vez en background para confirmar en BD (genera boletas y envía email)
      setTimeout(() => verificarEstado(), ESPERA_INICIAL_MS);
      return;
    }

    if (!compraId) { setVerificando(false); return; }

    let intentoActual = 0;
    let timerId;

    const correrIntento = async () => {
      intentoActual++;
      setIntentos(intentoActual);
      const terminado = await verificarEstado();
      if (!terminado && intentoActual < MAX_INTENTOS) {
        timerId = setTimeout(correrIntento, INTERVALO_MS);
      } else if (!terminado) {
        // Agotamos los intentos → mostrar estado final (pendiente o lo que haya)
        setVerificando(false);
      }
    };

    // Primera verificación después de la espera inicial
    timerId = setTimeout(correrIntento, ESPERA_INICIAL_MS);
    return () => clearTimeout(timerId);
  }, [compraId, estadoInicial, verificarEstado]);

  // ── UI helpers ──────────────────────────────────────────────────────────
  const esPagado   = status === 'aprobado';
  const esRechazado = status === 'rechazado';

  // ── Estilos en línea (compatible con cualquier versión de Tailwind) ──────
  const styles = {
    page: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0a0a 0%, #0f0f0f 50%, #0a0a0a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem',
      position: 'relative',
      overflow: 'hidden',
    },
    grid: {
      position: 'absolute',
      inset: 0,
      backgroundImage: `
        linear-gradient(rgba(177,78,255,0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(177,78,255,0.03) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
      pointerEvents: 'none',
    },
    card: {
      position: 'relative',
      width: '100%',
      maxWidth: '480px',
      background: 'rgba(15,15,15,0.95)',
      border: esPagado
        ? '1px solid rgba(52,211,153,0.4)'
        : esRechazado
          ? '1px solid rgba(239,68,68,0.4)'
          : '1px solid rgba(177,78,255,0.3)',
      borderRadius: '16px',
      padding: '3rem 2.5rem',
      textAlign: 'center',
      boxShadow: esPagado
        ? '0 0 60px rgba(52,211,153,0.15), 0 0 120px rgba(52,211,153,0.05)'
        : esRechazado
          ? '0 0 40px rgba(239,68,68,0.1)'
          : '0 0 40px rgba(177,78,255,0.1)',
    },
    iconWrapper: {
      width: '90px',
      height: '90px',
      borderRadius: '50%',
      margin: '0 auto 1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '2.5rem',
      background: esPagado
        ? 'rgba(52,211,153,0.1)'
        : esRechazado
          ? 'rgba(239,68,68,0.1)'
          : 'rgba(177,78,255,0.1)',
      border: esPagado
        ? '2px solid rgba(52,211,153,0.3)'
        : esRechazado
          ? '2px solid rgba(239,68,68,0.3)'
          : '2px solid rgba(177,78,255,0.3)',
      animation: verificando ? 'pulse 2s infinite' : esPagado ? 'bounceIn 0.6s ease' : 'none',
    },
    title: {
      fontSize: '1.6rem',
      fontWeight: 900,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      marginBottom: '0.75rem',
      color: esPagado ? '#34d399' : esRechazado ? '#f87171' : '#e2e8f0',
    },
    subtitle: {
      fontSize: '0.875rem',
      color: '#94a3b8',
      lineHeight: 1.7,
      marginBottom: '2rem',
    },
    badge: {
      display: 'inline-block',
      padding: '0.25rem 0.75rem',
      borderRadius: '999px',
      fontSize: '0.7rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      marginBottom: '1.5rem',
      background: esPagado ? 'rgba(52,211,153,0.15)' : 'rgba(177,78,255,0.15)',
      color: esPagado ? '#34d399' : '#c084fc',
      border: esPagado ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(177,78,255,0.3)',
    },
    btnPrimary: {
      width: '100%',
      padding: '1rem',
      borderRadius: '10px',
      border: 'none',
      cursor: 'pointer',
      fontSize: '0.8rem',
      fontWeight: 900,
      letterSpacing: '0.12em',
      textTransform: 'uppercase',
      marginBottom: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      transition: 'all 0.3s ease',
      background: esPagado
        ? 'linear-gradient(135deg, #059669, #10b981)'
        : 'linear-gradient(135deg, #7c3aed, #9333ea)',
      color: '#fff',
      boxShadow: esPagado
        ? '0 4px 20px rgba(16,185,129,0.4)'
        : '0 4px 20px rgba(147,51,234,0.4)',
    },
    btnSecondary: {
      width: '100%',
      padding: '0.75rem',
      borderRadius: '10px',
      border: '1px solid rgba(255,255,255,0.1)',
      cursor: 'pointer',
      fontSize: '0.75rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      background: 'rgba(255,255,255,0.04)',
      color: '#94a3b8',
      transition: 'all 0.3s ease',
    },
    compraId: {
      marginTop: '1.5rem',
      padding: '0.5rem 1rem',
      borderRadius: '8px',
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
      fontSize: '0.7rem',
      color: '#475569',
      letterSpacing: '0.05em',
    },
    spinnerWrapper: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.5rem',
      marginBottom: '1rem',
    },
    spinner: {
      width: '40px',
      height: '40px',
      border: '3px solid rgba(177,78,255,0.2)',
      borderTop: '3px solid #b14eff',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    },
    pollingInfo: {
      fontSize: '0.7rem',
      color: '#475569',
      marginTop: '0.5rem',
    },
  };

  // ── Confetti particles (animación de celebración) ────────────────────────
  const confettiColors = ['#34d399', '#b14eff', '#f472b6', '#fbbf24', '#60a5fa'];
  const confettiParticles = confettiActive ? Array.from({ length: 20 }) : [];

  return (
    <PageTransition>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(0.97)} }
        @keyframes bounceIn { 0%{transform:scale(0.3);opacity:0}50%{transform:scale(1.1)}70%{transform:scale(0.9)}100%{transform:scale(1);opacity:1} }
        @keyframes confettiFall {
          0%   { transform: translateY(-60px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0; }
        }
        @keyframes fadeInUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        .pago-card { animation: fadeInUp 0.5s ease; }
        .btn-primary:hover { transform: translateY(-2px); filter: brightness(1.1); }
        .btn-secondary:hover { background: rgba(255,255,255,0.08) !important; color: #cbd5e1 !important; }
      `}</style>

      {/* Confetti de celebración */}
      {confettiParticles.map((_, i) => (
        <div key={i} style={{
          position: 'fixed',
          top: '-20px',
          left: `${Math.random() * 100}%`,
          width: `${6 + Math.random() * 8}px`,
          height: `${6 + Math.random() * 8}px`,
          borderRadius: Math.random() > 0.5 ? '50%' : '2px',
          background: confettiColors[i % confettiColors.length],
          animation: `confettiFall ${1.5 + Math.random() * 2}s ease-in ${Math.random() * 1}s forwards`,
          zIndex: 9999,
          pointerEvents: 'none',
        }} />
      ))}

      <div style={styles.page}>
        <div style={styles.grid} />

        <div className="pago-card" style={styles.card}>
          {/* ── Ícono de estado ── */}
          <div style={styles.iconWrapper}>
            {verificando ? '⏳' : esPagado ? '✅' : esRechazado ? '❌' : '🕐'}
          </div>

          {/* ── Badge de estado ── */}
          {esPagado && <div style={styles.badge}>✓ Transacción Confirmada</div>}

          {/* ── Título ── */}
          <h1 style={styles.title}>
            {verificando
              ? 'Verificando pago...'
              : esPagado
                ? '¡Pago Exitoso!'
                : esRechazado
                  ? 'Pago Rechazado'
                  : sinSesion
                    ? 'Sesión Expirada'
                    : 'Pago Pendiente'}
          </h1>

          {/* ── Mensaje descriptivo ── */}
          <p style={styles.subtitle}>
            {verificando
              ? `Conectando con la pasarela de pago, por favor espera... (${intentos}/${MAX_INTENTOS})`
              : esPagado
                ? '¡Tu compra ha sido procesada con éxito! Tus boletas están listas. Hemos enviado un correo con los códigos QR a tu email.'
                : esRechazado
                  ? 'El pago no pudo completarse. Puedes intentar nuevamente desde el checkout. Si el dinero fue debitado, contáctanos.'
                  : sinSesion
                    ? 'Tu sesión expiró mientras procesábamos el pago. Inicia sesión para ver el estado de tu compra.'
                    : 'El pago está siendo procesado por la pasarela. Esto puede tardar unos minutos. Puedes revisar tu dashboard más tarde.'}
          </p>

          {/* ── Spinner mientras verifica ── */}
          {verificando && (
            <div style={styles.spinnerWrapper}>
              <div style={styles.spinner} />
              <p style={styles.pollingInfo}>
                Verificando automáticamente...
              </p>
            </div>
          )}

          {/* ── Botones de acción ── */}
          {!verificando && (
            <div>
              {sinSesion ? (
                <button
                  className="btn-primary"
                  style={styles.btnPrimary}
                  onClick={() => navigate('/login')}
                >
                  <span>🔐</span>
                  <span>Iniciar Sesión</span>
                </button>
              ) : (
                <button
                  className="btn-primary"
                  style={styles.btnPrimary}
                  onClick={() => navigate('/dashboard')}
                >
                  <span>{esPagado ? '🎫' : '📋'}</span>
                  <span>{esPagado ? 'Ver Mis Boletas' : 'Ir a Mi Dashboard'}</span>
                  <span>→</span>
                </button>
              )}

              {esRechazado && (
                <button
                  className="btn-primary"
                  style={{ ...styles.btnPrimary, marginTop: '0', marginBottom: '0.75rem',
                    background: 'linear-gradient(135deg, #7c3aed, #9333ea)',
                    boxShadow: '0 4px 20px rgba(147,51,234,0.4)' }}
                  onClick={() => navigate('/checkout')}
                >
                  <span>🔄</span>
                  <span>Intentar de Nuevo</span>
                </button>
              )}

              <button
                className="btn-secondary"
                style={styles.btnSecondary}
                onClick={() => navigate('/eventos')}
              >
                Ver Más Eventos
              </button>
            </div>
          )}

          {/* ── Referencia de compra ── */}
          {compraId && (
            <div style={styles.compraId}>
              Referencia de compra #{compraId}
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
