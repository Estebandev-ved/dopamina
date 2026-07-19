import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import PageTransition from '../components/PageTransition';
import { 
  Award, Zap, Gift, Copy, CheckCircle2, ChevronRight, User, 
  Calendar, Mail, Phone, Lock, Sparkles, RefreshCw, FileText, 
  Info, ShieldAlert, BadgeCheck, CheckCircle 
} from 'lucide-react';

/**
 * User Profile & Gamified Loyalty Portal.
 * Designed with neuromarketing triggers (belonging, loss aversion, instant rewards).
 * Connected to actual database endpoints.
 */
export default function Perfil() {
  const navigate = useNavigate();
  const currentUser = api.getUser();
  const [boletas, setBoletas] = useState([]);
  const [points, setPoints] = useState(0);
  const [canjes, setCanjes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [redeemModal, setRedeemModal] = useState(null); // { title, code, cost }
  const [chestUnlocked, setChestUnlocked] = useState(false);
  const [copiedCoupon, setCopiedCoupon] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const loadProfileData = async () => {
    try {
      setErrorMsg('');
      const [boletasData, pointsData, canjesData] = await Promise.all([
        api.getMisBoletas(),
        api.getPoints(),
        api.getMisCanjes()
      ]);
      setBoletas(boletasData);
      setPoints(pointsData.puntos || 0);
      setCanjes(canjesData || []);
    } catch (err) {
      console.error('Error fetching profile data:', err);
      setErrorMsg('No se pudo cargar la información de puntos y premios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!api.isAuthenticated()) {
      navigate('/login', { state: { from: '/perfil' } });
      return;
    }
    loadProfileData();
  }, [navigate]);

  if (!currentUser) return null;

  // Gamification metrics based on all purchases (including redeemed ones)
  const totalTickets = boletas.length;
  // Note: Rank calculation uses lifetime earned points = totalTickets * 50
  const lifetimePoints = totalTickets * 50;

  // Rank Calculation
  let rank = { name: "Recluta de Pista", level: 1, color: "text-gray-500 border-gray-800 bg-gray-950/20", icon: "💀" };
  let nextRankName = "Clubber Habitual";
  let pointsNeeded = 50 - lifetimePoints;
  let progressPercent = (lifetimePoints / 50) * 100;

  if (lifetimePoints >= 50 && lifetimePoints < 200) {
    rank = { name: "Clubber Habitual", level: 2, color: "text-blue-400 border-blue-500/20 bg-blue-950/10", icon: "🎧" };
    nextRankName = "Raver Consagrado";
    pointsNeeded = 200 - lifetimePoints;
    progressPercent = ((lifetimePoints - 50) / 150) * 100;
  } else if (lifetimePoints >= 200 && lifetimePoints < 400) {
    rank = { name: "Raver Consagrado", level: 3, color: "text-neon-glow border-neon-purple/30 bg-neon-purple/5", icon: "🔥" };
    nextRankName = "Leyenda Underground";
    pointsNeeded = 400 - lifetimePoints;
    progressPercent = ((lifetimePoints - 200) / 200) * 100;
  } else if (lifetimePoints >= 400) {
    rank = { name: "Leyenda Underground", level: 4, color: "text-amber-400 border-amber-500/30 bg-amber-950/10", icon: "👑" };
    nextRankName = "Máximo Rango Alcanzado";
    pointsNeeded = 0;
    progressPercent = 100;
  }

  // Redeemable rewards configuration
  const rewards = [
    {
      id: "stickers",
      title: "Pack de Calcomanías Dopamina",
      description: "Pegatinas de estética cyberpunk, logos de la crew e ilustración exclusiva del primer evento.",
      cost: 50,
      icon: "🎨",
      available: points >= 50
    },
    {
      id: "beer",
      title: "Bebida de Cortesía en Barra",
      description: "Canjeable por una cerveza nacional o bebida hidratante durante el evento.",
      cost: 100,
      icon: "🍺",
      available: points >= 100
    },
    {
      id: "cap",
      title: "Gorra Bordada Oficial",
      description: "Gorra negra clásica estructurada con el logo bordado en morado neón.",
      cost: 250,
      icon: "🧢",
      available: points >= 250
    },
    {
      id: "vip_access",
      title: "Acceso Camerinos (Meet & Greet)",
      description: "Ingresa antes de que abran puertas, asiste a la prueba de sonido y conoce a los DJs invitados.",
      cost: 500,
      icon: "⚡",
      available: points >= 500
    }
  ];

  const handleRedeem = async (reward) => {
    try {
      setErrorMsg('');
      const res = await api.reclamarPremio(reward.id, reward.title, reward.cost);
      setRedeemModal({
        title: res.premioTitulo,
        code: res.codigoCanje,
        cost: res.costoPuntos
      });
      // Refresh points and redemption history
      await loadProfileData();
    } catch (err) {
      setErrorMsg(err.message || 'Error al canjear el premio.');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedCoupon(true);
    setTimeout(() => setCopiedCoupon(false), 3000);
  };

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-black py-16 overflow-hidden">
        {/* Ambient background grid */}
        <div className="absolute inset-0 industrial-grid opacity-20 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          
          {/* Header */}
          <div className="border-b border-industrial-800 pb-8 mb-10 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-widest flex items-center justify-center md:justify-start gap-2">
                <Sparkles className="w-8 h-8 text-neon-purple animate-pulse" />
                PORTAL DE CREW MEMBER
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-1">
                BENEFICIOS, FIDELIZACIÓN Y PREMIOS ACUMULADOS
              </p>
            </div>
            <button 
              onClick={loadProfileData}
              className="mt-4 md:mt-0 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-industrial-800 bg-industrial-900/50 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-white hover:border-neon-purple/50 transition-all duration-200"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sincronizar
            </button>
          </div>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg p-4 mb-6 text-xs font-mono">
              ⚠️ {errorMsg}
            </div>
          )}

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 rounded-full border border-neon-purple border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-xs text-gray-400 font-mono uppercase">Cargando tu perfil...</p>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* TOP LAYOUT GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* LEFT COLUMN: USER INFO & RANK */}
                <div className="space-y-6 lg:col-span-1">
                  
                  {/* User Base Card */}
                  <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-20 h-20 bg-neon-purple/5 blur-xl pointer-events-none" />
                    
                    <div className="flex flex-col items-center text-center">
                      {/* Glowing Avatar */}
                      <div className="w-16 h-16 rounded-full bg-black border-2 border-neon-purple flex items-center justify-center text-neon-glow shadow-neon-sm mb-4 font-mono text-2xl font-black">
                        {currentUser.nombre.substring(0, 1).toUpperCase()}
                      </div>
                      
                      <h2 className="text-lg font-black text-white uppercase tracking-wider">{currentUser.nombre}</h2>
                      <span className="text-[10px] font-mono tracking-widest text-neon-violet font-bold uppercase mt-0.5">
                        Rango: {rank.name}
                      </span>
                    </div>

                    <div className="mt-6 pt-6 border-t border-industrial-800 space-y-4 text-xs font-mono text-gray-400">
                      <div className="flex items-center space-x-3">
                        <Mail className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <span className="truncate">{currentUser.email}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Phone className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <span>{currentUser.telefono || "Sin Teléfono"}</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-4 h-4 text-gray-600 flex-shrink-0" />
                        <span>Miembro desde 2026</span>
                      </div>
                    </div>
                  </div>

                  {/* Loyalty Rank Progress */}
                  <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-6">
                    <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center justify-between">
                      <span>Progreso de Nivel</span>
                      <span className="text-neon-glow font-mono text-[10px]">{lifetimePoints} PTS acumulados</span>
                    </h3>

                    <div className={`p-4 border rounded-lg text-center mb-5 ${rank.color}`}>
                      <span className="text-3xl block mb-1">{rank.icon}</span>
                      <h4 className="text-sm font-black text-white uppercase tracking-wider">{rank.name}</h4>
                      <span className="text-[9px] text-gray-400 font-mono block mt-1">NIVEL {rank.level} DE 4</span>
                    </div>

                    {pointsNeeded > 0 ? (
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                          <span>Siguiente: {nextRankName}</span>
                          <span>Faltan {pointsNeeded} PTS</span>
                        </div>
                        <div className="w-full bg-black h-2 rounded-full overflow-hidden border border-industrial-850">
                          <div 
                            className="bg-gradient-to-r from-neon-purple to-neon-violet h-full rounded-full"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <p className="text-[9px] text-gray-500 leading-relaxed font-mono mt-1">
                          * Ganas 50 puntos por cada boleta comprada en la web. ¡Cuanto más asistas, mejores premios desbloqueas!
                        </p>
                      </div>
                    ) : (
                      <div className="text-center p-2 bg-emerald-950/20 border border-emerald-500/30 rounded text-emerald-400 text-[10px] font-bold font-mono">
                        🎉 ¡HAS ALCANZADO EL RANGO MÁXIMO DE LEYENDA!
                      </div>
                    )}
                  </div>

                </div>

                {/* RIGHT COLUMN: LOYALTY REWARDS & MYSTERY CHEST */}
                <div className="space-y-6 lg:col-span-2">
                  
                  {/* Puntos Disponibles Header Card */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 flex flex-col justify-between">
                      <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Puntos Disponibles</span>
                      <span className="text-3xl font-black text-neon-glow font-mono mt-2">{points} PTS</span>
                      <span className="text-[9px] text-gray-500 font-mono mt-1">Para canjear hoy mismo</span>
                    </div>
                    <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-5 flex flex-col justify-between">
                      <span className="text-[10px] text-gray-500 font-mono uppercase tracking-widest">Boletas Compradas</span>
                      <span className="text-3xl font-black text-white font-mono mt-2">{totalTickets}</span>
                      <span className="text-[9px] text-gray-500 font-mono mt-1">Historial total en la cuenta</span>
                    </div>
                  </div>

                  {/* Mystery Chest Section */}
                  <div className="bg-gradient-to-r from-industrial-900 to-industrial-950 border border-neon-purple/20 rounded-lg p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/10 blur-2xl pointer-events-none" />
                    
                    <div className="flex flex-col sm:flex-row items-center sm:items-start sm:space-x-6">
                      <div className="text-4xl mb-4 sm:mb-0 select-none">
                        🎁
                      </div>
                      
                      <div className="space-y-2 text-center sm:text-left flex-grow">
                        <div className="inline-flex items-center space-x-1.5 bg-neon-purple/10 border border-neon-purple/30 text-neon-glow px-2.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest">
                          Beneficio de Bienvenida
                        </div>
                        
                        <h3 className="text-md font-black text-white uppercase tracking-wider">Cofre de Regalo Sorpresa</h3>
                        
                        <p className="text-xs text-gray-400 leading-relaxed max-w-lg">
                          Queremos agradecerte por pertenecer al parche oficial de Dopamina. Desbloquea tu cofre para reclamar un descuento oculto.
                        </p>

                        {!chestUnlocked ? (
                          <button
                            onClick={() => setChestUnlocked(true)}
                            className="mt-3 bg-neon-purple text-white text-[10px] font-black tracking-widest px-5 py-2.5 rounded shadow-neon-sm hover:shadow-neon-md transition-all uppercase"
                          >
                            Abrir Cofre Regalo
                          </button>
                        ) : (
                          <div className="mt-4 p-4 bg-black/50 border border-neon-purple/30 rounded-lg max-w-sm flex items-center justify-between">
                            <div>
                              <span className="text-[9px] font-mono text-gray-500 uppercase block tracking-wider">Código de Descuento (15%)</span>
                              <span className="text-sm font-black text-neon-glow tracking-widest font-mono">BODEGA15</span>
                            </div>
                            <button
                              onClick={() => copyToClipboard('BODEGA15')}
                              className="bg-industrial-800 hover:bg-neon-purple hover:text-white text-gray-300 text-[10px] font-bold px-3 py-2 rounded transition-colors flex items-center space-x-1.5"
                            >
                              {copiedCoupon ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              <span>{copiedCoupon ? 'Copiado' : 'Copiar'}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Redeemable Prizes Grid */}
                  <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-6">
                    <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6 flex items-center space-x-2">
                      <Gift className="w-4 h-4 text-neon-purple" />
                      <span>Catálogo de Premios Canjeables</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {rewards.map((reward) => (
                        <div 
                          key={reward.id} 
                          className={`border rounded-lg p-4 flex flex-col justify-between transition-all duration-300 ${
                            reward.available 
                              ? 'bg-industrial-950/40 border-industrial-800 hover:border-neon-purple/30' 
                              : 'bg-black/20 border-industrial-950 opacity-60'
                          }`}
                        >
                          <div className="space-y-2">
                            <div className="flex justify-between items-start">
                              <span className="text-2xl select-none">{reward.icon}</span>
                              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-industrial-850 text-neon-glow">
                                {reward.cost} PTS
                              </span>
                            </div>
                            <h4 className="text-xs font-black text-white uppercase tracking-wide">{reward.title}</h4>
                            <p className="text-[10px] text-gray-500 leading-relaxed font-mono">{reward.description}</p>
                          </div>

                          <div className="mt-4 pt-4 border-t border-industrial-900/60">
                            {reward.available ? (
                              <button
                                onClick={() => handleRedeem(reward)}
                                className="w-full bg-neon-purple hover:bg-neon-violet text-[10px] font-black tracking-wider py-2 rounded text-white uppercase shadow-neon-sm transition-all animate-pulse-slow"
                              >
                                Canjear Premio
                              </button>
                            ) : (
                              <div className="text-center text-[9px] font-mono text-gray-600 bg-black/40 py-2 rounded border border-industrial-950">
                                🔒 Bloqueado (Faltan {reward.cost - points} PTS)
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

              </div>

              {/* SECTION: MIS ITEMS DE COMBO */}
              {boletas.some(b => b.comboNombre) && (
                <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-6">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                    <Gift className="w-4 h-4 text-amber-400" />
                    <span>Mis Items de Combo — Barra</span>
                  </h3>
                  <p className="text-xs text-gray-400 mb-6 font-mono leading-relaxed">
                    * Los items de tu combo se entregan en la barra del evento. Muestra este estado al personal.
                  </p>
                  <div className="space-y-4">
                    {boletas.filter(b => b.comboNombre).map(b => (
                      <div key={b.id} className="border border-amber-500/20 bg-amber-500/5 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <span className="text-[10px] text-amber-400 font-mono uppercase tracking-wider font-bold">Evento: {b.eventoNombre}</span>
                            <h4 className="text-sm font-black text-white uppercase tracking-wide mt-0.5">{b.comboNombre}</h4>
                          </div>
                          <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-black border border-amber-500/30 text-amber-400">#{b.id}</span>
                        </div>
                        {b.comboItemClaims && b.comboItemClaims.length > 0 ? (
                          <div className="space-y-1.5">
                            {b.comboItemClaims.map((claim) => (
                              <div key={claim.id} className={`flex items-center justify-between text-[11px] font-mono px-3 py-1.5 rounded ${
                                claim.reclamado
                                  ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20'
                                  : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                              }`}>
                                <span className="flex items-center gap-1.5">
                                  <span>{claim.reclamado ? '✅' : '⏳'}</span>
                                  <span className="font-bold">{claim.itemNombre}</span>
                                </span>
                                <span className="text-[9px] opacity-70">{claim.reclamado ? 'Entregado' : 'Pendiente'}</span>
                              </div>
                            ))}
                          </div>
                        ) : b.comboItems ? (
                          <p className="text-[11px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-3 py-1.5 rounded inline-block">
                            Incluye: {b.comboItems}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SECTION: MIS CANJES REALES (Voucher History) */}
              <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-6">
                <h3 className="text-xs font-black text-white uppercase tracking-wider mb-4 flex items-center space-x-2">
                  <Award className="w-4 h-4 text-neon-purple" />
                  <span>Mis Códigos de Regalo y Canjes Activos</span>
                </h3>
                <p className="text-xs text-gray-400 mb-6 font-mono leading-relaxed">
                  * Todos tus canjes están registrados de forma inmutable en el sistema. Presenta el código único al personal de Dopamina en puerta o barra para recibir tu producto.
                </p>

                {canjes.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-industrial-800 rounded-lg">
                    <p className="text-xs text-gray-500 font-mono uppercase">No tienes ningún canje registrado todavía.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs font-mono">
                      <thead>
                        <tr className="border-b border-industrial-850 text-gray-500 text-[10px] uppercase tracking-wider">
                          <th className="py-2.5 px-3">Premio</th>
                          <th className="py-2.5 px-3">Código Único</th>
                          <th className="py-2.5 px-3 text-center">Costo</th>
                          <th className="py-2.5 px-3">Estado</th>
                          <th className="py-2.5 px-3 text-right">Fecha Canje</th>
                        </tr>
                      </thead>
                      <tbody>
                        {canjes.map((c) => (
                          <tr key={c.id} className="border-b border-industrial-850/60 hover:bg-white/[0.01] transition-colors">
                            <td className="py-3 px-3 font-semibold text-white uppercase">{c.premioTitulo}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-1 rounded bg-black border text-[11px] font-bold font-mono tracking-wider ${
                                c.estado === 'PENDIENTE' 
                                  ? 'text-neon-glow border-neon-purple/30' 
                                  : 'text-gray-600 border-industrial-800 line-through'
                              }`}>
                                {c.codigoCanje}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center text-neon-violet font-bold">{c.costoPuntos} PTS</td>
                            <td className="py-3 px-3">
                              <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-bold ${
                                c.estado === 'PENDIENTE' 
                                  ? 'bg-amber-500/10 border border-amber-500/30 text-amber-400' 
                                  : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                              }`}>
                                {c.estado === 'PENDIENTE' ? 'PENDIENTE' : 'ENTREGADO'}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right text-gray-500 text-[10px]">
                              {c.createdAt ? new Date(c.createdAt).toLocaleString('es-CO') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* BOTTOM SECTION: GENERAL INFO & MEMBERSHIP EXPLAINER */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                
                {/* FAQ & Point System */}
                <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-6 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-neon-purple" />
                    ¿CÓMO FUNCIONA EL SISTEMA DE PUNTOS?
                  </h3>
                  
                  <div className="space-y-3 text-xs text-gray-400 leading-relaxed font-mono">
                    <div>
                      <h4 className="font-black text-white uppercase mb-1">1. Compra de Boletas</h4>
                      <p>Cada entrada que compres directamente en nuestro portal te otorga **50 puntos**. El cálculo es inmediato al confirmarse tu orden.</p>
                    </div>
                    <div>
                      <h4 className="font-black text-white uppercase mb-1">2. Canje y Códigos</h4>
                      <p>Al presionar "Canjear", el backend deduce los puntos correspondientes de tu saldo y te genera un cupón digital único. Este cupón queda grabado bajo tu cuenta.</p>
                    </div>
                    <div>
                      <h4 className="font-black text-white uppercase mb-1">3. Reclamo Físico en Barra/Puerta</h4>
                      <p>Muestra el código al staff durante el evento. Ellos lo marcarán como **ENTREGADO** desde su panel de control para evitar duplicados.</p>
                    </div>
                  </div>
                </div>

                {/* Clubber Rules / Manual de Convivencia */}
                <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-6 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-500" />
                    REGLAMENTO GENERAL DEL CLUBBER
                  </h3>
                  
                  <div className="space-y-3 text-xs text-gray-400 leading-relaxed font-mono">
                    <p className="border-l-2 border-neon-purple pl-3">
                      En **Dopamina** promovemos un espacio libre de discriminación, acoso y violencia. Nos reservamos el derecho de admisión y permanencia para garantizar la seguridad de todos.
                    </p>
                    <ul className="list-disc pl-5 space-y-1.5 text-gray-500">
                      <li>**Solo Mayores de Edad:** Evento exclusivo para mayores de 18 años (+18). Obligatorio presentar documento de identidad físico original.</li>
                      <li>**Respeto Colectivo:** No toleramos comportamientos ofensivos de ningún tipo. El consentimiento es absoluto y obligatorio en el dancefloor.</li>
                      <li>**Sustancias y Elementos:** Prohibido el ingreso de armas, botellas de vidrio, líquidos externos u objetos cortopunzantes.</li>
                      <li>**Cuidado Mutuo:** Si te sientes mal o ves a alguien en problemas, acude inmediatamente a los puntos de soporte marcados o al staff de logística.</li>
                    </ul>
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>
      </div>

      {/* REDEEM CODE SUCCESS MODAL */}
      {redeemModal && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
          <div className="bg-industrial-950 border-2 border-neon-purple rounded-lg p-6 max-w-sm w-full text-center space-y-6 shadow-neon-lg">
            <div className="w-16 h-16 rounded-full bg-neon-purple/10 border border-neon-purple flex items-center justify-center mx-auto text-neon-purple">
              <CheckCircle className="w-8 h-8 animate-bounce" />
            </div>
            
            <div className="space-y-2">
              <h3 className="text-md font-black text-white uppercase tracking-wider">¡Canje Registrado Exitosamente!</h3>
              <p className="text-xs text-gray-400 leading-relaxed font-mono">
                Presenta este código al personal en puerta o barra para recibir tu premio:
              </p>
              <h4 className="text-sm font-bold text-white uppercase tracking-wide bg-neon-purple/10 border border-neon-purple/20 px-3 py-1.5 rounded inline-block font-mono">
                {redeemModal.title}
              </h4>
            </div>

            <div className="bg-black border border-industrial-800 p-4 rounded-lg flex flex-col items-center">
              <span className="text-sm font-black text-neon-glow font-mono tracking-widest uppercase mb-1">
                {redeemModal.code}
              </span>
              <span className="text-[8px] font-mono text-gray-600 uppercase">CÓDIGO ÚNICO EN BASE DE DATOS • VÁLIDO EN BARRA</span>
            </div>

            <button
              onClick={() => setRedeemModal(null)}
              className="w-full bg-neon-purple hover:bg-neon-violet text-[10px] font-black tracking-widest py-3 rounded uppercase text-white shadow-neon-sm transition-all"
            >
              Entendido / Cerrar
            </button>
          </div>
        </div>
      )}

    </PageTransition>
  );
}
