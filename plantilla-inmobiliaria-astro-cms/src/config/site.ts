export const SITE = {
  nombre: 'Horizonte Inmobiliario',
  nombreCorto: 'Horizonte',
  dominio: 'https://example.com',
  lema: 'Decisiones inmobiliarias con información clara',
  descripcion:
    'Plantilla demostrativa para una agencia inmobiliaria con catálogo, zonas, blog, captación de leads y CMS.',
  idioma: 'es-MX',
  moneda: 'MXN',
  telefono: '+52 000 000 0000',
  telefonoWa: '520000000000',
  waMensaje: 'Hola, visité su sitio y quiero recibir información.',
  agenda: 'https://calendly.com/example',
  correo: 'contacto@example.com',
  ubicacion: 'Ciudad de ejemplo, México',
  asesor: {
    nombre: 'Nombre del asesor',
    cargo: 'Asesoría inmobiliaria',
    bio: 'Presenta aquí la experiencia, el proceso de trabajo y el valor que aporta la persona o el equipo.',
    imagen: '/img/demo/portrait.svg',
  },
  redes: {
    instagram: '#',
    facebook: '#',
    linkedin: '#',
  },
  navegacion: [
    { etiqueta: 'Propiedades', href: '/propiedades' },
    { etiqueta: 'Zonas', href: '/zonas/centro' },
    { etiqueta: 'Blog', href: '/blog' },
    { etiqueta: 'Contacto', href: '/contacto' },
  ],
} as const;

export function waLink(mensaje: string = SITE.waMensaje): string {
  return `https://wa.me/${SITE.telefonoWa}?text=${encodeURIComponent(mensaje)}`;
}

export function formatoPrecio(precio: number, moneda: string = SITE.moneda): string {
  return new Intl.NumberFormat(SITE.idioma, {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(precio);
}
