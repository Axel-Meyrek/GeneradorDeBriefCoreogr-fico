/* ==========================================================================
   Spotify Service - Integración con Spotify Web API
   Usa Client Credentials Flow (no requiere login del usuario)
   ========================================================================== */

const SpotifyService = (() => {
  'use strict';

  // ---- Configuración ----
  // Reemplazar con credenciales reales de https://developer.spotify.com/dashboard
  const CONFIG = {
    clientId: '46a19bf191434e19a09e50a68647b6f5',
    clientSecret: '6737778457a94a2cbf3aff3335e95630',
    market: 'MX',
    tokenUrl: 'https://accounts.spotify.com/api/token',
    apiBase: 'https://api.spotify.com/v1'
  };

  // ---- Estado interno ----
  let accessToken = '';
  let tokenExpiry = 0;

  // Caché de búsquedas: query → { results, timestamp }
  const searchCache = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  const CACHE_MAX_SIZE = 50;

  // ---- Autenticación (Client Credentials) ----

  async function authenticate() {
    // Si el token aún es válido, reutilizar
    if (accessToken && Date.now() < tokenExpiry) {
      return accessToken;
    }

    if (!CONFIG.clientId || !CONFIG.clientSecret) {
      throw new SpotifyError(
        'CONFIG_MISSING',
        'Las credenciales de Spotify no están configuradas. Configura clientId y clientSecret en spotify-service.js'
      );
    }

    const credentials = btoa(`${CONFIG.clientId}:${CONFIG.clientSecret}`);

    const response = await fetch(CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      throw new SpotifyError(
        'AUTH_FAILED',
        'No se pudo autenticar con Spotify. Verifica las credenciales.'
      );
    }

    const data = await response.json();
    accessToken = data.access_token;
    // Expirar 60 seg antes para margen de seguridad
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;

    return accessToken;
  }

  function isConfigured() {
    return !!(CONFIG.clientId && CONFIG.clientSecret);
  }

  // ---- Búsqueda de canciones ----

  async function search(query, limit = 10) {
    const trimmed = query.trim();
    if (!trimmed) return [];

    // Revisar caché
    const cacheKey = `${trimmed.toLowerCase()}|${limit}`;
    const cached = searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.results;
    }

    const token = await authenticate();
    const params = new URLSearchParams({
      q: trimmed,
      type: 'track',
      market: CONFIG.market,
      limit: String(limit)
    });

    const response = await fetchWithRetry(
      `${CONFIG.apiBase}/search?${params}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      handleApiError(response);
    }

    const data = await response.json();
    const results = (data.tracks?.items || []).map(normalizeTrack);

    // Guardar en caché
    if (searchCache.size >= CACHE_MAX_SIZE) {
      // Eliminar la entrada más antigua
      const oldestKey = searchCache.keys().next().value;
      searchCache.delete(oldestKey);
    }
    searchCache.set(cacheKey, { results, timestamp: Date.now() });

    return results;
  }

  // ---- Obtener detalles de un track (incluye preview_url) ----

  async function getTrack(trackId) {
    if (!trackId) return null;

    const cacheKey = `track:${trackId}`;
    const cached = searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.results;
    }

    const token = await authenticate();
    const params = new URLSearchParams({ market: CONFIG.market });

    const response = await fetchWithRetry(
      `${CONFIG.apiBase}/tracks/${trackId}?${params}`,
      {
        headers: { 'Authorization': `Bearer ${token}` }
      }
    );

    if (!response.ok) {
      handleApiError(response);
    }

    const data = await response.json();
    const track = normalizeTrack(data);

    searchCache.set(cacheKey, { results: track, timestamp: Date.now() });

    return track;
  }

  // ---- Normalizar datos de un track ----

  function normalizeTrack(track) {
    return {
      id: track.id,
      name: track.name,
      artist: (track.artists || []).map((a) => a.name).join(', '),
      album: track.album?.name || '',
      albumImage: track.album?.images?.[1]?.url  // 300x300
                || track.album?.images?.[0]?.url  // fallback mayor
                || '',
      previewUrl: track.preview_url || null,
      duration: track.duration_ms || 0,
      spotifyUrl: track.external_urls?.spotify || '',
      uri: track.uri || ''
    };
  }

  // ---- Formatear duración ms → "3:45" ----

  function formatDuration(ms) {
    if (!ms) return '0:00';
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60);
    const sec = totalSec % 60;
    return `${min}:${String(sec).padStart(2, '0')}`;
  }

  // ---- Fetch con retry (1 reintento en 429 / 5xx) ----

  async function fetchWithRetry(url, options, retries = 1) {
    let response;
    try {
      response = await fetch(url, options);
    } catch {
      throw new SpotifyError('NETWORK_ERROR', 'Sin conexión a internet. Verifica tu red e intenta de nuevo.');
    }

    // Rate limit: esperar y reintentar
    if (response.status === 429 && retries > 0) {
      const retryAfter = parseInt(response.headers.get('Retry-After') || '2', 10);
      await delay(retryAfter * 1000);
      return fetchWithRetry(url, options, retries - 1);
    }

    // Error de servidor: reintentar una vez
    if (response.status >= 500 && retries > 0) {
      await delay(1000);
      return fetchWithRetry(url, options, retries - 1);
    }

    return response;
  }

  // ---- Manejo de errores de la API ----

  function handleApiError(response) {
    if (response.status === 401) {
      // Token expirado, limpiar para forzar re-auth
      accessToken = '';
      tokenExpiry = 0;
      throw new SpotifyError('TOKEN_EXPIRED', 'Sesión de Spotify expirada. Intenta buscar de nuevo.');
    }

    if (response.status === 429) {
      throw new SpotifyError('RATE_LIMIT', 'Demasiadas búsquedas. Espera unos segundos e intenta de nuevo.');
    }

    if (response.status >= 500) {
      throw new SpotifyError('SERVER_ERROR', 'Spotify no está disponible en este momento. Intenta más tarde.');
    }

    throw new SpotifyError('API_ERROR', `Error de Spotify (${response.status}). Intenta de nuevo.`);
  }

  // ---- Error personalizado ----

  class SpotifyError extends Error {
    constructor(code, message) {
      super(message);
      this.name = 'SpotifyError';
      this.code = code;
    }
  }

  // ---- Utilidades ----

  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function clearCache() {
    searchCache.clear();
  }

  // ---- API pública ----

  return {
    search,
    getTrack,
    formatDuration,
    isConfigured,
    clearCache,
    SpotifyError
  };
})();
