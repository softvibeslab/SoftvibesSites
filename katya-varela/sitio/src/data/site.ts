export const SITE = {
  nombre: 'Katya Varela · Inversiones Riviera Maya',
  dominio: 'https://katyavarela.com',
  lema: 'Propiedades rentables en la Riviera Maya. Todo con amor',
  lemaEn: 'Profitable properties in the Riviera Maya. All with love',
  descripcion:
    'Asesoría de inversión inmobiliaria en Playa del Carmen y Tulum. Departamentos frente al mar, preventa y propiedades de renta vacacional para compradores mexicanos y extranjeros.',
  descripcionEn:
    'Real estate investment advisory in Playa del Carmen and Tulum. Beachfront condos, pre-construction and vacation rental properties for Mexican and international buyers.',
  telefono: '+52 477 787 3992',
  telefonoWa: '524777873992',
  waMensaje:
    'Hola Katya, vi tu sitio y quiero más información sobre una propiedad de inversión en la Riviera Maya.',
  waMensajeEn:
    "Hi Katya, I saw your website and I'd like more information about an investment property in the Riviera Maya.",
  ubicacion: 'Playa del Carmen, Quintana Roo, México',
  asesor: 'Katya Varela',
  redes: {
    instagram: 'https://www.instagram.com/katyavarela.inversiones/',
    instagramPersonal: 'https://www.instagram.com/katya_varela/',
    facebook: 'https://www.facebook.com/profile.php?id=61557004452446',
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
