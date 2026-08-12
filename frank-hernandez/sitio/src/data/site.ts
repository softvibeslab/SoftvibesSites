export const SITE = {
  nombre: 'Frank Hernández · Riviera Maya Investment',
  dominio: 'https://frankrivieramaya.com',
  lema: 'Capital inteligente con visión de estilo de vida',
  lemaEn: 'Smart capital with a lifestyle vision',
  descripcion:
    'Asesoría de inversión inmobiliaria en la Riviera Maya. Preventas, departamentos y propiedades de renta con estrategia patrimonial en Cancún, Playa del Carmen y Tulum.',
  descripcionEn:
    'Real estate investment advisory in the Riviera Maya. Pre-construction, condos and rental properties with a wealth strategy in Cancún, Playa del Carmen and Tulum.',
  telefono: '+52 984 280 3445',
  telefonoWa: '529842803445',
  waMensaje:
    'Hola Frank, vi tu sitio y quiero más información sobre inversión en la Riviera Maya.',
  waMensajeEn:
    "Hi Frank, I saw your website and I'd like more information about investing in the Riviera Maya.",
  ubicacion: 'Playa del Carmen, Quintana Roo, México',
  asesor: 'Frank Hernández',
  redes: {
    instagram: 'https://www.instagram.com/frank.rivieramaya/',
    facebook: 'https://www.facebook.com/frankhernandezriviera',
    threads: 'https://www.threads.net/@frank.rivieramaya',
  },
};

export function waLink(mensaje: string = SITE.waMensaje): string {
  return `https://wa.me/${SITE.telefonoWa}?text=${encodeURIComponent(mensaje)}`;
}

export function formatoPrecio(precio: number, moneda: string = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: moneda,
    maximumFractionDigits: 0,
  }).format(precio);
}
