import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../services/api';
import PageTransition from '../components/PageTransition';
import { 
  Ticket, DollarSign, Percent, TrendingUp, Award, Copy, Check, Calendar, 
  ArrowRight, Users, Loader2, ArrowUpRight, BarChart3, AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';

export default function PromoterDashboard() {
  const [stats, setStats] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const currentUser = api.getUser();

  // Estado para el modal de cuenta bancaria
  const [showBankModal, setShowBankModal] = useState(false);
  const [bankForm, setBankForm] = useState({ cuentaBancaria: '', banco: '', titularCuenta: '', tipoCuenta: 'AHORROS' });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankError, setBankError] = useState('');
  const [bankSuccess, setBankSuccess] = useState(false);
  const [retoActivo, setRetoActivo] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, ventasData, cuentaData, retoData] = await Promise.all([
          api.promotorGetStats(),
          api.promotorGetVentas(),
          api.promotorGetCuenta().catch(() => ({ registrada: false })),
          api.promotorGetRetoActivo().catch(() => ({ message: '' }))
        ]);
        setStats(statsData);
        setVentas(ventasData);
        setRetoActivo(retoData?.message || '');
        // Si no tiene cuenta registrada, mostrar el modal
        if (!cuentaData.registrada) {
          setShowBankModal(true);
        } else {
          setBankForm({
            cuentaBancaria: cuentaData.cuentaBancaria || '',
            banco: cuentaData.banco || '',
            titularCuenta: cuentaData.titularCuenta || '',
            tipoCuenta: cuentaData.tipoCuenta || 'AHORROS'
          });
        }
        setError(null);
      } catch (err) {
        console.error('Error fetching promoter data:', err);
        setError('Ocurrió un error al cargar las estadísticas de promotor.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSaveBankAccount = async (e) => {
    e.preventDefault();
    setBankError('');
    if (!bankForm.cuentaBancaria.trim() || !bankForm.banco.trim() || !bankForm.titularCuenta.trim()) {
      setBankError('Todos los campos son obligatorios.');
      return;
    }
    try {
      setBankSaving(true);
      await api.promotorSaveCuenta(bankForm);
      setBankSuccess(true);
      setTimeout(() => {
        setShowBankModal(false);
        setBankSuccess(false);
      }, 1500);
    } catch (err) {
      setBankError(err.message || 'Error al guardar los datos. Inténtalo de nuevo.');
    } finally {
      setBankSaving(false);
    }
  };

  const referralLink = useMemo(() => {
    if (!stats || stats.codigoCupon === 'SIN_CUPON') return '';
    // Si tiene múltiples cupones, usamos el primero para el enlace rápido
    const firstCode = stats.codigoCupon.split(',')[0].trim();
    // Apunta a la home/eventos, no directamente a /checkout (que requiere estado de evento)
    return `${window.location.origin}/?cupon=${firstCode}`;
  }, [stats]);

  const copyToClipboard = (text, setFlag) => {
    navigator.clipboard.writeText(text);
    setFlag(true);
    setTimeout(() => setFlag(false), 2000);
  };

  // Agrupar ventas por día para el gráfico lineal
  const chartData = useMemo(() => {
    if (!ventas.length) return [];
    
    const groups = {};
    // Solo tomamos compras PAGADAS o REGALADAS para las métricas del gráfico
    const validSales = ventas.filter(v => v.estado === 'PAGADO' || v.estado === 'REGALADA');
    
    validSales.forEach(v => {
      if (!v.fecha) return;
      const day = v.fecha.split(' ')[0]; // yyyy-MM-dd
      const qty = v.cantidadPreventa + v.cantidadRegular;
      const com = v.comision;
      
      if (!groups[day]) {
        groups[day] = { count: 0, commission: 0 };
      }
      groups[day].count += qty;
      groups[day].commission += com;
    });

    return Object.entries(groups)
      .map(([date, data]) => ({
        fecha: date,
        boletas: data.count,
        comision: data.commission
      }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha))
      .slice(-10); // Mostrar los últimos 10 días activos
  }, [ventas]);

  // Datos para el gráfico de torta de preventa vs regular
  const pieData = useMemo(() => {
    if (!stats) return [];
    return [
      { name: 'Preventa ($25k)', value: stats.totalPreventa, color: 'var(--color-neon)' },
      { name: 'Regular ($35k)', value: stats.totalRegular, color: '#60a5fa' }
    ].filter(item => item.value > 0);
  }, [stats]);

  if (loading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center flex flex-col items-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-[var(--color-neon)]" />
            <span className="text-sm font-semibold tracking-widest text-gray-400">CARGANDO RITUAL...</span>
          </div>
        </div>
      </PageTransition>
    );
  }

  if (error || !stats) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
          <div className="bg-industrial-950 border border-red-500/20 rounded-xl p-8 max-w-md text-center shadow-2xl">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Error de Acceso</h2>
            <p className="text-sm text-gray-400 mb-6">{error || 'No tienes permisos de promotor configurados.'}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 rounded bg-red-500 hover:bg-red-600 text-white text-xs font-bold transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-black text-white relative pb-16 industrial-grid">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/90 to-black pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 relative z-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-industrial-800 pb-8 mb-10 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="w-5 h-5 text-[var(--color-neon)]" />
                <span className="text-[10px] sm:text-xs font-mono font-bold tracking-widest text-[var(--color-neon)] uppercase">
                  PROGRAMA DE PROMOTORES
                </span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black tracking-tighter">
                PANEL DE <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-neon)] to-[var(--color-neon-light)]">PROMOTOR</span>
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm mt-1">
                Bienvenido, <strong className="text-white">{currentUser?.nombre}</strong>. Aquí tienes el control de tus ventas y comisiones.
              </p>
            </div>
            
            {/* Quick Referral Actions */}
            {stats.codigoCupon !== 'SIN_CUPON' && (
              <div className="bg-[#10101A]/60 backdrop-blur-md border border-industrial-800 rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shadow-neon-sm">
                <div className="flex-1 min-w-[200px]">
                  <span className="text-[10px] text-gray-500 font-mono block uppercase mb-1">Tu Link de Referido</span>
                  <input 
                    type="text" 
                    readOnly 
                    value={referralLink} 
                    className="w-full text-xs font-mono bg-black/60 border border-industrial-800 rounded px-2.5 py-1.5 outline-none text-gray-300"
                  />
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => copyToClipboard(referralLink, setCopiedLink)}
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded bg-[var(--color-neon)] hover:bg-[var(--color-neon-light)] text-white text-xs font-black transition-all cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'COPIADO' : 'COPIAR LINK'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Active Challenge / Incentive Banner */}
          {retoActivo && (
            <div className="bg-gradient-to-r from-[var(--color-neon)]/20 via-[var(--color-neon)]/5 to-transparent border border-[var(--color-neon)]/30 rounded-xl p-5 mb-8 flex items-start gap-4 shadow-neon-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-neon)]/5 blur-2xl pointer-events-none" />
              <div className="flex-shrink-0 bg-[var(--color-neon)]/20 border border-[var(--color-neon)]/40 p-2.5 rounded-lg text-[var(--color-neon)] animate-pulse">
                <Award className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-[var(--color-neon)] tracking-widest uppercase block">
                  🔥 RETO / BONO ACTIVO HOY
                </span>
                <p className="text-sm font-semibold text-white leading-relaxed">
                  {retoActivo}
                </p>
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {/* Coupon Code Card */}
            <div className="bg-[#10101A]/40 backdrop-blur-md border border-industrial-800 rounded-xl p-6 hover:border-neon-purple/30 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold text-gray-400 tracking-wider uppercase">CÓDIGO DE CUPÓN</span>
                  <div className="w-8 h-8 rounded-lg bg-neon-purple/10 flex items-center justify-center text-[var(--color-neon)]">
                    <Percent className="w-4 h-4" />
                  </div>
                </div>
                <h2 className="text-2xl font-black font-mono tracking-wider break-all text-white">
                  {stats.codigoCupon}
                </h2>
              </div>
              <button 
                onClick={() => copyToClipboard(stats.codigoCupon, setCopied)}
                className="mt-6 flex items-center justify-center gap-1.5 w-full py-2 rounded border border-industrial-800 hover:border-neon-purple/40 text-gray-400 hover:text-white transition-all text-xs font-bold cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡CÓDIGO COPIADO!' : 'COPIAR CÓDIGO'}</span>
              </button>
            </div>

            {/* Total Tickets Card */}
            <div className="bg-[#10101A]/40 backdrop-blur-md border border-industrial-800 rounded-xl p-6 hover:border-neon-purple/30 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold text-gray-400 tracking-wider uppercase">BOLETAS VENDIDAS</span>
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                    <Ticket className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black font-mono">{stats.totalBoletas}</span>
                  <span className="text-xs text-gray-400">boletas</span>
                </div>
              </div>
              <div className="border-t border-industrial-800/80 pt-4 mt-6 flex justify-between text-[11px] font-mono">
                <span className="text-gray-500">PREVENTA: <strong className="text-white">{stats.totalPreventa}</strong></span>
                <span className="text-gray-500">REGULAR: <strong className="text-white">{stats.totalRegular}</strong></span>
              </div>
            </div>

            {/* Total Revenue Card */}
            <div className="bg-[#10101A]/40 backdrop-blur-md border border-industrial-800 rounded-xl p-6 hover:border-neon-purple/30 transition-all group flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold text-gray-400 tracking-wider uppercase">VENTAS GENERADAS</span>
                  <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-black text-gray-500">$</span>
                  <span className="text-3xl font-black font-mono">
                    {stats.totalVentasFacturado.toLocaleString('es-CO')}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono uppercase ml-1">COP</span>
                </div>
              </div>
              <div className="border-t border-industrial-800/80 pt-4 mt-6 text-[10px] text-gray-500 font-mono flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span>De {stats.usosActivos} compras completadas.</span>
              </div>
            </div>

            {/* Commissions Card */}
            <div className="bg-[#10101A]/40 backdrop-blur-md border border-industrial-800 rounded-xl p-6 hover:border-[var(--color-neon)]/30 transition-all group flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--color-neon)]/5 rounded-full blur-2xl pointer-events-none" />
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-mono font-bold text-gray-400 tracking-wider uppercase">MIS GANANCIAS (10%)</span>
                  <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center text-green-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xs font-black text-[var(--color-neon)]">$</span>
                  <span className="text-3xl font-black font-mono text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-300">
                    {stats.totalComision.toLocaleString('es-CO')}
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono uppercase ml-1">COP</span>
                </div>
              </div>
              <div className="border-t border-industrial-800/80 pt-4 mt-6 text-[10px] text-green-400 font-mono flex items-center justify-between">
                <span>COMISIÓN ACTIVA</span>
                <span className="flex items-center gap-0.5">
                  10% <ArrowUpRight className="w-3 h-3 animate-pulse" />
                </span>
              </div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Sales performance chart */}
            <div className="bg-[#10101A]/40 backdrop-blur-md border border-industrial-800 rounded-xl p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-base font-bold text-white">Rendimiento de Ventas</h3>
                  <p className="text-xs text-gray-500">Boletas vendidas y comisiones en los últimos 10 días activos</p>
                </div>
                <BarChart3 className="w-4.5 h-4.5 text-gray-500" />
              </div>
              
              <div className="h-72 w-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorBoletas" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-neon)" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="var(--color-neon)" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1F1F2E" />
                      <XAxis dataKey="fecha" stroke="#6B6B80" fontSize={10} fontMono />
                      <YAxis stroke="#6B6B80" fontSize={10} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0F0F15', 
                          borderColor: '#2D2D3F',
                          color: '#fff',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }} 
                      />
                      <Area type="monotone" dataKey="boletas" name="Boletas Vendidas" stroke="var(--color-neon)" fillOpacity={1} fill="url(#colorBoletas)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-gray-500 font-mono">
                    AÚN NO HAY COMPRAS COMPLETADAS ASOCIADAS
                  </div>
                )}
              </div>
            </div>

            {/* Ticket type distribution */}
            <div className="bg-[#10101A]/40 backdrop-blur-md border border-industrial-800 rounded-xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-bold text-white mb-2">Distribución por Tipo</h3>
                <p className="text-xs text-gray-500 mb-6">Comparativa de boletas preventa y regular vendidas</p>
              </div>

              <div className="h-56 w-full flex items-center justify-center">
                {pieData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0F0F15', 
                          borderColor: '#2D2D3F',
                          color: '#fff',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-xs text-gray-500 font-mono">SIN BOLETAS REGISTRADAS</div>
                )}
              </div>

              <div className="space-y-2 mt-4">
                {pieData.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-gray-400">{entry.name}</span>
                    </div>
                    <span className="font-bold text-white">{entry.value} ud</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sales History Table */}
          <div className="bg-[#10101A]/40 backdrop-blur-md border border-industrial-800 rounded-xl overflow-hidden">
            <div className="px-6 py-5 border-b border-industrial-800/80 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Historial de Transacciones</h3>
                <p className="text-xs text-gray-500">Registro detallado de todos los usos de tu código</p>
              </div>
              <span className="text-xs bg-industrial-900 border border-industrial-800 text-gray-400 px-3 py-1 rounded-full font-mono">
                {ventas.length} Transacciones
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-industrial-800/60 bg-black/30 text-[10px] font-mono tracking-wider text-gray-500 uppercase">
                    <th className="px-6 py-4">ID COMPRA</th>
                    <th className="px-6 py-4">FECHA Y HORA</th>
                    <th className="px-6 py-4">EVENTO</th>
                    <th className="px-6 py-4 text-center">TICKETS (PREV / REG)</th>
                    <th className="px-6 py-4 text-right">TOTAL PAGADO</th>
                    <th className="px-6 py-4 text-right">TU COMISIÓN (10%)</th>
                    <th className="px-6 py-4 text-center">ESTADO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-industrial-800/40 text-xs">
                  {ventas.length > 0 ? (
                    ventas.map((venta) => (
                      <tr key={venta.id} className="hover:bg-white/[0.01] transition-all">
                        <td className="px-6 py-4 font-mono font-bold text-gray-400">
                          #{venta.id}
                        </td>
                        <td className="px-6 py-4 text-gray-300 font-mono">
                          {venta.fecha || '—'}
                        </td>
                        <td className="px-6 py-4 font-bold text-white">
                          {venta.eventoNombre}
                        </td>
                        <td className="px-6 py-4 text-center font-mono text-gray-300">
                          <span className="text-white font-bold">
                            {venta.cantidadPreventa + venta.cantidadRegular}
                          </span>
                          <span className="text-gray-500 text-[10px] ml-1.5">
                            ({venta.cantidadPreventa} / {venta.cantidadRegular})
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-gray-300 font-bold">
                          ${venta.total.toLocaleString('es-CO')}
                        </td>
                        <td className="px-6 py-4 text-right font-mono text-green-400 font-bold">
                          ${venta.comision.toLocaleString('es-CO')}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-[9px] font-bold font-mono ${
                            venta.estado === 'PAGADO' || venta.estado === 'REGALADA'
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                              : venta.estado === 'PENDIENTE'
                              ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {venta.estado}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="px-6 py-12 text-center text-xs text-gray-500 font-mono">
                        No se han registrado transacciones con tu cupón todavía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 📢 Reglamento y Condiciones section */}
          <div className="mt-12 bg-[#10101A]/40 backdrop-blur-md border border-industrial-800 rounded-xl p-6 sm:p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-neon)]/5 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-center gap-3 border-b border-industrial-800 pb-5 mb-6">
              <div className="w-10 h-10 rounded-lg bg-[var(--color-neon)]/10 flex items-center justify-center text-[var(--color-neon)]">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">📢 REGLAMENTO Y CONDICIONES: EQUIPO DE PROMOTORES OFICIALES</h3>
                <p className="text-xs text-gray-500">Reglas de juego y condiciones económicas para asegurar el orden y la transparencia en Dopamina Crew</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Card 1: Beneficio Público */}
              <div className="bg-black/30 border border-industrial-900 rounded-lg p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 text-[var(--color-neon)]">
                    <Percent className="w-4 h-4" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">Beneficios para tu público</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Tus clientes recibirán un <strong className="text-white">5% de descuento</strong> exclusivo al usar tu cupón de descuento en la página web:
                  </p>
                </div>
                <div className="space-y-1.5 bg-[#10101A]/80 p-3 rounded border border-industrial-800/50 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Preventa Web:</span>
                    <span className="text-white font-bold">$23.750 <span className="text-gray-500 line-through text-[9px] font-normal">$25.000</span></span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Full Web:</span>
                    <span className="text-white font-bold">$33.250 <span className="text-gray-500 line-through text-[9px] font-normal">$35.000</span></span>
                  </div>
                </div>
              </div>

              {/* Card 2: Comisión */}
              <div className="bg-black/30 border border-industrial-900 rounded-lg p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3 text-green-400">
                    <DollarSign className="w-4 h-4" />
                    <span className="text-xs font-mono font-bold uppercase tracking-wider">Tu Comisión (10% Neto)</span>
                  </div>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    Ganarás el <strong className="text-white">10% neto</strong> de comisión por cada entrada exitosa que se registre en el sistema con tu cupón:
                  </p>
                </div>
                <div className="space-y-1.5 bg-[#10101A]/80 p-3 rounded border border-industrial-800/50 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Por cada Preventa:</span>
                    <span className="text-green-400 font-bold">+$2.375 COP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Por cada Boleta Full:</span>
                    <span className="text-green-400 font-bold">+$3.325 COP</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Transparencia */}
              <div className="bg-black/30 border border-industrial-900 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3 text-blue-400">
                  <Ticket className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Transparencia Total</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Las compras quedan automatizadas por la pasarela de pagos. <strong className="text-white">No se aceptarán reclamos</strong> retroactivos de clientes a quienes se les olvidó poner tu código. Tu comisión está asegurada únicamente si el código aparece registrado en la transacción del sistema.
                </p>
              </div>

              {/* Card 4: Cortes y Pago */}
              <div className="bg-black/30 border border-industrial-900 rounded-lg p-5">
                <div className="flex items-center gap-2 mb-3 text-orange-400">
                  <Calendar className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Corte y Fechas de Pago</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  El corte oficial de ventas de la web se cierra el día del evento. El pago acumulado de tus comisiones se transferirá de <strong className="text-white">3 a 4 días hábiles después de la fiesta</strong> (debido a los tiempos de desembolso de la pasarela de pagos) a través de transferencia bancaria (Nequi/Bancolombia).
                </p>
              </div>

              {/* Card 5: Publicidad */}
              <div className="bg-black/30 border border-industrial-900 rounded-lg p-5 md:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 mb-3 text-purple-400">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider">Contenido Oficial</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Para proteger la marca de la fiesta, <strong className="text-white">está prohibido diseñar piezas propias o hacer spam masivo</strong>. La encargada de marketing enviará reels, videos e imágenes oficiales listos para compartir diariamente en tus historias acompañados de tu código.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Modal de registro de cuenta bancaria - overlay sobre el dashboard */}
      {showBankModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px'
        }}>
          <div style={{
            background: 'linear-gradient(145deg, #0d0d14, #13131f)',
            border: '1px solid rgba(177,78,255,0.3)',
            borderRadius: '20px', padding: '36px', maxWidth: '480px', width: '100%',
            boxShadow: '0 0 60px rgba(177,78,255,0.15)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="2" y="8" width="20" height="13" rx="2" fill="rgba(177,78,255,0.15)" stroke="rgba(177,78,255,0.6)" strokeWidth="1.5"/>
                  <path d="M12 3L2 8h20L12 3z" fill="rgba(177,78,255,0.5)" stroke="rgba(177,78,255,0.6)" strokeWidth="1.2"/>
                  <rect x="9" y="13" width="6" height="8" rx="1" fill="rgba(177,78,255,0.4)"/>
                  <rect x="4" y="12" width="4" height="3" rx="0.5" fill="rgba(177,78,255,0.3)"/>
                  <rect x="16" y="12" width="4" height="3" rx="0.5" fill="rgba(177,78,255,0.3)"/>
                </svg>
              </div>
              <h2 style={{ color: '#e2d4ff', fontSize: '1.3rem', fontWeight: 900, letterSpacing: '1px', margin: '0 0 8px' }}>
                DATOS DE PAGO
              </h2>
              <p style={{ color: '#9b8eb0', fontSize: '0.82rem', margin: 0, lineHeight: '1.5' }}>
                Para poder enviarte tus comisiones, necesitamos tu info de cuenta bancaria.
                Esta información solo la verá el administrador.
              </p>
            </div>

            <form onSubmit={handleSaveBankAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#9b8eb0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Número de Cuenta *</label>
                <input
                  type="text" required maxLength={30}
                  placeholder="Ej: 1234567890"
                  value={bankForm.cuentaBancaria}
                  onChange={e => setBankForm(p => ({ ...p, cuentaBancaria: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(177,78,255,0.2)', borderRadius: '8px', padding: '10px 14px', color: '#e2d4ff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#9b8eb0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Banco / Billetera *</label>
                <select
                  required
                  value={bankForm.banco}
                  onChange={e => setBankForm(p => ({ ...p, banco: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(177,78,255,0.2)', borderRadius: '8px', padding: '10px 14px', color: bankForm.banco ? '#e2d4ff' : '#9b8eb0', fontSize: '0.9rem', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
                >
                  <option value="">Selecciona tu banco...</option>
                  <optgroup label="Bancos Principales">
                    <option value="Bancolombia">Bancolombia</option>
                    <option value="Banco de Bogotá">Banco de Bogotá</option>
                    <option value="Davivienda">Davivienda</option>
                    <option value="BBVA Colombia">BBVA Colombia</option>
                    <option value="Banco Popular">Banco Popular</option>
                    <option value="Banco de Occidente">Banco de Occidente</option>
                    <option value="Banco Agrario">Banco Agrario</option>
                    <option value="Banco AV Villas">Banco AV Villas</option>
                    <option value="Banco Caja Social">Banco Caja Social</option>
                    <option value="Scotiabank Colpatria">Scotiabank Colpatria</option>
                    <option value="Bancoomeva">Bancoomeva</option>
                    <option value="Banco Falabella">Banco Falabella</option>
                    <option value="Banco GNB Sudameris">Banco GNB Sudameris</option>
                    <option value="Itaú Colombia">Itaú Colombia</option>
                    <option value="Citibank Colombia">Citibank Colombia</option>
                  </optgroup>
                  <optgroup label="Billeteras Digitales">
                    <option value="Nequi">Nequi</option>
                    <option value="Daviplata">Daviplata</option>
                    <option value="Transfiya">Transfiya</option>
                    <option value="MOVii">MOVii</option>
                  </optgroup>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#9b8eb0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Titular de la Cuenta *</label>
                <input
                  type="text" required maxLength={100}
                  placeholder="Nombre completo tal como aparece en la cuenta"
                  value={bankForm.titularCuenta}
                  onChange={e => setBankForm(p => ({ ...p, titularCuenta: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(177,78,255,0.2)', borderRadius: '8px', padding: '10px 14px', color: '#e2d4ff', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.7rem', fontWeight: 700, color: '#9b8eb0', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '6px' }}>Tipo de Cuenta</label>
                <select
                  value={bankForm.tipoCuenta}
                  onChange={e => setBankForm(p => ({ ...p, tipoCuenta: e.target.value }))}
                  style={{ width: '100%', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(177,78,255,0.2)', borderRadius: '8px', padding: '10px 14px', color: '#e2d4ff', fontSize: '0.9rem', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="AHORROS">Cuenta de Ahorros</option>
                  <option value="CORRIENTE">Cuenta Corriente</option>
                  <option value="NEQUI">Nequi</option>
                  <option value="DAVIPLATA">Daviplata</option>
                </select>
              </div>

              {bankError && (
                <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#f87171', fontSize: '0.8rem' }}>
                  {bankError}
                </div>
              )}

              {bankSuccess && (
                <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)', borderRadius: '8px', padding: '10px 14px', color: '#4ade80', fontSize: '0.85rem', fontWeight: 700, textAlign: 'center' }}>
                  ✅ ¡Datos guardados correctamente!
                </div>
              )}

              <button
                type="submit"
                disabled={bankSaving}
                style={{
                  background: bankSaving ? 'rgba(177,78,255,0.3)' : 'linear-gradient(135deg, #b14eff, #7c3aed)',
                  border: 'none', borderRadius: '10px', padding: '14px',
                  color: '#fff', fontSize: '0.9rem', fontWeight: 800,
                  cursor: bankSaving ? 'not-allowed' : 'pointer',
                  letterSpacing: '1px', textTransform: 'uppercase',
                  boxShadow: bankSaving ? 'none' : '0 0 20px rgba(177,78,255,0.4)'
                }}
              >
                {bankSaving ? 'Guardando...' : 'Guardar Datos de Pago'}
              </button>
            </form>
          </div>
        </div>
      )}
    </PageTransition>
  );
}

