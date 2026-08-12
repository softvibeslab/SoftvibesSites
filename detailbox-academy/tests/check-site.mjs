import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const landing = await readFile(new URL('index.html', root), 'utf8');
const analysis = await readFile(new URL('analisis/index.html', root), 'utf8');
const script = await readFile(new URL('script.js', root), 'utf8');
const research = await readFile(new URL('docs/RESEARCH.md', root), 'utf8');
const socialSources = await readFile(new URL('docs/SOCIAL-SOURCES.md', root), 'utf8');

assert(landing.includes('Detailing automotriz integral'), 'Debe incluir la ruta integral.');
assert(landing.includes('Película antiasalto'), 'Debe incluir película antiasalto.');
assert(landing.includes('Car wrap'), 'Debe incluir car wrap.');
assert(landing.includes('529841799401'), 'Debe usar el contacto principal proporcionado.');
assert(landing.includes('525548215767'), 'Debe conservar el contacto CDMX proporcionado.');
assert(landing.includes('noindex, nofollow'), 'El prototipo no debe indexarse antes de publicar.');
assert(script.includes('encodeURIComponent(message)'), 'El formulario debe codificar el mensaje de WhatsApp.');
assert(analysis.includes('No conviene publicar “primera”'), 'El análisis debe advertir sobre afirmaciones no comprobadas.');
assert(research.includes('no resolvía DNS'), 'La investigación debe documentar el dominio inactivo.');
assert(landing.includes('id="experiencia"'), 'Debe incluir evidencia visual tomada de redes oficiales.');
assert(landing.includes('assets/redes-antonio-wrap.webp'), 'El hero debe usar una fotografía real de Detailbox.');
assert(landing.includes('assets/redes-practica-herramientas.webp'), 'Debe mostrar práctica real en la galería.');
assert(!landing.includes('Imagen conceptual'), 'La landing ya no debe presentar el hero como imagen conceptual.');
assert(analysis.includes('222'), 'El análisis debe incluir el contenido de mayor respuesta observado.');
assert(socialSources.includes('DbL0JlqEigb'), 'Las fotografías deben conservar trazabilidad a su publicación.');

const prohibitedClaims = [
  'avalado por la SEP',
  'avalados por la SEP',
  'garantía de ingresos',
  'empleo garantizado'
];

for (const claim of prohibitedClaims) {
  assert(!landing.toLowerCase().includes(claim.toLowerCase()), `La landing no debe afirmar: ${claim}`);
}

console.log('OK: landing, análisis social, imágenes reales, contactos, WhatsApp y límites verificados.');
