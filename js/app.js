/* ==========================================================================
   App.js - Punto de entrada principal de la aplicación
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // Inicializar módulos
  FormData.init();
  StepsManager.init();

  // ---- Botón "Comenzar mi proyecto" ----
  const btnStart = document.getElementById('btn-start');
  let welcomeAnimationsCleared = false;

  if (btnStart) {
    btnStart.addEventListener('click', () => {
      clearWelcomeAnimations();
      StepsManager.goTo(1);
    });
  }

  // Eliminar clases de animación del welcome para que no se repitan al volver
  function clearWelcomeAnimations() {
    if (welcomeAnimationsCleared) return;
    welcomeAnimationsCleared = true;

    const welcome = document.getElementById('welcome');
    if (!welcome) return;

    welcome.querySelectorAll('.fade-in, .fade-in-up').forEach((el) => {
      el.classList.remove('fade-in', 'fade-in-up');
      el.style.opacity = '1';
      el.style.transform = '';
    });
  }

  // ================================================================
  // PASO 1 - Información del Evento
  // ================================================================

  const step1 = (() => {
    const eventGrid = document.getElementById('event-type-grid');
    const customWrapper = document.getElementById('event-type-custom-wrapper');
    const customInput = document.getElementById('event-type-custom');
    const namesInput = document.getElementById('event-names');
    const dateInput = document.getElementById('event-date');

    // Fecha mínima = hoy
    if (dateInput) {
      dateInput.min = new Date().toISOString().split('T')[0];
    }

    // ---- Selección de tipo de evento (card grid) ----
    if (eventGrid) {
      eventGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.card-option');
        if (!card) return;

        // Deseleccionar todas
        eventGrid.querySelectorAll('.card-option').forEach((c) => {
          c.setAttribute('aria-checked', 'false');
        });

        // Seleccionar la actual
        card.setAttribute('aria-checked', 'true');
        const value = card.dataset.value;
        FormData.set('eventType', value);

        // Mostrar/ocultar input "Otro"
        if (value === 'Otro') {
          customWrapper.classList.add('visible');
          customInput.focus();
        } else {
          customWrapper.classList.remove('visible');
          FormData.set('eventTypeCustom', '');
        }
      });
    }

    // ---- Input "Otro" tipo de evento ----
    if (customInput) {
      customInput.addEventListener('input', () => {
        FormData.set('eventTypeCustom', customInput.value.trim());
      });
    }

    // ---- Input nombres ----
    if (namesInput) {
      namesInput.addEventListener('input', () => {
        FormData.set('names', namesInput.value.trim());
      });
    }

    // ---- Input fecha ----
    if (dateInput) {
      dateInput.addEventListener('change', () => {
        FormData.set('eventDate', dateInput.value);
      });
    }

    // ---- Restaurar datos desde localStorage ----
    function restore() {
      const data = FormData.getAll();

      // Tipo de evento
      if (data.eventType) {
        const card = eventGrid.querySelector(`[data-value="${data.eventType}"]`);
        if (card) {
          card.setAttribute('aria-checked', 'true');
        }
        if (data.eventType === 'Otro') {
          customWrapper.classList.add('visible');
          customInput.value = data.eventTypeCustom || '';
        }
      }

      // Nombres y fecha
      if (data.names) namesInput.value = data.names;
      if (data.eventDate) dateInput.value = data.eventDate;
    }

    // ---- Validación ----
    function validate() {
      const type = FormData.get('eventType');
      const names = FormData.get('names');

      if (!type) {
        return 'Selecciona el tipo de evento.';
      }
      if (type === 'Otro' && !FormData.get('eventTypeCustom')) {
        return 'Especifica el tipo de evento.';
      }
      if (!names) {
        return 'Ingresa los nombres de los protagonistas.';
      }
      return true;
    }

    restore();
    return { validate };
  })();

  // Registrar validador del paso 1
  StepsManager.registerValidator(1, step1.validate);

  // ================================================================
  // PASO 2 - Selección Musical
  // ================================================================

  const step2 = (() => {
    const MAX_SONGS = 3;
    const DEBOUNCE_MS = 350;

    const searchInput = document.getElementById('music-search');
    const searchSpinner = document.getElementById('search-spinner');
    const searchHint = document.getElementById('search-hint');
    const searchResults = document.getElementById('search-results');
    const songTagsContainer = document.getElementById('song-tags');
    const searchGroup = document.getElementById('music-search-group');
    const fernandoCheckbox = document.getElementById('fernando-suggest');
    const previewAudio = document.getElementById('preview-audio');

    let debounceTimer = null;
    let currentPlayingId = null;

    // ---- Debounced search ----

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        const query = searchInput.value.trim();

        if (!query) {
          clearResults();
          return;
        }

        debounceTimer = setTimeout(() => performSearch(query), DEBOUNCE_MS);
      });
    }

    async function performSearch(query) {
      showSpinner(true);
      clearResults();

      if (!SpotifyService.isConfigured()) {
        showStatus('Búsqueda no disponible. Usa la opción de abajo para que Fernando sugiera la música.', true);
        showSpinner(false);
        return;
      }

      try {
        const results = await SpotifyService.search(query, 8);

        if (results.length === 0) {
          showStatus('No se encontraron canciones. Intenta con otro término.');
        } else {
          renderResults(results);
        }
      } catch (err) {
        const msg = err instanceof SpotifyService.SpotifyError
          ? err.message
          : 'Error al buscar. Intenta de nuevo.';
        showStatus(msg, true);
      } finally {
        showSpinner(false);
      }
    }

    // ---- Render results ----

    function renderResults(tracks) {
      searchResults.innerHTML = '';
      const selectedIds = (FormData.get('songs') || []).map((s) => s.id);

      tracks.forEach((track) => {
        const isSelected = selectedIds.includes(track.id);
        const el = document.createElement('div');
        el.className = `track-item${isSelected ? ' track-item--selected' : ''}`;
        el.setAttribute('role', 'option');
        el.setAttribute('aria-selected', isSelected);
        el.dataset.trackId = track.id;

        el.innerHTML = `
          <div class="track-item__cover">
            ${track.albumImage ? `<img src="${track.albumImage}" alt="" loading="lazy">` : ''}
            ${track.previewUrl ? `
              <button type="button" class="track-item__play" data-preview="${track.previewUrl}" data-track-id="${track.id}" aria-label="Escuchar preview">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              </button>
            ` : ''}
          </div>
          <div class="track-item__info">
            <span class="track-item__name">${escapeHtml(track.name)}</span>
            <span class="track-item__artist">${escapeHtml(track.artist)}</span>
          </div>
          <span class="track-item__duration">${SpotifyService.formatDuration(track.duration)}</span>
          <button type="button" class="track-item__add${isSelected ? ' track-item__add--added' : ''}" data-action-add aria-label="${isSelected ? 'Quitar canción' : 'Agregar canción'}">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              ${isSelected
                ? '<polyline points="20 6 9 17 4 12"/>'
                : '<path d="M12 5v14"/><path d="M5 12h14"/>'
              }
            </svg>
          </button>
        `;

        // Click en play/pause
        const playBtn = el.querySelector('.track-item__play');
        if (playBtn) {
          playBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            togglePreview(playBtn.dataset.preview, playBtn.dataset.trackId, playBtn);
          });
        }

        // Click en agregar/quitar
        const addBtn = el.querySelector('[data-action-add]');
        addBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          if (isSelected) {
            removeSong(track.id);
          } else {
            addSong(track);
          }
        });

        searchResults.appendChild(el);
      });
    }

    function showStatus(message, isError = false) {
      searchResults.innerHTML = `<div class="search-results__status${isError ? ' search-results__status--error' : ''}">${escapeHtml(message)}</div>`;
    }

    function clearResults() {
      searchResults.innerHTML = '';
    }

    function showSpinner(show) {
      searchSpinner.classList.toggle('visible', show);
    }

    // ---- Audio preview ----

    function togglePreview(url, trackId, btn) {
      if (!url || !previewAudio) return;

      // Si ya está reproduciéndose esta canción, pausar
      if (currentPlayingId === trackId) {
        stopPreview();
        return;
      }

      // Parar cualquier preview anterior
      stopPreview();

      previewAudio.src = url;
      previewAudio.play().catch(() => {});
      currentPlayingId = trackId;

      // Marcar botón como playing
      btn.classList.add('playing');
      btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>';

      // Parar al terminar
      previewAudio.onended = () => stopPreview();
    }

    function stopPreview() {
      if (!previewAudio) return;
      previewAudio.pause();
      previewAudio.src = '';
      currentPlayingId = null;

      // Resetear todos los botones de play
      document.querySelectorAll('.track-item__play.playing').forEach((btn) => {
        btn.classList.remove('playing');
        btn.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><polygon points="5 3 19 12 5 21 5 3"/></svg>';
      });
    }

    // ---- Agregar / quitar canciones ----

    function addSong(track) {
      const songs = FormData.get('songs') || [];
      if (songs.length >= MAX_SONGS) {
        showStatus(`Máximo ${MAX_SONGS} canciones. Quita una para agregar otra.`);
        return;
      }
      if (songs.find((s) => s.id === track.id)) return;

      songs.push({
        id: track.id,
        name: track.name,
        artist: track.artist,
        album: track.album,
        albumImage: track.albumImage,
        previewUrl: track.previewUrl,
        duration: track.duration,
        spotifyUrl: track.spotifyUrl
      });

      FormData.set('songs', songs);
      renderTags();
      updateSearchHint();

      // Re-render results para actualizar estado de botones
      if (searchResults.children.length > 0 && searchInput.value.trim()) {
        performSearch(searchInput.value.trim());
      }
    }

    function removeSong(trackId) {
      let songs = FormData.get('songs') || [];
      songs = songs.filter((s) => s.id !== trackId);
      FormData.set('songs', songs);
      renderTags();
      updateSearchHint();

      // Re-render results
      if (searchResults.children.length > 0 && searchInput.value.trim()) {
        performSearch(searchInput.value.trim());
      }
    }

    // ---- Tags visuales ----

    function renderTags() {
      const songs = FormData.get('songs') || [];
      songTagsContainer.innerHTML = '';

      songs.forEach((song) => {
        const tag = document.createElement('span');
        tag.className = 'song-tag';
        tag.innerHTML = `
          <span class="song-tag__name" title="${escapeHtml(song.name)} — ${escapeHtml(song.artist)}">${escapeHtml(song.name)}</span>
          <button type="button" class="song-tag__remove" data-remove-id="${song.id}" aria-label="Quitar ${escapeHtml(song.name)}">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        `;
        songTagsContainer.appendChild(tag);
      });

      // Delegación para botones de remove
      songTagsContainer.querySelectorAll('[data-remove-id]').forEach((btn) => {
        btn.addEventListener('click', () => removeSong(btn.dataset.removeId));
      });
    }

    function updateSearchHint() {
      const songs = FormData.get('songs') || [];
      const remaining = MAX_SONGS - songs.length;
      if (remaining <= 0) {
        searchHint.textContent = `Has seleccionado el máximo de ${MAX_SONGS} canciones`;
      } else if (songs.length > 0) {
        searchHint.textContent = `${songs.length} de ${MAX_SONGS} canciones · Puedes agregar ${remaining} más`;
      } else {
        searchHint.textContent = 'Escribe para buscar canciones';
      }
    }

    // ---- Checkbox "Fernando sugiere" ----

    if (fernandoCheckbox) {
      fernandoCheckbox.addEventListener('change', () => {
        const checked = fernandoCheckbox.checked;
        FormData.set('letFernandoSuggest', checked);
        toggleSearchDisabled(checked);
        if (checked) stopPreview();
      });
    }

    function toggleSearchDisabled(disabled) {
      const targets = [searchGroup, songTagsContainer, searchResults];
      targets.forEach((el) => {
        if (!el) return;
        if (disabled) {
          el.classList.add('music-search-disabled');
        } else {
          el.classList.remove('music-search-disabled');
        }
      });
      if (searchInput) searchInput.disabled = disabled;
    }

    // ---- Restore ----

    function restore() {
      const data = FormData.getAll();
      renderTags();
      updateSearchHint();

      if (data.letFernandoSuggest) {
        fernandoCheckbox.checked = true;
        toggleSearchDisabled(true);
      }
    }

    // ---- Validación ----

    function validate() {
      const suggest = FormData.get('letFernandoSuggest');
      const songs = FormData.get('songs') || [];

      if (!suggest && songs.length === 0) {
        return 'Selecciona al menos una canción o elige que Fernando sugiera la música.';
      }
      return true;
    }

    // ---- Helpers ----

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    restore();
    return { validate, stopPreview };
  })();

  // Registrar validador del paso 2
  StepsManager.registerValidator(2, step2.validate);

  // ================================================================
  // PASO 3 - Duración y Estilo
  // ================================================================

  const step3 = (() => {
    const RECOMMENDED_MIN = 6;
    const RECOMMENDED_MAX = 7;

    const sliderContainer = document.getElementById('duration-slider');
    const rangeInput = document.getElementById('duration-range');
    const valueDisplay = document.getElementById('duration-value');
    const badge = document.getElementById('duration-badge');
    const ticks = sliderContainer ? sliderContainer.querySelectorAll('.duration-slider__ticks span') : [];
    const styleGrid = document.getElementById('style-grid');
    const referencesInput = document.getElementById('style-references');

    // ---- Slider de duración ----

    function updateSlider(value) {
      const val = parseInt(value, 10);
      valueDisplay.textContent = val;
      FormData.set('duration', val);

      // Rango recomendado
      const isRecommended = val >= RECOMMENDED_MIN && val <= RECOMMENDED_MAX;
      sliderContainer.classList.toggle('recommended', isRecommended);

      // Highlight del tick activo
      ticks.forEach((tick) => {
        tick.classList.toggle('active', parseInt(tick.dataset.val, 10) === val);
      });

      // Actualizar el fill visual del track
      updateSliderFill(val);
    }

    function updateSliderFill(val) {
      const min = parseInt(rangeInput.min, 10);
      const max = parseInt(rangeInput.max, 10);
      const percent = ((val - min) / (max - min)) * 100;
      rangeInput.style.background = `linear-gradient(to right, var(--color-accent) 0%, var(--color-accent) ${percent}%, rgba(255,255,255,0.08) ${percent}%, rgba(255,255,255,0.08) 100%)`;
    }

    if (rangeInput) {
      rangeInput.addEventListener('input', () => updateSlider(rangeInput.value));
    }

    // ---- Estilos de baile (multi-select) ----

    if (styleGrid) {
      styleGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.card-option--style');
        if (!card) return;

        // Toggle aria-checked
        const isChecked = card.getAttribute('aria-checked') === 'true';
        card.setAttribute('aria-checked', String(!isChecked));

        // Recopilar todos los seleccionados
        const selected = [];
        styleGrid.querySelectorAll('.card-option--style[aria-checked="true"]').forEach((c) => {
          selected.push(c.dataset.value);
        });
        FormData.set('styles', selected);
      });
    }

    // ---- Referencias adicionales ----

    if (referencesInput) {
      referencesInput.addEventListener('input', () => {
        FormData.set('references', referencesInput.value.trim());
      });
    }

    // ---- Restaurar ----

    function restore() {
      const data = FormData.getAll();

      // Duración
      const dur = data.duration || 6;
      rangeInput.value = dur;
      updateSlider(dur);

      // Estilos
      if (data.styles && data.styles.length > 0) {
        data.styles.forEach((styleId) => {
          const card = styleGrid.querySelector(`[data-value="${styleId}"]`);
          if (card) card.setAttribute('aria-checked', 'true');
        });
      }

      // Referencias
      if (data.references) {
        referencesInput.value = data.references;
      }
    }

    // ---- Validación ----

    function validate() {
      const styles = FormData.get('styles') || [];
      if (styles.length === 0) {
        return 'Selecciona al menos un estilo de baile.';
      }
      return true;
    }

    restore();
    return { validate };
  })();

  // Registrar validador del paso 3
  StepsManager.registerValidator(3, step3.validate);

  // ================================================================
  // PASO 4 - Experiencia Previa
  // ================================================================

  const step4 = (() => {
    const experienceGrid = document.getElementById('experience-grid');
    const detailsWrapper = document.getElementById('experience-details-wrapper');
    const detailsInput = document.getElementById('experience-details');

    // ---- Selección de nivel de experiencia ----

    if (experienceGrid) {
      experienceGrid.addEventListener('click', (e) => {
        const card = e.target.closest('.exp-card');
        if (!card) return;

        // Deseleccionar todas
        experienceGrid.querySelectorAll('.exp-card').forEach((c) => {
          c.setAttribute('aria-checked', 'false');
        });

        // Seleccionar la actual
        card.setAttribute('aria-checked', 'true');
        FormData.set('experienceLevel', card.dataset.value);

        // Mostrar textarea de detalles
        showDetails();
      });
    }

    // ---- Textarea de detalles ----

    if (detailsInput) {
      detailsInput.addEventListener('input', () => {
        FormData.set('experienceDetails', detailsInput.value.trim());
      });
    }

    function showDetails() {
      if (detailsWrapper) {
        detailsWrapper.classList.add('visible');
      }
    }

    function hideDetails() {
      if (detailsWrapper) {
        detailsWrapper.classList.remove('visible');
      }
    }

    // ---- Restaurar ----

    function restore() {
      const data = FormData.getAll();

      if (data.experienceLevel) {
        const card = experienceGrid.querySelector(`[data-value="${data.experienceLevel}"]`);
        if (card) {
          card.setAttribute('aria-checked', 'true');
          showDetails();
        }
      }

      if (data.experienceDetails) {
        detailsInput.value = data.experienceDetails;
      }
    }

    // ---- Validación ----

    function validate() {
      const level = FormData.get('experienceLevel');
      if (!level) {
        return 'Selecciona tu nivel de experiencia en baile.';
      }
      return true;
    }

    restore();
    return { validate };
  })();

  // Registrar validador del paso 4
  StepsManager.registerValidator(4, step4.validate);

  // ================================================================
  // PASO 5 - Confirmación y Resumen
  // ================================================================

  const step5 = (() => {
    const summaryContainer = document.getElementById('summary');

    // Refs a campos del resumen
    const els = {
      eventType: document.getElementById('sum-event-type'),
      names: document.getElementById('sum-names'),
      date: document.getElementById('sum-date'),
      musicBody: document.getElementById('sum-music-body'),
      duration: document.getElementById('sum-duration'),
      styles: document.getElementById('sum-styles'),
      referencesRow: document.getElementById('sum-references-row'),
      references: document.getElementById('sum-references'),
      experience: document.getElementById('sum-experience'),
      expDetailsRow: document.getElementById('sum-exp-details-row'),
      expDetails: document.getElementById('sum-exp-details')
    };

    // Labels legibles para niveles de experiencia
    const EXPERIENCE_LABELS = {
      principiantes: 'Ambos principiantes',
      mixto: 'Uno tiene experiencia',
      avanzado: 'Ambos bailan'
    };

    // Labels legibles para estilos
    const STYLE_LABELS = {
      elegante: 'Elegante',
      romantico: 'Romántico',
      dinamico: 'Dinámico',
      divertido: 'Divertido',
      sorpresa: 'Sorpresa'
    };

    // ---- Poblar resumen con datos actuales ----

    function populate() {
      const data = FormData.getAll();

      // Evento
      els.eventType.textContent = FormData.getEventLabel() || '—';
      els.names.textContent = data.names || '—';
      els.date.textContent = data.eventDate ? formatDate(data.eventDate) : 'Sin definir';

      // Música
      populateMusic(data);

      // Duración y estilo
      els.duration.textContent = data.duration ? `${data.duration} minutos` : '—';
      populateStyles(data.styles || []);

      // Referencias
      if (data.references) {
        els.referencesRow.classList.remove('summary-row--hidden');
        els.references.textContent = data.references;
      } else {
        els.referencesRow.classList.add('summary-row--hidden');
      }

      // Experiencia
      els.experience.textContent = EXPERIENCE_LABELS[data.experienceLevel] || '—';

      if (data.experienceDetails) {
        els.expDetailsRow.classList.remove('summary-row--hidden');
        els.expDetails.textContent = data.experienceDetails;
      } else {
        els.expDetailsRow.classList.add('summary-row--hidden');
      }
    }

    function populateMusic(data) {
      els.musicBody.innerHTML = '';

      if (data.letFernandoSuggest) {
        els.musicBody.innerHTML = `
          <div class="summary-suggest">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
            Fernando elegirá la música ideal
          </div>
        `;
        return;
      }

      const songs = data.songs || [];
      if (songs.length === 0) {
        els.musicBody.innerHTML = '<div class="summary-suggest">Sin canciones seleccionadas</div>';
        return;
      }

      songs.forEach((song) => {
        const el = document.createElement('div');
        el.className = 'summary-song';
        el.innerHTML = `
          ${song.albumImage
            ? `<div class="summary-song__cover"><img src="${escapeHtml(song.albumImage)}" alt="" loading="lazy"></div>`
            : ''
          }
          <div class="summary-song__info">
            <span class="summary-song__name">${escapeHtml(song.name)}</span>
            <span class="summary-song__artist">${escapeHtml(song.artist)}</span>
          </div>
        `;
        els.musicBody.appendChild(el);
      });
    }

    function populateStyles(styles) {
      if (styles.length === 0) {
        els.styles.textContent = '—';
        els.styles.className = 'summary-row__value';
        return;
      }

      const container = document.createElement('div');
      container.className = 'summary-styles';
      styles.forEach((styleId) => {
        const tag = document.createElement('span');
        tag.className = 'summary-style-tag';
        tag.textContent = STYLE_LABELS[styleId] || styleId;
        container.appendChild(tag);
      });

      els.styles.textContent = '';
      els.styles.className = 'summary-row__value';
      els.styles.appendChild(container);
    }

    // ---- Botones de editar ----

    if (summaryContainer) {
      summaryContainer.addEventListener('click', (e) => {
        const editBtn = e.target.closest('[data-edit-step]');
        if (!editBtn) return;
        const targetStep = parseInt(editBtn.dataset.editStep, 10);
        StepsManager.goTo(targetStep);
      });
    }

    // ---- Poblar al entrar al paso 5 ----

    // Observar cuando el step-5 se vuelve activo
    const step5Screen = document.getElementById('step-5');
    if (step5Screen) {
      const observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
            if (step5Screen.classList.contains('active')) {
              populate();
            }
          }
        }
      });
      observer.observe(step5Screen, { attributes: true, attributeFilter: ['class'] });
    }

    // ---- Validación final ----

    function validate() {
      const data = FormData.getAll();

      if (!data.eventType) return 'Falta el tipo de evento. Regresa al paso 1 para completarlo.';
      if (!data.names) return 'Faltan los nombres. Regresa al paso 1 para completarlos.';
      if (!data.letFernandoSuggest && (!data.songs || data.songs.length === 0)) {
        return 'Falta la selección musical. Regresa al paso 2.';
      }
      if (!data.styles || data.styles.length === 0) return 'Falta el estilo de baile. Regresa al paso 3.';
      if (!data.experienceLevel) return 'Falta tu nivel de experiencia. Regresa al paso 4.';

      return true;
    }

    // ---- Helpers ----

    function formatDate(dateStr) {
      try {
        const [year, month, day] = dateStr.split('-');
        const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
          'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        return `${parseInt(day, 10)} de ${months[parseInt(month, 10) - 1]} de ${year}`;
      } catch {
        return dateStr;
      }
    }

    function escapeHtml(str) {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    }

    return { validate, populate };
  })();

  // Registrar validador del paso 5
  StepsManager.registerValidator(5, step5.validate);

  // ================================================================
  // FLUJO DE GENERACIÓN Y PANTALLA FINAL
  // ================================================================

  const generateFlow = (() => {
    const app = document.getElementById('app');
    const progressHeader = document.getElementById('progress-header');
    const step5Screen = document.getElementById('step-5');
    const generatingScreen = document.getElementById('generating');
    const finishScreen = document.getElementById('finish');
    const btnDownload = document.getElementById('btn-download');
    const btnWhatsapp = document.getElementById('btn-whatsapp');
    const btnNewProject = document.getElementById('btn-new-project');

    let pdfBlob = null;
    let pdfFileName = '';

    let isGenerating = false;

    // ---- Botón "Generar mi Documento" ----

    app.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action="generate"]');
      if (!btn || isGenerating) return;

      // Validar paso 5
      const result = step5.validate();
      if (result !== true) {
        const errorMsg = typeof result === 'string' ? result : 'Completa todos los campos antes de generar.';
        showGenerateError(errorMsg);
        return;
      }

      clearGenerateError();
      startGeneration();
    });

    // ---- Proceso de generación ----

    async function startGeneration() {
      isGenerating = true;

      // Transicionar a pantalla de generación
      progressHeader.classList.remove('visible');
      await transitionScreen(step5Screen, generatingScreen);

      try {
        // Generar PDF con pausa mínima para que la animación se vea
        const minDelay = new Promise((r) => setTimeout(r, 1500));
        const [result] = await Promise.all([PDFGenerator.generate(), minDelay]);

        pdfBlob = result.blob;
        pdfFileName = PDFGenerator.getFileName();

        // Transicionar a pantalla final
        await transitionScreen(generatingScreen, finishScreen);
      } catch (err) {
        console.error('Error generando PDF:', err);
        // Volver al paso 5 con error
        await transitionScreen(generatingScreen, step5Screen);
        progressHeader.classList.add('visible');
        showGenerateError('Hubo un error al generar el documento. Intenta de nuevo.');
      } finally {
        isGenerating = false;
      }
    }

    // ---- Descargar PDF ----

    if (btnDownload) {
      btnDownload.addEventListener('click', () => {
        if (!pdfBlob) return;

        const url = URL.createObjectURL(pdfBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfFileName || 'Brief-Coreografico.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Limpiar después de un momento
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      });
    }

    // ---- Abrir WhatsApp ----

    if (btnWhatsapp) {
      btnWhatsapp.addEventListener('click', () => {
        WhatsAppSender.open();
      });
    }

    // ---- Crear otro proyecto ----

    if (btnNewProject) {
      btnNewProject.addEventListener('click', () => {
        FormData.clear();
        pdfBlob = null;
        pdfFileName = '';

        // Volver al welcome
        transitionScreen(finishScreen, document.getElementById('welcome'));
      });
    }

    // ---- Transición entre pantallas (fuera de StepsManager) ----

    function transitionScreen(from, to) {
      return new Promise((resolve) => {
        if (!from || !to) { resolve(); return; }

        from.classList.add('step--exit-left');
        window.scrollTo({ top: 0, behavior: 'smooth' });

        const duration = 400;

        setTimeout(() => {
          from.classList.remove('active', 'step--exit-left');
          to.classList.add('step--enter-right', 'active');

          to.offsetHeight; // force reflow

          requestAnimationFrame(() => {
            to.classList.remove('step--enter-right');
            // Esperar a que termine la transición de entrada
            setTimeout(resolve, duration);
          });
        }, duration);
      });
    }

    // ---- Errores en la generación ----

    function showGenerateError(message) {
      clearGenerateError();

      const nav = step5Screen.querySelector('.step__nav');
      if (!nav) return;

      const errorEl = document.createElement('div');
      errorEl.className = 'step__error step-content-enter';
      errorEl.setAttribute('role', 'alert');
      errorEl.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>${message}</span>
      `;
      nav.insertAdjacentElement('beforebegin', errorEl);
    }

    function clearGenerateError() {
      const existing = step5Screen.querySelector('.step__error');
      if (existing) existing.remove();
    }
  })();
});
