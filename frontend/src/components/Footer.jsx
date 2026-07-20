import React from 'react';
import { Link } from 'react-router-dom';
import { HeartHandshake, Instagram } from 'lucide-react';

/**
 * Footer component highlighting space safety protocol.
 */
export default function Footer() {
  return (
    <footer className="bg-industrial-950 border-t border-industrial-800 py-12 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 mb-12">
          {/* Brand & Mission */}
          <div className="space-y-4">
            <span className="text-xl font-black tracking-widest text-white">DOPAMINA</span>
            <p className="text-xs text-gray-500 font-mono italic">MOCOA UNDERGROUND INFLUENCE</p>
            <div className="flex space-x-4">
              <a
                href="https://www.instagram.com/dopaminalab.eventos/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-neon-glow transition-colors"
                title="Siguenos en Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Navegación principal */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Navegación</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/" className="hover:text-neon-glow transition-colors">Inicio</Link></li>
              <li><Link to="/eventos" className="hover:text-neon-glow transition-colors">Eventos</Link></li>
              <li><Link to="/artistas" className="hover:text-neon-glow transition-colors">Artistas</Link></li>
              <li><Link to="/about" className="hover:text-neon-glow transition-colors">Manifiesto</Link></li>
            </ul>
          </div>

          {/* Experiencias */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Experiencias</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/combos" className="hover:text-neon-glow transition-colors">Combos</Link></li>
              <li><Link to="/arcade" className="hover:text-neon-glow transition-colors">Zona Arcade</Link></li>
              <li><Link to="/graffiti" className="hover:text-neon-glow transition-colors">Graffiti</Link></li>
            </ul>
          </div>

          {/* Cuenta */}
          <div>
            <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Mi Cuenta</h4>
            <ul className="space-y-2 text-xs text-gray-400">
              <li><Link to="/login" className="hover:text-neon-glow transition-colors">Ingresar</Link></li>
              <li><Link to="/register" className="hover:text-neon-glow transition-colors">Registrarse</Link></li>
              <li><Link to="/dashboard" className="hover:text-neon-glow transition-colors">Mis Boletas</Link></li>
              <li><Link to="/perfil" className="hover:text-neon-glow transition-colors">Mi Perfil</Link></li>
            </ul>
          </div>
        </div>

        {/* Safe Space Callout */}
        <div className="flex flex-col justify-center p-6 bg-black/40 border border-neon-purple/20 rounded-lg mb-8">
          <div className="flex items-center space-x-2 text-neon-glow mb-2">
            <HeartHandshake className="w-5 h-5" />
            <span className="text-xs font-bold tracking-widest uppercase">Protocolo Espacio Seguro</span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Cero tolerancia al acoso, la discriminación y la violencia. Cuidamos el parche, cuidamos la pista.
            Si te sientes incómodo, busca a nuestro staff identificado.{' '}
            <Link to="/policies" className="text-neon-glow hover:underline font-semibold">Conoce el protocolo completo</Link>.
          </p>
        </div>

        {/* Legal & Copyright */}
        <div className="border-t border-industrial-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex space-x-6 text-[10px] text-gray-500 font-mono">
            <Link to="/policies" className="hover:text-white">Espacio Seguro</Link>
            <Link to="/terminos" className="hover:text-white">Términos y Condiciones</Link>
          </div>
          <p className="text-[10px] text-gray-600 font-mono">
            &copy; {new Date().getFullYear()} DOPAMINA. TODOS LOS DERECHOS RESERVADOS.
          </p>
        </div>
      </div>
    </footer>
  );
}
