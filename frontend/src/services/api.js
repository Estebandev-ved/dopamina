const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Service class for communicating with the Spring Boot backend API.
 * Security Note:
 * - Authorizations tokens (JWT) are sent in the headers for protected resources.
 * - Standard headers prevent CSRF issues in cross-origin environments.
 */
class ApiService {
  getToken() {
    return localStorage.getItem('dopamina_jwt');
  }

  setToken(token) {
    localStorage.setItem('dopamina_jwt', token);
  }

  setUser(user) {
    localStorage.setItem('dopamina_user', JSON.stringify(user));
  }

  getUser() {
    const userStr = localStorage.getItem('dopamina_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  isTokenExpired() {
    const token = this.getToken();
    if (!token) return true;
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const payload = JSON.parse(atob(base64));
      if (!payload.exp) return false;
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  isAuthenticated() {
    return !!this.getUser() && !this.isTokenExpired();
  }

  clearAuth() {
    localStorage.removeItem('dopamina_jwt');
    localStorage.removeItem('dopamina_user');
  }

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    // Set headers
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add JWT Token if available
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401 && !endpoint.includes('/api/auth/') && !endpoint.startsWith('/api/public/')) {
          this.clearAuth();
          if (!window.location.pathname.includes('/login')) {
            sessionStorage.setItem('dopamina_redirect_after_login', window.location.pathname + window.location.search);
            window.location.href = '/login';
          }
          throw new Error('Sesión expirada. Inicie sesión de nuevo.');
        }
        // Handle error payloads
        let errorMessage = data.message;
        if (!errorMessage && response.status === 400 && typeof data === 'object') {
          // Check if it's a field validation error mapping
          const errorsList = Object.entries(data).map(([field, msg]) => `${field}: ${msg}`);
          if (errorsList.length > 0) {
            errorMessage = errorsList.join(' | ');
          }
        }
        if (!errorMessage) {
          errorMessage = 'Ha ocurrido un error inesperado.';
        }
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error(`API Error on ${endpoint}:`, error);
      throw error;
    }
  }

  get(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'GET', headers });
  }

  post(endpoint, body, headers = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
      headers,
    });
  }

  delete(endpoint, headers = {}) {
    return this.request(endpoint, { method: 'DELETE', headers });
  }

  // Auth Operations
  register(name, email, phone, password) {
    return this.post('/api/auth/register', {
      nombre: name,
      email,
      telefono: phone,
      password,
    });
  }

  async login(email, password) {
    const res = await this.post('/api/auth/login', { email, password });
    if (res.token) {
      this.setToken(res.token);
      this.setUser({
        id: res.id,
        nombre: res.nombre,
        email: res.email,
        rol: res.rol,
      });
    }
    return res;
  }

  async loginWithGoogle(email, nombre, googleId) {
    const res = await this.post('/api/auth/google', { email, nombre, googleId });
    if (res.token) {
      this.setToken(res.token);
      this.setUser({
        id: res.id,
        nombre: res.nombre,
        email: res.email,
        rol: res.rol,
      });
    }
    return res;
  }

  // Protected operations
  buyTicket() {
    return this.post('/api/events/buy-ticket', {});
  }

  checkout(cantidad, codigoCupon, eventoId) {
    return this.post('/api/compras/checkout', { cantidad, codigoCupon, eventoId });
  }

  getMisBoletas() {
    return this.get('/api/compras/mis-boletas');
  }

  // ¿El usuario aún puede usar la promo de 10% por 4+ boletas?
  getPromoParcheDisponible() {
    return this.get('/api/compras/promo-parche');
  }

  // Admin Operations (ROLE_ADMIN only)
  adminGetStats() {
    return this.get('/api/admin/stats');
  }

  adminGetCompras() {
    return this.get('/api/admin/compras');
  }

  adminGetUsuarios() {
    return this.get('/api/admin/usuarios');
  }

  adminDeleteCompra(id) {
    return this.delete(`/api/admin/compras/${id}`);
  }

  adminDeleteUsuario(id) {
    return this.delete(`/api/admin/usuarios/${id}`);
  }

  adminValidarQr(codigoQr) {
    return this.post('/api/admin/boletas/validar-qr', { codigoQr });
  }

  adminGetLogsAcceso() {
    return this.get('/api/admin/boletas/logs-acceso');
  }

  adminClearLogsAcceso() {
    return this.delete('/api/admin/boletas/logs-acceso');
  }

  // ── Eventos Públicos ──────────────────────────────────────────────────────
  getEventos() {
    return this.get('/api/public/eventos');
  }

  getEventosDestacados() {
    return this.get('/api/public/eventos/destacados');
  }

  getEvento(id) {
    return this.get(`/api/public/eventos/${id}`);
  }

  // ── Eventos Admin (ROLE_ADMIN) ────────────────────────────────────────────
  adminGetEventos() {
    return this.get('/api/admin/eventos');
  }

  adminCrearEvento(data) {
    return this.post('/api/admin/eventos', data);
  }

  adminActualizarEvento(id, data) {
    return this.request(`/api/admin/eventos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  adminToggleEvento(id) {
    return this.request(`/api/admin/eventos/${id}/toggle`, { method: 'PATCH' });
  }

  adminDeleteEvento(id) {
    return this.delete(`/api/admin/eventos/${id}`);
  }

  // ── Canjes (Premios) ──────────────────────────────────────────────────────
  getPoints() {
    return this.get('/api/canjes/puntos');
  }

  getMisCanjes() {
    return this.get('/api/canjes/mis-canjes');
  }

  reclamarPremio(premioId, premioTitulo, costoPuntos) {
    return this.post('/api/canjes/reclamar', { premioId, premioTitulo, costoPuntos });
  }

  adminGetCanjes() {
    return this.get('/api/admin/canjes');
  }

  adminUpdateCanjeEstado(id, estado) {
    return this.request(`/api/admin/canjes/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    });
  }

  // ── Transferencias de Boletas ──────────────────────────────────────────────
  transferirBoleta(boletaId, emailDestino) {
    return this.post('/api/compras/transferir', { boletaId, emailDestino });
  }

  // ── Alertas de Espacio Seguro ──────────────────────────────────────────────
  crearReporteSeguridad(tipo, ubicacion, descripcion, anonimo) {
    return this.post('/api/public/reportes-seguridad', { tipo, ubicacion, descripcion, anonimo });
  }

  adminGetReportesSeguridad() {
    return this.get('/api/admin/reportes-seguridad');
  }

  adminResolverReporteSeguridad(id, estado) {
    return this.request(`/api/admin/reportes-seguridad/${id}/resolver`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    });
  }

  adminGetTransferencias() {
    return this.get('/api/admin/transferencias');
  }

  // ── Efipay Payment Gateway ──────────────────────────────────────────────────
  efipayGenerate(cantidad, codigoCupon, eventoId) {
    return this.post('/api/pagos/efipay/generate', { cantidad, codigoCupon, eventoId });
  }

  efipayPaymentStatus(compraId) {
    return this.get(`/api/pagos/efipay/status/${compraId}`);
  }

  adminVerifyPaymentStatus(compraId) {
    return this.get(`/api/admin/pagos/efipay/status/${compraId}`);
  }

  // ── Artistas ───────────────────────────────────────────────────────────────
  getArtistas() {
    return this.get('/api/public/artistas');
  }

  adminGetArtistas() {
    return this.get('/api/admin/artistas');
  }

  adminCrearArtista(data) {
    return this.post('/api/admin/artistas', data);
  }

  adminActualizarArtista(id, data) {
    return this.request(`/api/admin/artistas/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  adminEliminarArtista(id) {
    return this.delete(`/api/admin/artistas/${id}`);
  }

  // ── Ciberseguridad & Logs de Auditoría ──────────────────────────────────────
  adminGetLoginLogs() {
    return this.get('/api/admin/seguridad/logs');
  }

  adminBanUsuario(id) {
    return this.request(`/api/admin/seguridad/usuarios/${id}/ban`, { method: 'PUT' });
  }

  adminUnbanUsuario(id) {
    return this.request(`/api/admin/seguridad/usuarios/${id}/unban`, { method: 'PUT' });
  }

  adminActualizarRolUsuario(id, rol) {
    return this.request(`/api/admin/seguridad/usuarios/${id}/rol`, {
      method: 'PUT',
      body: JSON.stringify({ rol }),
    });
  }

  adminRegalarBoletas(data) {
    return this.post('/api/admin/boletas/regalar', data);
  }

  adminGetSorteoGanador(eventoId, numeroSorteo) {
    return this.get(`/api/admin/boletas/sorteo?eventoId=${eventoId}&numeroSorteo=${numeroSorteo}`);
  }

  adminGetSorteoParticipantes(eventoId) {
    return this.get(`/api/admin/boletas/sorteo/participantes?eventoId=${eventoId}`);
  }

  // ── Sugerencias del Público ─────────────────────────────────────────────────
  enviarSugerencia(contenido, nombre, email) {
    return this.post('/api/public/sugerencias', { contenido, nombre, email });
  }

  adminGetSugerencias() {
    return this.get('/api/admin/sugerencias');
  }

  adminActualizarEstadoSugerencia(id, estado) {
    return this.request(`/api/admin/sugerencias/${id}/estado`, {
      method: 'PUT',
      body: JSON.stringify({ estado }),
    });
  }

  // ── Sets Musicales (YouTube) ───────────────────────────────────────────
  getSets() {
    return this.get('/api/public/sets');
  }

  getSetsPorGenero(genero) {
    return this.get(`/api/public/sets/genero/${genero}`);
  }

  adminGetSets() {
    return this.get('/api/admin/sets');
  }

  adminCrearSet(data) {
    return this.post('/api/admin/sets', data);
  }

  adminActualizarSet(id, data) {
    return this.request(`/api/admin/sets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  adminEliminarSet(id) {
    return this.delete(`/api/admin/sets/${id}`);
  }

  // ── Tracking de Visitas ──────────────────────────────────────────────────
  trackVisit(pagina, titulo) {
    const user = this.getUser();
    const body = { pagina, titulo };
    if (user) body.usuarioId = user.id;
    return this.post('/api/public/visitas/track', body);
  }

  adminGetVisitStats() {
    return this.get('/api/public/visitas/stats');
  }

  adminGetAllVisits() {
    return this.get('/api/public/visitas');
  }

  // Cupones Public
  publicValidarCupon(codigo, cantidad = '') {
    const qtyParam = cantidad !== '' ? `&cantidad=${cantidad}` : '';
    return this.get(`/api/public/cupones/validar?codigo=${codigo}${qtyParam}`);
  }

  // Cupones Admin
  adminGetCupones() {
    return this.get('/api/admin/cupones');
  }

  adminGetCuponesReporte() {
    return this.get('/api/admin/cupones/reporte');
  }

  adminCreateCupon(data) {
    return this.post('/api/admin/cupones', data);
  }

  adminToggleCupon(id) {
    return this.request(`/api/admin/cupones/${id}/toggle`, { method: 'PUT' });
  }

  adminDeleteCupon(id) {
    return this.request(`/api/admin/cupones/${id}`, { method: 'DELETE' });
  }

  adminEnviarCorreo(to, subject, body) {
    return this.post('/api/admin/enviar-correo', { to, subject, body });
  }

  // ── Promotores (ROLE_PROMOTER) ───────────────────────────────────────────
  promotorGetStats() {
    return this.get('/api/promotor/stats');
  }

  promotorGetVentas() {
    return this.get('/api/promotor/ventas');
  }

  promotorGetCuenta() {
    return this.get('/api/promotor/cuenta');
  }

  promotorSaveCuenta(data) {
    return this.request('/api/promotor/cuenta', { method: 'PUT', body: JSON.stringify(data) });
  }

  // ── Admin: reporte de todos los promotores ────────────────────────────────
  adminGetPromotores() {
    return this.get('/api/admin/cupones/reporte').then(cupones =>
      // Filtramos solo cupones con promotor vinculado y los agrupamos por promotor
      (cupones || []).filter(c => c.promotorNombre)
    );
  }

  // ── Campañas y Retos ────────────────────────────────────────────────────────
  adminEnviarCampana(subject, message, target) {
    return this.post('/api/admin/campanas/enviar', { subject, message, target });
  }

  adminActualizarReto(message) {
    return this.post('/api/admin/campanas/reto', { message });
  }

  promotorGetRetoActivo() {
    return this.get('/api/promotor/reto-activo');
  }
}

export const api = new ApiService();

