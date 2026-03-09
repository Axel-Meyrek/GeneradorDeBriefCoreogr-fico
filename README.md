# Danza Perfecta - Generador de Brief Coreografico

Aplicacion web interactiva que guia a parejas y personas planeando eventos (bodas, XV anos, aniversarios) a traves de un proceso estructurado para definir su proyecto de coreografia. Al finalizar, genera un documento PDF profesional con toda la informacion necesaria para obtener una cotizacion precisa.

## Proposito

Resolver el problema de clientes que llegan sin claridad sobre lo que necesitan, reduciendo reuniones improductivas y permitiendo cotizaciones precisas desde el primer contacto.

## Stack Tecnologico

- **HTML5** - Semantico y accesible
- **CSS3** - Grid, Flexbox, Custom Properties, Animations
- **JavaScript Vanilla** - ES6+, sin frameworks
- **jsPDF** - Generacion de PDFs
- **html2canvas** - Captura de HTML para PDF
- **Spotify Web API** - Busqueda y preview de musica
- **Google Fonts** - Playfair Display + Inter

## Estructura del Proyecto

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
│   └── images/
├── CLAUDE.md
└── README.md
```

## Flujo de Usuario

1. **Bienvenida** - Hero visual con mensaje del coreografo
2. **Tu Evento** - Tipo de evento, nombres, fecha
3. **La Musica** - Busqueda en Spotify, preview y seleccion de canciones
4. **Duracion y Estilo** - Slider de minutos y seleccion de estilos
5. **Tu Experiencia** - Nivel de baile de los participantes
6. **Confirmacion** - Resumen completo con opcion de editar
7. **Descarga** - PDF generado + envio por WhatsApp

## Uso

Abrir `index.html` en un navegador moderno. No requiere servidor backend ni instalacion de dependencias.

## Compatibilidad

- Chrome (ultimas 2 versiones)
- Safari (ultimas 2 versiones)
- Firefox (ultimas 2 versiones)
