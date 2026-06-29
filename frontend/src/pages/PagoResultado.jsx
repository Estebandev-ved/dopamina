import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import PageTransition from '../components/PageTransition';
import { CheckCircle, XCircle, Clock, ArrowRight, AlertCircle } from 'lucide-react';

export default function PagoResultado() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const estado = searchParams.get('estado');
  const compraId = searchParams.get('compraId');

  useEffect(() => {
    const checkStatus = async () => {
      if (!compraId) {
        setLoading(false);
        return;
      }

      try {
        const result = await api.efipayPaymentStatus(compraId);
        setStatus(result.estado);
      } catch (err) {
        setStatus('pendiente');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(checkStatus, 1500);
    return () => clearTimeout(timer);
  }, [compraId]);

  const getNormalizedStatus = () => {
    const s = status || estado;
    if (!s) return 'pendiente';
    const norm = s.toLowerCase();
    if (norm === 'aprobado' || norm === 'aprobada' || norm === 'pagado' || norm === 'pagada' || norm === 'success') {
      return 'aprobado';
    }
    if (norm === 'rechazado' || norm === 'rechazada' || norm === 'fallido' || norm === 'fallida' || norm === 'rejected' || norm === 'failed') {
      return 'rechazado';
    }
    return 'pendiente';
  };

  const getIcon = () => {
    const s = getNormalizedStatus();
    if (s === 'aprobado') return <CheckCircle className="w-20 h-20 text-emerald-400" />;
    if (s === 'rechazado') return <XCircle className="w-20 h-20 text-rose-400" />;
    return <Clock className="w-20 h-20 text-yellow-400" />;
  };

  const getTitle = () => {
    const s = getNormalizedStatus();
    if (s === 'aprobado') return '¡PAGO EXITOSO!';
    if (s === 'rechazado') return 'PAGO RECHAZADO';
    return 'PAGO PENDIENTE';
  };

  const getMessage = () => {
    const s = getNormalizedStatus();
    if (s === 'aprobado') {
      return 'Tu compra ha sido procesada exitosamente. Las entradas están disponibles en tu perfil.';
    }
    if (s === 'rechazado') {
      return 'El pago no pudo ser completado. Puedes intentar nuevamente desde el checkout.';
    }
    return 'El pago está siendo procesado. Recibirás una confirmación cuando se complete.';
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-black py-16 overflow-hidden">
        <div className="absolute inset-0 industrial-grid opacity-25 pointer-events-none" />

        <div className="relative max-w-lg mx-auto px-4 z-10">
          <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-10 text-center">
            <div className="flex justify-center mb-6">
              {loading ? (
                <div className="w-20 h-20 flex items-center justify-center">
                  <div className="w-10 h-10 border-2 border-neon-purple border-t-transparent rounded-full animate-spin" />
                </div>
              ) : getIcon()}
            </div>

            <h1 className="text-2xl font-black text-white uppercase tracking-widest mb-3">
              {loading ? 'VERIFICANDO PAGO...' : getTitle()}
            </h1>

            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              {loading ? 'Por favor espera mientras verificamos el estado de tu pago.' : getMessage()}
            </p>

            <div className="space-y-3">
              {!loading && (
                <button
                  onClick={() => navigate('/dashboard')}
                  className="w-full bg-neon-purple text-white py-4 rounded text-xs font-black tracking-widest hover:shadow-neon-md transition-all duration-300 flex items-center justify-center space-x-2"
                >
                  <span>IR A MIS ENTRADAS</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <button
                onClick={() => navigate('/eventos')}
                className="w-full bg-industrial-800 text-white py-3 rounded text-xs font-bold tracking-widest hover:bg-industrial-700 transition-all duration-300"
              >
                VER MÁS EVENTOS
              </button>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
