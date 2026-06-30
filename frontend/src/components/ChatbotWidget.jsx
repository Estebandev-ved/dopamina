import React, { useState, useEffect, useRef } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  X, 
  Send, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight,
  Lock
} from 'lucide-react';

/**
 * Avatar SVG interactivo del Dopa-Raver.
 * Se adapta al tema activo en el root del HTML usando variables de CSS de Dopamina Crew.
 * Cambia los gráficos del visor según el estado emocional o funcional.
 */
function DopaRaverAvatar({ state, size = 64 }) {
  // state: 'idle' | 'thinking' | 'secure' | 'speaking'
  
  // Determina el color de neón activo. Si está en secure, usamos verde esmeralda.
  const neonColor = state === 'secure' ? '#10B981' : 'var(--color-neon)';
  const shadowColor = state === 'secure' ? 'rgba(16, 185, 129, 0.4)' : 'var(--color-neon-shadow-sm)';

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className="transition-all duration-300 hover:scale-105"
      style={{ filter: `drop-shadow(0 0 6px ${neonColor})` }}
    >
      {/* Levitating animation wrapper inside SVG using CSS */}
      <g className="animate-levitate">
        {/* Auriculares / Lados del Casco */}
        <rect x="8" y="32" width="10" height="32" rx="5" fill="#111118" stroke={neonColor} strokeWidth="2" />
        <rect x="82" y="32" width="10" height="32" rx="5" fill="#111118" stroke={neonColor} strokeWidth="2" />
        <path d="M18 36 C 25 15, 75 15, 82 36" stroke={neonColor} strokeWidth="2" fill="none" strokeDasharray="3 3" />
        
        {/* Antenas receptoras superiores */}
        <line x1="28" y1="20" x2="22" y2="10" stroke={neonColor} strokeWidth="2" />
        <circle cx="22" cy="10" r="3" fill={neonColor} className={state === 'thinking' ? 'animate-ping' : ''} />
        
        <line x1="72" y1="20" x2="78" y2="10" stroke={neonColor} strokeWidth="2" />
        <circle cx="78" cy="10" r="3" fill={neonColor} className={state === 'thinking' ? 'animate-ping' : ''} />

        {/* Casco Principal (Base de la cabeza) */}
        <rect x="18" y="22" width="64" height="52" rx="20" fill="#161622" stroke={neonColor} strokeWidth="3" />

        {/* Visor / Gafas de Neón (El núcleo de interacción) */}
        <rect x="25" y="32" width="50" height="24" rx="8" fill="#0A0A0F" stroke={neonColor} strokeWidth="1.5" />

        {/* Gráficos reactivos del Visor según el Estado */}
        {state === 'idle' && (
          <>
            {/* Visor en reposo: línea de energía estable que palpita */}
            <line x1="32" y1="44" x2="68" y2="44" stroke={neonColor} strokeWidth="3.5" strokeLinecap="round" className="animate-pulse" />
            <circle cx="34" cy="44" r="1" fill="#FFF" />
            <circle cx="66" cy="44" r="1" fill="#FFF" />
          </>
        )}

        {state === 'thinking' && (
          <>
            {/* Visor pensando: matriz de escaneo lateral */}
            <line x1="30" y1="44" x2="70" y2="44" stroke={neonColor} strokeWidth="1.5" strokeDasharray="3 3" />
            <circle cx="50" cy="44" r="4.5" fill={neonColor} className="animate-ping" />
            <circle cx="50" cy="44" r="3" fill="#FFF" />
          </>
        )}

        {state === 'secure' && (
          <>
            {/* Visor seguro: candado o escudo digital de seguridad */}
            <path 
              d="M44 45 C44 40, 56 40, 56 45 V48 H44 Z M42 48 H58 V53 C58 56, 50 59, 50 59 C50 59, 42 56, 42 53 Z" 
              fill="#10B981" 
              className="animate-pulse"
            />
          </>
        )}

        {state === 'speaking' && (
          <>
            {/* Visor hablando: ondas de audio moduladas */}
            <path d="M30 44 Q 38 34, 46 44 T 62 44 T 70 44" stroke={neonColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />
            <line x1="50" y1="36" x2="50" y2="52" stroke={neonColor} strokeWidth="1.5" opacity="0.7" />
          </>
        )}

        {/* Luces led en mejillas */}
        <circle cx="30" cy="62" r="2" fill={neonColor} opacity="0.6" />
        <circle cx="70" cy="62" r="2" fill={neonColor} opacity="0.6" />

        {/* Cuello y soporte del traje raver */}
        <path d="M32 74 L22 88 H78 L68 74 Z" fill="#1C1C28" stroke={neonColor} strokeWidth="2" />
        <line x1="50" y1="74" x2="50" y2="88" stroke={neonColor} strokeWidth="1.5" strokeDasharray="3 2" />
      </g>

      <style>{`
        @keyframes levitate {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .animate-levitate {
          animation: levitate 4s ease-in-out infinite;
        }
      `}</style>
    </svg>
  );
}

/**
 * DOPA-BOT: Smart Sales Concierge & Checkout Assistant.
 * 
 * MEDIDAS DE SEGURIDAD IMPLEMENTADAS:
 * 1. Sanitización de Entradas (XSS): Se limpia el input del usuario eliminando etiquetas HTML
 *    y caracteres potencialmente peligrosos antes de procesarlo o mostrarlo.
 * 2. Renderizado Seguro: Se usa el binding nativo de React (JSX `{}`) que automáticamente
 *    escapa el contenido de texto, previniendo cualquier ejecución de HTML o JavaScript inyectado.
 * 3. Enlace Seguro: Los enlaces generados por el bot se sanitizan y apuntan estrictamente
 *    a rutas internas del portal, impidiendo ataques de redirección abierta (Open Redirect).
 */
export default function ChatbotWidget() {
  const location = useLocation();
  const isCheckoutPage = location.pathname === '/checkout';

  const [isOpen, setIsOpen] = useState(false);
  const [characterState, setCharacterState] = useState('idle');
  const [speechBubbleText, setSpeechBubbleText] = useState('');
  const [inputMessage, setInputMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [eventos, setEventos] = useState([]);
  const messagesEndRef = useRef(null);

  // Cargar eventos del backend para usarlos en las respuestas en tiempo real
  useEffect(() => {
    api.getEventos()
      .then(data => {
        if (Array.isArray(data)) {
          setEventos(data.filter(e => e.activo));
        }
      })
      .catch(err => {
        console.error('Error al obtener eventos en DOPA-BOT:', err);
      });
  }, []);

  // Manejar diálogos contextuales automáticos según la página activa
  useEffect(() => {
    if (isOpen) {
      setSpeechBubbleText('');
      return;
    }

    let bubbleTimer;
    let initialDelayTimer;

    const showSpeech = (text, targetState = 'idle', delay = 2000) => {
      setCharacterState(targetState);
      initialDelayTimer = setTimeout(() => {
        setSpeechBubbleText(text);
        
        // Desvanecer bocadillo tras 8 segundos
        bubbleTimer = setTimeout(() => {
          setSpeechBubbleText('');
          // Si estaba en secure, se mantiene, si no vuelve a idle
          setCharacterState(isCheckoutPage ? 'secure' : 'idle');
        }, 8000);
      }, delay);
    };

    // Limpieza previa
    setSpeechBubbleText('');
    
    // Evaluar rutas
    if (location.pathname === '/checkout') {
      showSpeech(
        '🔒 ¡Todo seguro por aquí! Pagos cifrados SSL y tus boletas QR te llegan al instante al correo. ¿Tienes alguna duda?', 
        'secure', 
        1000
      );
    } else if (location.pathname === '/policies') {
      showSpeech(
        '🛡️ En Dopamina priorizamos tu seguridad física y digital. Conoce nuestro protocolo de Espacio Seguro aquí.', 
        'idle', 
        2000
      );
    } else if (location.pathname === '/eventos') {
      showSpeech(
        '🎵 ¡Los mejores Djs del circuito underground! ¿Quieres saber los detalles de algún line-up?', 
        'idle', 
        2000
      );
    } else if (location.pathname === '/') {
      showSpeech(
        '👾 ¡Buenas! Soy Dopa-Raver. Estoy aquí para guiarte en tu viaje musical. ¿Qué te gustaría consultar hoy?', 
        'idle', 
        2500
      );
    } else {
      setCharacterState('idle');
    }

    return () => {
      clearTimeout(initialDelayTimer);
      clearTimeout(bubbleTimer);
    };
  }, [location.pathname, isOpen]);

  // Mensaje de bienvenida inicial dentro del chat
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          sender: 'bot',
          text: '¡Hola! Soy DOPA-BOT, tu guía en el universo Dopamina Crew. 🖤👾 ¿En qué puedo ayudarte hoy?',
          isWelcome: true
        }
      ]);
    }
  }, [messages]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  /**
   * Sanitiza una cadena de texto para evitar ataques XSS eliminando etiquetas HTML.
   */
  const sanitizeInput = (text) => {
    if (!text) return '';
    return text
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  };

  /**
   * Envía un mensaje del usuario y simula la respuesta de la IA.
   */
  const handleSendMessage = (text) => {
    const cleanText = sanitizeInput(text);
    if (!cleanText) return;

    // Agregar mensaje del usuario
    const userMsgId = `user-${Date.now()}`;
    setMessages(prev => [...prev, { id: userMsgId, sender: 'user', text: cleanText }]);
    setInputMessage('');
    setIsTyping(true);
    setCharacterState('thinking');

    // Simular retraso de procesamiento para dar sensación de IA
    setTimeout(() => {
      const botResponse = getBotResponse(cleanText);
      setMessages(prev => [...prev, { id: `bot-${Date.now()}`, sender: 'bot', ...botResponse }]);
      setIsTyping(false);
      setCharacterState('speaking');
      
      // Volver a estado normal después de "hablar"
      setTimeout(() => {
        setCharacterState(isCheckoutPage ? 'secure' : 'idle');
      }, 3500);
    }, 1200);
  };

  /**
   * Motor de coincidencia de palabras clave (NLP local simple)
   */
  const getBotResponse = (text) => {
    const rawText = text.toLowerCase();
    
    // Normalizar texto quitando acentos básicos
    const query = rawText
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    // Palabras clave relacionadas con eventos y line-ups
    if (
      query.includes('evento') || 
      query.includes('fiesta') || 
      query.includes('tocar') || 
      query.includes('lineup') || 
      query.includes('line-up') || 
      query.includes('dj') || 
      query.includes('musica') || 
      query.includes('proximos') || 
      query.includes('quien toca')
    ) {
      if (eventos.length === 0) {
        return {
          text: 'Estamos preparando eventos oscuros e industriales increíbles para ti. Actualmente no hay preventas activas en la web, pero mantente al tanto de nuestras redes sociales. 🕶️🔊'
        };
      }
      
      const eventList = eventos.map(e => {
        const fecha = new Date(e.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' });
        const precio = e.precioPreventa ? `$${e.precioPreventa.toLocaleString()}` : `$${e.precio.toLocaleString()}`;
        return `• ${e.titulo} (${fecha}) - Preventa: ${precio}`;
      }).join('\n');

      return {
        text: `⚡ ¡Tenemos ${eventos.length} eventos activos! Aquí tienes los próximos en cartelera:\n\n${eventList}\n\n¿Quieres que te guíe para comprar entradas de alguno?`,
        suggestEvents: true
      };
    }

    // Palabras clave relacionadas con Protocolo de Espacio Seguro
    if (
      query.includes('segur') || 
      query.includes('acos') || 
      query.includes('violenc') || 
      query.includes('espacio seguro') || 
      query.includes('protocolo') || 
      query.includes('reporte') || 
      query.includes('staff') ||
      query.includes('agresion')
    ) {
      return {
        text: '🛡️ En Dopamina Crew la integridad y el respeto son absolutos. Si te sientes incómodo/a, acosado/a o en peligro durante un evento, puedes acudir inmediatamente a cualquier miembro del staff de seguridad o barra (protocolo Espacio Seguro).\n\nTambién contamos con un formulario de reporte anónimo en tiempo real en nuestra sección de Políticas, donde puedes alertar al staff desde tu celular de forma discreta.',
        showSafetyLink: true
      };
    }

    // Palabras clave relacionadas con pago y pasarela
    if (
      query.includes('pagar') || 
      query.includes('pago') || 
      query.includes('efipay') || 
      query.includes('tarjeta') || 
      query.includes('banco') || 
      query.includes('efectivo') || 
      query.includes('nequi') || 
      query.includes('daviplata') ||
      query.includes('pse')
    ) {
      return {
        text: '🔒 Tus transacciones están completamente seguras. Utilizamos la pasarela de pagos Efipay con encriptación SSL de 256 bits y cumplimiento de estándares PCI. Aceptamos tarjetas de crédito, débito, PSE, Nequi y Daviplata. Nunca almacenamos tus credenciales bancarias en nuestros servidores.'
      };
    }

    // Palabras clave relacionadas con código QR, entrega y boletas
    if (
      query.includes('qr') || 
      query.includes('entrada') || 
      query.includes('boleto') || 
      query.includes('ticket') || 
      query.includes('donde esta') || 
      query.includes('correo') || 
      query.includes('email') || 
      query.includes('recibo') ||
      query.includes('boleta')
    ) {
      return {
        text: '🎟️ Tus entradas son 100% digitales. Una vez que realizas tu pago con éxito en el Checkout, el sistema genera inmediatamente un código QR único para tu entrada. Puedes ver tus QR directamente en la sección "Mis Boletas" de tu perfil o descargarlos del correo de confirmación de compra.'
      };
    }

    // Palabras clave relacionadas con reembolsos y cancelaciones
    if (
      query.includes('reembols') || 
      query.includes('devoluc') || 
      query.includes('cancel') || 
      query.includes('devolver') ||
      query.includes('plata') ||
      query.includes('reembolso')
    ) {
      return {
        text: '⚡ Entendemos que los planes cambian. Ofrecemos reembolsos del 100% si lo solicitas hasta 48 horas antes del inicio del evento escribiendo a nuestro soporte. Además, si no puedes asistir, recuerda que nuestras entradas son transferibles digitalmente de forma gratuita.'
      };
    }

    // Palabras clave relacionadas con transferir entradas
    if (
      query.includes('transfer') || 
      query.includes('amigo') || 
      query.includes('regal') || 
      query.includes('pasar') ||
      query.includes('ceder')
    ) {
      return {
        text: '🙋‍♂️ ¡Sí, transferir tus entradas es súper fácil y seguro! Ve a tu Perfil/Dashboard, busca la sección "Mis Boletas", selecciona la entrada que deseas ceder e introduce el correo del destinatario. La entrada vieja se anulará y se le generará un nuevo código QR al correo de tu amigo de inmediato.'
      };
    }

    // Palabras clave relacionadas con descuentos y promociones
    if (
      query.includes('descuent') || 
      query.includes('promo') || 
      query.includes('parche') || 
      query.includes('cupon') || 
      query.includes('codigo') ||
      query.includes('gratis')
    ) {
      return {
        text: '⚡ ¡Tenemos dos formas geniales de ahorrar!\n\n1. **Descuento de Parche (10%)**: Si compras 4 o más entradas en el mismo checkout, el sistema te descuenta automáticamente un 10% del total (válido una vez por usuario).\n2. **Cupones de Descuento**: Si tienes un código promocional, ingrésalo en la casilla de cupones durante el checkout antes de proceder al pago.'
      };
    }

    // Si saluda o pregunta quién es
    if (
      query.includes('hola') || 
      query.includes('buenas') || 
      query.includes('que tal') || 
      query.includes('quien eres') || 
      query.includes('dopabot') ||
      query.includes('dopa-bot')
    ) {
      return {
        text: '¡Hola de nuevo! Soy DOPA-BOT, tu copiloto virtual en Dopamina Crew. ¿Qué te gustaría consultar hoy? Te puedo dar info de eventos, seguridad, pagos o políticas de reembolso.'
      };
    }

    // Respuesta por defecto
    return {
      text: 'Entiendo. Soy un bot optimizado para ayudarte a navegar en Dopamina Crew de forma segura y asistirte en tu compra. 🖤👾\n\n¿Te gustaría saber sobre alguna de estas preguntas frecuentes?',
      showFaqButtons: true
    };
  };

  // Preguntas sugeridas generales
  const generalSuggestions = [
    { text: '🎟️ ¿Cómo recibo mis entradas?', action: '🎟️ ¿Cómo compro y recibo mis entradas QR?' },
    { text: '🛡️ Protocolo Espacio Seguro', action: '🛡️ ¿Qué es el Protocolo de Espacio Seguro?' },
    { text: '🎵 Eventos Programados', action: '🎵 ¿Qué eventos tienen programados pronto?' },
    { text: '💳 Métodos de pago y reembolso', action: '💳 Métodos de pago y políticas de reembolsos' }
  ];

  // Preguntas sugeridas específicas de Checkout
  const checkoutSuggestions = [
    { text: '🔒 ¿El pago es 100% seguro?', action: '🔒 ¿El pago es seguro en este sitio?' },
    { text: '🎟️ ¿Cuándo me llega el QR?', action: '🎟️ ¿Cuándo y cómo recibo mi entrada QR tras pagar?' },
    { text: '🙋‍♂️ ¿Puedo transferir la entrada?', action: '🙋‍♂️ ¿Puedo ceder mi entrada a un amigo?' },
    { text: '🎟️ ¿Hay descuento grupal?', action: '🎟️ ¿Tienen descuento por compras grupales?' }
  ];

  const currentSuggestions = isCheckoutPage ? checkoutSuggestions : generalSuggestions;

  return (
    <>
      {/* Botón flotante del Personaje Mascota */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
        {/* Globo de texto contextual flotante */}
        {speechBubbleText && !isOpen && (
          <div 
            className="mb-3 mr-2 bg-zinc-950/95 border border-neon-purple text-bone text-xs p-3.5 rounded-2xl shadow-neon-sm max-w-[260px] animate-bounce relative backdrop-blur-md"
            style={{ 
              animationDuration: '3s',
              boxShadow: '0 0 15px var(--color-neon-shadow-sm)'
            }}
          >
            {/* Anclaje triangular apuntando al personaje */}
            <div className="absolute right-8 bottom-[-6px] w-3 h-3 bg-zinc-950 border-r border-b border-neon-purple transform rotate-45" />
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSpeechBubbleText('');
              }}
              className="absolute top-2 right-2 text-industrial-400 hover:text-white transition-colors"
              aria-label="Cerrar diálogo"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            
            <div className="pr-4 select-none">
              {isCheckoutPage ? (
                <p className="font-bold flex items-center gap-1 text-emerald-400 mb-1 text-[11px] uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5" /> Transacción Blindada
                </p>
              ) : (
                <p className="font-bold flex items-center gap-1 text-neon-violet mb-1 text-[11px] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" /> DOPA-RAVER
                </p>
              )}
              <p className="text-industrial-200 leading-relaxed text-[11px] font-sans">
                {speechBubbleText}
              </p>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            setIsOpen(!isOpen);
            setSpeechBubbleText('');
          }}
          className="relative hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none cursor-pointer"
          aria-label="Hablar con el asistente Dopa-Raver"
        >
          {/* Avatar SVG interactivo */}
          <DopaRaverAvatar state={isOpen ? 'idle' : characterState} size={76} />
          
          {/* Indicador de atención en Checkout */}
          {!isOpen && isCheckoutPage && (
            <span className="absolute top-2 right-2 block h-3.5 w-3.5 rounded-full ring-2 ring-zinc-950 bg-emerald-500 animate-ping" />
          )}
        </button>
      </div>

      {/* Panel del Chatbot */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-6 w-[360px] sm:w-[400px] h-[520px] max-h-[80vh] bg-industrial-950/95 border border-industrial-800 rounded-2xl flex flex-col shadow-2xl z-50 overflow-hidden backdrop-blur-md animate-fade-in"
          style={{ 
            boxShadow: '0 10px 30px -10px rgba(0,0,0,0.8), 0 0 15px var(--color-neon-shadow-sm)',
            animation: 'fadeIn 0.25s ease-out'
          }}
        >
          {/* Cabecera del Chat con el DopaRaverAvatar integrado */}
          <div className="px-4 py-3.5 bg-industrial-900 border-b border-industrial-800 flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-full bg-industrial-950 border border-neon-purple/30 flex items-center justify-center overflow-hidden">
                <DopaRaverAvatar state={isTyping ? 'thinking' : characterState} size={42} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-bone tracking-wider uppercase flex items-center gap-1.5">
                  DOPA-BOT
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                </h3>
                <p className="text-[10px] text-neon-violet font-mono uppercase tracking-widest">Cyber-Host</p>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-industrial-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cuerpo de Mensajes */}
          <div className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin scrollbar-thumb-industrial-700">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-3 rounded-xl text-sm leading-relaxed font-sans whitespace-pre-line ${
                    msg.sender === 'user' 
                      ? 'bg-neon-purple/20 border border-neon-purple/40 text-bone rounded-tr-none' 
                      : 'bg-industrial-800/80 border border-industrial-700 text-bone rounded-tl-none'
                  }`}
                >
                  <p>{msg.text}</p>

                  {/* Acciones interactivas específicas del Bot */}
                  {msg.showSafetyLink && (
                    <div className="mt-2.5 pt-2.5 border-t border-industrial-700">
                      <Link 
                        to="/policies" 
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1.5 text-xs text-neon-violet hover:text-white font-bold transition-colors"
                      >
                        Ver Protocolo Completo & Reportes <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}

                  {msg.suggestEvents && (
                    <div className="mt-2.5 pt-2.5 border-t border-industrial-700">
                      <Link 
                        to="/eventos" 
                        onClick={() => setIsOpen(false)}
                        className="inline-flex items-center gap-1.5 text-xs text-neon-violet hover:text-white font-bold transition-colors"
                      >
                        Ver Eventos Disponibles <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Indicador de Escritura */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-industrial-800/80 border border-industrial-700 p-3 rounded-xl rounded-tl-none flex space-x-1 items-center">
                  <div className="w-1.5 h-1.5 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-1.5 h-1.5 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-1.5 h-1.5 bg-neon-purple rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Sugerencias Rápidas */}
          <div className="px-4 py-2 bg-industrial-900/60 border-t border-industrial-800 flex flex-wrap gap-1.5 select-none">
            {currentSuggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(suggestion.action)}
                className="text-[11px] bg-industrial-800 hover:bg-industrial-700 border border-industrial-700 hover:border-neon-purple/50 text-industrial-400 hover:text-bone px-2 py-1 rounded-full transition-all duration-200 text-left font-sans cursor-pointer"
              >
                {suggestion.text}
              </button>
            ))}
          </div>

          {/* Formulario de Entrada */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputMessage);
            }}
            className="p-3 bg-industrial-900 border-t border-industrial-800 flex gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder={isCheckoutPage ? "Pregúntame sobre el pago o seguridad..." : "Escribe tu pregunta..."}
              maxLength={250}
              className="flex-1 bg-industrial-950 border border-industrial-800 text-bone text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-neon-purple/70 placeholder:text-industrial-400 font-sans transition-all duration-200"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="bg-neon-purple/10 border border-neon-purple/30 text-neon-violet hover:bg-neon-purple hover:text-white disabled:opacity-30 disabled:hover:bg-neon-purple/10 disabled:hover:text-neon-violet p-2.5 rounded-lg transition-all duration-200 flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Inyección de estilos clave de animación en CSS */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}
