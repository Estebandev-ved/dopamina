import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, X, ChevronLeft, ChevronRight, Expand, Map, Grid3X3, Camera, Share2, AlertTriangle } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { api } from '../services/api';
import PageTransition from '../components/PageTransition';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const neonIcon = (color) => L.divIcon({
  className: 'custom-marker',
  html: `<div style="
    width: 20px; height: 20px;
    background: ${color};
    border: 2px solid #000;
    border-radius: 50%;
    box-shadow: 0 0 12px ${color}, 0 0 24px ${color}40;
    animation: pulse-marker 2s infinite;
  "></div>
  <style>
    @keyframes pulse-marker {
      0%, 100% { transform: scale(1); opacity: 1; }
      50% { transform: scale(1.2); opacity: 0.8; }
    }
  </style>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -14],
});

export default function Graffiti() {
  const [graffitis, setGraffitis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('split');
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [filterTag, setFilterTag] = useState('all');

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersLayer = useRef(null);

  useEffect(() => {
    const fetchGraffitis = async () => {
      try {
        const data = await api.getGraffiti();
        setGraffitis(data);
      } catch (err) {
        setError('No se pudieron cargar los grafitis.');
      } finally {
        setLoading(false);
      }
    };
    fetchGraffitis();
  }, []);

  const allTags = [...new Set(graffitis.flatMap(g => (g.tags || '').split(',').map(t => t.trim()).filter(Boolean)))];

  const filteredGraffitis = filterTag === 'all'
    ? graffitis
    : graffitis.filter(g => (g.tags || '').toLowerCase().includes(filterTag.toLowerCase()));

  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => setLightboxIndex(-1);
  const nextImage = () => { if (lightboxIndex < graffitis.length - 1) setLightboxIndex(lightboxIndex + 1); };
  const prevImage = () => { if (lightboxIndex > 0) setLightboxIndex(lightboxIndex - 1); };

  useEffect(() => {
    const handleKey = (e) => {
      if (lightboxIndex < 0) return;
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowRight') nextImage();
      if (e.key === 'ArrowLeft') prevImage();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [lightboxIndex]);

  const neon = getComputedStyle(document.documentElement).getPropertyValue('--color-neon') || '#B14EFF';

  const updateMarkers = useCallback((map, markers, items) => {
    markers.clearLayers();
    const color = getComputedStyle(document.documentElement).getPropertyValue('--color-neon') || '#B14EFF';
    items.forEach((g) => {
      if (g.latitud == null || g.longitud == null) return;
      const marker = L.marker([g.latitud, g.longitud], { icon: neonIcon(color) });
      const imgHtml = g.imagenUrl
        ? `<img src="${g.imagenUrl}" alt="${g.titulo}" style="width:100%;height:96px;object-fit:cover;border-radius:4px;margin-bottom:6px" />`
        : '';
      marker.bindPopup(`
        <div style="text-align:center;min-width:180px">
          ${imgHtml}
          <p style="font-weight:bold;font-size:13px;margin:0">${g.titulo}</p>
          <p style="font-size:11px;color:#888;margin:2px 0 0">${g.ubicacion || ''}</p>
          ${g.artista ? `<p style="font-size:11px;color:${color};margin:4px 0 0">${g.artista}</p>` : ''}
        </div>
      `, { className: 'dark-popup' });
      marker.on('click', () => {
        const idx = graffitis.findIndex(x => x.id === g.id);
        if (idx >= 0) openLightbox(idx);
      });
      markers.addLayer(marker);
    });
  }, [graffitis]);

  useEffect(() => {
    if (viewMode === 'gallery') return;
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      const center = filteredGraffitis.length > 0
        ? [filteredGraffitis[0].latitud, filteredGraffitis[0].longitud]
        : [4.8133, -75.6961];

      const map = L.map(mapRef.current, { zoomControl: true }).setView(center, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);

      const markers = L.layerGroup().addTo(map);
      mapInstance.current = map;
      markersLayer.current = markers;
    }

    const map = mapInstance.current;
    const markers = markersLayer.current;

    updateMarkers(map, markers, filteredGraffitis);

    if (filteredGraffitis.length > 0) {
      map.setView([filteredGraffitis[0].latitud, filteredGraffitis[0].longitud], map.getZoom());
    }

    setTimeout(() => map.invalidateSize(), 100);
  }, [viewMode, filteredGraffitis, updateMarkers]);

  return (
    <PageTransition>
      <div className="relative min-h-screen overflow-hidden" style={{ backgroundColor: '#0A0A0F' }}>
        <div className="absolute inset-0 industrial-grid opacity-20 pointer-events-none" />
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-neon-purple/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/3 w-[300px] h-[300px] bg-neon-purple/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 z-10 pt-24 pb-16">

          {/* Header */}
          <div className="text-center mb-10">
            <span
              className="text-[10px] font-mono font-bold tracking-[0.3em] uppercase px-3 py-1 rounded-full border"
              style={{ color: 'var(--color-neon)', borderColor: 'var(--color-neon-shadow-sm)', backgroundColor: 'var(--color-neon-shadow-sm)' }}
            >
              Cultura Urbana & Street Art
            </span>
            <h1 className="text-4xl md:text-5xl font-black text-white mt-4 tracking-wider uppercase">
              Graffiti Trail
            </h1>
            <div className="w-16 h-[2px] mx-auto mt-4" style={{ backgroundColor: 'var(--color-neon)' }} />
            <p className="text-xs text-gray-400 mt-3 max-w-lg mx-auto leading-relaxed">
              Explora los grafitis que la crew pintó por la ciudad. Click en el mapa o en la galería para ver cada pieza en detalle.
            </p>
          </div>

          {/* Loading / Error / Empty */}
          {loading ? (
            <div className="text-center py-24">
              <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin mx-auto mb-4" style={{ borderColor: 'var(--color-neon)', borderTopColor: 'transparent' }} />
              <p className="text-xs text-gray-400 font-mono uppercase tracking-widest">Cargando grafitis...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-950/20 border border-rose-500/30 text-rose-400 p-6 rounded-lg max-w-md mx-auto text-center space-y-4">
              <AlertTriangle className="w-8 h-8 mx-auto text-rose-500" />
              <p className="text-xs font-mono uppercase tracking-wider">{error}</p>
            </div>
          ) : graffitis.length === 0 ? (
            <div className="bg-industrial-900 border border-industrial-800 rounded-lg p-12 text-center max-w-md mx-auto space-y-6">
              <div className="w-12 h-12 rounded-full bg-black border border-industrial-800 flex items-center justify-center mx-auto text-gray-500">
                <Camera className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Sin grafitis registrados</h3>
                <p className="text-xs text-gray-400">
                  Pronto agregaremos los primeros grafitis del trail urbano.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div className="flex bg-industrial-900 border border-industrial-800 rounded-lg overflow-hidden">
                  {[
                    { mode: 'split', icon: Grid3X3, label: 'Split' },
                    { mode: 'map', icon: Map, label: 'Mapa' },
                    { mode: 'gallery', icon: Camera, label: 'Galería' },
                  ].map(({ mode, icon: Icon, label }) => (
                    <button
                      key={mode}
                      onClick={() => setViewMode(mode)}
                      className={`flex items-center gap-1.5 px-3 py-2 text-[10px] font-mono font-bold uppercase tracking-wider transition-all ${
                        viewMode === mode ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                      }`}
                      style={{ backgroundColor: viewMode === mode ? 'var(--color-neon)' : 'transparent' }}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>

                {allTags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setFilterTag('all')}
                      className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded border transition-all ${
                        filterTag === 'all' ? 'text-white border-transparent' : 'text-gray-500 border-industrial-700 hover:text-gray-300'
                      }`}
                      style={filterTag === 'all' ? { backgroundColor: 'var(--color-neon)' } : {}}
                    >
                      Todos ({graffitis.length})
                    </button>
                    {allTags.slice(0, 6).map(tag => (
                      <button
                        key={tag}
                        onClick={() => setFilterTag(tag)}
                        className={`px-2.5 py-1 text-[9px] font-mono font-bold uppercase tracking-wider rounded border transition-all ${
                          filterTag === tag ? 'text-white border-transparent' : 'text-gray-500 border-industrial-700 hover:text-gray-300'
                        }`}
                        style={filterTag === tag ? { backgroundColor: 'var(--color-neon)' } : {}}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className={`${viewMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : ''}`}>

                {/* Map Section */}
                {(viewMode === 'split' || viewMode === 'map') && (
                  <div className="bg-industrial-900 border border-industrial-800 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-industrial-800 flex items-center gap-2">
                      <MapPin className="w-4 h-4" style={{ color: 'var(--color-neon)' }} />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                        Mapa de Grafitis ({filteredGraffitis.length})
                      </span>
                    </div>

                    <div
                      ref={mapRef}
                      className="w-full"
                      style={{ height: viewMode === 'map' ? '70vh' : '400px', backgroundColor: '#0A0A0F' }}
                    />
                  </div>
                )}

                {/* Gallery Section */}
                {(viewMode === 'split' || viewMode === 'gallery') && (
                  <div className="bg-industrial-900 border border-industrial-800 rounded-lg overflow-hidden">
                    <div className="px-4 py-3 border-b border-industrial-800 flex items-center gap-2">
                      <Camera className="w-4 h-4" style={{ color: 'var(--color-neon)' }} />
                      <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-gray-400">
                        Galería ({filteredGraffitis.length})
                      </span>
                    </div>

                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[600px] lg:max-h-none overflow-y-auto scrollbar-thin">
                      {filteredGraffitis.map((g, i) => (
                        <motion.div
                          key={g.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="group relative cursor-pointer rounded-lg overflow-hidden border border-industrial-700 hover:border-transparent transition-all duration-300"
                          onClick={() => openLightbox(graffitis.findIndex(x => x.id === g.id))}
                        >
                          {g.imagenUrl ? (
                            <img
                              src={g.imagenUrl}
                              alt={g.titulo}
                              className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full aspect-square bg-industrial-800 flex items-center justify-center">
                              <Camera className="w-8 h-8 text-gray-600" />
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute bottom-0 left-0 right-0 p-2.5 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                            <p className="text-[10px] font-mono font-bold text-white uppercase tracking-wider truncate">{g.titulo}</p>
                            <p className="text-[9px] text-gray-400 font-mono truncate">{g.ubicacion}</p>
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Expand className="w-4 h-4 text-white drop-shadow-lg" />
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Stats bar */}
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[
                  { label: 'Grafitis', value: graffitis.length, icon: Camera },
                  { label: 'Artistas', value: new Set(graffitis.map(g => g.artista)).size, icon: MapPin },
                  { label: 'Zonas', value: new Set(graffitis.map(g => g.ubicacion)).size, icon: Map },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="bg-industrial-900 border border-industrial-800 rounded-lg p-3 text-center">
                    <Icon className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--color-neon)' }} />
                    <p className="text-lg font-black text-white">{value}</p>
                    <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">{label}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Lightbox Modal */}
        <AnimatePresence>
          {lightboxIndex >= 0 && graffitis[lightboxIndex] && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-4"
              onClick={closeLightbox}
            >
              <button
                onClick={closeLightbox}
                className="absolute top-4 right-4 z-50 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {lightboxIndex > 0 && (
                <button
                  onClick={(e) => { e.stopPropagation(); prevImage(); }}
                  className="absolute left-2 sm:left-6 z-50 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              )}
              {lightboxIndex < graffitis.length - 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); nextImage(); }}
                  className="absolute right-2 sm:right-6 z-50 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              )}

              <motion.div
                key={lightboxIndex}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative max-w-4xl w-full bg-industrial-900 border border-industrial-700 rounded-xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="md:w-3/5 relative bg-black">
                  {graffitis[lightboxIndex].imagenUrl ? (
                    <img
                      src={graffitis[lightboxIndex].imagenUrl}
                      alt={graffitis[lightboxIndex].titulo}
                      className="w-full h-64 md:h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-64 md:h-full bg-industrial-800 flex items-center justify-center">
                      <Camera className="w-12 h-12 text-gray-600" />
                    </div>
                  )}
                </div>

                <div className="md:w-2/5 p-5 flex flex-col justify-between overflow-y-auto">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--color-neon)' }}>
                        <MapPin className="w-3 h-3 text-black" />
                      </div>
                      <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">
                        {lightboxIndex + 1} / {graffitis.length}
                      </span>
                    </div>

                    <h2 className="text-xl font-black text-white uppercase tracking-wider mb-1">
                      {graffitis[lightboxIndex].titulo}
                    </h2>
                    <p className="text-[10px] font-mono mb-3" style={{ color: 'var(--color-neon)' }}>
                      {graffitis[lightboxIndex].artista}
                    </p>
                    <p className="text-xs text-gray-400 leading-relaxed mb-4">
                      {graffitis[lightboxIndex].descripcion}
                    </p>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gray-500" />
                        <span className="text-[10px] text-gray-400 font-mono">{graffitis[lightboxIndex].ubicacion}</span>
                      </div>
                    </div>

                    {graffitis[lightboxIndex].tags && (
                      <div className="flex flex-wrap gap-1.5">
                        {graffitis[lightboxIndex].tags.split(',').map(tag => tag.trim()).filter(Boolean).map(tag => (
                          <span
                            key={tag}
                            className="px-2 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider rounded border border-industrial-700 text-gray-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-industrial-800">
                    <button
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-mono font-bold uppercase tracking-wider text-black transition-all"
                      style={{ backgroundColor: 'var(--color-neon)', boxShadow: '0 0 12px var(--color-neon-shadow-sm)' }}
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: graffitis[lightboxIndex].titulo,
                            text: `Mira este grafiti: ${graffitis[lightboxIndex].titulo} - ${graffitis[lightboxIndex].ubicacion}`,
                          });
                        }
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                      Compartir
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
