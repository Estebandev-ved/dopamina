import { useCallback } from 'react';
import { api } from './api';

const PIXEL_ID = import.meta.env.VITE_FACEBOOK_PIXEL_ID || '1667872257652141';

function sha256(message) {
  const msgBuffer = new TextEncoder().encode(message);
  return crypto.subtle.digest('SHA-256', msgBuffer).then(hashBuffer => {
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  });
}

function normalizeEmail(email) {
  return email?.toLowerCase().trim() || '';
}

function normalizePhone(phone) {
  return phone?.replace(/[^0-9]/g, '') || '';
}

/**
 * Hook para disparar eventos de Meta Pixel (navegador) + Conversions API (servidor).
 * Uso: const { trackEvent } = useFacebookPixel();
 *      trackEvent('ViewContent', { content_name: '...', value: 25000 });
 */
export default function useFacebookPixel() {
  const trackEvent = useCallback(async (eventName, params = {}, userData = {}) => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('track', eventName, params);
    }

    const currentUser = api.getUser();
    const serverData = { ...userData };

    if (currentUser?.email) {
      serverData.em = normalizeEmail(currentUser.email);
    }
    if (currentUser?.telefono) {
      serverData.ph = normalizePhone(currentUser.telefono);
    }

    if (serverData.em) {
      serverData.em = await sha256(serverData.em);
    }
    if (serverData.ph) {
      serverData.ph = await sha256(serverData.ph);
    }

    try {
      api.sendCAPIEvent(eventName, params, serverData).catch(() => {});
    } catch {
      // CAPI es best-effort; no bloquear UI
    }
  }, []);

  const trackCustom = useCallback(async (customEventName, params = {}) => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('trackCustom', customEventName, params);
    }
  }, []);

  const setUserData = useCallback((data) => {
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      window.fbq('init', PIXEL_ID, data);
    }
  }, []);

  return { trackEvent, trackCustom, setUserData };
}
