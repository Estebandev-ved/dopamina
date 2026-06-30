import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { api } from './api';

const PAGE_TITLES = {
  '/': 'Inicio',
  '/eventos': 'Eventos',
  '/artistas': 'Artistas',
  '/about': 'Quiénes Somos',
  '/policies': 'Espacio Seguro',
  '/login': 'Iniciar Sesión',
  '/register': 'Registrarse',
  '/checkout': 'Checkout',
  '/dashboard': 'Mis Boletas',
  '/perfil': 'Mi Perfil',
  '/pago-resultado': 'Resultado del Pago',
  '/admin': 'Panel Admin',
};

export default function usePageTracking() {
  const location = useLocation();
  const lastPath = useRef('');

  useEffect(() => {
    if (location.pathname === lastPath.current) return;
    lastPath.current = location.pathname;

    const titulo = PAGE_TITLES[location.pathname] || 'Dopamina Crew';
    api.trackVisit(location.pathname, titulo).catch(() => {});
  }, [location.pathname]);
}
