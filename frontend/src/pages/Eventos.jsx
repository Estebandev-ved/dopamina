import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { MapPin, Clock, Users, Minus, Plus, X, Ticket, BadgePercent, ArrowRight, Play, Pause } from 'lucide-react';

/**
 * Página pública de próximos eventos de Dopamina.
 * Los datos se obtienen del backend sin autenticación.
 */
export default function Eventos() {
  const navigate = useNavigate();
  const [eventos, setEventos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  const [selectedEvento, setSelectedEvento] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [activeModalTab, setActiveModalTab] = useState('info'); // 'info' | 'mapa'
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  // Promo de 4+ boletas: de un solo uso por usuario. Para usuarios no logueados se
  // muestra como disponible (verán el estado real al pagar tras iniciar sesión).
  const [promoParcheDisponible, setPromoParcheDisponible] = useState(true);
  const audioRef = useRef(null);

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

  // ── Helpers de preventa ─────────────────────────────────────────────────────
  // Entradas de preventa aún disponibles para un evento.
  const preventaRestante = (ev) => {
    if (!ev || ev.precioPreventa == null || !ev.cantidadPreventa) return 0;
    return Math.max(0, ev.cantidadPreventa - (ev.vendidas || 0));
  };

  // Precio "desde" que se muestra: el de preventa si todavía quedan cupos.
  const precioDesde = (ev) => (preventaRestante(ev) > 0 ? ev.precioPreventa : (ev?.precio || 0));

  // Total estimado de una compra aplicando precio mixto de preventa + descuento por cantidad.
  // Espeja el cálculo del backend para que coincida con el cobro real de la pasarela.
  const totalEstimado = (ev, cant) => {
    if (!ev) return 0;
    const precioRegular = ev.precio || 0;
    let subtotal;
    const rest = preventaRestante(ev);
    if (rest > 0) {
      const enPreventa = Math.min(cant, rest);
      subtotal = enPreventa * ev.precioPreventa + (cant - enPreventa) * precioRegular;
    } else {
      subtotal = cant * precioRegular;
    }
    // El 10% por 4+ boletas solo aplica si el usuario aún no usó la promo.
    const aplicaPromo = cant >= 4 && promoParcheDisponible;
    return subtotal * (aplicaPromo ? 0.9 : 1);
  };

  const handleSelectEvento = (evento) => {
    setSelectedEvento(evento);
    setCantidad(1);
    setActiveModalTab('info');
    setIsPlayingPreview(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
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
    const matchesFiltro = filtro === 'destacados' ? e.destacado : true;
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
                      <span className="bg-neon-purple/10 border border-neon-purple/20 text-neon-glow text-[7px] font-bold tracking-widest px-1.5 py-0.5 rounded uppercase leading-none">
                        ⭐ DESTACADO
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-3 text-[10px] text-gray-500 font-mono">
                    <span>📍 {evento.lugar}, {evento.ciudad}</span>
                    <span className="hidden md:inline">•</span>
                    <span>🕐 {formatHora(evento.hora)} hrs</span>
                    {evento.capacidad && (
                      <>
                        <span className="hidden md:inline">•</span>
                        <span>👥 Aforo: {evento.capacidad}</span>
                      </>
                    )}
                  </div>

                  {lineupInline && (
                    <p className="text-[10px] text-neon-violet font-semibold tracking-wider font-mono truncate uppercase mt-0.5 text-center md:text-left">
                      {lineupInline}
                    </p>
                  )}
                </div>

                {/* Right Side: Price and Action */}
                <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-industrial-800/40 flex-shrink-0">
                  <div className="text-left md:text-right font-mono">
                    <span className="text-[8px] text-gray-600 uppercase block leading-none">{preventaRestante(evento) > 0 ? 'Preventa desde' : 'Boletas desde'}</span>
                    <span className="text-xs font-black text-white">{formatPrecio(precioDesde(evento))}</span>
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
                  <span className="absolute top-4 left-4 bg-neon-purple text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase">
                    ⭐ Destacado
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
                        <span className="text-neon-purple text-base">📍</span>
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase block font-bold">Lugar</span>
                          <span>{selectedEvento.lugar}, {selectedEvento.ciudad}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2.5">
                        <span className="text-neon-purple text-base">🕐</span>
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase block font-bold">Fecha / Hora</span>
                          <span>{selectedEvento.fecha} • {selectedEvento.hora ? selectedEvento.hora.slice(0, 5) : '22:00'} hrs</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <span className="text-neon-purple text-base">👥</span>
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase block font-bold">Aforo Máximo</span>
                          <span>{selectedEvento.capacidad} personas</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2.5">
                        <span className="text-neon-purple text-base">🎫</span>
                        <div>
                          <span className="text-[9px] text-gray-500 uppercase block font-bold">Fase actual</span>
                          <span>Preventa General</span>
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
                      <p>
                        📍 <strong>Lugar del Evento:</strong> {selectedEvento.lugar}, {selectedEvento.ciudad}
                      </p>
                      <p>
                        🟢 <strong>Punto de Soporte y Zona Segura:</strong> Ubicada al costado derecho de la pista de baile. Personal médico y de seguridad entrenado se encuentra en este punto de forma permanente.
                      </p>
                    </div>
                  </div>
                )}

                {/* Ticket Selection Area */}
                <div className="bg-black/50 border border-industrial-800 rounded-lg p-5 space-y-4">
                  <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center justify-between">
                    <span>Selección de Boletas</span>
                    <span className="text-[10px] bg-industrial-800 text-neon-glow px-2 py-0.5 rounded font-mono uppercase">
                      Precio: ${selectedEvento.precio === 0 ? 'GRATIS' : `${Number(precioDesde(selectedEvento)).toLocaleString('es-CO')} COP`}
                    </span>
                  </h3>

                  {preventaRestante(selectedEvento) > 0 && (
                    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-2.5 text-[10px] text-emerald-400 flex items-start space-x-2">
                      <span className="text-sm flex-shrink-0 mt-0.5">🎟️</span>
                      <span>
                        <strong>¡Preventa activa!</strong> Las primeras {selectedEvento.cantidadPreventa} entradas a ${Number(selectedEvento.precioPreventa).toLocaleString('es-CO')} c/u. Quedan {preventaRestante(selectedEvento)} a este precio; luego suben a ${Number(selectedEvento.precio).toLocaleString('es-CO')}.
                      </span>
                    </div>
                  )}

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
                    <span className="text-sm flex-shrink-0 mt-0.5">🎰</span>
                    <span>
                      <strong>¡Sorteos en Vivo Incluidos!</strong> Al comprar tu boleta virtual, estás ingresando directamente a jugar en los sorteos que realizaremos en las primeras horas de la fiesta. Cada boleta tendrá asignado un número único de sorteo correlativo.
                    </span>
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
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
