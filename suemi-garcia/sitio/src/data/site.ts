export const SITE = {
  nombre: 'Suemi García · Bienes Raíces Riviera Maya',
  dominio: 'https://suemigarcia.com',
  lema: 'Vive la Riviera Maya. Invierte donde ya se vive bien',
  lemaEn: 'Live the Riviera Maya. Invest where life already works',
  descripcion:
    'Asesoría inmobiliaria en Playa del Carmen, Playacar y Tulum. Penthouses, departamentos de preventa y propiedades de renta vacacional con acompañamiento de principio a escritura.',
  descripcionEn:
    'Real estate advisory in Playa del Carmen, Playacar and Tulum. Penthouses, pre-construction condos and vacation rental properties, guided from first call to closing.',
  telefono: '+52 984 157 9774',
  telefonoWa: '529841579774',
  waMensaje:
    'Hola Suemi, vi tu sitio y quiero más información sobre una propiedad en la Riviera Maya.',
  waMensajeEn:
    "Hi Suemi, I saw your website and I'd like more information about a property in the Riviera Maya.",
  ubicacion: 'Playa del Carmen, Quintana Roo, México',
  asesor: 'Suemi García',
  agencia: '307 Realtors',
  redes: {
    instagram: 'https://www.instagram.com/suemi_garcia_bienes_raices/',
    facebook: 'https://www.facebook.com/suemi.garcia.5',
    tiktok: 'https://www.tiktok.com/@suemi.garcia.bienesraice',
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
