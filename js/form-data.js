/* ==========================================================================
   Form Data - Modelo de datos y persistencia con localStorage
   ========================================================================== */

const FormData = (() => {
  'use strict';

  const STORAGE_KEY = 'danza-perfecta-brief';

  const defaultData = {
    // Paso 1 - Evento
    eventType: '',
    eventTypeCustom: '',
    names: '',
    eventDate: '',

    // Paso 2 - Música
    songs: [],
    letFernandoSuggest: false,

    // Paso 3 - Duración y estilo
    duration: 6,
    styles: [],
    references: '',

    // Paso 4 - Experiencia
    experienceLevel: '',
    experienceDetails: ''
  };

  let data = {};

  // ---- Persistencia ----

  function load() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        data = { ...defaultData, ...JSON.parse(saved) };
      } else {
        data = { ...defaultData };
      }
    } catch {
      data = { ...defaultData };
    }
    return data;
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage lleno o no disponible
    }
  }

  function clear() {
    data = { ...defaultData };
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // silencioso
    }
  }

  // ---- Getters / Setters ----

  function get(key) {
    return data[key];
  }

  function set(key, value) {
    data[key] = value;
    save();
  }

  function update(partial) {
    Object.assign(data, partial);
    save();
  }

  function getAll() {
    return { ...data };
  }

  // ---- Helpers ----

  function getEventLabel() {
    if (data.eventType === 'Otro' && data.eventTypeCustom) {
      return data.eventTypeCustom;
    }
    return data.eventType || '';
  }

  // ---- Init ----

  function init() {
    load();
  }

  return {
    init,
    get,
    set,
    update,
    getAll,
    getEventLabel,
    load,
    save,
    clear
  };
})();
