export interface Zona {
  slug: string;
  nombre: string;
  h1: string;
  titulo: string;
  descripcion: string;
  imagen: string;
  intro: string[];
  faqs: { pregunta: string; respuesta: string }[];
}

export const ZONAS: Zona[] = [
  {
    slug: 'playa-del-carmen',
    imagen: '/img/parallax-mar.jpg',
    nombre: 'Playa del Carmen',
    h1: 'Bienes raíces en Playa del Carmen',
    titulo: 'Bienes raíces en Playa del Carmen | Frank Hernández · Riviera Maya Investment',
    descripcion:
      'Penthouses frente al mar, departamentos y lotes de inversión en Playa del Carmen y sus corredores de crecimiento. Asesoría con certeza legal.',
    intro: [
      'Playa del Carmen es el corazón de la Riviera Maya: una ciudad con crecimiento sostenido, turismo internacional todo el año y una oferta inmobiliaria que va desde lotes de inversión en corredores emergentes hasta penthouses frente al Mar Caribe en desarrollos como Corasol.',
      'Con Frank trabajas ambos extremos del mercado: el producto patrimonial de lujo frente al mar y la inversión de entrada en tierra escriturada a minutos de la ciudad, siempre con revisión legal previa.',
    ],
    faqs: [
      {
        pregunta: '¿Cuánto cuesta un departamento en Playa del Carmen?',
        respuesta:
          'El rango es amplio: departamentos en preventa desde ~$2.5 MDP, producto medio entre $4 y $8 MDP, y residencias o penthouses frente al mar desde $15 MDP en adelante, como el penthouse de 218 m² en Corasol.',
      },
      {
        pregunta: '¿Es buen momento para comprar lotes cerca de Playa del Carmen?',
        respuesta:
          'Los corredores emergentes como Guadalupe Victoria (a 21 km) ofrecen lotes escriturados desde ~$800/m². La clave es comprar en la ruta de expansión urbana antes de que llegue la infraestructura, con tierra no ejidal.',
      },
      {
        pregunta: '¿Los extranjeros pueden comprar propiedad en Playa del Carmen?',
        respuesta:
          'Sí. Al estar en zona restringida (a menos de 50 km de costa), los extranjeros compran mediante fideicomiso bancario, una figura segura y ampliamente utilizada en la Riviera Maya.',
      },
    ],
  },
  {
    slug: 'cancun',
    imagen: '/img/hero-caribe.jpg',
    nombre: 'Cancún',
    h1: 'Departamentos y propiedades en Cancún',
    titulo: 'Departamentos en Cancún | Frank Hernández · Riviera Maya Investment',
    descripcion:
      'Departamentos para inversión y residencia en Cancún, Quintana Roo. Renta vacacional, preventas y propiedades con plusvalía. Asesoría personalizada.',
    intro: [
      'Cancún es la puerta de entrada del Caribe mexicano y uno de los mercados de renta vacacional más sólidos de América Latina. Su aeropuerto internacional, su infraestructura urbana y la demanda constante de hospedaje lo convierten en una plaza ideal para inversión en departamentos.',
      'Frank nació en Cancún: conoce las zonas de crecimiento, los desarrollos con mejor historial de entrega y las oportunidades de preventa con planes de pago accesibles.',
    ],
    faqs: [
      {
        pregunta: '¿Qué zonas de Cancún tienen mejor plusvalía?',
        respuesta:
          'Los corredores con mayor dinamismo son la zona de Huayacán, Puerto Cancún y el sur hacia el aeropuerto, impulsados por nueva infraestructura comercial y residencial.',
      },
      {
        pregunta: '¿Conviene comprar para renta vacacional en Cancún?',
        respuesta:
          'Cancún mantiene tasas de ocupación altas todo el año. Un departamento bien ubicado y administrado puede generar rendimientos brutos de renta corta superiores a los de renta larga tradicional, aunque cada caso requiere su corrida financiera.',
      },
    ],
  },
  {
    slug: 'tulum',
    imagen: '/img/tulum-bacab.jpg',
    nombre: 'Tulum',
    h1: 'Lotes y propiedades de inversión en Tulum',
    titulo: 'Lotes de inversión en Tulum | Frank Hernández · Riviera Maya Investment',
    descripcion:
      'Lotes, casas y departamentos de inversión en Tulum. Aprovecha el crecimiento del aeropuerto y el Tren Maya con asesoría y certeza legal.',
    intro: [
      'Tulum pasó de pueblo bohemio a polo de inversión internacional. Con aeropuerto propio y estación del Tren Maya, su horizonte de crecimiento sigue abierto, especialmente en las regiones residenciales en desarrollo.',
      'En Tulum la revisión legal lo es todo: gran parte de la tierra tiene origen ejidal. Frank solo comercializa propiedad privada escriturada, y te acompañamos con notario en cada paso.',
    ],
    faqs: [
      {
        pregunta: '¿Qué riesgos tiene comprar tierra en Tulum?',
        respuesta:
          'El principal es adquirir tierra de origen ejidal sin desincorporar. Exige siempre escritura pública inscrita en el Registro Público, certificado de libertad de gravamen y compraventa ante notario.',
      },
      {
        pregunta: '¿Qué impacto tienen el Tren Maya y el aeropuerto de Tulum?',
        respuesta:
          'Ambos proyectos ampliaron la conectividad y aceleraron la demanda de suelo residencial y comercial, especialmente en los corredores entre Tulum y Playa del Carmen.',
      },
    ],
  },
];
