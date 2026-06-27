import React from 'react';
import PageTransition from '../components/PageTransition';
import { Eye, Users, ShieldAlert, Heart } from 'lucide-react';

/**
 * About / Manifesto page for Dopamina Crew.
 * Features:
 * - Brand Manifesto.
 * - Deep Berlin industrial design.
 * - Rebellious core value pillars.
 */
export default function About() {
  const manifestoPillars = [
    {
      title: "El Rebelde Consciente",
      description: "No rompemos las reglas por capricho; las redefinimos para crear algo mejor. Cuestionamos el statu quo del entretenimiento masivo y comercial, promoviendo una cultura musical crítica, autogestionada y con propósito social.",
      icon: <ShieldAlert className="w-6 h-6 text-neon-glow" />
    },
    {
      HorizontalTitle: "La Pista es Horizontal",
      description: "En nuestra pista no existen reservados, ni VIPs, ni zonas exclusivas. El DJ y el público vibran al mismo nivel físico y emocional. No hay jerarquías: todos somos iguales bajo la luz morada.",
      icon: <Users className="w-6 h-6 text-neon-glow" />,
      title: "La Pista Horizontal"
    },
    {
      title: "El Valor de la Comunidad",
      description: "El 'parche' prevalece sobre el individuo. Cuidamos de los nuestros. Dopamina no es solo una promotora de eventos, es una red de apoyo mutuo para artistas locales y apasionados de los ritmos alternativos.",
      icon: <Heart className="w-6 h-6 text-neon-glow" />
    }
  ];

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-black py-20 overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 industrial-grid opacity-20 pointer-events-none" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          {/* Header */}
          <div className="text-center mb-16">
            <span className="text-xs font-mono font-bold tracking-[0.3em] text-neon-purple uppercase bg-neon-purple/10 px-3 py-1 rounded-full border border-neon-purple/20">
              Manifiesto Dopamina
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white mt-4 tracking-wider uppercase">
              QUIÉNES SOMOS
            </h1>
            <div className="w-16 h-[2px] bg-neon-purple mx-auto mt-4" />
          </div>

          {/* Core Manifesto Text */}
          <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-8 sm:p-12 mb-12 shadow-neon-sm relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-neon-purple to-neon-violet" />
            
            <h2 className="text-xl sm:text-2xl font-black text-white uppercase tracking-wider mb-6">
              El Parche sobre el Negocio
            </h2>
            <p className="text-gray-300 leading-relaxed mb-6 font-medium">
              Nacimos en las sombras de la escena electrónica e industrial, cansados de los eventos elitistas y las pistas divididas por el dinero. Dopamina es un espacio de libertad, una zona temporalmente autónoma donde la música oscura y la cultura urbana reclaman su lugar legítimo.
            </p>
            <p className="text-gray-400 leading-relaxed">
              Inspirados por la ética del Hazlo Tú Mismo (DIY) y el espíritu libre de las bodegas industriales de Berlín, creamos rituales de baile basados en el respeto absoluto, la horizontalidad y el poder de la comunidad. No venimos a ser espectadores; venimos a ser parte del pulso.
            </p>
          </div>

          {/* Grid of Pillars */}
          <div className="space-y-6">
            <h3 className="text-lg font-black tracking-widest text-white uppercase text-center md:text-left mb-6">
              NUESTROS PILARES
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {manifestoPillars.map((pillar, index) => (
                <div 
                  key={index}
                  className="bg-industrial-900/40 border border-industrial-800 rounded-lg p-6 hover:border-neon-purple/40 hover:shadow-neon-sm transition-all duration-300"
                >
                  <div className="w-10 h-10 rounded bg-black border border-neon-purple/20 flex items-center justify-center mb-4">
                    {pillar.icon}
                  </div>
                  <h4 className="text-md font-bold text-white uppercase tracking-wide mb-2">
                    {pillar.title}
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed">
                    {pillar.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
