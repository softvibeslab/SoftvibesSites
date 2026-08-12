export const ZONAS = [
  {
    slug: 'centro',
    nombre: 'Zona Centro',
    titulo: 'Propiedades en Zona Centro | Horizonte Inmobiliario',
    descripcion: 'Página demostrativa para posicionamiento local de una zona inmobiliaria.',
    h1: 'Vivir e invertir en Zona Centro',
    imagen: '/img/demo/zone.svg',
    intro: [
      'Describe aquí la ubicación con información comprobable y útil para el comprador.',
      'Añade movilidad, servicios y perfil de propiedades sin inventar rendimientos ni resultados.',
    ],
    faqs: [
      {
        pregunta: '¿Qué tipo de propiedades se encuentran en esta zona?',
        respuesta: 'Adapta esta respuesta al inventario real disponible en el momento de publicación.',
      },
      {
        pregunta: '¿Cómo puedo agendar una visita?',
        respuesta: 'Utiliza el formulario, WhatsApp o el enlace de agenda configurado para el sitio.',
      },
    ],
  },
] as const;
