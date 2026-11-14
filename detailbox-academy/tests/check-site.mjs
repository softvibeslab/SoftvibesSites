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

// Landings nuevas: curso Método PAD y Detailbox AI Ecosystem.
const pad = await readFile(new URL('pad/index.html', root), 'utf8');
const padScript = await readFile(new URL('pad/pad.js', root), 'utf8');
const eco = await readFile(new URL('ecosistema/index.html', root), 'utf8');
const ecoScript = await readFile(new URL('ecosistema/ecosistema.js', root), 'utf8');

const strictClaims = [...prohibitedClaims, 'garantizamos', 'resultados garantizados', 'aval de la STPS', 'avalado por la STPS'];
const pricePattern = /\$\s?\d|\bMXN\b|\d+\s?pesos/i;

for (const [name, html, js] of [['PAD', pad, padScript], ['Ecosistema', eco, ecoScript]]) {
  assert(html.includes('noindex, nofollow'), `${name}: no debe indexarse antes de publicar.`);
  assert(html.includes('529841799401') || js.includes('529841799401'), `${name}: debe usar el contacto principal.`);
  assert(js.includes('encodeURIComponent(message)'), `${name}: el mensaje de WhatsApp debe codificarse.`);
  assert(html.includes('href="../"'), `${name}: debe enlazar a la landing de cursos técnicos.`);
  // La maqueta <figure class="mock"> lleva cifras ficticias rotuladas; el resto de la página no puede tener precios.
  const publicCopy = html.replace(/<figure class="mock">[\s\S]*?<\/figure>/g, '');
  assert(!pricePattern.test(publicCopy), `${name}: no debe publicar precios sin confirmar.`);
  for (const claim of strictClaims) {
    assert(!html.toLowerCase().includes(claim.toLowerCase()), `${name}: no debe afirmar «${claim}».`);
  }
}

assert(pad.includes('no garantiza ventas ni rentabilidad'), 'PAD: debe aclarar que el curso no garantiza ventas (Base PAD §1).');
assert(pad.includes('href="../ecosistema/"'), 'PAD: debe enlazar al ecosistema.');
for (const stage of ['Prepara', 'Apunta', 'Dispara']) {
  assert(pad.toLowerCase().includes(stage.toLowerCase()), `PAD: debe explicar la etapa ${stage}.`);
}
assert(eco.includes('href="../pad/"'), 'Ecosistema: debe enlazar al curso PAD.');
for (const tier of ['PAD Starter', 'PAD Growth', 'PAD Business Intelligence']) {
  assert(eco.includes(tier), `Ecosistema: debe presentar el nivel ${tier}.`);
}
assert(/acceso anticipado/i.test(eco), 'Ecosistema: debe presentarse como acceso anticipado, no como producto terminado.');
assert(/<figure class="mock">[\s\S]*datos ficticios[\s\S]*?<\/figure>/.test(eco), 'Ecosistema: la maqueta debe rotularse como datos ficticios.');

console.log('OK: landing, análisis social, imágenes reales, contactos, WhatsApp y límites verificados.');
console.log('OK: landings PAD y Ecosistema sin precios ni promesas, con WhatsApp codificado y enlaces cruzados.');

// Asesor de admisiones (agente de ventas Hermes): botón flotante en las tres landings.
const agentScript = await readFile(new URL('agente/agente.js', root), 'utf8');
for (const [name, html, origin] of [['Landing', landing, 'inicio'], ['PAD', pad, 'pad'], ['Ecosistema', eco, 'ecosistema']]) {
  assert(html.includes(`agente/agente.js" data-origen="${origin}"`), `${name}: debe cargar el asesor con su origen.`);
  assert(html.includes('agente/agente.css'), `${name}: debe cargar los estilos del asesor.`);
}
assert(agentScript.includes("'/api/ventas'"), 'El asesor debe hablar con /api/ventas.');
assert(agentScript.includes("credentials: 'omit'"), 'El asesor no debe enviar la cookie de sesión.');
assert(agentScript.includes('encodeURIComponent(message)'), 'El respaldo a WhatsApp debe codificar el mensaje.');
assert(!pricePattern.test(agentScript.replaceAll('$1', '')), 'El asesor no debe publicar precios.');
