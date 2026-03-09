/* ==========================================================================
   Music Service - Integración con iTunes Search API (Apple Music)
   Sin autenticación requerida, CORS habilitado, previews de 30 seg.
   Mantiene la misma interfaz pública que el servicio anterior de Spotify.
   ========================================================================== */

const SpotifyService = (() => {
  'use strict';

  // ---- Configuración ----
  const CONFIG = {
    apiBase: 'https://itunes.apple.com/search',
    country: 'MX',
    media: 'music',
    entity: 'song'
  };

  // Caché de búsquedas: query → { results, timestamp }
  const searchCache = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutos
  const CACHE_MAX_SIZE = 50;

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

    const params = new URLSearchParams({
      term: trimmed,
      country: CONFIG.country,
      media: CONFIG.media,
      entity: CONFIG.entity,
      limit: String(limit)
    });

    let response;
    try {
      response = await fetch(`${CONFIG.apiBase}?${params}`);
    } catch {
      throw new SpotifyError('NETWORK_ERROR', 'Sin conexión a internet. Verifica tu red e intenta de nuevo.');
    }

    if (!response.ok) {
      throw new SpotifyError('API_ERROR', `Error de búsqueda (${response.status}). Intenta de nuevo.`);
    }

    const data = await response.json();
    const results = (data.results || []).map(normalizeTrack);

    // Guardar en caché
    if (searchCache.size >= CACHE_MAX_SIZE) {
      const oldestKey = searchCache.keys().next().value;
      searchCache.delete(oldestKey);
    }
    searchCache.set(cacheKey, { results, timestamp: Date.now() });

    return results;
  }

  // ---- Obtener detalles de un track por ID (trackId = iTunes trackId numérico) ----

  async function getTrack(trackId) {
    if (!trackId) return null;

    const cacheKey = `track:${trackId}`;
    const cached = searchCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      return cached.results;
    }

    let response;
    try {
      const params = new URLSearchParams({
        id: String(trackId),
        country: CONFIG.country
      });
      response = await fetch(`https://itunes.apple.com/lookup?${params}`);
    } catch {
      throw new SpotifyError('NETWORK_ERROR', 'Sin conexión a internet. Verifica tu red e intenta de nuevo.');
    }

    if (!response.ok) {
      throw new SpotifyError('API_ERROR', `Error al obtener canción (${response.status}).`);
    }

    const data = await response.json();
    if (!data.results?.length) return null;

    const track = normalizeTrack(data.results[0]);
    searchCache.set(cacheKey, { results: track, timestamp: Date.now() });

    return track;
  }

  // ---- Normalizar datos de un track (misma forma que antes) ----

  function normalizeTrack(item) {
    // iTunes devuelve artworkUrl100; lo escalamos a 300x300
    const albumImage = (item.artworkUrl100 || '').replace('100x100', '300x300');

    return {
      id: String(item.trackId || ''),
      name: item.trackName || '',
      artist: item.artistName || '',
      album: item.collectionName || '',
      albumImage,
      previewUrl: item.previewUrl || null,
      duration: item.trackTimeMillis || 0,
      spotifyUrl: item.trackViewUrl || '',  // enlace a Apple Music
      uri: `itunes:track:${item.trackId || ''}`
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

  // ---- isConfigured: siempre true (no se necesitan credenciales) ----

  function isConfigured() {
    return true;
  }

  // ---- Error personalizado (mantiene el mismo nombre para compatibilidad) ----

  class SpotifyError extends Error {
    constructor(code, message) {
      super(message);
      this.name = 'SpotifyError';
      this.code = code;
    }
  }

  function clearCache() {
    searchCache.clear();
  }

  // ---- API pública (idéntica a la anterior) ----

  return {
    search,
    getTrack,
    formatDuration,
    isConfigured,
    clearCache,
    SpotifyError
  };
})();
