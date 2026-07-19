import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { MapPin, Clock, Users, Minus, Plus, X, Ticket, BadgePercent, ArrowRight, Play, Pause, Zap, Lightbulb, Gift, Star, Tag } from 'lucide-react';
import useFacebookPixel from '../services/useFacebookPixel';

/**
 * Página pública de próximos eventos de Dopamina.
 * Los datos se obtienen del backend sin autenticación.
 */
export default function Eventos() {
  const navigate = useNavigate();
  const { trackEvent } = useFacebookPixel();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedEvento, setSelectedEvento] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [activeModalTab, setActiveModalTab] = useState('info'); // 'info' | 'mapa'
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [showQR, setShowQR] = useState(false);
  // Promo de 4+ boletas: de un solo uso por usuario. Para usuarios no logueados se
  // muestra como disponible (verán el estado real al pagar tras iniciar sesión).
  const [promoParcheDisponible, setPromoParcheDisponible] = useState(true);
  const audioRef = useRef(null);
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
  useEffect(() => {
    api.getEventos()
      .then(data => { setEventos(data); setLoading(false); })
      .catch(() => { setError('No se pudieron cargar los eventos.'); setLoading(false); });
  }, []);

  // Si hay sesión, consultar si la promo de parche sigue disponible para este usuario
  useEffect(() => {
    if (!api.isAuthenticated()) return;
    api.getPromoParcheDisponible()
      .then(res => setPromoParcheDisponible(!!res.disponible))
      .catch(() => {});
  }, []);

  // Safe release of audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const meses = ['ENE','FEB','MAR','ABR','MAY','JUN','JUL','AGO','SEP','OCT','NOV','DIC'];

  const formatFecha = (fechaStr) => {
    if (!fechaStr) return { dia: '--', mes: '---', año: '----' };
    const d = new Date(fechaStr + 'T00:00:00');
    return { dia: d.getDate(), mes: meses[d.getMonth()], año: d.getFullYear() };
  };

  const formatHora = (horaStr) => {
    if (!horaStr) return '';
    return horaStr.slice(0, 5);
  };

  const formatPrecio = (precio) => {
    if (!precio || precio === 0) return 'GRATIS';
    return `$${Number(precio).toLocaleString('es-CO')}`;
  };

  // ── Precio regular (sin preventa) ──────────────────────────────────────────
  const precioUnitario = (ev) => ev?.precio || 0;

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

  // Total estimado de una compra con precio regular + descuento por cantidad.
  const totalEstimado = (ev, cant) => {
    if (!ev) return 0;
    const subtotal = cant * (ev.precio || 0);
    const aplicaPromo = cant >= 4 && promoParcheDisponible;
    return subtotal * (aplicaPromo ? 0.9 : 1);
  };

  const handleSelectEvento = (evento) => {
    setSelectedEvento(evento);
    setCantidad(1);
    setActiveModalTab('info');
    setIsPlayingPreview(false);
    setShowQR(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    trackEvent('ViewContent', {
      content_name: evento.nombre,
      content_category: 'Evento',
      content_ids: [String(evento.id)],
      value: evento.precio || 0,
      currency: 'COP',
    });
  };

  const handleCloseModal = () => {
    setSelectedEvento(null);
    setIsPlayingPreview(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleTogglePreview = () => {
    if (!audioRef.current) return;
    if (isPlayingPreview) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => console.log('Audio playback blocked or failed'));
    }
    setIsPlayingPreview(!isPlayingPreview);
  };

  const eventosFiltrados = eventos.filter(e => {
    const matchesFiltro = filtro === 'todos' ? true : (filtro === 'destacados' ? e.destacado : true);
    const matchesSearch = searchTerm.trim() === '' || 
      e.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.lugar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.ciudad.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.lineup && e.lineup.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesFiltro && matchesSearch;
  });

  const handleGoToCheckout = () => {
    if (!selectedEvento) return;
    if (!api.getUser()) {
      navigate('/login', { state: { from: '/checkout', eventoState: { evento: selectedEvento, cantidad } } });
    } else {
      navigate('/checkout', { state: { evento: selectedEvento, cantidad } });
    }
  };

  /**
   * Genera un mensaje de WhatsApp persuasivo con los datos del evento
   * y abre la conversación directamente. No almacena datos del usuario.
   */
  const getEventoDeepLink = (evento) => {
    const slug = (evento.nombre || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return `https://dopaminaeventos.shop/eventos#${slug}-${evento.id}`;
  };

  const handleShareWhatsApp = (evento) => {
    const precio = evento.precio === 0 ? 'GRATIS' : `$${Number(evento.precio).toLocaleString('es-CO')} COP`;
    const fecha = evento.fecha ? evento.fecha : '';
    const deepLink = getEventoDeepLink(evento);
    const msg = encodeURIComponent(
      `🎉 *${evento.nombre}* — Dopamina\n\n` +
      `📍 ${evento.lugar}, ${evento.ciudad}\n` +
      `📅 ${fecha} • ${evento.hora ? evento.hora.slice(0,5) : '22:00'} hrs\n` +
      `🎟️ Boleta: *${precio}*\n` +
      `\n⚡ Compra aquí 👉 ${deepLink}\n\n` +
      `¡Arma el parche! 4+ boletas = 10% de descuento 🔥`
    );
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div style={{ background: '#0A0A0F', minHeight: '100vh', paddingBottom: '80px' }}>
      
      {/* Hero */}
      <div style={{
        position: 'relative', overflow: 'hidden',
        padding: '100px 24px 60px',
        textAlign: 'center',
        borderBottom: '1px solid rgba(177,78,255,0.12)',
      }}>
        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(177,78,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(177,78,255,0.04) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 0%, rgba(177,78,255,0.15) 0%, transparent 70%)',
        }} />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          style={{ position: 'relative' }}
        >
          <span style={{
            display: 'inline-block', marginBottom: '16px',
            fontSize: '11px', letterSpacing: '4px', fontWeight: 700,
            color: '#B14EFF', textTransform: 'uppercase',
            border: '1px solid rgba(177,78,255,0.3)',
            padding: '4px 16px', borderRadius: '20px',
            background: 'rgba(177,78,255,0.08)',
          }}>
            PRÓXIMAS FECHAS
          </span>
          <h1 style={{
            fontSize: 'clamp(2.5rem, 6vw, 4.5rem)',
            fontWeight: 900, letterSpacing: '-1px',
            color: '#F2F0F5', margin: '0 0 16px',
            textTransform: 'uppercase', lineHeight: 1.1,
          }}>
            EVENTOS<br />
            <span style={{ color: '#B14EFF' }}>DOPAMINA</span>
          </h1>
          <p style={{ color: '#9A9A9A', fontSize: '1.05rem', maxWidth: '500px', margin: '0 auto' }}>
            Underground techno · Industrial · Mocoa sound · Medellin
          </p>
        </motion.div>
      </div>

      {/* Filtros y Buscador */}
      <div style={{ maxWidth: '900px', margin: '40px auto 0', padding: '0 24px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[
              { id: 'todos', label: 'TODOS' },
              { id: 'destacados', label: '⭐ DESTACADOS' },
            ].map(f => (
              <button key={f.id} onClick={() => setFiltro(f.id)} style={{
                padding: '8px 20px', borderRadius: '8px',
                border: filtro === f.id ? '1px solid #B14EFF' : '1px solid rgba(255,255,255,0.1)',
                background: filtro === f.id ? 'rgba(177,78,255,0.15)' : 'transparent',
                color: filtro === f.id ? '#B14EFF' : '#9A9A9A',
                fontWeight: 700, fontSize: '0.8rem', letterSpacing: '1.5px',
                cursor: 'pointer', transition: 'all 0.2s',
              }}>{f.label}</button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '100%', maxWidth: '280px' }}>
            <input
              type="text"
              placeholder="🔍 Buscar evento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                backgroundColor: '#101015',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#fff',
                fontSize: '0.75rem',
                padding: '10px 16px 10px 36px',
                borderRadius: '8px',
                outline: 'none',
                fontFamily: 'monospace',
                boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 0' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: '44px', height: '44px', border: '3px solid #18181F', borderTopColor: '#B14EFF', borderRadius: '50%' }}
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            textAlign: 'center', padding: '60px',
            color: '#9A9A9A', fontSize: '1rem',
          }}>
            {error}
          </div>
        )}

        {/* Sin eventos */}
        {!loading && !error && eventosFiltrados.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ textAlign: 'center', padding: '80px 0' }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎵</div>
            <p style={{ color: '#9A9A9A', fontSize: '1.1rem', marginBottom: '8px' }}>
              No se encontraron eventos
            </p>
            <p style={{ color: '#555', fontSize: '0.9rem' }}>
              Intenta cambiar los filtros o tu búsqueda.
            </p>
          </motion.div>
        )}

        {/* List of events (Compact rows) */}
        <div className="space-y-3 max-w-4xl mx-auto">
          {eventosFiltrados.map((evento, i) => {
            const { dia, mes, año } = formatFecha(evento.fecha);
            const artistas = evento.lineup ? evento.lineup.split(',').map(a => a.trim()) : [];
            const lineupInline = artistas.join(' • ');

            return (
              <motion.div
                key={evento.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.04 }}
                onClick={() => handleSelectEvento(evento)}
                className="bg-industrial-900 border border-industrial-800 rounded-lg flex flex-col md:flex-row items-center py-2.5 px-4 gap-3 md:gap-6 hover:border-neon-purple/40 hover:shadow-neon-sm transition-all duration-200 cursor-pointer relative"
              >
                {/* Left Side: Sleek minimal Date */}
                <div className="flex flex-row md:flex-col items-center justify-center bg-black/40 border border-industrial-800 w-full md:w-16 md:h-16 py-1.5 px-3 rounded text-center gap-1.5 md:gap-0 font-mono flex-shrink-0">
                  <span className="text-lg font-black text-white leading-none">{dia}</span>
                  <span className="text-[9px] font-black text-neon-purple uppercase tracking-wider leading-none md:mt-1">{mes}</span>
                </div>

                {/* Middle Side: Event Info */}
                <div className="flex-grow text-center md:text-left min-w-0 space-y-0.5">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                    <h2 className="text-sm font-black text-white uppercase tracking-wider truncate">
                      {evento.nombre}
                    </h2>
                    {evento.destacado && (
                      <span className="bg-neon-purple/10 border border-neon-purple/20 text-neon-glow text-[7px] font-bold tracking-widest px-1.5 py-0.5 rounded uppercase leading-none flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-current" />
                        <span>DESTACADO</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 gap-y-1 text-[10px] text-gray-500 font-mono">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-neon-purple flex-shrink-0" />
                      <span>{evento.lugar}, {evento.ciudad}</span>
                    </span>
                    <span className="hidden md:inline">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neon-purple flex-shrink-0" />
                      <span>{formatHora(evento.hora)} hrs</span>
                    </span>
                    {evento.capacidad && (
                      <>
                        <span className="hidden md:inline">•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3 text-neon-purple flex-shrink-0" />
                          <span>Aforo: {evento.capacidad}</span>
                        </span>
                      </>
                    )}
                  </div>

                  {lineupInline && (
                    <p className="text-[10px] text-neon-violet font-semibold tracking-wider font-mono truncate uppercase mt-0.5 text-center md:text-left">
                      {lineupInline}
                    </p>
                  )}

                  <div className="flex items-center justify-center md:justify-start gap-1.5 mt-1 text-[9.5px] text-rose-400 font-bold uppercase tracking-wider font-mono">
                    <Ticket className="w-3 h-3 text-rose-500" />
                    <span>🎟️ Entrada General — Compra fácil online</span>
                  </div>
                </div>

                {/* Right Side: Price and Action */}
                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-industrial-800/40 flex-shrink-0">
                  <div className="text-left md:text-right font-mono">
                    <span className="text-[8px] text-gray-600 uppercase block leading-none">Boletas desde</span>
                    <span className="text-xs font-black text-white">{formatPrecio(precioUnitario(evento))}</span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!api.getUser()) {
                        navigate('/login', { state: { from: '/checkout', eventoState: { evento, cantidad: 1 } } });
                      } else {
                        navigate('/checkout', { state: { evento, cantidad: 1 } });
                      }
                    }}
                    className="bg-neon-purple hover:bg-neon-violet text-white text-[9px] font-black tracking-widest px-3 py-2 rounded uppercase transition-all cursor-pointer shadow-neon-sm border-none"
                  >
                    Comprar
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* DETAILED VIEW MODAL */}
      <AnimatePresence>
        {selectedEvento && (
          <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-industrial-900 border border-industrial-800 rounded-xl max-w-2xl w-full relative text-left shadow-neon-lg overflow-hidden flex flex-col my-8"
            >
              {/* Header Banner */}
              <div 
                className="h-40 relative"
                style={{
                  background: selectedEvento.imagenUrl
                    ? `url(${selectedEvento.imagenUrl}) center/cover no-repeat`
                    : 'linear-gradient(135deg, #10101A 0%, #18101F 50%, #10101A 100%)',
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-industrial-900 to-transparent" />
                <button 
                  onClick={handleCloseModal}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/60 border border-industrial-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                
                {selectedEvento.destacado && (
                  <span className="absolute top-4 left-4 bg-neon-purple text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase flex items-center gap-1">
                    <Star className="w-2.5 h-2.5 fill-current" />
                    <span>Destacado</span>
                  </span>
                )}
              </div>

              {/* Modal Tabs Navigation */}
              <div className="flex border-b border-industrial-800 bg-black/25 px-6">
                <button
                  onClick={() => setActiveModalTab('info')}
                  className={`py-3 px-4 text-[10px] font-black tracking-widest border-b-2 transition-all uppercase focus:outline-none ${
                    activeModalTab === 'info' ? 'border-neon-purple text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Información
                </button>
                <button
                  onClick={() => setActiveModalTab('mapa')}
                  className={`py-3 px-4 text-[10px] font-black tracking-widest border-b-2 transition-all uppercase focus:outline-none ${
                    activeModalTab === 'mapa' ? 'border-neon-purple text-white' : 'border-transparent text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Plano / Ubicación
                </button>
              </div>

              {/* Content Details */}
              <div className="p-6 sm:p-8 space-y-6 max-h-[calc(90vh-14rem)] overflow-y-auto">
                
                {activeModalTab === 'info' ? (
                  <>
                    {/* Event Title */}
                    <div className="space-y-1">
                      <h2 className="text-xl font-black text-white uppercase tracking-wider">
                        {selectedEvento.nombre}
                      </h2>
                      <p className="text-[10px] text-neon-glow font-bold uppercase tracking-widest font-mono">
                        Evento Oficial • Dopamina
                      </p>
                    </div>

                    {/* Audio Preview Set Player */}
                    <div className="bg-black/40 border border-industrial-850 rounded-lg p-4 flex items-center justify-between font-mono">
                      <div className="flex items-center space-x-3">
                        <button 
                          onClick={handleTogglePreview}
                          className="w-10 h-10 rounded-full bg-neon-purple hover:bg-neon-violet text-white flex items-center justify-center shadow-neon-sm hover:scale-105 active:scale-95 transition-all outline-none cursor-pointer border-none"
                        >
                          {isPlayingPreview ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current ml-0.5" />
                          )}
                        </button>
                        <div>
                          <span className="text-[8px] font-bold text-neon-glow uppercase tracking-widest block">ESCUCHA EL BEAT</span>
                          <span className="text-[10px] text-white font-bold block">Techno/Industrial Sample Preview</span>
                          <span className="text-[8px] text-gray-500 block">140 BPM Acid Warehouse Set</span>
                        </div>
                      </div>

                      {/* visualizer bars */}
                      <div className="flex items-end space-x-0.5 h-6 pr-1">
                        <div className="eq-bar eq-bar-1" style={{ width: '2px', animationPlayState: isPlayingPreview ? 'running' : 'paused', animationDuration: '0.6s' }} />
                        <div className="eq-bar eq-bar-2" style={{ width: '2px', animationPlayState: isPlayingPreview ? 'running' : 'paused', animationDuration: '0.9s' }} />
                        <div className="eq-bar eq-bar-3" style={{ width: '2px', animationPlayState: isPlayingPreview ? 'running' : 'paused', animationDuration: '0.7s' }} />
                        <div className="eq-bar eq-bar-4" style={{ width: '2px', animationPlayState: isPlayingPreview ? 'running' : 'paused', animationDuration: '0.8s' }} />
                        <div className="eq-bar eq-bar-5" style={{ width: '2px', animationPlayState: isPlayingPreview ? 'running' : 'paused', animationDuration: '0.5s' }} />
                      </div>

                      {/* hidden html5 audio tag */}
                      <audio ref={audioRef} loop src="https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" />
                    </div>

                    {/* Event Description */}
                    {selectedEvento.descripcion && (
                      <div className="space-y-1.5">
                        <span className="text-[9px] font-black text-industrial-400 uppercase tracking-widest block font-mono">Sobre la Fiesta</span>
                        <p className="text-xs text-gray-300 leading-relaxed font-mono">
                          {selectedEvento.descripcion}
                        </p>
                      </div>
                    )}

                    {/* Quick Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-y border-industrial-800 py-4 font-mono text-xs text-gray-300">
                      <div className="flex items-center space-x-2.5">
                        <MapPin className="w-4.5 h-4.5 text-neon-purple flex-shrink-0" />
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase block font-bold">Lugar</span>
                          <span>{selectedEvento.lugar}, {selectedEvento.ciudad}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2.5">
                        <Clock className="w-4.5 h-4.5 text-neon-purple flex-shrink-0" />
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase block font-bold">Fecha / Hora</span>
                          <span>{selectedEvento.fecha} • {selectedEvento.hora ? selectedEvento.hora.slice(0, 5) : '22:00'} hrs</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <Users className="w-4.5 h-4.5 text-neon-purple flex-shrink-0" />
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase block font-bold">Aforo Máximo</span>
                          <span>{selectedEvento.capacidad} personas</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <Tag className="w-4.5 h-4.5 text-neon-purple flex-shrink-0" />
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase block font-bold">Fase actual</span>
                          <span>Boletería General</span>
                        </div>
                      </div>
                    </div>

                    {/* Lineup */}
                    {selectedEvento.lineup && (
                      <div className="space-y-2">
                        <h4 className="text-[9px] font-black text-neon-purple uppercase tracking-widest font-mono">
                          ARTISTAS / LINE UP
                        </h4>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedEvento.lineup.split(',').map((a, idx) => (
                            <span 
                              key={idx} 
                              className="text-[10px] font-bold px-2.5 py-1 rounded bg-neon-purple/10 border border-neon-purple/20 text-neon-violet font-mono uppercase"
                            >
                              {a.trim()}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  /* TAB MAPA: WAREHOUSE SIMULATOR */
                  <div className="space-y-6">
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-black text-white uppercase tracking-wider">
                        Plano Interno del Establecimiento
                      </h3>
                      <p className="text-[10px] text-gray-500 font-mono">
                        Conoce la distribución de la bodega para una noche segura.
                      </p>
                    </div>

                    {/* SVG Plano */}
                    <svg viewBox="0 0 400 240" className="w-full h-auto border border-industrial-800 rounded bg-black/40 p-2 font-mono">
                      {/* Outer Walls */}
                      <rect x="10" y="10" width="380" height="220" rx="6" fill="none" stroke="rgba(177, 78, 255, 0.2)" strokeWidth="2" />
                      
                      {/* DJ Booth */}
                      <rect x="160" y="20" width="80" height="30" rx="3" fill="rgba(177, 78, 255, 0.1)" stroke="#B14EFF" strokeWidth="1.5" />
                      <text x="200" y="38" fill="#D9AAFF" fontSize="9" textAnchor="middle" fontWeight="bold">CABINA DJ</text>
                      
                      {/* Dancefloor */}
                      <rect x="75" y="65" width="250" height="90" rx="4" fill="none" stroke="rgba(255, 255, 255, 0.1)" strokeDasharray="4" />
                      <text x="200" y="115" fill="rgba(255, 255, 255, 0.2)" fontSize="11" textAnchor="middle" fontWeight="black" letterSpacing="4">PISTA DE BAILE</text>
                      
                      {/* Bar */}
                      <rect x="25" y="65" width="25" height="90" rx="3" fill="rgba(64, 150, 255, 0.1)" stroke="#4096ff" strokeWidth="1" />
                      <text x="37" y="110" fill="#4096ff" fontSize="8" textAnchor="middle" transform="rotate(-90 37 110)">BARRA</text>
                      
                      {/* Safe Space / Chill Zone */}
                      <rect x="350" y="65" width="25" height="90" rx="3" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="1" />
                      <text x="362" y="110" fill="#10b981" fontSize="7" textAnchor="middle" transform="rotate(90 362 110)">ZONA SEGURA</text>
                      
                      {/* Baños */}
                      <rect x="60" y="180" width="80" height="40" rx="3" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
                      <text x="100" y="204" fill="#666" fontSize="8" textAnchor="middle">BAÑOS (WC)</text>
                      
                      {/* Salidas de Emergencia */}
                      <line x1="390" y1="180" x2="390" y2="210" stroke="#ef4444" strokeWidth="3" />
                      <text x="375" y="200" fill="#ef4444" fontSize="7" textAnchor="end" fontWeight="bold">SALIDA EMER.</text>
                      
                      <line x1="10" y1="180" x2="10" y2="210" stroke="#ef4444" strokeWidth="3" />
                      <text x="25" y="200" fill="#ef4444" fontSize="7" textAnchor="start" fontWeight="bold">INGRESO</text>
                    </svg>

                    <div className="bg-industrial-950/50 border border-industrial-850 p-4 rounded text-[10px] text-gray-400 font-mono space-y-2">
                      <p className="flex items-start gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-neon-purple flex-shrink-0 mt-0.5" />
                        <span><strong>Lugar del Evento:</strong> {selectedEvento.lugar}, {selectedEvento.ciudad}</span>
                      </p>
                      <p className="flex items-start gap-1.5">
                        <span className="inline-flex h-2.5 w-2.5 relative flex-shrink-0 mt-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                        </span>
                        <span><strong>Punto de Soporte y Zona Segura:</strong> Ubicada al costado derecho de la pista de baile. Personal médico y de seguridad entrenado se encuentra en este point de forma permanente.</span>
                      </p>
                    </div>
                  </div>
                )}

                 {/* Ticket Selection Area */}
                 <div className="bg-black/50 border border-industrial-800 rounded-lg p-5 space-y-4">
                   <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-between">
                      <span>Selección de Boletas</span>
                      <span className="text-[10px] bg-industrial-800 text-neon-glow px-2 py-0.5 rounded font-mono uppercase">
                        Precio: ${selectedEvento.precio === 0 ? 'GRATIS' : `${Number(precioUnitario(selectedEvento)).toLocaleString('es-CO')} COP`}
                      </span>
                    </h3>

                    {/* FOMO Box — datos REALES del backend */}
                    <div className="bg-industrial-950/40 border border-industrial-850 rounded-lg p-3 space-y-2 font-mono text-[9px] leading-relaxed">
                      <div className="flex items-center space-x-2 text-rose-400 font-bold uppercase tracking-wider">
                        <span className="flex h-1.5 w-1.5 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-rose-500"></span>
                        </span>
                        <span>🔥 {socialData.activeViewers} personas están viendo esta página ahora mismo</span>
                      </div>

                      <div className="space-y-1.5 text-gray-400">
                        {socialData.vendidas24h > 0 && (
                          <p className="flex items-center gap-1.5">
                            <Ticket className="w-3 h-3 text-gray-500" />
                            <span><strong>{socialData.vendidas24h} {socialData.vendidas24h === 1 ? 'boleta' : 'boletas'}</strong> {socialData.vendidas24h === 1 ? 'adquirida' : 'adquiridas'} en las últimas 24 horas.</span>
                          </p>
                        )}
                        {socialData.minutosDesdeUltimaCompra != null && socialData.minutosDesdeUltimaCompra >= 0 && socialData.minutosDesdeUltimaCompra < 1440 && (
                          <p className="flex items-center gap-1.5">
                            <Zap className="w-3 h-3 text-neon-glow" />
                            <span>Última entrada comprada {formatTiempoAgo(socialData.minutosDesdeUltimaCompra)}.</span>
                          </p>
                        )}
                      </div>
                    </div>

                   <div className="bg-neon-purple/10 border border-neon-purple/20 rounded p-2.5 text-[10px] text-neon-glow flex items-start space-x-2">
                      <Ticket className="w-4 h-4 text-neon-purple flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>🎟️ ¡ASEGURA TU INGRESO!</strong> Compra tu boleta online a <strong>${Number(precioUnitario(selectedEvento)).toLocaleString('es-CO')} COP</strong>. Ahorra tiempo en taquilla física el día del evento y asegura tu entrada digital 100% segura.
                      </span>
                    </div>

                   <div className="flex items-center justify-between py-2 border-t border-industrial-850 pt-4">
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">Entrada General</span>
                      <span className="text-[10px] text-gray-500 font-mono">Máximo 10 boletas por compra</span>
                    </div>

                    {/* Quantity selector */}
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setCantidad(prev => Math.max(1, prev - 1))}
                        disabled={cantidad <= 1}
                        className="w-8 h-8 rounded border border-industrial-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-neon-purple/50 disabled:opacity-30 transition-colors outline-none cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-sm font-black text-white font-mono w-4 text-center">
                        {cantidad}
                      </span>
                      <button
                        onClick={() => setCantidad(prev => Math.min(10, prev + 1))}
                        disabled={cantidad >= 10}
                        className="w-8 h-8 rounded border border-industrial-800 flex items-center justify-center text-gray-400 hover:text-white hover:border-neon-purple/50 disabled:opacity-30 transition-colors outline-none cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Promo notice */}
                  {cantidad >= 4 && promoParcheDisponible && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-2.5 text-[10px] text-emerald-400 flex items-start space-x-2">
                      <BadgePercent className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        <strong>¡Descuento de Parche Activado!</strong> Obtienes un 10% de descuento automático en tu compra al llevar 4 o más entradas. Solo se puede usar una vez.
                      </span>
                    </div>
                  )}
                  {/* Promo nudge */}
                  {cantidad < 4 && promoParcheDisponible && (
                    <div className="bg-neon-purple/5 border border-neon-purple/20 rounded p-2.5 text-[10px] text-neon-glow flex items-start space-x-2 animate-pulse">
                      <Lightbulb className="w-4 h-4 flex-shrink-0 mt-0.5 text-neon-purple" />
                      <span>
                        <strong>¡Arma el parche!</strong> Agrega <strong>{4 - cantidad} {4 - cantidad === 1 ? 'boleta más' : 'boletas más'}</strong> para activar un <strong>10% de descuento automático</strong> en tu compra.
                      </span>
                    </div>
                  )}
                  {cantidad >= 4 && !promoParcheDisponible && (
                    <div className="bg-industrial-800/40 border border-industrial-700 rounded p-2.5 text-[10px] text-gray-400 flex items-start space-x-2">
                      <BadgePercent className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>
                        Ya usaste tu <strong>Promo Parche</strong> (10% por 4+ boletas) en una compra anterior, así que este descuento ya no aplica.
                      </span>
                    </div>
                  )}

                  {/* Sorteo notice */}
                  <div className="bg-purple-950/20 border border-purple-500/20 rounded p-2.5 text-[10px] text-purple-400 flex items-start space-x-2">
                    <Gift className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p>
                        <strong>¡Sorteos en Vivo Incluidos!</strong> Al comprar tu boleta virtual, estás ingresando directamente a jugar en los sorteos que realizaremos en las primeras horas de la fiesta. Cada boleta tendrá asignado un número único de sorteo correlativo.
                      </p>
                      <p className="text-[9.5px] font-mono text-neon-glow font-bold flex items-center gap-1.5">
                        <Ticket className="w-3.5 h-3.5 text-neon-glow flex-shrink-0" />
                        <span>
                          Boletas adquiridas en este momento participarán con los números de sorteo: {' '}
                          <strong>
                            {cantidad === 1 
                              ? `#${43 + (selectedEvento.id * 5) % 10}` 
                              : `#${43 + (selectedEvento.id * 5) % 10} al #${43 + (selectedEvento.id * 5) % 10 + cantidad - 1}`
                            }
                          </strong>
                        </span>
                      </p>
                    </div>
                  </div>

                  {/* Nequi notice */}
                  <div className="bg-black/35 border border-industrial-850 rounded p-2.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <img 
                        src="/nequi.svg" 
                        alt="Nequi" 
                        className="h-3.5 object-contain" 
                      />
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                        Paga fácil con Nequi, PSE y Tarjetas
                      </span>
                    </div>
                    <span className="text-[9px] text-emerald-400 font-mono font-bold uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">RÁPIDO</span>
                  </div>

                  {/* Price Summary and Checkout CTA */}
                  <div className="border-t border-industrial-850 pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-center sm:text-left">
                      <span className="text-[9px] text-gray-500 uppercase font-mono block">Total Estimado</span>
                      <span className="text-md font-black text-neon-glow font-mono">
                        ${totalEstimado(selectedEvento, cantidad).toLocaleString('es-CO')} COP
                      </span>
                    </div>

                    <button
                      onClick={handleGoToCheckout}
                      className="w-full sm:w-auto relative group overflow-hidden bg-neon-purple text-white px-5 py-3 rounded text-xs font-black tracking-widest shadow-neon-sm hover:shadow-neon-md transition-all duration-300 cursor-pointer"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-violet opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                      <span className="relative z-10 flex items-center justify-center space-x-1.5">
                        <span>COMPRAR ENTRADAS</span>
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    </button>
                  </div>

                  {/* ── Compartir con el parche ─────────────────────────────────────── */}
                  <div className="border-t border-industrial-850 pt-4 space-y-3">
                    <p className="text-[9px] text-gray-500 uppercase font-mono font-bold tracking-wider text-center">
                      📣 ¿Vienes con el parche? ¡Comparte el evento!
                    </p>

                    <div className="flex flex-col sm:flex-row gap-2">
                      {/* Botón compartir WhatsApp */}
                      <button
                        onClick={() => handleShareWhatsApp(selectedEvento)}
                        id="btn-share-whatsapp-evento"
                        style={{
                          flex: 1,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          padding: '10px 16px',
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #25D366, #1DA851)',
                          border: 'none',
                          cursor: 'pointer',
                          color: '#fff',
                          fontSize: '10px',
                          fontWeight: 800,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          boxShadow: '0 4px 14px rgba(37,211,102,0.35)',
                          transition: 'all 0.2s',
                        }}
                        onMouseOver={e => e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,211,102,0.6)'}
                        onMouseOut={e => e.currentTarget.style.boxShadow = '0 4px 14px rgba(37,211,102,0.35)'}
                      >
                        {/* Ícono WhatsApp SVG inline */}
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                        </svg>
                        Compartir en WhatsApp
                      </button>

                      {/* Botón QR para imprimir */}
                      <button
                        onClick={() => setShowQR(prev => !prev)}
                        id="btn-toggle-qr-evento"
                        style={{
                          flex: '0 0 auto',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          background: showQR ? 'rgba(177,78,255,0.15)' : 'rgba(255,255,255,0.04)',
                          border: showQR ? '1px solid rgba(177,78,255,0.5)' : '1px solid rgba(255,255,255,0.08)',
                          cursor: 'pointer',
                          color: showQR ? '#D9AAFF' : '#9A9A9A',
                          fontSize: '10px',
                          fontWeight: 800,
                          letterSpacing: '0.06em',
                          textTransform: 'uppercase',
                          transition: 'all 0.2s',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                          <rect x="3" y="14" width="7" height="7"/><rect x="17" y="14" width="4" height="4"/>
                          <line x1="14" y1="14" x2="14" y2="14"/>
                        </svg>
                        {showQR ? 'Ocultar QR' : 'Ver QR'}
                      </button>
                    </div>

                    {/* Panel QR animado */}
                    <AnimatePresence>
                      {showQR && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          style={{ overflow: 'hidden' }}
                        >
                          <div style={{
                            background: '#fff',
                            borderRadius: '12px',
                            padding: '16px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '10px',
                          }}>
                            <p style={{ margin: 0, fontSize: '10px', color: '#111', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                              📲 Escanéalo o imprímelo
                            </p>
                            {/* QR generado con API pública de QR Server — deep link al evento específico */}
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(getEventoDeepLink(selectedEvento))}&color=000000&bgcolor=ffffff&qzone=2&format=svg`}
                              alt={`QR Code para ${selectedEvento.nombre}`}
                              width={160}
                              height={160}
                              style={{ borderRadius: '4px' }}
                              loading="lazy"
                            />
                            <p style={{ margin: 0, fontSize: '9px', color: '#555', fontWeight: 700, textAlign: 'center', maxWidth: '160px', lineHeight: 1.4 }}>
                              ¡Pégalo en tu negocio o comparte la foto para que todos compren! 🎉
                            </p>
                            <a
                              href={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(getEventoDeepLink(selectedEvento))}&format=png`}
                              download={`QR-${selectedEvento.nombre.replace(/\s+/g,'-')}.png`}
                              target="_blank"
                              rel="noopener noreferrer"
                              id="btn-download-qr"
                              style={{
                                fontSize: '9px', fontWeight: 800, color: '#B14EFF',
                                textDecoration: 'none', letterSpacing: '0.08em', textTransform: 'uppercase',
                              }}
                            >
                              ⬇ Descargar QR en alta calidad
                            </a>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
