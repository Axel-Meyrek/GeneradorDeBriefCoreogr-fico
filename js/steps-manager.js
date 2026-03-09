/* ==========================================================================
   Steps Manager - Navegación y control de pasos del formulario
   ========================================================================== */

const StepsManager = (() => {
  'use strict';

  const TOTAL_STEPS = 5;
  const STEP_TITLES = {
    1: 'Tu Evento',
    2: 'La Música',
    3: 'Duración y Estilo',
    4: 'Tu Experiencia',
    5: 'Confirmación'
  };

  let currentStep = 0; // 0 = welcome
  let isTransitioning = false;

  // Pantallas ya visitadas (no re-animar contenido)
  const visitedScreens = new Set();

  // Validadores por paso (se registran externamente)
  const validators = {};

  // ---- DOM refs (se cachean en init) ----
  let els = {};

  function cacheDOM() {
    els.app = document.getElementById('app');
    els.welcome = document.getElementById('welcome');
    els.progressHeader = document.getElementById('progress-header');
    els.progressLabel = document.getElementById('progress-label');
    els.progressTitle = document.getElementById('progress-title');
    els.progressBar = document.getElementById('progress-bar');
    els.progressFill = document.getElementById('progress-fill');
    els.btnBackHome = document.getElementById('btn-back-home');
    els.screens = document.querySelectorAll('.screen');
    els.steps = document.querySelectorAll('.screen.step');
  }

  // ---- Navegación ----

  function goTo(step) {
    if (isTransitioning) return;
    if (step < 0 || step > TOTAL_STEPS) return;

    const direction = step > currentStep ? 'forward' : 'backward';
    const prevStep = currentStep;
    currentStep = step;

    transitionScreens(prevStep, step, direction);
    updateProgress();
    scrollToTop();
  }

  function next() {
    if (currentStep >= TOTAL_STEPS) return;

    // Validar paso actual antes de avanzar
    if (!validateCurrentStep()) return;

    goTo(currentStep + 1);
  }

  function prev() {
    if (currentStep <= 1) {
      goTo(0); // Volver a welcome
      return;
    }
    goTo(currentStep - 1);
  }

  function getCurrentStep() {
    return currentStep;
  }

  // ---- Transiciones ----

  function transitionScreens(fromStep, toStep, direction) {
    isTransitioning = true;

    const fromScreen = getScreenByStep(fromStep);
    const toScreen = getScreenByStep(toStep);

    if (!fromScreen || !toScreen) {
      isTransitioning = false;
      return;
    }

    // Clase de dirección para la animación CSS
    const exitClass = direction === 'forward' ? 'step--exit-left' : 'step--exit-right';
    const enterClass = direction === 'forward' ? 'step--enter-right' : 'step--enter-left';

    // Salida de la pantalla actual
    fromScreen.classList.add(exitClass);

    // Mostrar progress header al salir del welcome
    if (fromStep === 0 && toStep >= 1) {
      els.progressHeader.classList.add('visible');
    }

    // Tras la animación de salida
    const duration = getTransitionDuration();

    setTimeout(() => {
      fromScreen.classList.remove('active', exitClass);

      // Ocultar progress header al volver a welcome
      if (toStep === 0) {
        els.progressHeader.classList.remove('visible');
      }

      // Preparar entrada
      toScreen.classList.add(enterClass);
      toScreen.classList.add('active');

      // Forzar reflow para que el navegador aplique la clase enter antes de quitarla
      toScreen.offsetHeight; // eslint-disable-line no-unused-expressions

      // Disparar la animación de entrada removiendo la clase
      requestAnimationFrame(() => {
        toScreen.classList.remove(enterClass);

        setTimeout(() => {
          isTransitioning = false;
          animateStepContent(toScreen);
        }, duration);
      });
    }, duration);
  }

  function getScreenByStep(step) {
    if (step === 0) return els.welcome;
    return document.getElementById(`step-${step}`);
  }

  function getTransitionDuration() {
    const style = getComputedStyle(document.documentElement);
    const val = style.getPropertyValue('--duration-moderate').trim();
    return parseInt(val, 10) || 400;
  }

  function animateStepContent(screen) {
    const key = screen.id || screen.dataset.step;
    if (visitedScreens.has(key)) return;
    visitedScreens.add(key);

    const elements = screen.querySelectorAll('.step__title, .step__description, .step__body > *:not(.step__title):not(.step__description)');
    elements.forEach((el, i) => {
      el.style.setProperty('--delay', `${i * 80}ms`);
      el.classList.remove('step-content-enter');
      el.offsetHeight; // eslint-disable-line no-unused-expressions
      el.classList.add('step-content-enter');
    });
  }

  function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ---- Barra de progreso ----

  function updateProgress() {
    if (currentStep < 1) return;

    const percent = (currentStep / TOTAL_STEPS) * 100;

    els.progressLabel.textContent = `Paso ${currentStep} de ${TOTAL_STEPS}`;
    els.progressTitle.textContent = STEP_TITLES[currentStep] || '';
    els.progressFill.style.width = `${percent}%`;
    els.progressBar.setAttribute('aria-valuenow', currentStep);

    // Actualizar estado de los indicadores
    els.steps.forEach((step) => {
      const stepNum = parseInt(step.dataset.step, 10);
      step.classList.toggle('step--completed', stepNum < currentStep);
      step.classList.toggle('step--current', stepNum === currentStep);
    });
  }

  // ---- Validación ----

  function registerValidator(step, fn) {
    validators[step] = fn;
  }

  function validateCurrentStep() {
    const validator = validators[currentStep];
    if (!validator) return true; // Sin validador = siempre válido

    const result = validator();

    if (result === true) {
      clearStepError();
      return true;
    }

    // result es un string con el mensaje de error
    showStepError(typeof result === 'string' ? result : 'Completa los campos requeridos antes de continuar.');
    return false;
  }

  function showStepError(message) {
    const screen = getScreenByStep(currentStep);
    if (!screen) return;

    // Remover error previo si existe
    clearStepError(screen);

    const errorEl = document.createElement('div');
    errorEl.className = 'step__error step-content-enter';
    errorEl.setAttribute('role', 'alert');
    errorEl.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>${message}</span>
    `;

    const nav = screen.querySelector('.step__nav');
    if (nav) {
      nav.insertAdjacentElement('beforebegin', errorEl);
    }
  }

  function clearStepError(screen) {
    const target = screen || getScreenByStep(currentStep);
    if (!target) return;
    const existing = target.querySelector('.step__error');
    if (existing) existing.remove();
  }

  // ---- Eventos ----

  function bindEvents() {
    // Botones Siguiente / Atrás dentro de cada step
    els.app.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-action]');
      if (!btn) return;

      const action = btn.dataset.action;
      if (action === 'next') next();
      if (action === 'prev') prev();
    });

    // Botón de volver al inicio en el header
    els.btnBackHome.addEventListener('click', () => {
      goTo(currentStep - 1);
    });

    // Navegación con teclado (Escape = atrás)
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && currentStep > 0) {
        prev();
      }
    });
  }

  // ---- Init ----

  function init() {
    cacheDOM();
    bindEvents();
    updateProgress();
  }

  return {
    init,
    goTo,
    next,
    prev,
    getCurrentStep,
    registerValidator
  };
})();
