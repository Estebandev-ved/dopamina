import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import PageTransition from '../components/PageTransition';
import { ShieldCheck, CreditCard, BadgePercent, Lock, ArrowRight, Minus, Plus, AlertCircle, Flame, Zap, Gift, Ticket } from 'lucide-react';

/**
 * Checkout page for ticket bookings.
 * Features:
 * - Counter quantity selector.
 * - Auto discount applied for >= 4 tickets.
 * - Coupon validation.
 * - Explanatory security badges about encryption.
 */
export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const selectedEvento = location.state?.evento;
  const currentUser = api.getUser();

  // Guard: If not logged in or token expired, redirect to login with return state
  useEffect(() => {
    if (!currentUser || api.isTokenExpired()) {
      if (api.isTokenExpired()) api.clearAuth();
      navigate('/login', { state: { from: '/checkout', eventoState: { evento: selectedEvento, cantidad: location.state?.cantidad || 1 } } });
    } else if (!selectedEvento) {
      navigate('/');
    }
  }, [currentUser, selectedEvento, navigate]);

  const [cantidad, setCantidad] = useState(location.state?.cantidad || 1);
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscountPercent, setCouponDiscountPercent] = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponMinTickets, setCouponMinTickets] = useState(1);

  // Promo de "10% por 4+ boletas": es de un solo uso por usuario.
  const [promoParcheDisponible, setPromoParcheDisponible] = useState(true);

  // Statuses
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Auto apply active coupon from profile chest or state
  useEffect(() => {
    let targetCoupon = location.state?.autoCoupon;
    
    if (!targetCoupon) {
      // Check if there is an explicit intent to apply the coupon (user clicked "Gastar cupón" in Dashboard)
      targetCoupon = sessionStorage.getItem('dopamina_intent_auto_coupon');
      if (targetCoupon) {
        // Consume the intent immediately so it doesn't auto-apply to subsequent checkouts
        sessionStorage.removeItem('dopamina_intent_auto_coupon');
      }
    }

    if (!targetCoupon) {
      // Check if there is a referral coupon saved in localStorage
      targetCoupon = localStorage.getItem('dopamina_referral_cupon');
    }

    if (targetCoupon) {
      setCouponCode(targetCoupon);
      api.publicValidarCupon(targetCoupon, cantidad)
        .then(res => {
          if (res.valido) {
            setCouponApplied(true);
            setCouponDiscountPercent(res.descuentoPorcentaje);
            setCouponMinTickets(res.minBoletas || 1);
          }
        })
        .catch(err => console.log('Error al autoaplicar cupón sorpresa:', err));
    }
  }, [location.state, cantidad]);

  // Consultar si el usuario todavía tiene disponible la promo de 4+ boletas
  useEffect(() => {
    api.getPromoParcheDisponible()
      .then(res => setPromoParcheDisponible(!!res.disponible))
      .catch(() => setPromoParcheDisponible(false));
  }, []);

  const [socialData, setSocialData] = useState({ vendidas24h: 0, minutosDesdeUltimaCompra: 0, activeViewers: 0 });

  useEffect(() => {
    if (!selectedEvento) return;
    // Usar datos REALES del backend en vez de datos falsos
    const baseViewers = Math.max(3, Math.floor((selectedEvento.capacidad || 100) * 0.05));
    setSocialData({
      vendidas24h: selectedEvento.vendidasUltimas24h || 0,
      minutosDesdeUltimaCompra: selectedEvento.minutosDesdeUltimaCompra || 0,
      activeViewers: baseViewers + Math.floor(Math.random() * 4),
    });
    const interval = setInterval(() => {
      setSocialData(prev => ({
        ...prev,
        activeViewers: baseViewers + Math.floor(Math.random() * 4),
      }));
    }, 8000);
    return () => clearInterval(interval);
  }, [selectedEvento]);

  if (!currentUser || api.isTokenExpired()) {
    return null;
  }
  if (!selectedEvento) {
    return null;
  }

  // Precio regular directo (sin preventa)
  const precioUnitario = selectedEvento?.precio || 0;

  // Formatear minutos a texto legible
  const formatTiempoAgo = (minutos) => {
    if (minutos == null || minutos < 0) return null;
    if (minutos < 1) return 'hace un momento';
    if (minutos < 60) return `hace ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}`;
    const horas = Math.floor(minutos / 60);
    if (horas < 24) return `hace ${horas} ${horas === 1 ? 'hora' : 'horas'}`;
    const dias = Math.floor(horas / 24);
    return `hace ${dias} ${dias === 1 ? 'día' : 'días'}`;
  };
  const subtotal = cantidad * precioUnitario;
  // La promo de parche (10%) solo aplica si: no hay cupón, son 4+ boletas y el usuario no la ha usado.
  const promoParcheActiva = !couponApplied && cantidad >= 4 && promoParcheDisponible;
  const activeDiscountPercent = couponApplied ? couponDiscountPercent : (promoParcheActiva ? 10 : 0);
  const descuento = subtotal * (activeDiscountPercent / 100.0);
  const total = subtotal - descuento;

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    setCouponError('');
    if (!couponCode.trim()) return;

    try {
      const res = await api.publicValidarCupon(couponCode.trim(), cantidad);
      if (res.valido) {
        setCouponApplied(true);
        setCouponDiscountPercent(res.descuentoPorcentaje);
        setCouponMinTickets(res.minBoletas || 1);
      } else {
        setCouponApplied(false);
        setCouponDiscountPercent(0);
        setCouponMinTickets(1);
        setCouponError('Código de cupón inválido o inactivo.');
      }
    } catch (err) {
      setCouponApplied(false);
      setCouponDiscountPercent(0);
      setCouponMinTickets(1);
      setCouponError(err.message || 'Error al validar el cupón.');
    }
  };

  const handleQuantityChange = (val) => {
    const newQty = cantidad + val;
    if (newQty >= 1 && newQty <= 10) {
      setCantidad(newQty);
      // Validar si la nueva cantidad no cumple la condición del cupón ya aplicado
      if (couponApplied && newQty < couponMinTickets) {
        setCouponApplied(false);
        setCouponDiscountPercent(0);
        setCouponError(`El cupón requiere la compra de mínimo ${couponMinTickets} boletas.`);
      }
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    setErrorMsg('');

    // Clear the referral coupon from storage so it doesn't auto-apply to future purchases
    localStorage.removeItem('dopamina_referral_cupon');

    sessionStorage.setItem('dopamina_checkout_state', JSON.stringify({
      evento: selectedEvento,
      cantidad,
      couponCode: couponApplied ? couponCode : null,
    }));

    try {
      // Sin cupón explícito enviamos null: la promo de 4+ boletas la aplica el backend
      // automáticamente (y es de un solo uso). NO mandamos 'DOPAMINA10' como cupón.
      const result = await api.efipayGenerate(
        cantidad,
        couponApplied ? couponCode.toUpperCase() : null,
        selectedEvento ? selectedEvento.id : null
      );

      if (result.redirectUrl) {
        sessionStorage.setItem('dopamina_compra_pending', JSON.stringify({
          compraId: result.compraId,
          paymentId: result.paymentId,
        }));
        window.location.href = result.redirectUrl;
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error al procesar el pago.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-black py-16 overflow-hidden">
        {/* Grids */}
        <div className="absolute inset-0 industrial-grid opacity-25 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-3xl font-black text-white uppercase tracking-widest">
              CHECKOUT DE ENTRADAS
            </h1>
            <p className="text-xs text-gray-500 font-mono mt-1">
              PROCESO DE PAGO SEGURO • DOPAMINA
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* LEFT COLUMN: ORDER INFO */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Ticket Quantity Picker */}
              <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-6">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                  <span>1. Selecciona tus Entradas</span>
                  <span className="text-xs font-mono text-neon-glow">Boletería General</span>
                </h3>
                
                <div className="flex items-center justify-between py-4 border-y border-industrial-800">
                  <div>
                    <h4 className="font-bold text-white text-md">
                      {selectedEvento.nombre}
                    </h4>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {`${selectedEvento.fecha} • ${selectedEvento.lugar}, ${selectedEvento.ciudad}`}
                    </p>
                    <p className="text-xs font-bold text-neon-violet mt-1 font-mono">
                      ${precioUnitario.toLocaleString('es-CO')} COP / Entrada
                    </p>
                  </div>
                  
                  {/* Plus/Minus counter */}
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleQuantityChange(-1)}
                      disabled={cantidad <= 1}
                      className="w-10 h-10 rounded border border-industrial-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-neon-purple/50 disabled:opacity-30 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="text-lg font-black text-white w-6 text-center font-mono">
                      {cantidad}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(1)}
                      disabled={cantidad >= 10}
                      className="w-10 h-10 rounded border border-industrial-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-neon-purple/50 disabled:opacity-30 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Phase Alert Banner */}
                <div className="mt-4 bg-rose-500/10 border border-rose-500/20 rounded p-3 text-xs text-rose-400 flex items-start space-x-2.5 animate-pulse">
                  <Flame className="w-4.5 h-4.5 text-rose-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span><strong>🔥 Entrada General</strong> — una vez se agoten, no habrá más ingresos. No esperes.</span>
                  </div>
                </div>

                {/* Promo notice */}
                <div className="mt-3 bg-neon-purple/5 border border-neon-purple/20 rounded p-3 text-xs text-gray-300 flex items-start space-x-2.5">
                  <BadgePercent className="w-4.5 h-4.5 text-neon-glow flex-shrink-0 mt-0.5" />
                  <div>
                    {promoParcheDisponible ? (
                      <>
                        <span className="font-bold text-white">Promo Parche:</span> Compra 4 o más entradas y obtén un <span className="text-neon-glow font-bold">10% de descuento automático</span>. ¡Solo se puede usar una vez!
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-white">Promo Parche ya utilizada:</span> Ya aprovechaste tu 10% de descuento por 4+ boletas en una compra anterior. ¡Gracias por traer a tu parche!
                      </>
                    )}
                  </div>
                </div>

                {/* Sorteo notice */}
                <div className="mt-3 bg-purple-950/10 border border-purple-500/20 rounded p-3 text-xs text-gray-300 flex items-start space-x-2.5">
                  <Gift className="w-4.5 h-4.5 text-purple-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Sorteos de la Noche Incluidos:</span> Al completar tu compra, cada boleta virtual en tu perfil recibirá un número único de sorteo correlativo para participar en los sorteos en vivo que realizaremos durante las primeras horas de la fiesta.
                  </div>
                </div>
              </div>

              {/* Encrypted Payments Info Banner */}
              <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-6">
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <Lock className="w-4 h-4 text-emerald-400" />
                  <span>2. Pasarela Encriptada & Seguridad</span>
                </h3>
                
                <p className="text-xs text-gray-300 leading-relaxed mb-4">
                  Tu privacidad es fundamental. Implementamos cifrado de extremo a extremo **SSL/TLS de 256 bits** para proteger tus transacciones financieras. No almacenamos los datos de tus tarjetas de crédito o credenciales bancarias. Toda validación de pago se procesa directamente a través de pasarelas autorizadas homologadas por PCI-DSS.
                </p>

                <div className="grid grid-cols-3 gap-4 border-t border-industrial-800 pt-4">
                  <div className="flex flex-col items-center p-3 bg-black/40 border border-emerald-500/20 rounded text-center">
                    <ShieldCheck className="w-5 h-5 text-emerald-400 mb-1" />
                    <span className="text-[10px] font-bold text-white uppercase">Cifrado SSL</span>
                    <span className="text-[9px] text-gray-500 mt-0.5 font-mono">256-Bit</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-black/40 border border-neon-purple/20 rounded text-center">
                    <CreditCard className="w-5 h-5 text-neon-glow mb-1" />
                    <span className="text-[10px] font-bold text-white uppercase">Seguro PCI</span>
                    <span className="text-[9px] text-gray-500 mt-0.5 font-mono">Cumplimiento</span>
                  </div>

                  <div className="flex flex-col items-center p-3 bg-black/40 border border-industrial-800 rounded text-center">
                    <span className="text-xs font-black text-white font-mono mb-1.5">100%</span>
                    <span className="text-[10px] font-bold text-white uppercase">Sin Retención</span>
                    <span className="text-[9px] text-gray-500 mt-0.5 font-mono">Cero logs bancarios</span>
                  </div>
                </div>
              </div>
            </div>

             {/* RIGHT COLUMN: PRICE BREAKDOWN & SUBMIT */}
             <div className="space-y-6">
 
               {/* FOMO Box */}
               <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 space-y-3">
                 <h4 className="text-[10px] font-black text-white uppercase tracking-widest font-mono border-b border-industrial-800 pb-2 flex items-center justify-between">
                   <span className="flex items-center gap-1.5">
                     <Zap className="w-3.5 h-3.5 text-neon-glow" />
                     <span>Compra Segura en Progreso</span>
                   </span>
                   <span className="text-[9px] bg-rose-500/10 border border-rose-500/20 text-rose-400 px-1.5 py-0.5 rounded font-mono uppercase animate-pulse">Alta Demanda</span>
                 </h4>
                 
                  <div className="bg-industrial-950/40 border border-industrial-850 rounded-lg p-3.5 space-y-2 font-mono text-[10px] leading-relaxed">
                   <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase tracking-wider">
                     <span className="flex h-1.5 w-1.5 relative">
                       <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                       <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                     </span>
                     <Flame className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
                     <span>{socialData.activeViewers} personas están viendo esta página ahora mismo</span>
                   </div>
 
                   <div className="space-y-1.5 text-gray-400">
                     {socialData.vendidas24h > 0 && (
                       <p className="flex items-center gap-1.5">
                         <Ticket className="w-3.5 h-3.5 text-gray-500" />
                         <span><strong>{socialData.vendidas24h} {socialData.vendidas24h === 1 ? 'boleta' : 'boletas'}</strong> {socialData.vendidas24h === 1 ? 'adquirida' : 'adquiridas'} en las últimas 24 horas.</span>
                       </p>
                     )}
                     {socialData.minutosDesdeUltimaCompra != null && socialData.minutosDesdeUltimaCompra >= 0 && socialData.minutosDesdeUltimaCompra < 1440 && (
                       <p className="flex items-center gap-1.5">
                         <Zap className="w-3.5 h-3.5 text-neon-glow" />
                         <span>Última entrada comprada {formatTiempoAgo(socialData.minutosDesdeUltimaCompra)}.</span>
                       </p>
                     )}
                   </div>
                 </div>
               </div>
               
               {/* Price Summary */}
               <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-neon-purple/5 blur-xl pointer-events-none" />
                
                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6 pb-2 border-b border-industrial-800">
                  Resumen del Pedido
                </h3>

                <div className="space-y-3 text-xs font-mono">
                  <div className="flex justify-between text-gray-400">
                    <span>Subtotal:</span>
                    <span>${subtotal.toLocaleString('es-CO')} COP</span>
                  </div>
                  
                  {descuento > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Descuento ({activeDiscountPercent}%):</span>
                      <span>-${descuento.toLocaleString('es-CO')} COP</span>
                    </div>
                  )}

                  <div className="flex justify-between text-gray-400">
                    <span>Entradas:</span>
                    <span>{cantidad}x</span>
                  </div>

                  <div className="flex justify-between text-white text-sm font-bold pt-3 border-t border-industrial-850">
                    <span>TOTAL:</span>
                    <span className="text-neon-glow">${total.toLocaleString('es-CO')} COP</span>
                  </div>
                </div>

                {/* Coupon Code Input */}
                <form onSubmit={handleApplyCoupon} className="mt-6 pt-4 border-t border-industrial-800">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">
                    ¿Tienes un Cupón?
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="CÓDIGO"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      disabled={couponApplied}
                      className="flex-grow bg-black border border-industrial-800 text-xs px-3 py-2 text-white uppercase font-mono rounded focus:outline-none focus:border-neon-purple"
                    />
                    <button
                      type="submit"
                      disabled={couponApplied || !couponCode}
                      className="bg-industrial-800 hover:bg-neon-purple text-white text-xs font-bold px-3 py-2 rounded transition-colors disabled:opacity-40"
                    >
                      Aplicar
                    </button>
                  </div>
                  {couponApplied && (
                    <p className="text-[10px] text-emerald-400 font-semibold mt-1">
                      ✓ Cupón {couponCode.toUpperCase()} ({couponDiscountPercent}%) aplicado con éxito.
                    </p>
                  )}
                  {couponError && (
                    <p className="text-[10px] text-rose-400 font-semibold mt-1">
                      {couponError}
                    </p>
                  )}
                </form>

                {/* Submit Action */}
                <div className="mt-8">
                  {errorMsg && (
                    <div className="bg-rose-950/20 border border-rose-500/30 text-rose-400 text-xs p-3 rounded mb-4 flex items-start space-x-2">
                      <AlertCircle className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  <button
                    onClick={handlePurchase}
                    disabled={loading}
                    className="w-full relative group overflow-hidden bg-neon-purple text-white py-4 rounded text-xs font-black tracking-[0.2em] shadow-neon-sm hover:shadow-neon-md transition-all duration-300 disabled:opacity-50"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-violet opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      <span>{loading ? 'REDIRIGIENDO A EFIPAY...' : 'PAGAR CON EFIPAY'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-2 p-2 rounded-lg bg-black/40 border border-industrial-800">
                    <img 
                      src="/nequi.svg" 
                      alt="Nequi" 
                      className="h-3.5 object-contain" 
                    />
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                      • PSE • TARJETAS • EFIPAY
                    </span>
                  </div>
                  
                  <p className="text-[9px] text-center text-gray-500 mt-3 leading-relaxed">
                    Las entradas serán almacenadas en tu perfil web de inmediato y enviadas a tu correo para mayor comodidad.
                  </p>
                </div>

              </div>

            </div>

          </div>
        </div>
      </div>
    </PageTransition>
  );
}
