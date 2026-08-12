export const SITE = {
  nombre: "Val Madero",
  nombreCorto: "Val",
  dominio: "https://lightcoral-heron-899450.hostingersite.com",
  lema: 'Tu siguiente paso en Riviera Maya, explicado claro',
  descripcion:
    'Acompañamiento inmobiliario de Valeria Soto Madero para vivir, invertir o entender tus opciones en Playa del Carmen y Riviera Maya.',
  idioma: 'es-MX',
  moneda: 'MXN',
  telefono: '',
  telefonoWa: '',
  whatsappUrl: 'https://wa.link/d8vvwr',
  waMensaje: 'Hola Val, visité tu sitio y quiero entender mis opciones en Riviera Maya.',
  agenda: 'https://wa.link/d8vvwr',
  correo: 'contacto@valmadero.example',
  ubicacion: 'Playa del Carmen y Riviera Maya, México',
  asesor: {
    nombre: 'Valeria Soto Madero',
    cargo: 'Asesoría inmobiliaria en Riviera Maya',
    bio: 'Valeria comparte su vida en el Caribe y acompaña a quienes quieren comprar o invertir con explicaciones sencillas sobre opciones, crédito, enganche y gastos asociados.',
    imagen: '/media/valmadero/valeria-soto-madero.jpg',
  },
  redes: {
    instagram: 'https://www.instagram.com/_valmadero/',
    facebook: '#',
    linkedin: '#',
  },
  navegacion: [
    { etiqueta: 'Opciones', href: '/propiedades' },
    { etiqueta: 'Playa del Carmen', href: '/zonas/playa-del-carmen' },
    { etiqueta: 'Guías', href: '/blog' },
    { etiqueta: 'Hablemos', href: '/contacto' },
  ],
} as const;

export function waLink(mensaje: string = SITE.waMensaje): string {
  if (SITE.whatsappUrl) return SITE.whatsappUrl;
  return `https://wa.me/${SITE.telefonoWa}?text=${encodeURIComponent(mensaje)}`;
}

export function formatoPrecio(precio: number, moneda: string = SITE.moneda): string {
  return new Intl.NumberFormat(SITE.idioma, {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(precio);
}
