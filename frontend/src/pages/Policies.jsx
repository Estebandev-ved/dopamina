import React from 'react';
import PageTransition from '../components/PageTransition';
import { Shield, Sparkles, AlertTriangle, EyeOff, Send, AlertCircle } from 'lucide-react';
import { api } from '../services/api';

/**
 * Policies page focusing on the "Espacio Seguro" protocol.
 */
export default function Policies() {
  const [tipo, setTipo] = React.useState('Acoso / Agresión');
  const [ubicacion, setUbicacion] = React.useState('');
  const [descripcion, setDescripcion] = React.useState('');
  const [anonimo, setAnonimo] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!ubicacion.trim()) {
      setError('Por favor indica la ubicación de la alerta.');
      return;
    }
    if (!descripcion.trim()) {
      setError('Por favor describe brevemente lo que ocurre.');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.crearReporteSeguridad(tipo, ubicacion, descripcion, anonimo);
      setSuccess('Alerta enviada correctamente. El personal de seguridad ha sido notificado.');
      setUbicacion('');
      setDescripcion('');
    } catch (err) {
      setError(err.message || 'Error al enviar el reporte de seguridad.');
    } finally {
      setLoading(false);
    }
  };

  const safetyRules = [
    {
      title: "Consentimiento Activo",
      description: "Solo un 'Sí' entusiasta y claro significa sí. Si no hay consentimiento explícito, detén cualquier interacción física o verbal de inmediato.",
      icon: <Sparkles className="w-5 h-5 text-neon-glow" />
    },
    {
      title: "Cero Acoso y Violencia",
      description: "No toleramos el acoso físico, verbal ni visual. Cualquier comportamiento agresivo, intimidante o discriminatorio resultará en la expulsión del evento.",
      icon: <AlertTriangle className="w-5 h-5 text-neon-glow" />
    },
    {
      title: "Respeto a la Privacidad",
      description: "Para mantener una atmósfera de libertad y desconexión, desalentamos el uso de cámaras y flashes en la pista de baile. Respeta la intimidad de los demás.",
      icon: <EyeOff className="w-5 h-5 text-neon-glow" />
    }
  ];

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-black py-20 overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 industrial-grid opacity-20 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-xs font-mono font-bold tracking-[0.3em] text-rose-500 uppercase bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              Seguridad & Convivencia
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white mt-4 tracking-wider uppercase">
              PROTOCOLO ESPACIO SEGURO
            </h1>
            <div className="w-16 h-[2px] bg-rose-500 mx-auto mt-4" />
          </div>

          {/* Intro Callout Card */}
          <div className="bg-rose-950/10 border border-rose-500/30 rounded-lg p-6 sm:p-10 mb-12 flex flex-col md:flex-row items-center md:items-start md:space-x-6">
            <div className="w-12 h-12 rounded-full bg-rose-950/50 border border-rose-500/50 flex items-center justify-center mb-4 md:mb-0 flex-shrink-0 text-rose-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-wider mb-2">
                Nuestra Prioridad es tu Integridad
              </h2>
              <p className="text-sm text-gray-300 leading-relaxed">
                Queremos que sientas la libertad absoluta de bailar y expresarte sin miedo. Dopamina se compromete a mantener un entorno inclusivo, libre de discriminación de género, orientación sexual, etnia o condición social. Si en algún momento te sientes incómodo, acosado o en peligro, acércate inmediatamente a cualquier miembro del staff de seguridad o barra; estamos entrenados para asistirte bajo absoluta reserva.
              </p>
            </div>
          </div>

          {/* Conduct Rules Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {safetyRules.map((rule, index) => (
              <div 
                key={index}
                className="bg-industrial-900 border border-industrial-800 rounded-lg p-6 hover:border-neon-purple/30 transition-colors duration-300"
              >
                <div className="w-10 h-10 rounded bg-black border border-neon-purple/20 flex items-center justify-center mb-4">
                  {rule.icon}
                </div>
                <h3 className="text-sm font-black text-white uppercase tracking-wide mb-2">
                  {rule.title}
                </h3>
                <p className="text-xs text-gray-400 leading-relaxed">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>

          {/* Formulario de Alerta en Tiempo Real */}
          <div className="bg-gradient-to-r from-red-950/10 to-industrial-900 border border-red-500/20 rounded-lg p-6 sm:p-10 mb-16 shadow-[0_0_15px_rgba(239,68,68,0.05)]">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-red-950/50 border border-red-500/40 flex items-center justify-center text-red-500 animate-pulse">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-wider">
                  Reportar Alerta de Seguridad
                </h3>
                <p className="text-[10px] text-gray-500 font-mono uppercase mt-0.5">
                  Conexión directa e instantánea con el centro de control
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-400 mb-6 leading-relaxed">
              Si presencias o sufres una situación de acoso, emergencia médica o riesgo dentro de la bodega, envíanos una alerta. El equipo de logística y seguridad será despachado de inmediato. Puedes elegir enviar el reporte con tu nombre o mantenerlo completamente anónimo.
            </p>

            <form onSubmit={handleSubmitReport} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    Tipo de Alerta
                  </label>
                  <select 
                    value={tipo}
                    onChange={(e) => setTipo(e.target.value)}
                    className="w-full bg-black border border-industrial-800 focus:border-red-500 text-xs text-gray-300 px-3 py-2.5 rounded outline-none transition-colors cursor-pointer"
                  >
                    <option value="Acoso / Agresión">Acoso / Agresión</option>
                    <option value="Emergencia Médica">Emergencia Médica</option>
                    <option value="Consumo de Riesgo">Consumo de Riesgo</option>
                    <option value="Conflicto / Pelea">Conflicto / Pelea</option>
                    <option value="Problema de Infraestructura">Problema de Infraestructura</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                    Ubicación Aproximada
                  </label>
                  <input 
                    type="text" 
                    value={ubicacion}
                    onChange={(e) => setUbicacion(e.target.value)}
                    placeholder="Ej. Barra principal lado derecho, baños, etc."
                    className="w-full bg-black border border-industrial-800 focus:border-red-500 text-xs text-white px-3 py-2.5 rounded outline-none transition-colors placeholder:text-gray-700"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                  Descripción del Incidente
                </label>
                <textarea 
                  rows="3"
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Describe brevemente lo que ocurre para poder responder de forma adecuada..."
                  className="w-full bg-black border border-industrial-800 focus:border-red-500 text-xs text-white px-3 py-2.5 rounded outline-none transition-colors placeholder:text-gray-700 resize-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                <label className="inline-flex items-center space-x-2.5 cursor-pointer select-none">
                  <input 
                    type="checkbox"
                    checked={anonimo}
                    onChange={(e) => setAnonimo(e.target.checked)}
                    className="w-4 h-4 bg-black border border-industrial-800 text-red-500 rounded focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                    Enviar de forma 100% Anónima
                  </span>
                </label>

                <button 
                  type="submit"
                  disabled={loading}
                  className="bg-red-600 hover:bg-red-500 text-white text-xs font-black tracking-widest px-8 py-3 rounded shadow-[0_0_10px_rgba(220,38,38,0.3)] hover:shadow-[0_0_15px_rgba(220,38,38,0.5)] transition-all uppercase cursor-pointer disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Despachar Alerta</span>
                    </>
                  )}
                </button>
              </div>

              {error && (
                <div className="border border-red-500/20 bg-red-950/20 text-red-400 text-xs px-3 py-2.5 rounded font-mono font-bold">
                  {error}
                </div>
              )}

              {success && (
                <div className="border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 text-xs px-3 py-2.5 rounded font-mono font-bold">
                  {success}
                </div>
              )}
            </form>
          </div>

          {/* Legal / Terms Accordion Mockup */}
          <div className="border-t border-industrial-800 pt-10 space-y-6">
            <h3 className="text-lg font-black tracking-widest text-white uppercase mb-4">
              Términos Generales
            </h3>

            <div className="space-y-4 text-xs text-gray-400 leading-relaxed font-mono">
              <div className="bg-industrial-900/40 p-4 border border-industrial-800 rounded">
                <h4 className="font-bold text-white uppercase mb-2">1. Control de Admisión</h4>
                <p>
                  Nos reservamos el derecho de admisión y permanencia. Cualquier persona que intente ingresar sustancias peligrosas o que muestre conductas hostiles en la fila no será admitida, perdiendo el derecho al reembolso.
                </p>
              </div>

              <div className="bg-industrial-900/40 p-4 border border-industrial-800 rounded">
                <h4 className="font-bold text-white uppercase mb-2">2. Reembolsos y Cancelaciones</h4>
                <p>
                  Las entradas son personales y no reembolsables, salvo cancelación definitiva del evento por causas imputables a la organización. En caso de reprogramación, la boleta seguirá siendo válida para la nueva fecha.
                </p>
              </div>

              <div className="bg-industrial-900/40 p-4 border border-industrial-800 rounded">
                <h4 className="font-bold text-white uppercase mb-2">3. Política de Privacidad de Datos</h4>
                <p>
                  Los datos recolectados durante el registro (Nombre, Email, Teléfono) se tratan de conformidad con las leyes de protección de datos personales de la República de Colombia y se usarán estrictamente para control de accesos y notificaciones de eventos futuros de Dopamina. No compartimos bases de datos con terceros.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
