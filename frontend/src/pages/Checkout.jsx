import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import PageTransition from '../components/PageTransition';
import { ShieldCheck, CreditCard, BadgePercent, Lock, ArrowRight, Minus, Plus, AlertCircle } from 'lucide-react';

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

  // Guard: If no event, redirect to catalog/home
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (!selectedEvento) {
      navigate('/');
    }
  }, [currentUser, selectedEvento, navigate]);

  const TICKET_PRICE = selectedEvento ? selectedEvento.precio : 25000;
  const [cantidad, setCantidad] = useState(location.state?.cantidad || 1);
  const [couponCode, setCouponCode] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');

  // Statuses
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!currentUser || !selectedEvento) {
    return null;
  }

  // Auto discount is triggered if quantity >= 4 OR the coupon 'DOPAMINA10' is applied
  const isDiscountEligible = cantidad >= 4 || (couponApplied && couponCode.toUpperCase() === 'DOPAMINA10');
  
  const subtotal = cantidad * TICKET_PRICE;
  const descuento = isDiscountEligible ? subtotal * 0.10 : 0.0;
  const total = subtotal - descuento;

  const handleApplyCoupon = (e) => {
    e.preventDefault();
    setCouponError('');
    if (couponCode.trim().toUpperCase() === 'DOPAMINA10') {
      setCouponApplied(true);
    } else {
      setCouponApplied(false);
      setCouponError('Código de cupón inválido.');
    }
  };

  const handleQuantityChange = (val) => {
    const newQty = cantidad + val;
    if (newQty >= 1 && newQty <= 10) {
      setCantidad(newQty);
    }
  };

  const handlePurchase = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      await api.checkout(
        cantidad, 
        couponApplied ? couponCode.toUpperCase() : (cantidad >= 4 ? 'DOPAMINA10' : null),
        selectedEvento ? selectedEvento.id : null
      );
      // redirect to dashboard
      navigate('/dashboard');
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
                  <span className="text-xs font-mono text-neon-glow">Preventa Inicial</span>
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
                      ${TICKET_PRICE.toLocaleString('es-CO')} COP / Entrada
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

                {/* Promo notice */}
                <div className="mt-4 bg-neon-purple/5 border border-neon-purple/20 rounded p-3 text-xs text-gray-300 flex items-start space-x-2.5">
                  <BadgePercent className="w-4.5 h-4.5 text-neon-glow flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-white">Promo Parche Activada:</span> Compra 4 o más entradas y obtén un <span className="text-neon-glow font-bold">10% de descuento automático</span>. ¡Incentiva a tu parche a unirse!
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
                  
                  {isDiscountEligible && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Descuento (10%):</span>
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
                      ✓ Cupón DOPAMINA10 aplicado con éxito.
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
                      <span>{loading ? 'PROCESANDO PAGO...' : 'SIMULAR PAGO'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </span>
                  </button>
                  
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
