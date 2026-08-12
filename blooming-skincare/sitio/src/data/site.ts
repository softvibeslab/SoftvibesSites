export const SITE = {
  nombre: 'Blooming · Depilación Láser & Skincare',
  dominio: 'https://bloomingskincare.net',
  lema: 'Tu piel, nuestra pasión',
  lemaEn: 'Your skin, our passion',
  descripcion:
    'Clínica de estética en Playa del Carmen: depilación láser diodo, Hollywood Peel, faciales personalizados, Dermapen, BB Glow, botox y ácido hialurónico. Calificación 5.0 con 38 reseñas en Google.',
  descripcionEn:
    'Aesthetic clinic in Playa del Carmen: diode laser hair removal, Hollywood Peel, custom facials, Dermapen, BB Glow, botox and hyaluronic acid. Rated 5.0 with 38 Google reviews.',
  telefono: '+52 984 315 7426',
  telefonoWa: '529843157426',
  waMensaje:
    'Hola Blooming, vi su sitio y quiero agendar una cita. ¿Me comparten disponibilidad?',
  waMensajeEn:
    'Hi Blooming, I saw your website and I would like to book an appointment. Could you share your availability?',
  correo: 'blooming.laserskincare@gmail.com',
  /** Dirección VIGENTE — la que aparece en Instagram está desactualizada */
  direccion: 'Calle Tihosuco No. 13, Fracc. Cataluña Mz. 24 Lt. 4',
  direccionCorta: 'Calle Tihosuco 13, Fracc. Cataluña',
  cp: 'CP 77710',
  ciudad: 'Playa del Carmen, Quintana Roo',
  mapa: 'https://www.google.com/maps/search/?api=1&query=Blooming+Depilaci%C3%B3n+L%C3%A1ser+%26+Skin+Care+Playa+del+Carmen',
  horario: 'Lunes a sábado, 10:00 a 20:00',
  resenas: { calificacion: '5.0', total: 38, fuente: 'Google' },
  redes: {
    instagram: 'https://www.instagram.com/blooming_skincare_/',
    facebook: 'https://www.facebook.com/p/Blooming-100077172775317/',
    threads: 'https://www.threads.com/@blooming_skincare_',
  },
};

export function waLink(mensaje: string = SITE.waMensaje): string {
  return `https://wa.me/${SITE.telefonoWa}?text=${encodeURIComponent(mensaje)}`;
}

export function formatoPrecio(precio: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(precio);
}

export const CATEGORIAS: Record<string, string> = {
  facial: 'Faciales',
  laser: 'Depilación láser',
  corporal: 'Corporales',
  inyectable: 'Inyectables',
  bienestar: 'Bienestar',
};

export const CATEGORIAS_EN: Record<string, string> = {
  facial: 'Facials',
  laser: 'Laser hair removal',
  corporal: 'Body',
  inyectable: 'Injectables',
  bienestar: 'Wellness',
};
