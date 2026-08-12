export const SITE = {
  nombre: 'Vive Mar · Real Estate',
  dominio: 'https://vivemarrealestate.com',
  lema: 'El paraíso de tus sueños, a tu alcance',
  descripcion:
    'Inmobiliaria en Cancún y la Riviera Maya. Propiedades de lujo, departamentos y lotes de inversión con certeza legal en Playa del Carmen, Tulum y Cancún.',
  telefono: '+52 984 254 1127',
  telefonoWa: '529842541127',
  waMensaje:
    'Hola Viridiana, vi una propiedad en vivemarrealestate.com y quiero más información.',
  calendly: 'https://calendly.com/vivemarrealestate',
  correo: 'contacto@vivemarrealestate.com',
  ubicacion: 'Cancún, Quintana Roo, México',
  asesora: 'Viridiana Mar',
  redes: {
    instagram: 'https://www.instagram.com/viridianamarrealtor/',
    tiktok: 'https://www.tiktok.com/@viridianamarrealtor',
    facebook: 'https://facebook.com/vivemarrealestate',
    linkedin: 'https://www.linkedin.com/company/vivemarrealestate',
    pinterest: 'https://mx.pinterest.com/vivemarrealestate/',
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
