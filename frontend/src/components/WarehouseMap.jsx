import React, { useState } from 'react';
import { Droplet, Heart, ShieldAlert, Activity, LogOut, Beer, Info, MapPin } from 'lucide-react';

export default function WarehouseMap() {
  const [selectedZone, setSelectedZone] = useState('chill');

  const zones = {
    booth: {
      id: 'booth',
      title: 'Cabina DJ & Escenario',
      color: 'var(--color-neon)',
      icon: <Activity className="w-5 h-5" />,
      description: 'El corazón musical del ritual. Mantén una distancia respetuosa con los artistas y el equipo de sonido. Respeta el espacio de la cabina.',
      protocol: 'Cero flash en esta zona para no distraer al DJ. Si alguien invade el escenario de forma agresiva, repórtalo al staff de seguridad más cercano.'
    },
    hydration: {
      id: 'hydration',
      title: 'Punto de Hidratación Gratuito',
      color: '#00D8FF', // Cyan
      icon: <Droplet className="w-5 h-5" />,
      description: 'Agua potable completamente gratuita disponible durante todo el evento. Mantenerse hidratado es fundamental para bailar seguro.',
      protocol: 'Puedes pedir vasos de agua o recargar tu termo ilimitadamente. No se juzga ni se cuestiona. Si te sientes mareado, avisa al personal del punto.'
    },
    chill: {
      id: 'chill',
      title: 'Zona de Descanso / Espacio Seguro',
      color: '#FF2A85', // Rosa neón
      icon: <Heart className="w-5 h-5" />,
      description: 'Un espacio tranquilo con luz tenue y asientos, alejado del alto volumen de la pista. Diseñado para descompresión, contención emocional y relajación.',
      protocol: 'Aquí se encuentra nuestro staff de contención de Espacio Seguro. Si te sientes abrumado, sufres acoso o necesitas hablar con alguien en un ambiente de total confidencialidad y sin prejuicios, este es tu lugar.'
    },
    medical: {
      id: 'medical',
      title: 'Enfermería & Primeros Auxilios',
      color: '#FF6B00', // Naranja
      icon: <ShieldAlert className="w-5 h-5" />,
      description: 'Unidad de asistencia médica de respuesta rápida con profesionales capacitados y equipamiento de primeros auxilios de emergencia.',
      protocol: 'Ante cualquier síntoma físico adverso, fatiga extrema o sospecha de sobredosis/intoxicación (propia o de un tercero), acude de inmediato. Recuerda que no llamamos a la policía; priorizamos la salud por encima de todo.'
    },
    exits: {
      id: 'exits',
      title: 'Salidas de Emergencia',
      color: '#00FF66', // Verde
      icon: <LogOut className="w-5 h-5" />,
      description: 'Vías de evacuación directa y salidas de emergencia debidamente señalizadas y libres de cualquier obstáculo físico.',
      protocol: 'Identifica la salida más cercana a tu posición al ingresar. En caso de una evacuación requerida, mantén la calma, sigue las luces verdes de señalización y las instrucciones del staff.'
    },
    bar: {
      id: 'bar',
      title: 'Barra Principal',
      color: '#FFC800', // Amarillo / Amber
      icon: <Beer className="w-5 h-5" />,
      description: 'Punto de venta oficial de bebidas alcohólicas y refrescos. Nuestro personal de barra promueve el consumo responsable.',
      protocol: 'Si notas que un amigo ha consumido en exceso, puedes pedir ayuda aquí. El personal de barra tiene comunicación directa por radio con el equipo médico y de Espacio Seguro.'
    }
  };

  const handleZoneClick = (zoneId) => {
    setSelectedZone(zoneId);
  };

  const currentZone = zones[selectedZone] || zones.chill;

  return (
    <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-6 sm:p-8 w-full transition-all duration-300">
      <div className="flex flex-col lg:flex-row gap-8 items-stretch">
        
        {/* SVG Map Container */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-neon-purple" style={{ color: 'var(--color-neon)' }} />
              Mapa Interactivo de la Bodega (Warehouse Plan)
            </h4>
            <p className="text-[10px] text-gray-500 font-mono uppercase mb-4">
              Haz clic en los puntos interactivos para ver detalles del protocolo
            </p>
          </div>

          <div className="relative bg-black/50 border border-industrial-800/80 rounded-lg p-4 flex items-center justify-center overflow-hidden aspect-[4/3] sm:aspect-[16/10]">
            {/* Ambient industrial grids */}
            <div className="absolute inset-0 industrial-grid opacity-10 pointer-events-none" />
            
            <svg 
              viewBox="0 0 800 500" 
              className="w-full h-full select-none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Outer Warehouse Wall */}
              <rect x="20" y="20" width="760" height="460" rx="12" fill="none" stroke="#222" strokeWidth="4" />
              <rect x="22" y="22" width="756" height="456" rx="10" fill="none" stroke="#111" strokeWidth="2" />
              
              {/* Internal structural walls/lines */}
              <line x1="20" y1="120" x2="250" y2="120" stroke="#333" strokeWidth="2" strokeDasharray="5,5" />
              <line x1="200" y1="20" x2="200" y2="120" stroke="#333" strokeWidth="2" />
              <line x1="550" y1="20" x2="550" y2="120" stroke="#333" strokeWidth="2" />
              <line x1="550" y1="120" x2="780" y2="120" stroke="#333" strokeWidth="2" strokeDasharray="5,5" />

              {/* Structural Columns */}
              {[150, 300, 450, 600].flatMap(x => [180, 320].map(y => (
                <rect key={`${x}-${y}`} x={x - 8} y={y - 8} width="16" height="16" fill="#1A1A1D" stroke="#333" strokeWidth="1" />
              )))}

              {/* ZONE: DJ BOOTH */}
              <g 
                className="cursor-pointer group" 
                onClick={() => handleZoneClick('booth')}
              >
                {/* Booth Area Outline */}
                <rect 
                  x="300" y="30" width="200" height="70" rx="6" 
                  fill={selectedZone === 'booth' ? 'rgba(177, 78, 255, 0.08)' : 'rgba(0,0,0,0.3)'} 
                  stroke={selectedZone === 'booth' ? 'var(--color-neon)' : '#333'} 
                  strokeWidth="2"
                  className="transition-all duration-300"
                />
                <text x="400" y="60" fill="#fff" fontSize="11" fontWeight="bold" textAnchor="middle" letterSpacing="2" className="opacity-70 group-hover:opacity-100 transition-opacity font-mono">ESCENARIO / DJ</text>
                
                {/* Glowing Pulsing Interactive Marker */}
                <circle cx="400" cy="80" r="10" fill="var(--color-neon)" opacity="0.15" className="animate-ping" />
                <circle 
                  cx="400" cy="80" r="6" 
                  fill="var(--color-neon)" 
                  stroke="#fff" strokeWidth="1.5"
                  className="group-hover:scale-125 transition-transform duration-200"
                  style={{ filter: `drop-shadow(0 0 6px var(--color-neon))` }}
                />
              </g>

              {/* ZONE: CHILL OUT / SAFE SPACE */}
              <g 
                className="cursor-pointer group" 
                onClick={() => handleZoneClick('chill')}
              >
                {/* Chill Out Area */}
                <rect 
                  x="35" y="30" width="150" height="80" rx="6" 
                  fill={selectedZone === 'chill' ? 'rgba(255, 42, 133, 0.08)' : 'rgba(0,0,0,0.3)'} 
                  stroke={selectedZone === 'chill' ? '#FF2A85' : '#333'} 
                  strokeWidth="2"
                  className="transition-all duration-300"
                />
                <text x="110" y="65" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle" letterSpacing="1" className="opacity-75 font-mono">ESPACIO SEGURO</text>
                <text x="110" y="80" fill="#888" fontSize="8" textAnchor="middle" className="font-mono">CHILL OUT ZONE</text>
                
                <circle cx="110" cy="95" r="10" fill="#FF2A85" opacity="0.15" className="animate-ping" />
                <circle 
                  cx="110" cy="95" r="6" 
                  fill="#FF2A85" 
                  stroke="#fff" strokeWidth="1.5"
                  className="group-hover:scale-125 transition-transform duration-200"
                  style={{ filter: 'drop-shadow(0 0 6px #FF2A85)' }}
                />
              </g>

              {/* ZONE: MEDICAL */}
              <g 
                className="cursor-pointer group" 
                onClick={() => handleZoneClick('medical')}
              >
                <rect 
                  x="590" y="30" width="150" height="80" rx="6" 
                  fill={selectedZone === 'medical' ? 'rgba(255, 107, 0, 0.08)' : 'rgba(0,0,0,0.3)'} 
                  stroke={selectedZone === 'medical' ? '#FF6B00' : '#333'} 
                  strokeWidth="2"
                  className="transition-all duration-300"
                />
                <text x="665" y="65" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle" letterSpacing="1" className="opacity-75 font-mono">ENFERMERÍA</text>
                <text x="665" y="80" fill="#888" fontSize="8" textAnchor="middle" className="font-mono">PRIMEROS AUXILIOS</text>
                
                <circle cx="665" cy="95" r="10" fill="#FF6B00" opacity="0.15" className="animate-ping" />
                <circle 
                  cx="665" cy="95" r="6" 
                  fill="#FF6B00" 
                  stroke="#fff" strokeWidth="1.5"
                  className="group-hover:scale-125 transition-transform duration-200"
                  style={{ filter: 'drop-shadow(0 0 6px #FF6B00)' }}
                />
              </g>

              {/* ZONE: BARS */}
              <g 
                className="cursor-pointer group" 
                onClick={() => handleZoneClick('bar')}
              >
                {/* Left side main bar */}
                <rect 
                  x="30" y="200" width="60" height="150" rx="6" 
                  fill={selectedZone === 'bar' ? 'rgba(255, 200, 0, 0.08)' : 'rgba(0,0,0,0.3)'} 
                  stroke={selectedZone === 'bar' ? '#FFC800' : '#333'} 
                  strokeWidth="2"
                  className="transition-all duration-300"
                />
                <text x="60" y="265" fill="#fff" fontSize="10" fontWeight="bold" textAnchor="middle" transform="rotate(-90 60 265)" letterSpacing="2" className="opacity-70 font-mono">BARRA PRINCIPAL</text>
                
                <circle cx="60" cy="275" r="10" fill="#FFC800" opacity="0.15" className="animate-ping" />
                <circle 
                  cx="60" cy="275" r="6" 
                  fill="#FFC800" 
                  stroke="#fff" strokeWidth="1.5"
                  className="group-hover:scale-125 transition-transform duration-200"
                  style={{ filter: 'drop-shadow(0 0 6px #FFC800)' }}
                />
              </g>

              {/* ZONE: HYDRATION */}
              <g 
                className="cursor-pointer group" 
                onClick={() => handleZoneClick('hydration')}
              >
                {/* Right side hydration bar */}
                <rect 
                  x="710" y="200" width="60" height="150" rx="6" 
                  fill={selectedZone === 'hydration' ? 'rgba(0, 216, 255, 0.08)' : 'rgba(0,0,0,0.3)'} 
                  stroke={selectedZone === 'hydration' ? '#00D8FF' : '#333'} 
                  strokeWidth="2"
                  className="transition-all duration-300"
                />
                <text x="740" y="275" fill="#fff" fontSize="9" fontWeight="bold" textAnchor="middle" transform="rotate(90 740 275)" letterSpacing="1" className="opacity-70 font-mono">AGUA GRATIS</text>
                
                <circle cx="740" cy="275" r="10" fill="#00D8FF" opacity="0.15" className="animate-ping" />
                <circle 
                  cx="740" cy="275" r="6" 
                  fill="#00D8FF" 
                  stroke="#fff" strokeWidth="1.5"
                  className="group-hover:scale-125 transition-transform duration-200"
                  style={{ filter: 'drop-shadow(0 0 6px #00D8FF)' }}
                />
              </g>

              {/* ZONE: EMERGENCY EXITS */}
              {/* Exit 1: Left base corner */}
              <g 
                className="cursor-pointer group" 
                onClick={() => handleZoneClick('exits')}
              >
                <path d="M 20 400 L 0 400 L 0 440 L 20 440" fill="none" stroke="#00FF66" strokeWidth="3" />
                <text x="45" y="425" fill="#00FF66" fontSize="8" fontWeight="bold" className="font-mono opacity-80 group-hover:opacity-100">SALIDA →</text>
                
                <circle cx="20" cy="420" r="10" fill="#00FF66" opacity="0.15" className="animate-ping" />
                <circle 
                  cx="20" cy="420" r="6" 
                  fill="#00FF66" 
                  stroke="#fff" strokeWidth="1.5"
                  className="group-hover:scale-125 transition-transform duration-200"
                  style={{ filter: 'drop-shadow(0 0 6px #00FF66)' }}
                />
              </g>

              {/* Exit 2: Right base corner */}
              <g 
                className="cursor-pointer group" 
                onClick={() => handleZoneClick('exits')}
              >
                <path d="M 780 400 L 800 400 L 800 440 L 780 440" fill="none" stroke="#00FF66" strokeWidth="3" />
                <text x="715" y="425" fill="#00FF66" fontSize="8" fontWeight="bold" className="font-mono opacity-80 group-hover:opacity-100">← SALIDA</text>
                
                <circle cx="780" cy="420" r="10" fill="#00FF66" opacity="0.15" className="animate-ping" />
                <circle 
                  cx="780" cy="420" r="6" 
                  fill="#00FF66" 
                  stroke="#fff" strokeWidth="1.5"
                  className="group-hover:scale-125 transition-transform duration-200"
                  style={{ filter: 'drop-shadow(0 0 6px #00FF66)' }}
                />
              </g>

              {/* Pista de baile label (Dancefloor) */}
              <text x="400" y="280" fill="#fff" fontSize="16" fontWeight="bold" textAnchor="middle" letterSpacing="6" opacity="0.15" className="font-mono uppercase">PISTA DE BAILE</text>
              
              {/* Acceso Principal (Main Entrance) */}
              <line x1="350" y1="480" x2="450" y2="480" stroke="#888" strokeWidth="3" />
              <text x="400" y="473" fill="#888" fontSize="8" textAnchor="middle" letterSpacing="1" className="font-mono uppercase">ACCESO PRINCIPAL</text>

            </svg>
          </div>
        </div>

        {/* Selected Zone Info Panel */}
        <div className="w-full lg:w-80 bg-black/40 border border-industrial-800/80 rounded-lg p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div 
                className="w-10 h-10 rounded flex items-center justify-center text-white transition-all duration-300"
                style={{ backgroundColor: currentZone.color, boxShadow: `0 0 15px ${currentZone.color}40` }}
              >
                {currentZone.icon}
              </div>
              <div>
                <h5 className="text-sm font-black text-white uppercase tracking-wider">{currentZone.title}</h5>
                <span className="text-[9px] font-mono text-gray-500 uppercase">Zona de Seguridad</span>
              </div>
            </div>

            <div className="w-full h-[1px] bg-industrial-800/60 mb-4" />

            <div className="space-y-4">
              <div>
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1">Descripción:</span>
                <p className="text-xs text-gray-300 leading-relaxed font-sans">{currentZone.description}</p>
              </div>

              <div>
                <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-1 flex items-center gap-1">
                  <Info className="w-3 h-3 text-neon-purple" style={{ color: 'var(--color-neon)' }} />
                  Protocolo Aplicado:
                </span>
                <p className="text-xs text-neon-glow/90 leading-relaxed font-sans italic" style={{ color: currentZone.color === '#fff' ? 'var(--color-neon-light)' : currentZone.color }}>
                  {currentZone.protocol}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-industrial-800/60 flex items-center justify-between text-[9px] font-mono text-gray-500">
            <span>DOPAMINA CREW</span>
            <span>CUIDAMOS LA PISTA</span>
          </div>
        </div>

      </div>
    </div>
  );
}
