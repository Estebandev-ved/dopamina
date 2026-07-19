import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import PageTransition from '../components/PageTransition';
import { Ticket, Download, Printer, Calendar, ShieldCheck, Clock, X, Gift } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const formatDateTime = (dateStr) => {
  if (!dateStr) return '—';
  try {
    const cleanStr = dateStr.replace('T', ' ').split('.')[0];
    const parts = cleanStr.split(' ');
    const dateParts = parts[0].split('-');
    const timeParts = parts[1].split(':');
    
    const year = dateParts[0];
    const month = dateParts[1];
    const day = dateParts[2];
    
    let hour = parseInt(timeParts[0], 10);
    const minute = timeParts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12;
    hour = hour ? hour : 12;
    
    return `${day}/${month}/${year} - ${hour}:${minute} ${ampm}`;
  } catch (e) {
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return '—';
      return d.toLocaleString('es-CO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch (err) {
      return '—';
    }
  }
};

/**
 * User Dashboard showing purchased tickets.
 * Integrates:
 * - Mock SVG QR Codes for scanning.
 * - Ticket order list.
 */
export default function Dashboard() {
  const navigate = useNavigate();
  const currentUser = api.getUser();
  const [boletas, setBoletas] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados para el cofre regalo sorpresa
  const [cofreAbierto, setCofreAbierto] = useState(false);
  const [tiempoRestante, setTiempoRestante] = useState(0);
  const [expirado, setExpirado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  // Inicializar cofre sorpresa
  useEffect(() => {
    const expTimeStr = localStorage.getItem('dopamina_cofre_expiracion');
    if (expTimeStr) {
      const expTime = parseInt(expTimeStr, 10);
      const diff = Math.floor((expTime - Date.now()) / 1000);
      if (diff <= 0) {
        setTiempoRestante(0);
        setExpirado(true);
        setCofreAbierto(true);
      } else {
        setTiempoRestante(diff);
        setCofreAbierto(true);
      }
    }
  }, []);

  // Timer para la cuenta regresiva del cofre
  useEffect(() => {
    let interval = null;
    if (cofreAbierto && tiempoRestante > 0 && !expirado) {
      interval = setInterval(() => {
        const expTimeStr = localStorage.getItem('dopamina_cofre_expiracion');
        if (expTimeStr) {
          const expTime = parseInt(expTimeStr, 10);
          const diff = Math.floor((expTime - Date.now()) / 1000);
          if (diff <= 0) {
            setTiempoRestante(0);
            setExpirado(true);
            clearInterval(interval);
          } else {
            setTiempoRestante(diff);
          }
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [cofreAbierto, tiempoRestante, expirado]);

  const handleAbrirCofre = () => {
    const expTime = Date.now() + 3 * 60 * 60 * 1000; // 3 horas
    localStorage.setItem('dopamina_cofre_expiracion', expTime.toString());
    setTiempoRestante(3 * 60 * 60);
    setCofreAbierto(true);
  };

  const handleCopiarCupon = () => {
    navigator.clipboard.writeText('REGALO15');
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const handleGastarCupon = () => {
    sessionStorage.setItem('dopamina_intent_auto_coupon', 'REGALO15');
    navigate('/', { state: { autoCoupon: 'REGALO15' } });
  };

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const [selectedBoleta, setSelectedBoleta] = useState(null);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');
  const [transferLoading, setTransferLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  /**
   * Generates a real PDF for the ticket using jsPDF + html2canvas.
   * Captures the rendered boleta card DOM element and exports as A5 landscape PDF.
   * Security: No external calls with ticket data; all rendering is client-side.
   */
  const handleDownloadPDF = async (boleta) => {
    const element = document.getElementById(`boleta-card-${boleta.id}`);
    if (!element) return;
    setDownloadingId(boleta.id);
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0a0a0a',
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a5' });
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const ratio = Math.min(pdfW / canvas.width, pdfH / canvas.height);
      const imgW = canvas.width * ratio;
      const imgH = canvas.height * ratio;
      pdf.setFillColor(10, 10, 10);
      pdf.rect(0, 0, pdfW, pdfH, 'F');
      pdf.addImage(imgData, 'PNG', (pdfW - imgW) / 2, (pdfH - imgH) / 2, imgW, imgH);
      pdf.save(`Boleta_Dopamina_${boleta.id}.pdf`);
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setDownloadingId(null);
    }
  };

  /**
   * Opens a browser print window with formatted ticket.
   * Uses QRCode CDN library to render the real QR in the print document.
   */
  const handlePrint = (boleta) => {
    const pw = window.open('', '_blank');
    if (!pw) return;
    const qrVal = boleta.codigoQr;
    const comboLabel = boleta.comboNombre ? `<div style="color:#F59E0B;font-size:11px;margin:8px 0;padding:6px 10px;border:1px solid rgba(245,158,11,.3);border-radius:6px;background:rgba(245,158,11,.05)"><strong>COMBO:</strong> ${boleta.comboNombre}${boleta.comboItems ? ' — Incluye: ' + boleta.comboItems : ''}</div>` : '';
    const html = `<!DOCTYPE html><html><head><title>Boleta #${boleta.id} - Dopamina</title>
      <style>
        body{margin:0;padding:24px;background:#0a0a0a;color:white;font-family:monospace}
        .t{border:1px solid rgba(177,78,255,.4);border-radius:12px;padding:24px;max-width:600px;margin:auto;background:#111}
        h1{color:#B14EFF;font-size:20px;letter-spacing:3px;margin:0 0 4px}
        p.sub{color:#888;font-size:11px;margin:0 0 16px}
        h2{color:white;font-size:17px;margin:0 0 16px}
        .g{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px}
        label{font-size:9px;color:#555;text-transform:uppercase;display:block;font-weight:700;margin-bottom:2px}
        .val{font-size:12px;color:#ccc}
        .qr{display:flex;flex-direction:column;align-items:center;padding-top:16px;border-top:1px dashed rgba(177,78,255,.3);margin-top:16px}
        .code{font-size:9px;color:#B14EFF;word-break:break-all;margin-top:6px;max-width:260px;text-align:center}
      </style>
      </head><body><div class="t">
      <h1>DOPAMINA</h1><p class="sub">BOLETA OFICIAL #${boleta.id}</p>
      <h2>${boleta.eventoNombre || 'Evento Dopamina'}</h2>
      ${comboLabel}
      <div class="g">
        <div><label>Asistente</label><span class="val">${currentUser.nombre}</span></div>
        <div><label>Estado</label><span class="val">${boleta.estado}</span></div>
        <div><label>Fecha del Evento</label><span class="val">${boleta.eventoFecha || '—'} ${boleta.eventoHora ? boleta.eventoHora.slice(0,5) : ''}</span></div>
        <div><label>Lugar</label><span class="val">${boleta.eventoLugar ? boleta.eventoLugar + ', ' + boleta.eventoCiudad : '—'}</span></div>
        <div><label>Fecha de Compra</label><span class="val">${formatDateTime(boleta.createdAt)}</span></div>
        <div><label>N° Sorteo</label><span class="val" style="color:#B14EFF;font-weight:bold">${boleta.numeroSorteo !== null && boleta.numeroSorteo !== undefined ? String(boleta.numeroSorteo).padStart(3, '0') : '—'}</span></div>
      </div>
      <div class="qr"><canvas id="qrc"></canvas>
      <div class="code">${qrVal}</div></div>
      </div>
      <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.3/build/qrcode.min.js"><\/script>
      <script>window.onload=function(){QRCode.toCanvas(document.getElementById('qrc'),'${qrVal}',{width:160},function(){setTimeout(function(){window.print();window.close();},600)})}<\/script>
      </body></html>`;
    pw.document.write(html);
    pw.document.close();
  };

  const openTransferModal = (boleta) => {
    setSelectedBoleta(boleta);
    setTransferEmail('');
    setTransferError('');
    setTransferSuccess('');
  };

  const closeTransferModal = () => {
    setSelectedBoleta(null);
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!transferEmail.trim()) {
      setTransferError('Por favor ingrese el correo electrónico del destinatario.');
      return;
    }
    setTransferLoading(true);
    setTransferError('');
    setTransferSuccess('');
    try {
      const response = await api.transferirBoleta(selectedBoleta.id, transferEmail);
      setTransferSuccess(response.message || 'Boleta transferida con éxito.');
      // Refresh tickets
      const data = await api.getMisBoletas();
      setBoletas(data);
      setTimeout(() => {
        closeTransferModal();
      }, 1500);
    } catch (err) {
      setTransferError(err.message || 'Error al transferir la boleta.');
    } finally {
      setTransferLoading(false);
    }
  };

  useEffect(() => {
    if (!api.isAuthenticated()) {
      navigate('/login', { state: { from: '/dashboard' } });
      return;
    }

    const fetchBoletas = async () => {
      try {
        const data = await api.getMisBoletas();
        setBoletas(data);
      } catch (err) {
        console.error('Error fetching tickets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoletas();
  }, [navigate]);

  if (!currentUser) return null;

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-black py-16 overflow-hidden">
        {/* Ambient grids */}
        <div className="absolute inset-0 industrial-grid opacity-25 pointer-events-none" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-industrial-800 pb-8 mb-10 text-center md:text-left">
            <div>
              <h1 className="text-3xl font-black text-white uppercase tracking-widest">
                MIS ENTRADAS
              </h1>
              <p className="text-xs text-gray-500 font-mono mt-1">
                HISTORIAL DE COMPRAS Y CÓDIGOS DE ACCESO
              </p>
            </div>
            
            {/* User badge */}
            <div className="mt-4 md:mt-0 inline-flex items-center space-x-2 bg-industrial-900 border border-neon-purple/20 px-4 py-2 rounded-lg justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-gray-300 font-mono uppercase">
                {currentUser.nombre} (CREW MEMBER)
              </span>
            </div>
          </div>

          {/* COFRE REGALO SORPRESA */}
          <div className="mb-10 relative overflow-hidden bg-gradient-to-r from-industrial-900 via-industrial-900 to-purple-950/20 border border-industrial-800 rounded-lg p-6 md:p-8 shadow-neon-sm">
            <div className="absolute top-0 right-0 w-32 h-32 bg-neon-purple/5 blur-2xl pointer-events-none" />
            
            {!cofreAbierto ? (
              /* ESTADO CERRADO */
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div className="flex items-center space-x-5 text-center md:text-left flex-col md:flex-row">
                  <div className="w-16 h-16 rounded-full bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center text-3xl animate-bounce mb-3 md:mb-0">
                    🎁
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-white uppercase tracking-wider">
                      Cofre Regalo Sorpresa
                    </h3>
                    <p className="text-xs text-gray-400 font-mono mt-1">
                      Tenemos un regalo exclusivo para ti. Ábrelo ahora para revelar tu recompensa.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleAbrirCofre}
                  className="w-full md:w-auto bg-gradient-to-r from-neon-purple to-neon-violet hover:from-neon-violet hover:to-neon-purple text-white text-xs font-black tracking-widest px-8 py-3.5 rounded shadow-neon-sm hover:shadow-neon-md transition-all duration-300 uppercase cursor-pointer"
                >
                  Abrir Cofre
                </button>
              </div>
            ) : expirado ? (
              /* ESTADO EXPIRADO */
              <div className="flex flex-col md:flex-row items-center justify-between gap-6 opacity-60">
                <div className="flex items-center space-x-5 text-center md:text-left flex-col md:flex-row">
                  <div className="w-16 h-16 rounded-full bg-industrial-850 border border-industrial-800 flex items-center justify-center text-3xl mb-3 md:mb-0">
                    🔒
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-gray-400 uppercase tracking-wider">
                      Regalo Expirado
                    </h3>
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      La cuenta regresiva de 3 horas ha finalizado y el cupón sorpresa del 15% de descuento ha vencido.
                    </p>
                  </div>
                </div>
                <div className="text-xs font-mono font-bold text-rose-500 uppercase border border-rose-500/25 px-4 py-2 rounded bg-rose-950/10">
                  Cerrado / Expirado
                </div>
              </div>
            ) : (
              /* ESTADO ABIERTO / ACTIVO */
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                  <div className="flex items-center space-x-5 text-center md:text-left flex-col md:flex-row">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-3xl animate-pulse mb-3 md:mb-0">
                      🔓
                    </div>
                    <div>
                      <h3 className="text-lg font-black text-white uppercase tracking-wider flex items-center justify-center md:justify-start gap-2">
                        <span>¡Cupón Revelado!</span>
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded font-mono">15% OFF</span>
                      </h3>
                      <p className="text-xs text-gray-400 font-mono mt-1">
                        Has desbloqueado un **15% de descuento** en tu compra de entradas. ¡Se autoaplicará en el checkout!
                      </p>
                    </div>
                  </div>

                  {/* Temporizador de Cuenta Regresiva */}
                  <div className="flex flex-col items-center md:items-end font-mono">
                    <span className="text-[10px] text-gray-500 uppercase tracking-widest">El cupón expira en</span>
                    <span className="text-2xl font-black text-orange-500 tracking-wider animate-pulse mt-0.5">
                      {formatTime(tiempoRestante)}
                    </span>
                  </div>
                </div>

                {/* Cupón Card */}
                <div className="flex flex-col sm:flex-row items-center justify-between bg-black/40 border border-dashed border-industrial-800 rounded-lg p-5 gap-4">
                  <div className="space-y-1 text-center sm:text-left">
                    <span className="text-[9px] text-gray-500 uppercase tracking-widest block font-mono">Código de Descuento</span>
                    <span className="text-xl font-black text-neon-glow font-mono uppercase tracking-widest">
                      REGALO15
                    </span>
                  </div>
                  
                  <div className="flex space-x-3 w-full sm:w-auto">
                    <button
                      onClick={handleCopiarCupon}
                      className="flex-grow sm:flex-grow-0 border border-industrial-800 hover:border-neon-purple/50 bg-black text-gray-300 hover:text-white text-xs font-bold px-5 py-3 rounded transition-colors uppercase font-mono"
                    >
                      {copiado ? '✓ Copiado' : 'Copiar Código'}
                    </button>
                    <button
                      onClick={handleGastarCupon}
                      className="flex-grow sm:flex-grow-0 bg-neon-purple text-white text-xs font-black tracking-widest px-6 py-3 rounded shadow-neon-sm hover:shadow-neon-md transition-all duration-300 uppercase cursor-pointer"
                    >
                      Comprar Entradas
                    </button>
                  </div>
                </div>

                <p className="text-[10px] text-center text-gray-500 font-mono leading-relaxed">
                  ⚠️ <strong>Nota:</strong> Una vez activado, el cupón es válido únicamente durante 3 horas. Finaliza tu compra de entradas antes de que el temporizador llegue a cero para no perder el beneficio.
                </p>
              </div>
            )}
          </div>

          {loading ? (
            <div className="text-center py-20">
              <div className="w-8 h-8 rounded-full border border-neon-purple border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">Cargando tus boletas...</p>
            </div>
          ) : boletas.length === 0 ? (
            /* Empty State */
            <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-12 text-center max-w-xl mx-auto space-y-6">
              <div className="w-16 h-16 rounded-full bg-black border border-industrial-800 flex items-center justify-center mx-auto text-gray-500">
                <Ticket className="w-8 h-8" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">Aún no tienes entradas</h3>
                <p className="text-xs text-gray-400 max-w-md mx-auto leading-relaxed">
                  Las boletas que adquieras para nuestros eventos se guardarán aquí automáticamente. Recibirás una copia de seguridad en tu correo electrónico.
                </p>
              </div>
              <div>
                <button
                  onClick={() => navigate('/')}
                  className="bg-neon-purple text-white text-xs font-black tracking-widest px-6 py-3 rounded shadow-neon-sm hover:shadow-neon-md transition-all uppercase"
                >
                  Ver Próximo Evento
                </button>
              </div>
            </div>
          ) : (
            /* Tickets Grid */
            <div className="space-y-8">
              {boletas.map((boleta, index) => (
                <div 
                  key={boleta.id}
                  id={`boleta-card-${boleta.id}`}
                  className="bg-industrial-900 border border-industrial-800 rounded-lg overflow-hidden flex flex-col md:flex-row relative"
                >
                  {/* Left design tag */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b ${boleta.comboNombre ? 'from-amber-500 to-orange-500' : 'from-neon-purple to-neon-violet'}`} />

                  {/* TICKET DESCRIPTION AREA */}
                  <div className="flex-grow p-6 sm:p-8 flex flex-col justify-between border-b md:border-b-0 md:border-r border-industrial-800">
                    <div className="space-y-4">
                      {/* Badge status */}
                      <div className="flex items-center space-x-2 flex-wrap gap-2">
                        <span className={`text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded uppercase border ${
                          boleta.estado === 'ACTIVA' 
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' 
                            : 'bg-red-950/40 border-red-500/40 text-red-400'
                        }`}>
                          {boleta.estado}
                        </span>
                        <span className="text-[10px] font-mono text-gray-500">
                          ID: #{boleta.id}
                        </span>
                        {boleta.numeroSorteo !== undefined && boleta.numeroSorteo !== null && (
                          <span className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded uppercase border bg-purple-950/40 border-purple-500/40 text-purple-400 animate-pulse">
                            N° Sorteo: {String(boleta.numeroSorteo).padStart(3, '0')}
                          </span>
                        )}
                      </div>
                      
                      {/* Event name */}
                      <div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-wide">
                          {boleta.eventoNombre || "Borrachos pero nunca fachos"}
                        </h2>
                        {boleta.comboNombre ? (
                          <div className="mt-1.5 space-y-1.5">
                            <p className="text-xs font-bold tracking-wider font-mono uppercase flex items-center gap-1.5" style={{ color: 'var(--color-neon)' }}>
                              <Gift className="w-3.5 h-3.5" />
                              {boleta.comboNombre}
                            </p>
                            {boleta.comboItemClaims && boleta.comboItemClaims.length > 0 ? (
                              <div className="space-y-1">
                                {boleta.comboItemClaims.map((claim) => (
                                  <p key={claim.id} className={`text-[11px] font-mono px-2 py-1 rounded inline-flex items-center gap-1.5 ${
                                    claim.reclamado 
                                      ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                                      : 'text-amber-400 bg-amber-500/10 border border-amber-500/20'
                                  }`}>
                                    <span>{claim.reclamado ? '✅' : '⏳'}</span>
                                    <span>{claim.itemNombre}</span>
                                    <span className="text-[9px] opacity-70">— {claim.reclamado ? 'Entregado' : 'Pendiente'}</span>
                                  </p>
                                ))}
                              </div>
                            ) : boleta.comboItems ? (
                              <p className="text-[11px] text-amber-400 font-mono bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded inline-block">
                                Incluye: {boleta.comboItems}
                              </p>
                            ) : null}
                          </div>
                        ) : (
                          <p className="text-xs text-neon-glow font-bold tracking-wider font-mono mt-0.5 uppercase">
                            Entrada Individual (Pase Único)
                          </p>
                        )}
                      </div>

                      {/* Info breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-industrial-850">
                        <div className="flex items-start space-x-2.5">
                          <Calendar className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold block">Fecha del Evento</span>
                            <span className="text-xs text-gray-300">
                              {boleta.eventoFecha 
                                ? `${boleta.eventoFecha} - ${boleta.eventoHora ? boleta.eventoHora.slice(0,5) : ''}`
                                : "Sábado, 11 de Julio - 22:00"}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex items-start space-x-2.5">
                          <ShieldCheck className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold block">Ubicación</span>
                            <span className="text-xs text-gray-300">
                              {boleta.eventoLugar 
                                ? `${boleta.eventoLugar}, ${boleta.eventoCiudad}`
                                : "Bogotá Bodega Club"}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-start space-x-2.5">
                          <Clock className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <span className="text-[10px] text-gray-500 uppercase font-bold block">Fecha de Compra</span>
                            <span className="text-xs text-gray-300">
                              {formatDateTime(boleta.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions */}
                    <div className="flex items-center flex-wrap gap-3 mt-8 pt-4 border-t border-industrial-850">
                      <button 
                        onClick={() => handleDownloadPDF(boleta)}
                        disabled={downloadingId === boleta.id}
                        className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                      >
                        <Download className="w-4 h-4" />
                        <span className="font-semibold">{downloadingId === boleta.id ? 'Generando...' : 'Descargar PDF'}</span>
                      </button>
                      <button 
                        onClick={() => handlePrint(boleta)}
                        className="flex items-center space-x-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                      >
                        <Printer className="w-4 h-4" />
                        <span className="font-semibold">Imprimir</span>
                      </button>
                      {boleta.estado === 'ACTIVA' && (
                        <button 
                          onClick={() => openTransferModal(boleta)}
                          className="flex items-center space-x-1.5 text-xs text-neon-purple hover:text-neon-glow transition-colors cursor-pointer ml-auto font-bold uppercase tracking-wider"
                        >
                          <Ticket className="w-4 h-4" />
                          <span>Transferir Entrada</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {/* QR CODE AREA — Real QR generado desde codigoQr */}
                  <div className="w-full md:w-64 bg-black/40 p-6 flex flex-col items-center justify-center text-center">
                    
                    {/* Real QR Code using qrcode.react */}
                    <div className="w-36 h-36 bg-white rounded-lg p-2 flex items-center justify-center shadow-neon-sm mb-4">
                      <QRCodeSVG
                        value={boleta.codigoQr}
                        size={128}
                        bgColor="#ffffff"
                        fgColor="#000000"
                        level="H"
                        includeMargin={false}
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[8px] font-mono text-gray-500 uppercase block tracking-widest">
                        Código de Acceso Único
                      </span>
                      <span className="text-[9px] font-mono text-neon-glow font-bold break-all leading-tight block">
                        {boleta.codigoQr.substring(0, 20)}...
                      </span>
                      <span className="text-[8px] font-mono text-gray-600 block">
                        Presenta en puerta del evento
                      </span>
                    </div>

                  </div>
                  
                </div>
              ))}
            </div>
          )}

          {/* Transfer Modal */}
          {selectedBoleta && (
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-industrial-900 border border-industrial-800 rounded-lg max-w-md w-full overflow-hidden shadow-neon-md relative">
                <div className="h-1 bg-gradient-to-r from-neon-purple to-neon-violet" />
                
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-bold text-white uppercase tracking-wider">Transferir Entrada</h3>
                      <p className="text-[10px] text-gray-500 font-mono uppercase mt-0.5">ID Boleta: #{selectedBoleta.id}</p>
                    </div>
                    <button 
                      onClick={closeTransferModal}
                      className="text-gray-500 hover:text-white transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="border border-industrial-800 bg-black/40 rounded p-4 text-xs space-y-2">
                    <p className="text-gray-300">
                      <span className="text-gray-500 font-bold uppercase tracking-wider block">Evento:</span>
                      {selectedBoleta.eventoNombre || "Borrachos pero nunca fachos"}
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-500 font-bold uppercase tracking-wider block">Ubicación:</span>
                      {selectedBoleta.eventoLugar || "Bogotá Bodega Club"}
                    </p>
                    <p className="text-gray-300">
                      <span className="text-gray-500 font-bold uppercase tracking-wider block">Fecha de Compra:</span>
                      {formatDateTime(selectedBoleta.createdAt)}
                    </p>
                  </div>

                  <form onSubmit={handleTransfer} className="space-y-4 pt-2">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">
                        Correo Electrónico Destinatario
                      </label>
                      <input 
                        type="email" 
                        value={transferEmail}
                        onChange={(e) => setTransferEmail(e.target.value)}
                        placeholder="amigo@correo.com"
                        disabled={transferLoading || transferSuccess}
                        className="w-full bg-black/50 border border-industrial-800 hover:border-industrial-700 focus:border-neon-purple text-sm text-white px-3 py-2.5 rounded outline-none transition-colors placeholder:text-gray-600"
                      />
                      <p className="text-[9px] text-gray-500 leading-normal">
                        * El destinatario debe tener una cuenta registrada en Dopamina para recibir la entrada.
                      </p>
                    </div>

                    {transferError && (
                      <div className="border border-red-500/20 bg-red-950/20 text-red-400 text-xs px-3 py-2.5 rounded font-mono font-bold">
                        {transferError}
                      </div>
                    )}

                    {transferSuccess && (
                      <div className="border border-emerald-500/20 bg-emerald-950/20 text-emerald-400 text-xs px-3 py-2.5 rounded font-mono font-bold">
                        {transferSuccess}
                      </div>
                    )}

                    <div className="flex space-x-3 pt-2">
                      <button 
                        type="button"
                        onClick={closeTransferModal}
                        disabled={transferLoading || transferSuccess}
                        className="flex-1 bg-transparent hover:bg-industrial-800 border border-industrial-800 text-xs font-bold tracking-widest text-gray-400 hover:text-white py-3 rounded uppercase transition-colors cursor-pointer disabled:opacity-50"
                      >
                        Cancelar
                      </button>
                      <button 
                        type="submit"
                        disabled={transferLoading || transferSuccess}
                        className="flex-1 bg-neon-purple text-white text-xs font-black tracking-widest py-3 rounded shadow-neon-sm hover:shadow-neon-md transition-all uppercase cursor-pointer disabled:opacity-50 flex items-center justify-center animate-pulse"
                      >
                        {transferLoading ? (
                          <div className="w-4 h-4 border border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                          'Confirmar'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
}
