import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { LogOut, User, Shield, Menu, X, ChevronDown, Ticket, Award } from 'lucide-react';
import logoImg from '../assets/logo.png';

/**
 * Navbar component for Dopamina Crew portal.
 * Features:
 * - Glassmorphism blur back styling.
 * - Dynamic login states.
 * - Neon interactions.
 * - Dropdown user profile selector to prevent layout clutter.
 */
export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [currentUser, setCurrentUser] = useState(api.getUser());

  useEffect(() => {
    setCurrentUser(api.getUser());
  }, [location.pathname]);

  const [currentTheme, setCurrentTheme] = useState(localStorage.getItem('neon-theme') || 'violet');

  const [featuredEvent, setFeaturedEvent] = useState(null);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: false });
  const [showBanner, setShowBanner] = useState(true);

  useEffect(() => {
    api.getEventos()
      .then(data => {
        const featured = data.find(e => e.destacado) || data[0];
        setFeaturedEvent(featured || null);
      })
      .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (!featuredEvent) return;
    const target = new Date(`${featuredEvent.fecha}T${featuredEvent.hora || '22:00:00'}`);
    if (isNaN(target.getTime())) return;

    const tick = () => {
      const now = new Date();
      const diff = target - now;
      if (diff <= 0) {
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0, expired: true });
        return;
      }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ days, hours, minutes, seconds, expired: false });
    };

    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [featuredEvent]);

  const changeTheme = (theme) => {
    const root = document.documentElement;
    if (theme === 'green') {
      root.style.setProperty('--color-neon', '#00FF66');
      root.style.setProperty('--color-neon-light', '#33FF88');
      root.style.setProperty('--color-neon-glow', '#80FFAA');
      root.style.setProperty('--color-neon-shadow-sm', 'rgba(0, 255, 102, 0.3)');
      root.style.setProperty('--color-neon-shadow-md', 'rgba(0, 255, 102, 0.55)');
      root.style.setProperty('--color-neon-shadow-lg', 'rgba(0, 255, 102, 0.8)');
    } else if (theme === 'red') {
      root.style.setProperty('--color-neon', '#FF3E3E');
      root.style.setProperty('--color-neon-light', '#FF6666');
      root.style.setProperty('--color-neon-glow', '#FFA0A0');
      root.style.setProperty('--color-neon-shadow-sm', 'rgba(255, 62, 62, 0.3)');
      root.style.setProperty('--color-neon-shadow-md', 'rgba(255, 62, 62, 0.55)');
      root.style.setProperty('--color-neon-shadow-lg', 'rgba(255, 62, 62, 0.8)');
    } else {
      root.style.setProperty('--color-neon', '#B14EFF');
      root.style.setProperty('--color-neon-light', '#C97FFF');
      root.style.setProperty('--color-neon-glow', '#D9AAFF');
      root.style.setProperty('--color-neon-shadow-sm', 'rgba(177, 78, 255, 0.3)');
      root.style.setProperty('--color-neon-shadow-md', 'rgba(177, 78, 255, 0.55)');
      root.style.setProperty('--color-neon-shadow-lg', 'rgba(177, 78, 255, 0.8)');
    }
    localStorage.setItem('neon-theme', theme);
    setCurrentTheme(theme);
  };

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    api.clearAuth();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <div className="sticky top-0 z-40 w-full">
      {/* ⏱️ Top Promotional Countdown Banner */}
      {showBanner && featuredEvent && !countdown.expired && (
        <div 
          className="bg-black border-b border-neon-purple/20 py-2 px-4 flex items-center justify-between transition-all duration-300 relative overflow-hidden"
          style={{ borderBottomColor: 'var(--color-neon-shadow-sm)' }}
        >
          {/* Neon background overlay */}
          <div className="absolute inset-0 bg-neon-purple/[0.03] pointer-events-none" />
          
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-center z-10">
            <span className="text-[10px] sm:text-xs font-mono font-bold text-gray-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-neon-purple animate-ping" style={{ backgroundColor: 'var(--color-neon)' }} />
              ⚡ PRÓXIMO RITUAL: <strong className="text-white">{(featuredEvent.nombre || '').toUpperCase()}</strong>
              <Link to="/eventos" className="text-[10px] text-neon-purple hover:text-neon-glow font-bold uppercase tracking-wider ml-1" style={{ color: 'var(--color-neon)' }}>
                Adquirir Boletas →
              </Link>
            </span>
            
            <div className="flex items-center gap-2 text-[10px] sm:text-xs font-mono text-gray-400">
              <span className="font-bold">INICIA EN:</span>
              <div className="flex gap-1.5">
                {[
                  { v: countdown.days, l: 'd' },
                  { v: countdown.hours, l: 'h' },
                  { v: countdown.minutes, l: 'm' },
                  { v: countdown.seconds, l: 's' }
                ].map(({ v, l }) => (
                  <span key={l} className="bg-industrial-950 border border-neon-purple/30 text-white font-black rounded px-2 py-0.5 min-w-[36px] text-center shadow-neon-sm font-mono text-[11px] flex items-center justify-center gap-0.5" style={{ borderColor: 'rgba(var(--color-neon), 0.25)', textShadow: '0 0 6px var(--color-neon)' }}>
                    <span>{String(v).padStart(2, '0')}</span>
                    <span className="text-gray-500 text-[8px] font-normal uppercase">{l}</span>
                  </span>
                ))}
              </div>
            </div>
          </div>

          <button 
            onClick={() => setShowBanner(false)}
            className="text-gray-500 hover:text-white transition-colors p-1 z-10 cursor-pointer"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>
      )}

      {/* Main Navbar */}
      <nav className="bg-black/80 backdrop-blur-md border-b border-industrial-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-8 h-8 rounded border border-neon-purple flex items-center justify-center bg-black overflow-hidden transition-all duration-300 group-hover:shadow-neon-sm group-hover:border-neon-violet">
                <img src={logoImg} alt="Dopamina Logo" className="w-6 h-6 object-contain" />
              </div>
              <span className="text-xl font-black tracking-widest text-white group-hover:text-neon-glow transition-colors duration-300">
                DOPAMINA
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link
              to="/"
              className={`text-sm font-semibold tracking-wider transition-colors duration-200 ${
                isActive('/') ? 'text-neon-glow' : 'text-gray-400 hover:text-white'
              }`}
            >
              INICIO
            </Link>
            <Link
              to="/eventos"
              className={`text-sm font-semibold tracking-wider transition-colors duration-200 ${
                isActive('/eventos') ? 'text-neon-glow' : 'text-gray-400 hover:text-white'
              }`}
            >
              EVENTOS
            </Link>
            <Link
              to="/artistas"
              className={`text-sm font-semibold tracking-wider transition-colors duration-200 ${
                isActive('/artistas') ? 'text-neon-glow' : 'text-gray-400 hover:text-white'
              }`}
            >
              ARTISTAS
            </Link>
            <Link
              to="/about"
              className={`text-sm font-semibold tracking-wider transition-colors duration-200 ${
                isActive('/about') ? 'text-neon-glow' : 'text-gray-400 hover:text-white'
              }`}
            >
              QUIÉNES SOMOS
            </Link>
            <Link
              to="/policies"
              className={`text-sm font-semibold tracking-wider transition-colors duration-200 ${
                isActive('/policies') ? 'text-neon-glow' : 'text-gray-400 hover:text-white'
              }`}
            >
              ESPACIO SEGURO
            </Link>
          </div>

          {/* User Auth Info / Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Neon Customizer */}
            <div className="flex items-center space-x-2 mr-2 bg-industrial-900 border border-industrial-800 rounded-full px-2.5 py-1 select-none">
              <span className="text-[10px] tracking-wider text-gray-500 font-bold uppercase mr-1">NEÓN:</span>
              <button
                onClick={() => changeTheme('violet')}
                className={`w-3.5 h-3.5 rounded-full bg-[#B14EFF] border border-white/20 transition-all duration-200 hover:scale-110 cursor-pointer ${currentTheme === 'violet' ? 'ring-2 ring-white shadow-[0_0_8px_#B14EFF]' : ''}`}
                title="Violeta"
              />
              <button
                onClick={() => changeTheme('green')}
                className={`w-3.5 h-3.5 rounded-full bg-[#00FF66] border border-white/20 transition-all duration-200 hover:scale-110 cursor-pointer ${currentTheme === 'green' ? 'ring-2 ring-white shadow-[0_0_8px_#00FF66]' : ''}`}
                title="Verde"
              />
              <button
                onClick={() => changeTheme('red')}
                className={`w-3.5 h-3.5 rounded-full bg-[#FF3E3E] border border-white/20 transition-all duration-200 hover:scale-110 cursor-pointer ${currentTheme === 'red' ? 'ring-2 ring-white shadow-[0_0_8px_#FF3E3E]' : ''}`}
                title="Rojo"
              />
            </div>

            {currentUser ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center space-x-2 bg-industrial-900 border border-industrial-800 hover:border-neon-purple/50 rounded-full px-3 py-1.5 text-xs text-gray-300 cursor-pointer select-none transition-all duration-200 outline-none"
                >
                  {currentUser.rol === 'ROLE_ADMIN' ? (
                    <Shield className="w-3.5 h-3.5 text-neon-violet" />
                  ) : (
                    <User className="w-3.5 h-3.5 text-gray-400" />
                  )}
                  <span className="font-semibold max-w-[100px] truncate">{currentUser.nombre}</span>
                  <span className="text-[10px] bg-industrial-800 text-neon-glow px-1.5 py-0.5 rounded font-mono uppercase">
                    {currentUser.rol === 'ROLE_ADMIN' ? 'Admin' : 'Crew'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded bg-black/95 backdrop-blur-md border border-industrial-800 shadow-neon-sm py-1.5 z-50">
                    <div className="px-4 py-2 border-b border-industrial-800/60">
                      <p className="text-[10px] text-gray-500 font-mono">AUTENTICADO COMO</p>
                      <p className="text-sm font-black text-white truncate mt-0.5">{currentUser.nombre}</p>
                    </div>
                    
                    <div className="py-1.5">
                      <Link
                        to="/perfil"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-neon-purple/10 transition-colors"
                      >
                        <Award className="w-4 h-4 text-neon-purple" />
                        <span>Mi Perfil (Premios)</span>
                      </Link>
                      
                      <Link
                        to="/dashboard"
                        onClick={() => setDropdownOpen(false)}
                        className="flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-neon-purple/10 transition-colors"
                      >
                        <Ticket className="w-4 h-4 text-neon-purple" />
                        <span>Mis Boletas</span>
                      </Link>

                      {currentUser.rol === 'ROLE_ADMIN' && (
                        <Link
                          to="/admin"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center space-x-2.5 px-4 py-2 text-xs font-bold text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10 transition-colors"
                        >
                          <Shield className="w-4 h-4 text-yellow-500" />
                          <span>Panel Admin</span>
                        </Link>
                      )}
                    </div>

                    <div className="border-t border-industrial-800/60 mt-1 pt-1">
                      <button
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center space-x-2.5 px-4 py-2 text-xs font-semibold text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/login"
                  className="text-sm font-semibold text-gray-400 hover:text-white transition-colors duration-200"
                >
                  INGRESAR
                </Link>
                <Link
                  to="/register"
                  className="relative group overflow-hidden rounded bg-neon-purple px-4 py-2 text-xs font-black tracking-widest text-white shadow-neon-sm hover:shadow-neon-md transition-all duration-300"
                >
                  <span className="relative z-10">REGISTRARSE</span>
                  <div className="absolute inset-0 bg-gradient-to-r from-neon-purple to-neon-violet opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-400 hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="md:hidden bg-black/95 border-b border-industrial-800 px-4 pt-2 pb-6 space-y-4">
          <div className="flex flex-col space-y-3">
            <Link
              to="/"
              onClick={() => setIsOpen(false)}
              className={`text-sm font-bold tracking-widest py-2 ${
                isActive('/') ? 'text-neon-glow' : 'text-gray-400'
              }`}
            >
              INICIO
            </Link>
            <Link
              to="/eventos"
              onClick={() => setIsOpen(false)}
              className={`text-sm font-bold tracking-widest py-2 ${
                isActive('/eventos') ? 'text-neon-glow' : 'text-gray-400'
              }`}
            >
              EVENTOS
            </Link>
            <Link
              to="/artistas"
              onClick={() => setIsOpen(false)}
              className={`text-sm font-bold tracking-widest py-2 ${
                isActive('/artistas') ? 'text-neon-glow' : 'text-gray-400'
              }`}
            >
              ARTISTAS
            </Link>
            <Link
              to="/about"
              onClick={() => setIsOpen(false)}
              className={`text-sm font-bold tracking-widest py-2 ${
                isActive('/about') ? 'text-neon-glow' : 'text-gray-400'
              }`}
            >
              QUIÉNES SOMOS
            </Link>
            <Link
              to="/policies"
              onClick={() => setIsOpen(false)}
              className={`text-sm font-bold tracking-widest py-2 ${
                isActive('/policies') ? 'text-neon-glow' : 'text-gray-400'
              }`}
            >
              ESPACIO SEGURO
            </Link>
            {currentUser && (
              <Link
                to="/perfil"
                onClick={() => setIsOpen(false)}
                className={`text-sm font-bold tracking-widest py-2 ${
                  isActive('/perfil') ? 'text-neon-glow' : 'text-gray-400'
                }`}
              >
                MI PERFIL
              </Link>
            )}
            {currentUser && (
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className={`text-sm font-bold tracking-widest py-2 ${
                  isActive('/dashboard') ? 'text-neon-glow' : 'text-gray-400'
                }`}
              >
                MIS BOLETAS
              </Link>
            )}
            {currentUser && currentUser.rol === 'ROLE_ADMIN' && (
              <Link
                to="/admin"
                onClick={() => setIsOpen(false)}
                className="flex items-center space-x-2 text-sm font-black tracking-widest py-2 text-yellow-400 border-b border-yellow-500/20"
              >
                <Shield className="w-4 h-4" />
                <span>⚡ PANEL ADMIN</span>
              </Link>
            )}
          </div>

          <div className="pt-4 border-t border-industrial-800">
            {/* Mobile Neon Customizer */}
            <div className="flex items-center justify-between bg-industrial-900 border border-industrial-800 rounded px-4 py-2.5 mb-4">
              <span className="text-xs tracking-wider text-gray-400 font-bold uppercase">ACENTO NEÓN</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => changeTheme('violet')}
                  className={`w-5 h-5 rounded-full bg-[#B14EFF] border border-white/20 transition-all duration-200 cursor-pointer ${currentTheme === 'violet' ? 'ring-2 ring-white shadow-[0_0_10px_#B14EFF]' : ''}`}
                />
                <button
                  onClick={() => changeTheme('green')}
                  className={`w-5 h-5 rounded-full bg-[#00FF66] border border-white/20 transition-all duration-200 cursor-pointer ${currentTheme === 'green' ? 'ring-2 ring-white shadow-[0_0_10px_#00FF66]' : ''}`}
                />
                <button
                  onClick={() => changeTheme('red')}
                  className={`w-5 h-5 rounded-full bg-[#FF3E3E] border border-white/20 transition-all duration-200 cursor-pointer ${currentTheme === 'red' ? 'ring-2 ring-white shadow-[0_0_10px_#FF3E3E]' : ''}`}
                />
              </div>
            </div>

            {currentUser ? (
              <div className="flex flex-col space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-300">
                  <User className="w-4 h-4 text-neon-glow" />
                  <span>{currentUser.nombre}</span>
                  <span className="text-[10px] bg-industrial-900 border border-neon-purple/30 text-neon-glow px-2 py-0.5 rounded font-mono uppercase">
                    {currentUser.rol === 'ROLE_ADMIN' ? 'Admin' : 'Crew'}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left py-2 text-sm font-bold text-red-500 hover:text-red-400 uppercase tracking-widest"
                >
                  CERRAR SESIÓN
                </button>
              </div>
            ) : (
              <div className="flex flex-col space-y-3">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="text-sm font-bold text-gray-400 hover:text-white"
                >
                  INGRESAR
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center bg-neon-purple text-white text-xs font-black tracking-widest py-2.5 rounded shadow-neon-sm"
                >
                  REGISTRARSE
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
    </div>
  );
}
