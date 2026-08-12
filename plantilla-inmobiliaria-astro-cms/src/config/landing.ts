export const LANDING = {
  hero: {
    etiqueta: 'Inmuebles seleccionados · Atención personalizada',
    titulo: 'Encuentra un espacio que acompañe tu siguiente etapa',
    descripcion:
      'Explora propiedades de demostración y adapta esta propuesta a tu mercado, inventario y proceso comercial.',
    imagen: '/img/demo/hero.svg',
  },
  confianza: [
    { titulo: 'Proceso claro', texto: 'Explica las etapas desde el primer contacto hasta el cierre.' },
    { titulo: 'Información verificable', texto: 'Publica únicamente disponibilidad y datos confirmados.' },
    { titulo: 'Acompañamiento', texto: 'Define responsables y tiempos de respuesta realistas.' },
  ],
  razones: [
    { numero: '01', titulo: 'Define el objetivo', texto: 'Residencia, inversión o renta: el catálogo puede organizarse por intención.' },
    { numero: '02', titulo: 'Compara opciones', texto: 'Presenta ubicación, precio y atributos con una estructura consistente.' },
    { numero: '03', titulo: 'Conversa con un asesor', texto: 'Conecta cada propiedad con WhatsApp, agenda y formulario.' },
  ],
  testimonioDemo: {
    cita: 'Agrega aquí un testimonio real, autorizado y atribuible.',
    autor: 'Contenido demostrativo — no publicar como evidencia',
  },
} as const;
