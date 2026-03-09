# Danza Perfecta - Generador de Brief Coreográfico

## Descripción del Proyecto

Aplicación web interactiva que guía a parejas y personas planeando eventos (bodas, XV años, aniversarios) a través de un proceso estructurado para definir su proyecto de coreografía. Al finalizar, genera un documento PDF profesional con toda la información necesaria para que Fernando Morales (coreógrafo profesional) pueda dar una cotización precisa.

## Problema a Resolver

Los clientes de Fernando llegan sin claridad sobre lo que necesitan. Fernando dedica mucho tiempo respondiendo las mismas preguntas básicas (música, duración, estilo, experiencia), generando:
- Reuniones largas e improductivas
- Cotizaciones imprecisas
- Frustración mutua
- Pérdida de tiempo

## Stack Tecnológico

- **HTML5**: Semántico y accesible
- **CSS3**: Grid, Flexbox, Custom Properties, Animations
- **JavaScript Vanilla**: ES6+, sin frameworks
- **Librerías externas (CDN)**:
  - jsPDF (generación de PDFs)
  - html2canvas (captura de HTML)
  - Spotify Web API (búsqueda de música)
- **Fuentes**: Google Fonts (Playfair Display + Inter)
- **Hosting**: GitHub Pages o Netlify (archivos estáticos)

## Estructura de Archivos
```
danza-perfecta/
├── index.html
├── css/
│   ├── reset.css
│   ├── variables.css
│   ├── main.css
│   ├── steps.css
│   └── animations.css
├── js/
│   ├── app.js
│   ├── steps-manager.js
│   ├── spotify-service.js
│   ├── pdf-generator.js
│   ├── form-data.js
│   └── whatsapp-sender.js
├── assets/
│   ├── images/
│   └── logo.png
└── README.md
```

## Flujo de Usuario

1. **Bienvenida**: Hero visual + mensaje de Fernando + botón "Comenzar"
2. **Paso 1/5 - Tu Evento**: Tipo de evento, nombres, fecha
3. **Paso 2/5 - La Música**: Búsqueda Spotify, preview 30 seg, selección hasta 3 canciones
4. **Paso 3/5 - Duración y Estilo**: Slider minutos (3-10), selección de estilos (Elegante, Romántico, Dinámico, Divertido, Sorpresa)
5. **Paso 4/5 - Tu Experiencia**: Nivel de baile (Principiantes, Mixto, Avanzado)
6. **Paso 5/5 - Confirmación**: Resumen completo, opción de editar
7. **Generación**: Loading + creación de PDF
8. **Finalización**: Descarga PDF + botón WhatsApp

## Información que se Captura

### Datos del Evento
- Tipo: Boda, XV Años, Boda destino, Aniversario, Otro
- Nombres de protagonistas
- Fecha aproximada

### Selección Musical
- Hasta 3 canciones (con búsqueda en Spotify)
- Preview de 30 segundos
- Opción: "Prefiero que Fernando sugiera"

### Duración y Estilo
- Duración: 3-10 minutos (recomendación visual en 6-7)
- Estilos: Elegante, Romántico, Dinámico, Divertido, Sorpresa
- Referencias adicionales (texto libre)

### Experiencia Previa
- Ambos principiantes
- Uno tiene experiencia
- Ambos bailan
- Detalles adicionales

## Principios de Diseño

### 1. Experiencia sobre Formulario
- NO debe sentirse como cuestionario aburrido
- SÍ debe generar emoción sobre el baile
- Un objetivo por pantalla

### 2. Profesionalidad
- Diseño elegante y sofisticado
- Animaciones sutiles
- Sin elementos genéricos

### 3. Mobile-First
- Diseñado primero para móviles
- Táctil y fácil de usar
- Responsive hasta desktop


## Estructura del PDF

**Características**:
- Diseño limpio con secciones bien divididas
- Iconos para identificación visual
- Tipografía elegante
- Espaciado generoso
- Enlaces clickeables a Spotify

## WhatsApp Integration

**URL**: `https://wa.me/52XXXXXXXXXX?text=[mensaje]`

**Mensaje predefinido**:
```
Hola Fernando 👋

Te comparto el brief de mi proyecto coreográfico.

Adjunto el documento PDF con toda la información.

¡Espero tu propuesta!
```

**Limitación**: WhatsApp no permite adjuntar archivos por URL. El usuario debe:
1. Descargar el PDF
2. Abrir WhatsApp (se abre automáticamente con mensaje)
3. Adjuntar PDF manualmente
4. Enviar

## Configuración del Proyecto
```javascript
const CONFIG = {
  spotify: {
    clientId: 'TU_CLIENT_ID',
    clientSecret: 'TU_CLIENT_SECRET',
    market: 'MX'
  },
  
  whatsapp: {
    phoneNumber: '52XXXXXXXXXX',
    countryCode: '52'
  },
  
  choreographer: {
    name: 'Fernando Morales',
    title: 'Profesor y Coreógrafo Profesional',
    location: 'Reforma Sur'
  },
  
  eventTypes: ['Boda', 'XV Años', 'Boda Destino', 'Aniversario', 'Otro'],
  
  danceStyles: [
    { id: 'elegante', label: 'Elegante' },
    { id: 'romantico', label: 'Romántico' },
    { id: 'dinamico', label: 'Dinámico' },
    { id: 'divertido', label: 'Divertido' },
    { id: 'sorpresa', label: 'Sorpresa' }
  ],
  
  experienceLevels: [
    { id: 'principiantes', label: 'Ambos somos principiantes' },
    { id: 'mixto', label: 'Uno tiene experiencia' },
    { id: 'avanzado', label: 'Ambos bailamos' }
  ]
};
```

## Criterios de Aceptación

### Funcionales
- ✅ Flujo completo sin recargas
- ✅ Búsqueda de música funcional
- ✅ Todas las validaciones activas
- ✅ PDF generado profesionalmente
- ✅ Persistencia con localStorage
- ✅ WhatsApp abre correctamente

### UX
- ✅ Experiencia fluida (3-5 min completar)
- ✅ Feedback visual constante
- ✅ Mensajes de error claros
- ✅ No se siente como "formulario genérico"

### Diseño
- ✅ Elegante y profesional
- ✅ Responsive (móvil, tablet, desktop)
- ✅ Animaciones sutiles
- ✅ Paleta consistente
- ✅ Tipografía legible

### Técnicos
- ✅ Sin errores en consola
- ✅ Código limpio y comentado
- ✅ Compatible: Chrome, Safari, Firefox
- ✅ Carga < 3 segundos
- ✅ Accesible (ARIA, contraste, teclado)

## Restricciones

- ❌ No usar frameworks (React, Vue, Angular)
- ❌ No usar backend/servidor
- ❌ Solo archivos estáticos
- ✅ Solo JavaScript vanilla
- ✅ Compatibilidad: últimas 2 versiones de navegadores

## Notas Importantes

1. **Persistencia**: Usar localStorage para guardar progreso entre pasos
2. **Validaciones**: Cada paso valida antes de "Siguiente"
3. **Loading states**: Siempre mostrar feedback (spinners, mensajes)
4. **Error handling**: Manejar casos de API no disponible, preview_url null, etc.
5. **Accessibility**: Etiquetas semánticas, ARIA labels, navegación con teclado
6. **Performance**: Debounce en búsqueda (300ms), lazy loading de imágenes
7. **Testing**: Probar en móvil real, diferentes tamaños, conexión lenta

## Mensaje de Bienvenida (Fernando)
```
Hola, mucho gusto. Soy Fernando Morales, profesor y coreógrafo especializado en baile para bodas.

Para poder ofrecerles una propuesta clara, profesional y totalmente alineada a lo que necesitan, trabajo con un breve levantamiento de información. Esto me permite analizar su proyecto, definir el proceso correcto y entregarles una cotización real, sin sobrecostos ni sesiones innecesarias.

De manera general, la mayoría de los montajes se completan en 3 a 4 sesiones, cada una de 2 horas, trabajando de forma progresiva, sin presión y adaptándonos completamente a su ritmo y tiempos.

📍 Me encuentro en Reforma Sur, donde cuento con un salón acondicionado para clases particulares y preparación de bailes de boda.

Comencemos a dar forma al montaje de ese momento tan importante.
```

## Orden de Desarrollo

El proyecto se dividirá en 12 tareas secuenciales que se ejecutarán una por una:

## Tareas completadas
1. Configuración del proyecto y estructura
2. Sistema de variables CSS
3. Pantalla de bienvenida
4. Sistema de navegación entre pasos
5. Paso 1 - Información del Evento
6. Integración Spotify API
7. Paso 2 - Selector de Música
8. Paso 3 - Duración y Estilo

## Tareas Pendientes
9. Paso 4 - Experiencia Previa
10. Paso 5 - Resumen y Confirmación
11. Generador de PDF
12. Envío por WhatsApp y finalización