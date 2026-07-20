import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { motion, useScroll, useTransform } from 'framer-motion';
import PageTransition from '../components/PageTransition';
import { Ticket, Radio, Flame, Sparkles, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck, Send, Gift, EyeOff, MessageCircle, Music, SkipBack, SkipForward, ChevronDown, ChevronUp } from 'lucide-react';
import heroBg from '../assets/hero-bg.png';

/**
 * Homepage for Dopamina Crew portal.
 * Features:
 * - Industrial Hero featuring the event 'Borrachos pero nunca fachos'.
 * - Interactive timeline for 3 music blocks.
 * - Ticket booking triggering secured backend endpoints.
 * Security: all user inputs are validated server-side; no sensitive data stored in state.
 */
export default function Home() {
  const navigate = useNavigate();
  const currentUser = api.getUser();
  const homeContainerRef = useRef(null);

  const { scrollY } = useScroll();
  const yBg = useTransform(scrollY, [0, 800], [0, 100]);
  const opacityBg = useTransform(scrollY, [0, 800], [1, 0]);

  const [activeBlock, setActiveBlock] = useState(0);
  const [purchaseStatus, setPurchaseStatus] = useState(null);
  const [purchaseMessage, setPurchaseMessage] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [suggestionText, setSuggestionText] = useState('');
  const [suggestionNombre, setSuggestionNombre] = useState('');
  const [suggestionEmail, setSuggestionEmail] = useState('');
  const [suggestionSubmitted, setSuggestionSubmitted] = useState(false);
  const [submittingSuggestion, setSubmittingSuggestion] = useState(false);

  const [featuredEvent, setFeaturedEvent] = useState(null);
  const [loadingEvent, setLoadingEvent] = useState(true);

  // Sets musicales (YouTube)
  const [sets, setSets] = useState([]);
  const [currentSetIdx, setCurrentSetIdx] = useState(0);
  const [showSetSelector, setShowSetSelector] = useState(false);
  const playerRef = useRef(null);
  const playerReadyRef = useRef(false);
  const containerRefPlayer = useRef(null);

  const getYoutubeId = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  };

  const currentSet = sets[currentSetIdx] || null;
  const youtubeId = currentSet ? getYoutubeId(currentSet.youtubeUrl) : null;


  // FAQ and Contact states
  const [faqOpen, setFaqOpen] = useState(null);
  const [contactForm, setContactForm] = useState({ nombre: '', email: '', mensaje: '' });
  const [contactSuccess, setContactSuccess] = useState(false);
  const [submittingContact, setSubmittingContact] = useState(false);

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    if (!contactForm.nombre || !contactForm.email || !contactForm.mensaje) return;
    setSubmittingContact(true);
    try {
      await api.enviarSugerencia(contactForm.mensaje, contactForm.nombre, contactForm.email);
      setContactSuccess(true);
      setContactForm({ nombre: '', email: '', mensaje: '' });
      setTimeout(() => setContactSuccess(false), 5000);
    } catch (err) {
      console.error('Error al enviar mensaje de contacto:', err);
    } finally {
      setSubmittingContact(false);
    }
  };

  // Suggestion box handler
  const handleSuggestionSubmit = async (e) => {
    e.preventDefault();
    if (!suggestionText.trim()) return;
    setSubmittingSuggestion(true);
    try {
      await api.enviarSugerencia(suggestionText.trim(), suggestionNombre.trim(), suggestionEmail.trim());
      setSuggestionSubmitted(true);
      setSuggestionText('');
      setSuggestionNombre('');
      setSuggestionEmail('');
      setTimeout(() => setSuggestionSubmitted(false), 5000);
    } catch (err) {
      console.error('Error al enviar sugerencia:', err);
    } finally {
      setSubmittingSuggestion(false);
    }
  };

  // YouTube IFrame Player API
  const loadYoutubeApi = useCallback(() => {
    if (window.YT) return;
    const tag = document.createElement('script');
    tag.src = `https://www.youtube.com/iframe_api?origin=${encodeURIComponent(window.location.origin)}`;
    const first = document.getElementsByTagName('script')[0];
    first.parentNode.insertBefore(tag, first);
  }, []);

  const createPlayer = useCallback((videoId) => {
    if (!containerRefPlayer.current) return;
    if (playerRef.current) {
      playerRef.current.loadVideoById(videoId);
      playerRef.current.playVideo();
      return;
    }
    playerRef.current = new window.YT.Player(containerRefPlayer.current, {
      height: '360',
      width: '640',
      videoId: videoId,
      playerVars: { autoplay: 1, rel: 0, modestbranding: 1, origin: window.location.origin },
      events: {
        onReady: (e) => {
          playerReadyRef.current = true;
          e.target.playVideo();
        },
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.PLAYING) setIsPlaying(true);
          else if (e.data === window.YT.PlayerState.ENDED) setIsPlaying(false);
          else if (e.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
        },
      },
    });
  }, []);

  useEffect(() => {
    loadYoutubeApi();
    window.onYouTubeIframeAPIReady = () => {};
    return () => {
      if (playerRef.current) {
        playerRef.current.destroy();
        playerRef.current = null;
      }
    };
  }, [loadYoutubeApi]);

  const playCurrentSet = useCallback(() => {
    if (!youtubeId) return;
    if (window.YT && window.YT.Player) {
      createPlayer(youtubeId);
    } else {
      loadYoutubeApi();
      const checkReady = setInterval(() => {
        if (window.YT && window.YT.Player) {
          clearInterval(checkReady);
          createPlayer(youtubeId);
        }
      }, 300);
    }
  }, [youtubeId, createPlayer, loadYoutubeApi]);

  const stopCurrentSet = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
    setIsPlaying(false);
  }, []);

  const handleTogglePlay = () => {
    if (isPlaying) {
      stopCurrentSet();
    } else {
      playCurrentSet();
    }
  };

  const handlePrevSet = useCallback(() => {
    if (playerRef.current) playerRef.current.destroy();
    playerRef.current = null;
    playerReadyRef.current = false;
    setIsPlaying(false);
    setCurrentSetIdx(prev => (prev - 1 + sets.length) % sets.length);
  }, [sets.length]);

  const handleNextSet = useCallback(() => {
    if (playerRef.current) playerRef.current.destroy();
    playerRef.current = null;
    playerReadyRef.current = false;
    setIsPlaying(false);
    setCurrentSetIdx(prev => (prev + 1) % sets.length);
  }, [sets.length]);

  // Fetch sets from API
  useEffect(() => {
    api.getSets()
      .then(data => {
        setSets(data || []);
        if (data && data.length > 0) {
          setCurrentSetIdx(0);
        }
      })
      .catch(() => {});
  }, []);

  React.useEffect(() => {
    api.getEventos()
      .then(data => {
        const featured = data.find(e => e.destacado) || data[0];
        setFeaturedEvent(featured || null);
        setLoadingEvent(false);
      })
      .catch(() => {
        setLoadingEvent(false);
      });
  }, []);

  const musicalBlocks = [
    {
      title: "Bloque 1: Reggaetón Clásico",
      genre: "Old School & Marquesina",
      hours: "22:00 - 00:30",
      description: "Apenas empieza la fiesta y ya estamos listos para romperla. Volviendo a las raíces del perreo de marquesina (2000 - 2012) mientras hacemos nuestros primeros sorteos de la noche. Bajos analógicos sucios, líricas que marcaron una generación y el golpe rítmico inconfundible del dembow crudo.",
      color: "from-purple-500/25 to-transparent",
      icon: <Gift className="w-8 h-8 text-neon-glow" />,
      tagline: "Comienza la fiesta. Sorteos y regalos."
    },
    {
      title: "Bloque 2: Shows y Sorpresas",
      genre: "Experiencia en Vivo",
      hours: "⏱️ Hora Incógnita",
      description: "La noche guarda secretos que no te podemos contar... aún. Shows en vivo, presentaciones especiales y momentos únicos que solo los que estén presentes podrán vivir. El misterio es parte de la experiencia.",
      color: "from-pink-500/25 to-transparent",
      icon: <EyeOff className="w-8 h-8 text-neon-glow" />,
      tagline: "El misterio es parte de la noche."
    },
    {
      title: "Bloque 3: Dancehall & Perreo Pesado",
      genre: "Riddims & Sub-Bajos Densos",
      hours: "Hasta que el cuerpo aguante",
      description: "El punto de quiebre de la noche. Fusión de beats jamaiquinos con bajos subsaturados que golpean el pecho. Dancehall, perreo pesado y el sudor de la pista en su punto más álgido. Esto apenas se pone bueno.",
      color: "from-neon-purple/25 to-transparent",
      icon: <Flame className="w-8 h-8 text-neon-glow" />,
      tagline: "Perreo intenso hasta el amanecer."
    }
  ];

  const faqs = [
    {
      q: "¿Es seguro comprar en esta web?",
      a: "Totalmente. Nuestra plataforma cuenta con certificados de seguridad SSL de 256 bits para proteger tus datos de registro y pago. Adicionalmente, el sistema genera códigos QR únicos con identificadores UUID independientes para cada boleta. Cada entrada se valida en tiempo real en la puerta, haciendo imposible la clonación o reventa no autorizada."
    },
    {
      q: "¿Cuáles son los métodos de pago aceptados?",
      a: "Aceptamos pagos rápidos y 100% seguros con Nequi, cuentas de ahorro/corriente a través de PSE y Tarjetas de Crédito de cualquier franquicia (Visa, Mastercard, Amex) a través de la pasarela de pagos Efipay. Al completar el pago, tus boletas se generarán de inmediato en tu perfil."
    },
    {
      q: "¿Pueden ingresar menores de edad?",
      a: "NO. El evento es de carácter exclusivo para mayores de 18 años (+18). Al ingresar se exigirá la presentación del documento de identidad físico y original (cédula o pasaporte). No se admiten menores de edad. En caso de que un menor adquiera una boleta y se presente al evento, no se le permitirá el ingreso y NO se realizarán reembolsos de dinero bajo ningún motivo."
    },
    {
      q: "¿Cómo recibo mis boletas después de pagar?",
      a: "Tus entradas se generan de forma instantánea en tu perfil de usuario. Puedes acceder a ellas haciendo clic en tu nombre en la barra de navegación y entrando a 'Mis Boletas' (/dashboard). Allí verás las tarjetas individuales con sus correspondientes códigos QR listos para mostrar desde tu celular o imprimir. También recibirás un correo electrónico de confirmación."
    },
    {
      q: "¿Qué pasa si compro boletas para mis amigos?",
      a: "Cuando compras múltiples boletas (ej. 4 boletas), el sistema genera 4 boletas individuales con 4 códigos QR únicos. Puedes descargar cada boleta y enviársela a tus amigos. El lector en puerta validará cada código QR de manera independiente. Una vez escaneada cada boleta en puerta, su estado cambiará a 'USADA' y nadie más podrá ingresar con ese mismo código."
    }
  ];

  const handleBuyTicket = () => {
    if (!featuredEvent) {
      navigate('/eventos');
      return;
    }
    if (!api.getUser()) {
      navigate('/login', { state: { from: '/checkout', eventoState: { evento: featuredEvent, cantidad: 1 } } });
    } else {
      navigate('/checkout', { state: { evento: featuredEvent } });
    }
  };

  const handleVerCombos = () => {
    if (!featuredEvent) {
      navigate('/eventos');
      return;
    }
    if (!api.getUser()) {
      navigate('/login', { state: { from: '/combos', eventoState: { evento: featuredEvent } } });
    } else {
      navigate('/combos', { state: { evento: featuredEvent } });
    }
  };

  return (
    <PageTransition>
      <div ref={homeContainerRef} className="relative min-h-screen bg-black flex flex-col overflow-x-hidden">

        {/* Parallax Background Image */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {/* On mobile: static image (no parallax to avoid layout shifts). On sm+: parallax motion */}
          <motion.div
            style={{ y: yBg, opacity: opacityBg }}
            className="absolute top-0 left-0 w-full h-full sm:-top-[5%] sm:h-[110%]"
          >
            <img
              src={heroBg}
              alt="Dopamina Party"
              className="w-full h-full object-cover object-top brightness-[0.45]"
            />
            {/* Gradient: stronger top darkening on mobile so navbar is readable */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/10 to-black z-10" />
          </motion.div>
        </div>

        {/* Decorative Grid and Glow — behind text, not over the photo */}
        <div className="absolute inset-0 industrial-grid opacity-10 pointer-events-none z-10" />
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-neon-purple/5 rounded-full blur-[160px] pointer-events-none z-10" />

        {/* HERO SECTION */}
        <div className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 sm:pt-20 pb-16 text-center z-20">

          {/* Launch badge */}
          <div className="inline-flex items-center space-x-2 border border-neon-purple/30 bg-neon-purple/5 px-3 py-1.5 sm:px-4 rounded-full mb-5 sm:mb-6 mx-auto">
            <span className="w-2 h-2 rounded-full bg-neon-glow animate-pulse flex-shrink-0" />
            <span className="text-[10px] sm:text-xs font-black tracking-[0.15em] sm:tracking-[0.2em] text-neon-glow uppercase">
              Primer Lanzamiento • Dopamina
            </span>
          </div>

          <h2 className="text-xs sm:text-sm font-semibold tracking-[0.2em] sm:tracking-[0.4em] text-gray-500 uppercase mb-3">
            El Siguiente Capítulo
          </h2>

          {/* Event Title — scales down on xs screens to prevent overflow */}
          <h1 className="text-3xl sm:text-6xl md:text-7xl font-black tracking-tight leading-[1.05] mb-5 sm:mb-6 uppercase px-2 text-white sm:text-transparent sm:bg-clip-text sm:bg-gradient-to-b sm:from-white sm:via-gray-300 sm:to-gray-700">
            {featuredEvent ? featuredEvent.nombre : (
              <>
                BORRACHOS PERO
                <br />
                <span className="text-neon-glow">NUNCA FACHOS</span>
              </>
            )}
          </h1>

          {/* CTA BUTTONS — full-width on mobile */}
          <div className="flex flex-col items-center justify-center space-y-3 px-4 sm:px-0">
            {featuredEvent ? (
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handleBuyTicket}
                  className="group relative overflow-hidden rounded-md bg-neon-purple w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-sm font-black tracking-[0.2em] sm:tracking-[0.25em] text-white shadow-neon-md hover:shadow-neon-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 min-h-[52px] touch-manipulation"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-purple via-neon-glow to-neon-violet opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <span className="relative z-10 flex items-center space-x-3 justify-center">
                    <Ticket className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" />
                    <span>ADQUIRIR ENTRADA</span>
                  </span>
                </button>
                <button
                  onClick={handleVerCombos}
                  className="group relative overflow-hidden rounded-md border-2 border-neon-purple/40 bg-transparent w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-sm font-black tracking-[0.2em] sm:tracking-[0.25em] text-neon-glow hover:bg-neon-purple/10 hover:border-neon-purple/70 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 min-h-[52px] touch-manipulation"
                >
                  <span className="relative z-10 flex items-center space-x-3 justify-center">
                    <Gift className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" />
                    <span>VER COMBOS</span>
                  </span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleBuyTicket}
                className="group relative overflow-hidden rounded-md bg-neon-purple w-full sm:w-auto px-8 sm:px-10 py-4 sm:py-5 text-sm font-black tracking-[0.2em] sm:tracking-[0.25em] text-white shadow-neon-md hover:shadow-neon-lg transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 min-h-[52px] touch-manipulation"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-neon-purple via-neon-glow to-neon-violet opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <span className="relative z-10 flex items-center space-x-3 justify-center">
                  <Ticket className="w-5 h-5 group-hover:rotate-12 transition-transform duration-300 flex-shrink-0" />
                  <span>VER CARTELERA</span>
                </span>
              </button>
            )}
            <p className="text-[10px] text-gray-500 font-mono text-center px-2">
              {featuredEvent
                ? `LUGAR: ${featuredEvent.lugar.toUpperCase()}, ${featuredEvent.ciudad.toUpperCase()} • VALOR ENTRADA: ${featuredEvent.precio === 0 ? 'GRATIS' : `$${Number(featuredEvent.precio).toLocaleString('es-CO')} COP`}`
                : "VALOR PREVENTA: $25.000 COP • CUPO LIMITADO"
              }
            </p>

            {/* FOMO activity banner */}
            {featuredEvent && (
              <div className="flex items-center justify-center gap-2 text-[10px] font-mono text-gray-300 mt-2 bg-black/45 px-4 py-1.5 rounded-full border border-industrial-850 max-w-sm mx-auto shadow-neon-sm">
                <Flame className="w-3.5 h-3.5 text-rose-500 fill-rose-500/20" />
                <span className="font-bold uppercase tracking-wider">¡Boletería de lanzamiento activa!</span>
              </div>
            )}

            {/* Payment methods notice in Hero */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5 p-2 px-4 rounded-lg bg-industrial-950/40 border border-industrial-850/80 max-w-sm mx-auto">
              <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">
                Paga fácil con:
              </span>
              <div className="flex items-center gap-2.5">
                <img 
                  src="/nequi.svg" 
                  alt="Nequi" 
                  className="h-3.5 object-contain" 
                />
                <span className="text-[10px] text-gray-500 font-bold">•</span>
                <span className="text-[10px] text-gray-400 font-black tracking-widest font-mono">PSE</span>
                <span className="text-[10px] text-gray-500 font-bold">•</span>
                <span className="text-[10px] text-gray-400 font-bold font-mono">TARJETAS</span>
              </div>
            </div>
          </div>

          {/* SPONSORS TICKER */}
          <div className="w-full overflow-hidden bg-industrial-950/60 border-y border-industrial-800/80 py-4 sm:py-6 my-10 sm:my-16 relative">
            <div className="absolute left-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-r from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 sm:w-16 bg-gradient-to-l from-black to-transparent z-10 pointer-events-none" />

            <div className="animate-ticker-scroll flex items-center space-x-8 sm:space-x-12 select-none">
              {[1, 2].map((loop) => (
                <React.Fragment key={loop}>
                  <span className="text-xs sm:text-sm font-black text-industrial-400 hover:text-neon-glow font-mono uppercase tracking-[0.2em] sm:tracking-[0.25em] transition-colors duration-300 whitespace-nowrap">JEAN TATTOO</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-industrial-700 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-black text-industrial-400 hover:text-neon-glow font-mono uppercase tracking-[0.2em] sm:tracking-[0.25em] transition-colors duration-300 whitespace-nowrap">VAPES MOCOA</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-industrial-700 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-black text-industrial-400 hover:text-neon-glow font-mono uppercase tracking-[0.2em] sm:tracking-[0.25em] transition-colors duration-300 whitespace-nowrap">TRIBU SHOP</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-industrial-700 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-black text-industrial-400 hover:text-neon-glow font-mono uppercase tracking-[0.2em] sm:tracking-[0.25em] transition-colors duration-300 whitespace-nowrap">GENERACIÓN Z</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-industrial-700 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-black text-industrial-400 hover:text-neon-glow font-mono uppercase tracking-[0.2em] sm:tracking-[0.25em] transition-colors duration-300 whitespace-nowrap">ARAWA CAFÉ</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-industrial-700 flex-shrink-0" />
                  <span className="text-xs sm:text-sm font-black text-industrial-400 hover:text-neon-glow font-mono uppercase tracking-[0.2em] sm:tracking-[0.25em] transition-colors duration-300 whitespace-nowrap">LUAU</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-industrial-700 flex-shrink-0" />
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* TIMELINE SECTION */}
          <div className="border-t border-industrial-800 pt-10 sm:pt-16">
            <h3 className="text-xl sm:text-2xl font-black tracking-widest text-white mb-2 text-center uppercase">
              La Línea de Tiempo
            </h3>
            <p className="text-xs text-gray-500 mb-8 sm:mb-10 text-center font-mono">
              3 BLOQUES MUSICALES • DINÁMICA DE LA NOCHE
            </p>

            {/* Interactive Timeline Tabs */}
            <div className="grid grid-cols-3 gap-1 sm:gap-2 max-w-2xl mx-auto mb-8 sm:mb-10 bg-industrial-950 p-1 border border-industrial-800 rounded-lg">
              {musicalBlocks.map((block, index) => (
                <button
                  key={index}
                  onClick={() => setActiveBlock(index)}
                  className={`py-3 sm:py-3.5 text-center text-[10px] sm:text-xs font-black tracking-wider rounded transition-all duration-300 touch-manipulation min-h-[44px] ${activeBlock === index
                    ? 'bg-neon-purple text-white shadow-neon-sm'
                    : 'text-gray-400 hover:text-white hover:bg-industrial-900'
                    }`}
                >
                  <span className="hidden sm:inline">BLOQUE {index + 1}</span>
                  <span className="sm:hidden">B{index + 1}</span>
                </button>
              ))}
            </div>

            {/* Active Content Detail Card */}
            <div className="max-w-4xl mx-auto bg-industrial-900/60 border border-industrial-800 rounded-lg p-5 sm:p-10 relative overflow-hidden transition-all duration-500 mb-10 sm:mb-16">
              {/* Corner accent glow */}
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${musicalBlocks[activeBlock].color} blur-2xl pointer-events-none`} />

              <div className="flex flex-col md:flex-row md:items-center md:space-x-8 relative z-10">
                {/* Visual Icon */}
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-black border border-neon-purple/30 flex items-center justify-center mb-5 md:mb-0 mx-auto md:mx-0 flex-shrink-0 shadow-neon-sm">
                  {musicalBlocks[activeBlock].icon}
                </div>

                <div className="text-center md:text-left flex-grow">
                  <span className="text-[10px] font-mono tracking-widest bg-industrial-800 text-neon-glow border border-neon-purple/20 px-2 py-0.5 rounded uppercase">
                    {musicalBlocks[activeBlock].hours}
                  </span>
                  <h4 className="text-lg sm:text-2xl font-black text-white mt-3 uppercase tracking-wider leading-tight">
                    {musicalBlocks[activeBlock].title}
                  </h4>
                  <p className="text-xs text-neon-violet font-semibold tracking-wider font-mono mt-1">
                    {musicalBlocks[activeBlock].genre}
                  </p>
                  <p className="text-sm text-gray-400 mt-4 leading-relaxed">
                    {musicalBlocks[activeBlock].description}
                  </p>
                  <div className="flex items-center space-x-2 mt-5 sm:mt-6 justify-center md:justify-start text-xs font-mono text-gray-500">
                    <ArrowRight className="w-3.5 h-3.5 text-neon-glow flex-shrink-0" />
                    <span>{musicalBlocks[activeBlock].tagline}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RESIDENT DJ PLAYER — YouTube Sets */}
            <div className="max-w-xl mx-auto bg-industrial-950 border border-industrial-800 rounded-lg p-4 sm:p-5 shadow-neon-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-neon-purple/5 blur-xl pointer-events-none" />

              {/* YouTube Player container (invisible but active for background audio) */}
              <div ref={containerRefPlayer} style={{ position: 'fixed', bottom: 0, right: 0, width: '320px', height: '180px', opacity: 0.01, pointerEvents: 'none', zIndex: -1 }} />

              {sets.length === 0 ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center space-x-3 sm:space-x-4 z-10 min-w-0">
                    <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-industrial-800 flex items-center justify-center flex-shrink-0">
                      <Radio className="w-5 h-5 text-gray-600" />
                    </div>
                    <div className="text-left min-w-0">
                      <span className="text-[9px] font-mono font-bold text-neon-glow uppercase tracking-widest block">TRANSMISIÓN SONORA</span>
                      <h4 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider truncate">Cargando sets...</h4>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 sm:space-x-4 z-10 min-w-0">
                      <button
                        onClick={handleTogglePlay}
                        disabled={!youtubeId}
                        className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-neon-purple text-white flex items-center justify-center shadow-neon-sm hover:shadow-neon-md hover:scale-105 transition-all duration-300 focus:outline-none flex-shrink-0 touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isPlaying ? (
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current"><rect x="5" y="4" width="4" height="16" /><rect x="15" y="4" width="4" height="16" /></svg>
                        ) : (
                          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current ml-1"><polygon points="5,3 19,12 5,21" /></svg>
                        )}
                      </button>

                      <div className="text-left min-w-0">
                        <span className="text-[9px] font-mono font-bold text-neon-glow uppercase tracking-widest block">TRANSMISIÓN SONORA</span>
                        <h4 className="text-[11px] sm:text-xs font-black text-white uppercase tracking-wider truncate max-w-[160px] sm:max-w-[220px]">
                          {currentSet ? currentSet.titulo : 'Sin sets disponibles'}
                        </h4>
                        {currentSet && currentSet.artista && (
                          <p className="text-[10px] text-gray-500 font-mono mt-0.5 hidden sm:block truncate max-w-[200px]">
                            {currentSet.artista}{currentSet.genero ? ` • ${currentSet.genero}` : ''}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Navegación entre sets */}
                      {sets.length > 1 && (
                        <>
                          <button onClick={handlePrevSet} className="text-gray-500 hover:text-white transition-colors p-1 cursor-pointer" title="Anterior">
                            <SkipBack className="w-4 h-4" />
                          </button>
                          <button onClick={handleNextSet} className="text-gray-500 hover:text-white transition-colors p-1 cursor-pointer" title="Siguiente">
                            <SkipForward className="w-4 h-4" />
                          </button>
                        </>
                      )}

                      {/* Equalizer */}
                      <div className="flex items-end space-x-1 h-8">
                        <div className="eq-bar eq-bar-1" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
                        <div className="eq-bar eq-bar-2" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
                        <div className="eq-bar eq-bar-3" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
                        <div className="eq-bar eq-bar-4" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
                        <div className="eq-bar eq-bar-5" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
                        <div className="eq-bar eq-bar-6" style={{ animationPlayState: isPlaying ? 'running' : 'paused' }} />
                      </div>
                    </div>
                  </div>

                  {/* Selector de sets desplegable */}
                  {sets.length > 1 && (
                    <div className="mt-3 border-t border-industrial-800 pt-2">
                      <button
                        onClick={() => setShowSetSelector(!showSetSelector)}
                        className="flex items-center justify-center gap-1 w-full text-[9px] font-mono text-gray-500 hover:text-gray-300 uppercase tracking-widest transition-colors cursor-pointer"
                      >
                        {showSetSelector ? 'Ocultar' : 'Ver todos los sets'}
                        {showSetSelector ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>

                      {showSetSelector && (
                        <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                          {sets.map((set, idx) => (
                            <button
                              key={set.id}
                              onClick={() => { if (playerRef.current) { playerRef.current.destroy(); playerRef.current = null; } setIsPlaying(false); setCurrentSetIdx(idx); setShowSetSelector(false); }}
                              className={`w-full text-left px-3 py-2 rounded text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                                idx === currentSetIdx
                                  ? 'bg-neon-purple/20 text-neon-glow border border-neon-purple/30'
                                  : 'text-gray-400 hover:bg-industrial-900 hover:text-white border border-transparent'
                              }`}
                            >
                              <span className="font-bold">{set.titulo}</span>
                              {set.artista && <span className="text-gray-500 ml-2">— {set.artista}</span>}
                              {set.genero && <span className="text-neon-purple ml-2 text-[8px]">[{set.genero}]</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

          </div>

          {/* SUGGESTION BOX - QUEREMOS ESCUCHARTE */}
          <div className="border-t border-industrial-800 pt-10 sm:pt-16 mt-10 sm:mt-16 max-w-4xl mx-auto">
            <h3 className="text-xl sm:text-2xl font-black tracking-widest text-white mb-2 text-center uppercase">
              Queremos Escucharte
            </h3>
            <p className="text-xs text-gray-500 mb-8 sm:mb-10 text-center font-mono">
              TÚ DECIDES QUÉ SUENA • OPINA Y PARTICIPA
            </p>

            <div className="bg-industrial-900/60 border border-industrial-800 rounded-lg p-6 sm:p-10 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-32 h-32 bg-neon-purple/5 blur-2xl pointer-events-none" />

              <div className="flex flex-col items-center text-center relative z-10">
                <div className="w-14 h-14 rounded-full bg-black border border-neon-purple/30 flex items-center justify-center mb-5 shadow-neon-sm">
                  <Music className="w-7 h-7 text-neon-glow" />
                </div>

                <h4 className="text-base sm:text-lg font-black text-white uppercase tracking-wider mb-1">
                  ¿Qué canciones quieres escuchar?
                </h4>
                <p className="text-xs text-gray-400 mb-6 max-w-md leading-relaxed">
                  Esta fiesta la hacemos entre todos. Cuéntanos qué géneros, artistas o canciones te gustaría escuchar en la noche. Cada sugerencia la tenemos en cuenta para armar el set perfecto.
                </p>

                <form onSubmit={handleSuggestionSubmit} className="w-full max-w-lg space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      className="w-full bg-black border border-industrial-800 text-sm px-4 py-3 text-white rounded focus:outline-none focus:border-neon-purple font-mono placeholder:text-gray-600"
                      placeholder="Tu nombre (opcional)"
                      value={suggestionNombre}
                      onChange={e => setSuggestionNombre(e.target.value)}
                    />
                    <input
                      type="email"
                      className="w-full bg-black border border-industrial-800 text-sm px-4 py-3 text-white rounded focus:outline-none focus:border-neon-purple font-mono placeholder:text-gray-600"
                      placeholder="Tu email (opcional)"
                      value={suggestionEmail}
                      onChange={e => setSuggestionEmail(e.target.value)}
                    />
                  </div>
                  <textarea
                    required
                    rows="3"
                    className="w-full bg-black border border-industrial-800 text-sm px-4 py-3 text-white rounded focus:outline-none focus:border-neon-purple font-mono resize-none placeholder:text-gray-600"
                    placeholder="Ej: Quiero escuchar más dancehall, pongan a Bad Bunny, necesito perreo de marquesina..."
                    value={suggestionText}
                    onChange={e => setSuggestionText(e.target.value)}
                  />

                  {suggestionSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs rounded font-mono"
                    >
                      ✓ ¡Gracias por tu sugerencia! La tendremos en cuenta para armar la mejor noche.
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingSuggestion}
                    className="w-full bg-industrial-800 hover:bg-neon-purple text-white text-xs font-black tracking-widest py-3.5 rounded uppercase transition-all duration-300 disabled:opacity-40 disabled:hover:bg-industrial-800 flex items-center justify-center space-x-2 touch-manipulation min-h-[48px]"
                  >
                    {submittingSuggestion ? (
                      <span className="w-4 h-4 rounded-full border border-white border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <MessageCircle className="w-4 h-4" />
                        <span>Enviar Sugerencia</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>

          {/* SECCIÓN DE SEGURIDAD, CONFIANZA Y EDAD */}
          <div className="border-t border-industrial-800 pt-10 sm:pt-16 max-w-5xl mx-auto text-left space-y-8 sm:space-y-12 mt-10 sm:mt-16">

            {/* Tarjeta de Advertencia Edad +18 */}
            <div className="bg-rose-950/10 border border-rose-500/30 rounded-lg p-5 sm:p-8 flex flex-col sm:flex-row items-center sm:items-start space-y-4 sm:space-y-0 sm:space-x-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-xl pointer-events-none" />
              <div className="w-12 h-12 rounded-full bg-rose-950/50 border border-rose-500/50 flex items-center justify-center flex-shrink-0 text-rose-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="space-y-2 text-center sm:text-left">
                <h4 className="text-sm sm:text-md font-black text-rose-400 uppercase tracking-wider sm:tracking-widest leading-snug">
                  ADVERTENCIA DE INGRESO: EVENTO EXCLUSIVO +18
                </h4>
                <p className="text-xs text-gray-300 leading-relaxed font-mono">
                  Se requiere documento de identidad original físico (Cédula de Ciudadanía, Cédula de Extranjería o Pasaporte) para el ingreso. No se admiten contraseñas, fotocopias ni imágenes en celulares.
                  <span className="text-rose-400 font-bold block mt-2">
                    ⚠️ IMPORTANTE: Menores de edad que compren entradas no podrán ingresar al establecimiento. Dopamina NO realiza reembolsos, devoluciones ni compensaciones de dinero a menores de edad bajo ninguna circunstancia.
                  </span>
                </p>
              </div>
            </div>

            {/* Grid de Confianza */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 pt-2 sm:pt-4">
              <div className="bg-industrial-900/40 border border-industrial-850 p-5 sm:p-6 rounded-lg space-y-3 hover:border-neon-purple/20 transition-all duration-300">
                <div className="w-10 h-10 rounded bg-neon-purple/5 border border-neon-purple/20 flex items-center justify-center text-neon-glow">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Compra 100% Segura</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Cifrado SSL de 256 bits y pasarela de pagos Efipay con cumplimiento PCI-DSS. Tus datos personales y de pago están completamente resguardados de extremo a extremo.
                </p>
              </div>

              <div className="bg-industrial-900/40 border border-industrial-850 p-5 sm:p-6 rounded-lg space-y-3 hover:border-neon-purple/20 transition-all duration-300">
                <div className="w-10 h-10 rounded bg-neon-purple/5 border border-neon-purple/20 flex items-center justify-center text-neon-glow">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">Proveedor Oficial</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Esta es la boletería oficial del evento Dopamina. Comprar directamente aquí te garantiza el ingreso legítimo y el soporte inmediato de los organizadores.
                </p>
              </div>

              <div className="bg-industrial-900/40 border border-industrial-850 p-5 sm:p-6 rounded-lg space-y-3 hover:border-neon-purple/20 transition-all duration-300">
                <div className="w-10 h-10 rounded bg-neon-purple/5 border border-neon-purple/20 flex items-center justify-center text-neon-glow">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-black text-white uppercase tracking-wider">QRs Únicos e Infalsificables</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Cada entrada genera su propio código QR único mediante hashes no colisionables. El sistema en puerta detecta clonaciones y boletas duplicadas al instante.
                </p>
              </div>
            </div>

            {/* SECCIÓN FAQ Y CONTACTO */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 pt-8 border-t border-industrial-800/60">

              {/* FAQ Left Block */}
              <div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-widest mb-2">
                  Preguntas Frecuentes
                </h3>
                <p className="text-xs text-gray-500 font-mono mb-5 sm:mb-6 uppercase">
                  Respuestas rápidas para resolver tus dudas
                </p>

                <div className="space-y-3 sm:space-y-4">
                  {faqs.map((faq, idx) => (
                    <div
                      key={idx}
                      className="border border-industrial-800 rounded-lg overflow-hidden bg-industrial-950/40 transition-all"
                    >
                      <button
                        onClick={() => setFaqOpen(faqOpen === idx ? null : idx)}
                        className="w-full flex items-center justify-between p-4 text-left text-xs font-bold text-white uppercase tracking-wider hover:bg-industrial-900/40 transition-colors focus:outline-none touch-manipulation min-h-[48px]"
                      >
                        <span className="pr-2 leading-snug">{faq.q}</span>
                        <span className="text-neon-glow font-mono text-base flex-shrink-0 ml-2">
                          {faqOpen === idx ? '−' : '+'}
                        </span>
                      </button>

                      {faqOpen === idx && (
                        <div className="p-4 border-t border-industrial-800 text-xs text-gray-400 leading-relaxed font-mono">
                          {faq.a}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Contact Form Right Block */}
              <div>
                <h3 className="text-base sm:text-lg font-black text-white uppercase tracking-widest mb-2">
                  Contacto y Soporte
                </h3>
                <p className="text-xs text-gray-500 font-mono mb-5 sm:mb-6 uppercase">
                  ¿Tienes problemas con tus boletas? Escríbenos directamente
                </p>

                <form onSubmit={handleContactSubmit} className="space-y-4">
                  {/* Name & Email — stack on mobile, side by side on sm+ */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Nombre</label>
                      <input
                        type="text"
                        required
                        className="w-full bg-black border border-industrial-800 text-sm px-3 py-3 text-white rounded focus:outline-none focus:border-neon-purple font-mono"
                        placeholder="Ej. Juan Pérez"
                        value={contactForm.nombre}
                        onChange={e => setContactForm({ ...contactForm, nombre: e.target.value })}
                        disabled={submittingContact}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Correo Electrónico</label>
                      <input
                        type="email"
                        required
                        className="w-full bg-black border border-industrial-800 text-sm px-3 py-3 text-white rounded focus:outline-none focus:border-neon-purple font-mono"
                        placeholder="correo@ejemplo.com"
                        value={contactForm.email}
                        onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                        disabled={submittingContact}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Mensaje o Duda</label>
                    <textarea
                      required
                      rows="4"
                      className="w-full bg-black border border-industrial-800 text-sm px-3 py-3 text-white rounded focus:outline-none focus:border-neon-purple font-mono resize-none"
                      placeholder="Escribe aquí tu duda, adjunta tu referencia de pago si tienes inconvenientes..."
                      value={contactForm.mensaje}
                      onChange={e => setContactForm({ ...contactForm, mensaje: e.target.value })}
                      disabled={submittingContact}
                    />
                  </div>

                  {contactSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs rounded font-mono"
                    >
                      ✓ ¡Mensaje enviado con éxito! Nos pondremos en contacto contigo en breve.
                    </motion.div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingContact || !contactForm.nombre || !contactForm.email || !contactForm.mensaje}
                    className="w-full bg-industrial-800 hover:bg-neon-purple text-white text-xs font-black tracking-widest py-3.5 rounded uppercase transition-all duration-300 disabled:opacity-40 disabled:hover:bg-industrial-800 flex items-center justify-center space-x-2 touch-manipulation min-h-[48px]"
                  >
                    {submittingContact ? (
                      <span className="w-4 h-4 rounded-full border border-white border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Enviar Mensaje</span>
                      </>
                    )}
                  </button>
                </form>
              </div>

            </div>

          </div>

        </div>
      </div>
    </PageTransition>
  );
}
