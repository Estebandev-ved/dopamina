import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../services/api';
import PageTransition from '../components/PageTransition';
import { Ticket, Gift, Sparkles, AlertCircle, Calendar, ShieldCheck, Flame, Info, Check, X, CreditCard, Sparkle, MapPin } from 'lucide-react';

export default function Combos() {
  const navigate = useNavigate();
  const currentUser = api.getUser();

  // State
  const [combos, setCombos] = useState([]);
  const [eventos, setEventos] = useState([]);
  const [selectedEvento, setSelectedEvento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  
  // Birthday Modal State
  const [showBirthdayModal, setShowBirthdayModal] = useState(false);
  const [birthdayCombo, setBirthdayCombo] = useState(null);
  const [birthdate, setBirthdate] = useState('');
  const [documentNumber, setDocumentNumber] = useState('');
  const [birthdayError, setBirthdayError] = useState('');
  const [validatingBirthday, setValidatingBirthday] = useState(false);

  // Terms Modal State (for combo purchases)
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [pendingCombo, setPendingCombo] = useState(null);

  // Load events and combos
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        // Fetch events
        const eventsData = await api.getEventos();
        const activeEvents = eventsData.filter(e => e.activo);
        setEventos(activeEvents);
        if (activeEvents.length > 0) {
          // Select featured event or the first one by default
          const featured = activeEvents.find(e => e.destacado) || activeEvents[0];
          setSelectedEvento(featured);
        }

        // Fetch combos
        try {
          const combosData = await api.getCombos();
          setCombos(combosData);
        } catch (comboErr) {
          console.warn("Failed to fetch combos from backend, using default seeds:", comboErr);
          // Fallback static seeds in case db is empty or offline
          setCombos([
            {
              id: 1,
              nombre: 'Combo Ron Crew',
              descripcion: 'Arma el parche: 4 entradas generales y una Botella de Ron para iniciar la noche. Ahorra tiempo y dinero.',
              precio: 100000.00,
              cantidadBoletas: 4,
              itemsAdicionales: '1 Botella de Ron',
              esCumpleanero: false,
              imagenUrl: null
            },
            {
              id: 2,
              nombre: 'Combo Vape Crew',
              descripcion: 'El combo ideal para parejas: 2 entradas generales y 1 Vape premium a tu elección.',
              precio: 60000.00,
              cantidadBoletas: 2,
              itemsAdicionales: '1 Vape Premium',
              esCumpleanero: false,
              imagenUrl: null
            },
            {
              id: 3,
              nombre: 'Combo Cumpleañero',
              descripcion: '¡Tu cumpleaños va por cuenta de la casa! Compra 3 entradas y la 4ta (la tuya) es GRATIS. Válido presentando cédula física en portería.',
              precio: 0.00, // Calculated dynamically in backend
              cantidadBoletas: 4,
              itemsAdicionales: '1 Entrada Gratis (Verificar Cédula)',
              esCumpleanero: true,
              imagenUrl: null
            }
          ]);
        }
      } catch (err) {
        setErrorMsg('Error al cargar la información de combos y eventos.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getMesNombre = (mesIndex) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mesIndex];
  };

  const currentMonthName = getMesNombre(new Date().getMonth());

  // Handle Combo Purchase Click
  const handleBuyCombo = (combo) => {
    if (!currentUser) {
      // Redirect to login with state to return
      navigate('/login', { state: { from: '/combos' } });
      return;
    }

    if (!selectedEvento) {
      setErrorMsg('Por favor selecciona un evento primero.');
      return;
    }

    if (combo.esCumpleanero) {
      setBirthdayCombo(combo);
      setBirthdayError('');
      setBirthdate('');
      setDocumentNumber('');
      setShowBirthdayModal(true);
    } else {
      // Show Terms & Conditions modal before checkout
      setPendingCombo(combo);
      setTermsAccepted(false);
      setShowTermsModal(true);
    }
  };

  // Validate Birthday Combo before Checkout
  const handleVerifyBirthday = (e) => {
    e.preventDefault();
    setBirthdayError('');
    setValidatingBirthday(true);

    if (!birthdate) {
      setBirthdayError('La fecha de nacimiento es obligatoria.');
      setValidatingBirthday(false);
      return;
    }

    if (!documentNumber.trim()) {
      setBirthdayError('El número de cédula es obligatorio.');
      setValidatingBirthday(false);
      return;
    }

    try {
      const birth = new Date(birthdate + 'T00:00:00');
      const birthMonth = birth.getMonth() + 1; // 1-indexed
      const currentMonth = new Date().getMonth() + 1;

      if (birthMonth !== currentMonth) {
        setBirthdayError(`El mes de nacimiento (${getMesNombre(birth.getMonth())}) no coincide con el mes actual (${currentMonthName}). La promo solo aplica para cumpleañeros de este mes.`);
        setValidatingBirthday(false);
        return;
      }

      // Validated successfully! Redirect to Checkout passing birthdate
      setShowBirthdayModal(false);
      navigate('/checkout', {
        state: {
          evento: selectedEvento,
          cantidad: birthdayCombo.cantidadBoletas,
          comboId: birthdayCombo.id,
          comboNombre: birthdayCombo.nombre,
          comboPrecio: null, // calculated dynamically in backend (price of 3 tickets)
          comboItems: birthdayCombo.itemsAdicionales,
          fechaNacimientoCumpleanero: birthdate
        }
      });

    } catch (err) {
      setBirthdayError('Ocurrió un error al validar los datos. Revisa el formato.');
    } finally {
      setValidatingBirthday(false);
    }
  };

  // Proceed to checkout after accepting combo terms
  const handleAcceptTerms = () => {
    if (!pendingCombo) return;
    setShowTermsModal(false);
    navigate('/checkout', {
      state: {
        evento: selectedEvento,
        cantidad: pendingCombo.cantidadBoletas,
        comboId: pendingCombo.id,
        comboNombre: pendingCombo.nombre,
        comboPrecio: pendingCombo.precio,
        comboItems: pendingCombo.itemsAdicionales
      }
    });
  };

  // Helper to format currency
  const formatCOP = (val) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-black py-16 overflow-hidden">
        {/* Grids */}
        <div className="absolute inset-0 industrial-grid opacity-25 pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          
          {/* Header */}
          <div className="text-center mb-12">
            <span className="text-[10px] font-mono font-bold tracking-[0.3em] text-neon-purple uppercase bg-neon-purple/10 px-3 py-1 rounded-full border border-neon-purple/20" style={{ color: 'var(--color-neon)', borderColor: 'rgba(var(--color-neon), 0.2)' }}>
              Combos & Promociones
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white mt-4 tracking-wider uppercase">
              RITUAL EN COMBO ⚡
            </h1>
            <p className="text-xs text-gray-500 font-mono mt-2 uppercase tracking-widest">
              Arma el parche • Asegura entradas • Ahorra en licores y vapes
            </p>
            <div className="w-16 h-[2px] bg-neon-purple mx-auto mt-4" style={{ backgroundColor: 'var(--color-neon)' }} />
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-10 h-10 border-4 border-t-neon-purple border-industrial-800 rounded-full animate-spin mb-4" style={{ borderTopColor: 'var(--color-neon)' }} />
              <p className="text-xs text-gray-500 font-mono">CARGANDO COMBOS...</p>
            </div>
          ) : (
            <>
              {errorMsg && (
                <div className="max-w-md mx-auto mb-8 bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded text-xs flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Event Selector Banner */}
              {eventos.length > 0 ? (
                <div className="max-w-xl mx-auto mb-12 bg-industrial-900/60 backdrop-blur-md border border-industrial-800 rounded-lg p-5 flex flex-col md:flex-row items-center justify-between gap-4">
                  <div className="flex items-center space-x-3 text-left">
                    <Calendar className="w-5 h-5 text-neon-purple" style={{ color: 'var(--color-neon)' }} />
                    <div>
                      <span className="text-[9px] text-gray-500 font-mono uppercase block leading-none">Evento Seleccionado</span>
                      <strong className="text-white text-sm uppercase font-black">{selectedEvento?.nombre}</strong>
                      <span className="text-xs text-gray-400 block mt-0.5">{selectedEvento?.fecha} • {selectedEvento?.lugar}</span>
                    </div>
                  </div>

                  {eventos.length > 1 && (
                    <select
                      value={selectedEvento?.id || ''}
                      onChange={(e) => {
                        const found = eventos.find(ev => ev.id === parseInt(e.target.value));
                        setSelectedEvento(found);
                      }}
                      className="bg-black border border-industrial-800 hover:border-neon-purple text-xs text-white rounded px-3 py-1.5 focus:outline-none transition-colors"
                    >
                      {eventos.map(ev => (
                        <option key={ev.id} value={ev.id}>{ev.nombre}</option>
                      ))}
                    </select>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 bg-industrial-900/40 border border-industrial-800 rounded-lg max-w-lg mx-auto mb-12">
                  <AlertCircle className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                  <p className="text-xs text-gray-400 font-mono">NO HAY EVENTOS ACTIVOS EN ESTE MOMENTO.</p>
                </div>
              )}

              {/* Combos Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {combos.map((combo) => {
                  const esCumple = combo.esCumpleanero;
                  
                  // Calculate dynamic birthday price for UI helper
                  const priceUnit = selectedEvento ? (selectedEvento.precio || 25000) : 25000;
                  let displayPriceText = formatCOP(combo.precio);
                  let savingsLabel = null;
                  let originalPriceDisplay = null;

                  if (esCumple) {
                    const originalTotal = priceUnit * 4;
                    const comboTotal = priceUnit * 3;
                    displayPriceText = formatCOP(comboTotal);
                    originalPriceDisplay = formatCOP(originalTotal);
                    savingsLabel = `¡AHORRAS ${formatCOP(priceUnit)}!`;
                  } else if (combo.precioOriginal && combo.precioOriginal > combo.precio) {
                    const savings = combo.precioOriginal - combo.precio;
                    originalPriceDisplay = formatCOP(combo.precioOriginal);
                    savingsLabel = `¡AHORRAS ${formatCOP(savings)}!`;
                  }

                  return (
                    <motion.div
                      key={combo.id}
                      whileHover={{ y: -5, boxShadow: '0 0 20px var(--color-neon-shadow-sm)' }}
                      transition={{ duration: 0.2 }}
                      className="bg-industrial-900 border border-industrial-800 rounded-lg p-6 flex flex-col justify-between relative overflow-hidden transition-all duration-300 group hover:border-neon-purple/50"
                    >
                      {/* Top diagonal stripe for branding */}
                      <div className={`absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r ${esCumple ? 'from-pink-500 to-neon-purple' : 'from-neon-purple to-neon-violet'}`} style={{ backgroundImage: `linear-gradient(to right, ${esCumple ? '#EC4899' : 'var(--color-neon)'}, var(--color-neon-light))` }} />
                      
                      {savingsLabel && (
                        <span className={`absolute top-4 right-4 text-[9px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded ${esCumple ? 'bg-pink-500/20 text-pink-400 border border-pink-500/30' : 'bg-neon-purple/20 text-neon-glow border border-neon-purple/30'}`} style={!esCumple ? { color: 'var(--color-neon)', backgroundColor: 'rgba(var(--color-neon), 0.2)', borderColor: 'rgba(var(--color-neon), 0.3)' } : {}}>
                          {savingsLabel}
                        </span>
                      )}
                      {/* Combo Image */}
                      {combo.imagenUrl && (
                        <div className="mt-2 mb-4 -mx-6 overflow-hidden" style={{ marginTop: '3px' }}>
                          <img 
                            src={combo.imagenUrl} 
                            alt={combo.nombre} 
                            className="w-full h-40 object-cover transition-transform duration-500 group-hover:scale-105"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        </div>
                      )}

                      {/* Header Info */}
                      <div className={`${combo.imagenUrl ? '' : 'mt-2'} flex-grow`}>
                        <div className="w-12 h-12 rounded bg-black border border-industrial-850 flex items-center justify-center mb-5 group-hover:border-neon-purple/30 transition-colors">
                          {esCumple ? (
                            <Gift className="w-6 h-6 text-pink-400" />
                          ) : (
                            <Ticket className="w-6 h-6 text-neon-glow" style={{ color: 'var(--color-neon)' }} />
                          )}
                        </div>

                        <h3 className="text-xl font-black text-white uppercase tracking-wide group-hover:text-neon-glow transition-colors duration-200" style={!esCumple ? { groupHover: { color: 'var(--color-neon)' } } : {}}>
                          {combo.nombre}
                        </h3>
                        
                        <p className="text-xs text-gray-400 leading-relaxed mt-3 mb-6">
                          {combo.descripcion}
                        </p>

                        {/* Included Items Checklist */}
                        <div className="space-y-2 border-t border-industrial-850 pt-4 mb-6">
                          <span className="text-[10px] text-gray-500 font-mono uppercase block mb-1">El combo incluye:</span>
                          
                          <div className="flex items-center space-x-2 text-xs text-gray-300">
                            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                            <span>{combo.cantidadBoletas} Entradas Digitales (Eventos)</span>
                          </div>
                          
                          {combo.itemsAdicionales && (
                            <div className="flex items-center space-x-2 text-xs text-gray-300">
                              <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                              <span className="font-bold text-white">{combo.itemsAdicionales}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Pricing and Button */}
                      <div className="border-t border-industrial-850 pt-5 mt-auto">
                        {/* Price breakdown: Original / Combo / Savings */}
                        <div className="space-y-1.5 mb-4">
                          {originalPriceDisplay && (
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] text-gray-500 font-mono uppercase">Precio Original</span>
                              <span className="text-sm text-gray-500 line-through font-mono">{originalPriceDisplay}</span>
                            </div>
                          )}
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-gray-500 font-mono uppercase">Precio Combo</span>
                            <span className="text-2xl font-black font-mono text-white">{displayPriceText}</span>
                          </div>
                          {originalPriceDisplay && (
                            <div className="flex items-center justify-between bg-emerald-500/10 rounded px-2 py-1 -mx-2">
                              <span className="text-[10px] text-emerald-400 font-mono uppercase font-bold">Tu Ahorro</span>
                              <span className="text-sm font-black font-mono text-emerald-400">
                                {esCumple ? formatCOP(priceUnit) : formatCOP((combo.precioOriginal || 0) - combo.precio)}
                              </span>
                            </div>
                          )}
                        </div>

                        <button
                          onClick={() => handleBuyCombo(combo)}
                          disabled={!selectedEvento}
                          className={`w-full py-2.5 rounded font-black text-xs uppercase tracking-widest transition-all duration-300 cursor-pointer ${
                            esCumple 
                              ? 'bg-pink-600 hover:bg-pink-700 text-white shadow-[0_0_10px_rgba(236,72,153,0.3)]'
                              : 'bg-neon-purple hover:bg-neon-purple-dark text-white shadow-neon-sm'
                          } disabled:opacity-40 disabled:pointer-events-none`}
                          style={!esCumple ? { backgroundColor: 'var(--color-neon)', boxShadow: '0 0 10px var(--color-neon-shadow-sm)' } : {}}
                        >
                          Adquirir Combo →
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Safety notice info */}
              <div className="mt-16 max-w-2xl mx-auto bg-industrial-950 border border-industrial-850/60 rounded-lg p-5 text-xs text-gray-400 flex items-start space-x-3.5">
                <Info className="w-5 h-5 text-neon-purple flex-shrink-0 mt-0.5" style={{ color: 'var(--color-neon)' }} />
                <div className="space-y-1.5 text-left">
                  <strong className="text-white block uppercase tracking-wider font-bold">Instrucciones de Redención de Bebidas / Vapes:</strong>
                  <span>Al finalizar tu compra en línea de un combo, recibirás tus códigos QR correspondientes a las boletas de ingreso y un **código de reclamo único** en tu panel de perfil. Presenta tu código de reclamo en la barra oficial del evento para retirar tu Botella de Ron o Vape. Cada reclamo se registra en tiempo real por seguridad.</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Terms & Conditions Modal for Combos */}
      <AnimatePresence>
        {showTermsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTermsModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-industrial-900 border border-industrial-800 rounded-lg p-6 max-w-lg w-full relative z-10 overflow-hidden shadow-neon-sm max-h-[85vh] flex flex-col"
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-neon-purple to-neon-violet" style={{ backgroundImage: 'linear-gradient(to right, var(--color-neon), var(--color-neon-light))' }} />

              <div className="flex justify-between items-start mb-4 flex-shrink-0">
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" style={{ color: 'var(--color-neon)' }} />
                  <span>Términos del Combo</span>
                </h3>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Combo name badge */}
              <div className="bg-neon-purple/10 border border-neon-purple/20 rounded p-3 mb-4 text-center flex-shrink-0" style={{ borderColor: 'rgba(var(--color-neon), 0.2)', backgroundColor: 'rgba(var(--color-neon), 0.08)' }}>
                <span className="text-[10px] font-mono text-gray-500 uppercase block">Vas a adquirir</span>
                <span className="text-sm font-black text-white uppercase tracking-wider" style={{ color: 'var(--color-neon)' }}>{pendingCombo?.nombre}</span>
              </div>

              {/* Scrollable terms content */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-5 pr-1">
                <div className="bg-industrial-950 border border-industrial-850/60 rounded p-4 text-xs text-gray-300 space-y-3">
                  <div className="flex items-start space-x-3">
                    <Ticket className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-neon)' }} />
                    <div>
                      <strong className="text-white block mb-1 uppercase tracking-wider text-[11px]">Boletas Digitales</strong>
                      <span className="text-gray-400 leading-relaxed">Las entradas incluidas en el combo son <strong className="text-white">100% digitales</strong>. Se guardarán automáticamente en tu perfil web y se enviarán a tu correo electrónico. No se emiten boletas físicas.</span>
                    </div>
                  </div>

                  <div className="border-t border-industrial-850/60" />

                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 flex-shrink-0 mt-0.5 text-rose-400" />
                    <div>
                      <strong className="text-white block mb-1 uppercase tracking-wider text-[11px]">Redención Exclusiva en Evento</strong>
                      <span className="text-gray-400 leading-relaxed">Los combos son <strong className="text-white">redimibles únicamente en el lugar del evento</strong>. No es posible canjearlos en otra ubicación ni en línea. Debes presentar tu boleta digital en la puerta de acceso.</span>
                    </div>
                  </div>

                  <div className="border-t border-industrial-850/60" />

                  <div className="flex items-start space-x-3">
                    <Gift className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-400" />
                    <div>
                      <strong className="text-white block mb-1 uppercase tracking-wider text-[11px]">Entrega de Items Adicionales</strong>
                      <span className="text-gray-400 leading-relaxed">Los productos adicionales del combo (botellas, vapes, etc.) se <strong className="text-white">entregan el día del evento en la barra oficial</strong>. Debes presentar tu boleta digital y el código de reclamo visible en tu perfil para recoger tu producto.</span>
                    </div>
                  </div>

                  <div className="border-t border-industrial-850/60" />

                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block mb-1 uppercase tracking-wider text-[11px]">Importante</strong>
                      <span className="text-gray-400 leading-relaxed">Una vez realizada la compra, <strong className="text-white">no se aceptan devoluciones ni cancelaciones</strong>, salvo cancelación oficial del evento por parte de Dopamina. Los productos adicionales están sujetos a disponibilidad en el evento.</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkbox + Actions */}
              <div className="flex-shrink-0 border-t border-industrial-800 pt-4 space-y-4">
                <label className="flex items-start space-x-3 cursor-pointer group">
                  <div className="relative flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${termsAccepted ? 'border-emerald-500 bg-emerald-500/20' : 'border-industrial-700 bg-black group-hover:border-industrial-600'}`}>
                      {termsAccepted && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                  </div>
                  <span className="text-xs text-gray-400 leading-relaxed">
                    He leído y acepto los <strong className="text-white">términos y condiciones</strong> de este combo: las entradas son digitales, el combo es redimible solo en el evento, y los productos adicionales se entregan en la barra el día del evento.
                  </span>
                </label>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTermsModal(false)}
                    className="flex-1 py-2.5 bg-industrial-850 hover:bg-industrial-800 text-gray-400 hover:text-white rounded text-xs font-bold uppercase transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleAcceptTerms}
                    disabled={!termsAccepted}
                    className="flex-1 py-2.5 bg-neon-purple hover:bg-neon-purple-dark text-white rounded text-xs font-black uppercase tracking-wider transition-all disabled:opacity-40 disabled:pointer-events-none"
                    style={{ backgroundColor: termsAccepted ? 'var(--color-neon)' : undefined, boxShadow: termsAccepted ? '0 0 10px var(--color-neon-shadow-sm)' : undefined }}
                  >
                    Aceptar y Pagar →
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Birthday Modal */}
      <AnimatePresence>
        {showBirthdayModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowBirthdayModal(false)}
              className="absolute inset-0 bg-black/85 backdrop-blur-sm"
            />

            {/* Modal Body */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-industrial-900 border border-industrial-800 rounded-lg p-6 max-w-md w-full relative z-10 overflow-hidden shadow-neon-sm"
            >
              <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-pink-500 to-neon-purple" />

              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Gift className="w-5 h-5 text-pink-500" />
                  <span>PRE-VALIDAR CUMPLEAÑERO</span>
                </h3>
                <button
                  onClick={() => setShowBirthdayModal(false)}
                  className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-pink-500/5 border border-pink-500/10 rounded p-3 mb-5 text-[11px] text-pink-300 text-left">
                <span className="font-bold uppercase tracking-wider block mb-0.5">🎂 Promoción Mes de {currentMonthName}</span>
                Adquiere 4 entradas por el precio de 3. Recuerda que es **obligatorio presentar tu cédula física** al ingresar al evento para corroborar que tu fecha de cumpleaños es en **{currentMonthName}**.
              </div>

              {birthdayError && (
                <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded text-[11px] text-left flex items-start space-x-1.5 animate-shake">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{birthdayError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyBirthday} className="space-y-4 text-left">
                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Fecha de Nacimiento:
                  </label>
                  <input
                    type="date"
                    required
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    className="w-full bg-black border border-industrial-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                    Número de Cédula (ID):
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1122334455"
                    value={documentNumber}
                    onChange={(e) => setDocumentNumber(e.target.value)}
                    className="w-full bg-black border border-industrial-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500 font-mono"
                  />
                  <span className="text-[9px] text-gray-600 font-mono mt-1 block">Este número se validará contra el documento físico en puerta.</span>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowBirthdayModal(false)}
                    className="flex-1 py-2 bg-industrial-850 hover:bg-industrial-800 text-gray-400 hover:text-white rounded text-xs font-bold uppercase transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={validatingBirthday}
                    className="flex-1 py-2 bg-gradient-to-r from-pink-600 to-pink-500 hover:from-pink-700 hover:to-pink-600 text-white rounded text-xs font-black uppercase tracking-wider transition-all shadow-[0_0_10px_rgba(236,72,153,0.2)] disabled:opacity-50"
                  >
                    {validatingBirthday ? 'Validando...' : 'Confirmar & Pagar'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
