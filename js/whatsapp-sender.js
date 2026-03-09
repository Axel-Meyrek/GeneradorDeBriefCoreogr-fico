/* ==========================================================================
   WhatsApp Sender - Integración con WhatsApp para envío del brief
   ========================================================================== */

const WhatsAppSender = (() => {
  'use strict';

  // Número de Fernando (con código de país, sin +)
  // Cambiar por el número real
  const CONFIG = {
    phoneNumber: '521234567890'
  };

  // ---- Construir mensaje predefinido ----

  function buildMessage(data) {
    const eventLabel = data.eventType === 'Otro' && data.eventTypeCustom
      ? data.eventTypeCustom
      : (data.eventType || 'evento');

    let msg = 'Hola Fernando \u{1F44B}\n\n';
    msg += 'Te comparto el brief de mi proyecto coreográfico.';

    if (data.names) {
      msg += '\n\nSomos ' + data.names;
      msg += ' y estamos planeando nuestro baile para ' + eventLabel.toLowerCase() + '.';
    }

    msg += '\n\nAdjunto el documento PDF con toda la información.';
    msg += '\n\n\u00A1Espero tu propuesta!';

    return msg;
  }

  // ---- Generar URL de WhatsApp ----

  function getUrl(data) {
    const d = data || FormData.getAll();
    const message = buildMessage(d);
    return 'https://wa.me/' + CONFIG.phoneNumber + '?text=' + encodeURIComponent(message);
  }

  // ---- Abrir WhatsApp en nueva pestaña ----

  function open(data) {
    window.open(getUrl(data), '_blank');
  }

  // ---- Configurar número (parametrizable) ----

  function setPhoneNumber(phone) {
    CONFIG.phoneNumber = phone.replace(/[^0-9]/g, '');
  }

  // ---- API pública ----

  return {
    open,
    getUrl,
    setPhoneNumber
  };
})();
