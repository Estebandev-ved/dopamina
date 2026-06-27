import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { api } from '../services/api';
import PageTransition from '../components/PageTransition';
import { Music, Instagram, Headphones, AlertTriangle } from 'lucide-react';

export default function Artistas() {
  const [artistas, setArtistas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchArtistas = async () => {
      try {
        const data = await api.getArtistas();
        setArtistas(data);
      } catch (err) {
        setError('No se pudo cargar la cartelera de artistas.');
      } finally {
        setLoading(false);
      }
    };
    fetchArtistas();
  }, []);

  return (
    <PageTransition>
      <div className="relative min-h-screen bg-black py-16 overflow-hidden">
        {/* Ambient grids & background lights */}
        <div className="absolute inset-0 industrial-grid opacity-25 pointer-events-none" />
        <div className="absolute top-0 right-1/4 w-[350px] h-[350px] bg-neon-purple/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-10 left-1/4 w-[300px] h-[300px] bg-neon-purple/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 z-10">
          
          {/* Header */}
          <div className="border-b border-industrial-800 pb-8 mb-8 text-center md:text-left">
            <h1 className="text-4xl font-black text-white uppercase tracking-widest">
              ARTISTAS
            </h1>
            <p className="text-xs text-gray-500 font-mono mt-2 tracking-wider">
              NUESTRA TRIPULACIÓN & INVITADOS ESPECIALES
            </p>
          </div>

          {/* Putumayo Promotion Banner */}
          <div className="bg-industrial-900 border border-neon-purple/20 rounded-lg p-5 mb-10 flex flex-col md:flex-row items-center gap-4 shadow-neon-sm">
            <div className="w-10 h-10 rounded-full bg-neon-purple/10 border border-neon-purple/30 flex items-center justify-center flex-shrink-0 text-neon-purple">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-300 leading-relaxed font-sans">
                <strong className="text-white uppercase tracking-wider block mb-1">Apoyo al Talento Local del Putumayo</strong>
                Este espacio está dedicado a visibilizar e impulsar a los artistas y productores de nuestra región. Ten en cuenta que los artistas listados aquí no necesariamente forman parte del line-up del próximo evento; el propósito de esta cartelera es incentivar a la comunidad del Putumayo a conocer, apoyar y valorar nuestro talento local.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-24">
              <div className="w-8 h-8 rounded-full border border-neon-purple border-t-transparent animate-spin mx-auto mb-4" />
              <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">Sincronizando base de datos de la crew...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-950/20 border border-rose-500/30 text-rose-400 p-6 rounded-lg max-w-md mx-auto text-center space-y-4">
              <AlertTriangle className="w-8 h-8 mx-auto text-rose-500" />
              <p className="text-xs font-mono uppercase tracking-wider">{error}</p>
            </div>
          ) : artistas.length === 0 ? (
            <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-12 text-center max-w-md mx-auto space-y-6">
              <div className="w-12 h-12 rounded-full bg-black border border-industrial-800 flex items-center justify-center mx-auto text-gray-500">
                <Music className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sin artistas registrados</h3>
                <p className="text-xs text-gray-400">
                  Pronto anunciaremos el line-up completo de los próximos eventos.
                </p>
              </div>
            </div>
          ) : (
            /* Artists Grid */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {artistas.map((art, idx) => (
                <motion.div
                  key={art.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.05 }}
                  className="group bg-industrial-900/90 border border-industrial-800 rounded-lg overflow-hidden flex flex-col justify-between hover:border-neon-purple/40 hover:shadow-neon-sm transition-all duration-300 relative"
                >
                  {/* Neon top highlight */}
                  <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-neon-purple to-neon-violet opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div>
                    {/* Image section */}
                    <div className="aspect-[4/3] w-full bg-black border-b border-industrial-800 relative overflow-hidden flex items-center justify-center text-gray-700">
                      {art.imagenUrl ? (
                        <img
                          src={art.imagenUrl}
                          alt={art.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-industrial-900 to-black flex items-center justify-center relative">
                          <div className="absolute inset-0 bg-neon-purple/5 opacity-50 blur-[20px] pointer-events-none" />
                          <Music className="w-12 h-12 text-industrial-700 group-hover:text-neon-purple transition-colors duration-300" />
                        </div>
                      )}
                      
                      {/* Local / Guest Badge */}
                      <span className={`absolute top-3 right-3 text-[9px] font-black tracking-widest px-2.5 py-1 rounded font-mono uppercase ${
                        art.local 
                          ? 'bg-neon-purple/20 border border-neon-purple/40 text-neon-purple' 
                          : 'bg-amber-500/10 border border-amber-500/30 text-amber-500'
                      }`}>
                        {art.local ? 'LOCAL' : 'INVITADO'}
                      </span>
                    </div>

                    {/* Details section */}
                    <div className="p-6 space-y-3">
                      <div className="space-y-1">
                        <h3 className="text-lg font-black text-white uppercase tracking-wider font-mono group-hover:text-neon-glow transition-colors">
                          {art.nombre}
                        </h3>
                        <span className="inline-block text-[10px] font-bold text-neon-purple font-mono uppercase tracking-widest bg-neon-purple/5 border border-neon-purple/10 px-2 py-0.5 rounded">
                          {art.genero}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 leading-relaxed font-sans line-clamp-4">
                        {art.bio || 'Biografía en desarrollo para este crew member.'}
                      </p>
                    </div>
                  </div>

                  {/* Footer Socials */}
                  <div className="p-6 pt-0 flex gap-4 border-t border-industrial-800/50 mt-4">
                    {art.instagramUrl && (
                      <a
                        href={art.instagramUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-white transition-colors"
                        title="Instagram Profile"
                      >
                        <Instagram className="w-4 h-4" />
                      </a>
                    )}
                    {art.soundcloudUrl && (
                      <a
                        href={art.soundcloudUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-white transition-colors"
                        title="Soundcloud Sets"
                      >
                        <Headphones className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

        </div>
      </div>
    </PageTransition>
  );
}
