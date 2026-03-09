/* ==========================================================================
   PDF Generator - Generación del brief en formato PDF
   Usa jsPDF para dibujo directo con diseño profesional
   ========================================================================== */

const PDFGenerator = (() => {
  'use strict';

  // ---- Configuración de página (A4 en mm) ----

  const PAGE = {
    width: 210,
    height: 297,
    margin: { top: 22, bottom: 28, left: 25, right: 25 }
  };
  const CONTENT_WIDTH = PAGE.width - PAGE.margin.left - PAGE.margin.right;
  const CONTENT_BOTTOM = PAGE.height - PAGE.margin.bottom;

  // ---- Paleta de colores (RGB) ----

  const C = {
    gold:      [201, 169, 110],
    goldDark:  [176, 141, 79],
    dark:      [26, 26, 46],
    text:      [55, 55, 65],
    label:     [130, 130, 140],
    muted:     [170, 170, 175],
    white:     [255, 255, 255],
    line:      [215, 215, 218],
    lineFaint: [232, 232, 234]
  };

  // ---- Labels legibles ----

  const EXPERIENCE_LABELS = {
    principiantes: 'Ambos somos principiantes',
    mixto: 'Uno de nosotros tiene experiencia',
    avanzado: 'Ambos bailamos'
  };

  const STYLE_LABELS = {
    elegante: 'Elegante',
    romantico: 'Romantico',
    dinamico: 'Dinamico',
    divertido: 'Divertido',
    sorpresa: 'Sorpresa'
  };

  // ---- Generación principal ----

  async function generate() {
    const data = FormData.getAll();
    const doc = new window.jspdf.jsPDF({ unit: 'mm', format: 'a4' });

    let y = PAGE.margin.top;

    // Header
    y = drawHeader(doc, data, y);

    // Sección: Evento
    y = drawSectionTitle(doc, 'INFORMACION DEL EVENTO', y);
    y = drawRow(doc, 'Tipo de evento', getEventLabel(data), y);
    y = drawRow(doc, 'Protagonistas', data.names || '-', y);
    y = drawRow(doc, 'Fecha del evento', data.eventDate ? formatDate(data.eventDate) : 'Por definir', y);
    y = drawDivider(doc, y);

    // Sección: Música
    y = drawSectionTitle(doc, 'SELECCION MUSICAL', y);
    y = drawMusicContent(doc, data, y);
    y = drawDivider(doc, y);

    // Sección: Duración y Estilo
    y = drawSectionTitle(doc, 'DURACION Y ESTILO', y);
    y = drawRow(doc, 'Duracion', data.duration ? data.duration + ' minutos' : '-', y);
    const stylesText = (data.styles || []).map((s) => STYLE_LABELS[s] || s).join(', ');
    y = drawRow(doc, 'Estilos', stylesText || '-', y);
    if (data.references) {
      y = drawRow(doc, 'Referencias', sanitize(data.references), y, true);
    }
    y = drawDivider(doc, y);

    // Sección: Experiencia
    y = drawSectionTitle(doc, 'EXPERIENCIA EN BAILE', y);
    y = drawRow(doc, 'Nivel', EXPERIENCE_LABELS[data.experienceLevel] || '-', y);
    if (data.experienceDetails) {
      y = drawRow(doc, 'Detalles', sanitize(data.experienceDetails), y, true);
    }
    y = drawDivider(doc, y);

    // Footer
    drawFooter(doc);

    // Salida
    const blob = doc.output('blob');
    const base64 = doc.output('datauristring');

    return { blob, base64, doc };
  }

  // ---- Header del documento ----

  function drawHeader(doc, data, y) {
    const cx = PAGE.width / 2;

    // Línea decorativa dorada superior
    doc.setDrawColor(...C.gold);
    doc.setLineWidth(0.8);
    doc.line(PAGE.margin.left, y, PAGE.width - PAGE.margin.right, y);
    y += 14;

    // Título principal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.setTextColor(...C.dark);
    doc.text('DANZA PERFECTA', cx, y, { align: 'center' });
    y += 9;

    // Subtítulo
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...C.gold);
    doc.text('Brief Coreografico', cx, y, { align: 'center' });
    y += 10;

    // Línea dorada corta centrada
    doc.setDrawColor(...C.gold);
    doc.setLineWidth(0.4);
    doc.line(cx - 20, y, cx + 20, y);
    y += 12;

    // Nombres de los protagonistas
    if (data.names) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.setTextColor(...C.dark);
      doc.text(sanitize(data.names), cx, y, { align: 'center' });
      y += 8;
    }

    // Tipo de evento + fecha en texto secundario
    const eventLabel = getEventLabel(data);
    const dateStr = data.eventDate ? formatDate(data.eventDate) : '';
    const parts = [eventLabel, dateStr].filter(Boolean);
    if (parts.length > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(...C.label);
      doc.text(sanitize(parts.join('  |  ')), cx, y, { align: 'center' });
      y += 6;
    }

    y += 8;

    // Separador de contenido
    doc.setDrawColor(...C.line);
    doc.setLineWidth(0.3);
    doc.line(PAGE.margin.left, y, PAGE.width - PAGE.margin.right, y);
    y += 10;

    return y;
  }

  // ---- Título de sección ----

  function drawSectionTitle(doc, title, y) {
    y = ensureSpace(doc, y, 25);

    // Barra de acento dorada vertical
    doc.setFillColor(...C.gold);
    doc.rect(PAGE.margin.left, y - 1, 2.5, 5.5, 'F');

    // Texto del título
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...C.dark);
    doc.text(title, PAGE.margin.left + 7, y + 3);

    y += 12;
    return y;
  }

  // ---- Fila de dato (label + valor) ----

  function drawRow(doc, label, value, y, isMultiline) {
    y = ensureSpace(doc, y, isMultiline ? 20 : 8);

    const labelX = PAGE.margin.left + 4;
    const valueX = PAGE.margin.left + 50;
    const maxValueWidth = CONTENT_WIDTH - 54;

    // Label
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...C.label);
    doc.text(label, labelX, y);

    // Valor
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...C.text);

    const safeValue = sanitize(value || '-');

    if (isMultiline && safeValue) {
      const lines = doc.splitTextToSize(safeValue, maxValueWidth);
      doc.text(lines, valueX, y);
      y += Math.max(lines.length * 4.5, 6);
    } else {
      doc.text(truncate(doc, safeValue, maxValueWidth), valueX, y);
      y += 6.5;
    }

    return y;
  }

  // ---- Contenido de música ----

  function drawMusicContent(doc, data, y) {
    if (data.letFernandoSuggest) {
      return drawRow(doc, 'Seleccion', 'Fernando elegira la musica ideal para el evento', y);
    }

    const songs = data.songs || [];
    if (songs.length === 0) {
      return drawRow(doc, 'Canciones', 'Sin seleccion', y);
    }

    const labelX = PAGE.margin.left + 4;
    const valueX = PAGE.margin.left + 50;
    const maxWidth = CONTENT_WIDTH - 54;

    songs.forEach((song, i) => {
      y = ensureSpace(doc, y, 16);

      // Label solo en la primera canción
      if (i === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...C.label);
        doc.text(songs.length === 1 ? 'Cancion' : 'Canciones', labelX, y);
      }

      // Nombre de la canción
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(...C.text);
      doc.text(truncate(doc, sanitize(song.name), maxWidth), valueX, y);
      y += 4.5;

      // Artista
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8.5);
      doc.setTextColor(...C.label);
      doc.text(truncate(doc, sanitize(song.artist), maxWidth), valueX, y);
      y += 4;

      // Enlace a Spotify (solo si doc.link existe)
      if (song.spotifyUrl && typeof doc.link === 'function') {
        try {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(...C.gold);
          doc.text('Abrir en Spotify', valueX, y);
          const linkWidth = doc.getTextWidth('Abrir en Spotify');
          doc.link(valueX, y - 3, linkWidth, 4, { url: song.spotifyUrl });
          y += 5;
        } catch {
          // Si link falla, solo mostrar la URL como texto
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          doc.setTextColor(...C.gold);
          doc.text(truncate(doc, song.spotifyUrl, maxWidth), valueX, y);
          y += 5;
        }
      } else {
        y += 2;
      }

      // Espacio entre canciones
      if (i < songs.length - 1) {
        y += 2;
      }
    });

    y += 1;
    return y;
  }

  // ---- Divisor entre secciones ----

  function drawDivider(doc, y) {
    y += 2;
    doc.setDrawColor(...C.lineFaint);
    doc.setLineWidth(0.15);
    doc.line(PAGE.margin.left, y, PAGE.width - PAGE.margin.right, y);
    y += 8;
    return y;
  }

  // ---- Footer ----

  function drawFooter(doc) {
    const pageCount = doc.internal.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const footerY = PAGE.height - PAGE.margin.bottom + 10;

      // Línea separadora
      doc.setDrawColor(...C.line);
      doc.setLineWidth(0.2);
      doc.line(PAGE.margin.left, footerY - 6, PAGE.width - PAGE.margin.right, footerY - 6);

      // Información del coreógrafo
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.setTextColor(...C.muted);
      doc.text('Fernando Morales - Profesor y Coreografo Profesional - Reforma Sur', PAGE.margin.left, footerY);

      // Fecha de generación
      doc.text('Generado el ' + formatCurrentDate(), PAGE.width - PAGE.margin.right, footerY, { align: 'right' });

      // Número de página (solo si hay más de una)
      if (pageCount > 1) {
        doc.setFontSize(7);
        doc.text(i + ' / ' + pageCount, PAGE.width / 2, footerY + 5, { align: 'center' });
      }
    }
  }

  // ---- Utilidades ----

  function ensureSpace(doc, y, needed) {
    if (y + needed > CONTENT_BOTTOM) {
      doc.addPage();
      return PAGE.margin.top;
    }
    return y;
  }

  function truncate(doc, text, maxWidth) {
    if (!text) return '-';
    if (doc.getTextWidth(text) <= maxWidth) return text;

    let t = text;
    while (t.length > 0 && doc.getTextWidth(t + '...') > maxWidth) {
      t = t.slice(0, -1);
    }
    return t + '...';
  }

  // Reemplaza caracteres Unicode fuera de WinAnsiEncoding
  // jsPDF con fuentes built-in (helvetica) no soporta caracteres fuera de Latin-1/Windows-1252
  function sanitize(str) {
    if (!str) return '';
    return String(str)
      .replace(/[\u2018\u2019]/g, "'")   // comillas simples tipográficas
      .replace(/[\u201C\u201D]/g, '"')   // comillas dobles tipográficas
      .replace(/\u2014/g, '-')           // em dash
      .replace(/\u2013/g, '-')           // en dash
      .replace(/\u2026/g, '...')         // ellipsis
      .replace(/\u00B7/g, '-')           // middle dot
      .replace(/[^\x00-\xFF]/g, '');     // eliminar cualquier caracter fuera de Latin-1
  }

  function getEventLabel(data) {
    if (data.eventType === 'Otro' && data.eventTypeCustom) {
      return sanitize(data.eventTypeCustom);
    }
    return sanitize(data.eventType || '');
  }

  function formatDate(dateStr) {
    try {
      const [year, month, day] = dateStr.split('-');
      const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
        'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
      return parseInt(day, 10) + ' de ' + months[parseInt(month, 10) - 1] + ' de ' + year;
    } catch {
      return dateStr;
    }
  }

  function formatCurrentDate() {
    const now = new Date();
    const months = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    return now.getDate() + ' de ' + months[now.getMonth()] + ' de ' + now.getFullYear();
  }

  function getFileName() {
    const data = FormData.getAll();
    const name = (data.names || 'brief')
      .replace(/[^a-zA-ZaeiounAEIOUN0-9\s]/g, '')
      .trim()
      .replace(/\s+/g, '-');
    return 'Brief-' + (name || 'Coreografico') + '.pdf';
  }

  // ---- API pública ----

  return {
    generate,
    getFileName
  };
})();
