# Análisis — theclosefactory.vercel.app

Consulta: 2026-10-29. Solo información pública: HTML de la portada, cabeceras HTTP y una comprobación de que los dos sitios socios responden. No hay datos de visitas, de tiempos de respuesta en WhatsApp ni de cierres. Donde eso falta, no se inventa una cifra.

La versión para leer en el navegador está en `analisis/index.html`.

## Veredicto

La página explica bien qué vende y qué no promete. Hoy no puede encontrarse en buscadores, no se puede reenviar con imagen y no distingue de qué botón salió una conversación. El diagnóstico depende de un solo WhatsApp.

## Qué es

Una sola vista en Next.js, prerenderizada en Vercel, en `es-MX`. Vende un diagnóstico de operación comercial para desarrolladores, inmobiliarias y redes de brokers. El recorrido es captura, calificación, seguimiento y cierre. El método es diagnóstico, diseño del flujo, piloto y mejora con datos. Grupo Zamna aparece como estrategia comercial y ROVI CRM como socio tecnológico.

El único cierre es `https://wa.me/529841362816` con el texto «quiero solicitar un diagnóstico comercial de THE CLOSE FACTORY». No hay formulario, precio ni checkout. El precio queda, a propósito, para después del diagnóstico.

## Lo que ya sostiene la página

- Una sola tarea: pedir el diagnóstico. Los botones dicen solicitar, evaluar, medir, hablar o agendar, y todos llegan al mismo canal.
- La promesa está acotada. Las preguntas dicen que no es necesariamente otro CRM, que la IA no cierra sola, que no hay ventas garantizadas y que no hay un precio público.
- El panel del hero enseña una oportunidad de ejemplo (WhatsApp, compra de vivienda, calificación, visita) y avisa que es una interfaz ilustrativa, no el producto en operación.
- Hay un `h1`, idioma `es-MX`, `theme-color` `#08111f` y HSTS. La respuesta trae `x-nextjs-prerender: 1`.
- Los enlaces a [grupozamna.com](https://grupozamna.com/) y [rovicrm.com](https://rovicrm.com/) respondieron 200 el día de la consulta.

## Hechos medidos

| Hecho | Evidencia del 2026-10-29 |
|---|---|
| Fuera de índice | `<meta name="robots" content="noindex, nofollow">` |
| Sin mapa del sitio | `sitemap.xml` responde 404 |
| Sin robots.txt | `robots.txt` responde 404 y devuelve HTML |
| Sin URL canónica ni `og:url` | ausentes en el `<head>` |
| Sin imagen al compartir | no hay `og:image`; Twitter es `summary` |
| Sin favicon | no hay `link rel="icon"` |
| Sin datos estructurados | no hay JSON-LD |
| Sin imágenes ni formulario | 0 `<img>`, 0 `<form>`, 0 `<video>` |
| Un solo mensaje de WhatsApp | seis llamados, un `href` |
| Descripciones distintas | la meta nombra brokers; Open Graph y Twitter solo dicen desarrolladores e inmobiliarias |
| «Conocer el sistema» | apunta a `#como-funciona`, no al panel |
| Jerarquía | el título del panel es `h3` y aparece antes del primer `h2` |
| Socios | enlaces vivos a Grupo Zamna y ROVI CRM |

## Fugas

Están ordenadas por lo que impiden: que la encuentren, que la reenvíen, que se sepa de dónde llegó la conversación y que haya una prueba.

### 1. No puede aparecer en buscadores

La propia página pide `noindex, nofollow`. No hay `canonical` ni `og:url`. `robots.txt` y `sitemap.xml` no existen: ambos responden 404. Si `theclosefactory.vercel.app` es el sitio con el que se quiere atraer demanda, hoy Google no debe indexarlo. Si es un borrador a la espera de dominio, el `noindex` es la decisión correcta y hay que tratarlo como tal, no como un fallo escondido.

### 2. Al reenviar el enlace no hay imagen

No hay `og:image`, el favicon no está y la tarjeta de Twitter es `summary`. El llamado a la acción es WhatsApp: la página se va a reenviar. Quien la reciba ve título y un texto corto, sin una vista del seguimiento.

### 3. No se sabe qué botón originó la conversación

Estos seis textos abren el mismo enlace y el mismo mensaje: Solicitar diagnóstico, Evaluar mi operación, Quiero medir mi conversión, Hablemos de tu caso y Agendar diagnóstico por WhatsApp (el primero está en la navegación y otra vez en el hero). El número no está escrito en la página. Si alguien no puede abrir WhatsApp, no tiene otra forma de guardar el contacto. Si sí lo abre, el equipo no distingue el hero del cierre.

### 4. La página pide medición y no muestra ninguna

«Lo que no se mide, se pierde» enlista indicadores de un piloto: primera respuesta, prospectos calificados, citas, propuestas y costo de atención. No hay un número, un caso ni un nombre. Tampoco hay fotos de equipo, de una operación o de un desarrollo. El panel avisa que no es el producto real. Esa cautela evita una promesa falsa. También deja la oferta sin una evidencia mínima que el visitante pueda creer.

### 5. «Conocer el sistema» no lleva al sistema

Ese botón apunta a `#como-funciona`, la sección del método en cuatro pasos. El panel que sí muestra una oportunidad está arriba, en el hero, y su título es un `h3` colocado antes del primer `h2`.

### 6. Si ese WhatsApp no contesta, el recorrido se corta

No hay formulario, correo ni agenda. El diagnóstico «sin compromiso» depende de que alguien responda ese número. La página no muestra un horario ni un tiempo de respuesta. No medí si contestan: eso queda fuera de este análisis.

### 7. El texto para compartir omite a una audiencia

La meta description dice: «Conecta prospectos, IA, brokers y seguimiento en un proceso comercial medible.» Open Graph y Twitter dicen: «Inteligencia comercial para desarrolladores e inmobiliarias.» Las redes de brokers son la tercera audiencia en la página y no aparecen en lo que se comparte.

### 8. Los socios son respaldo y también una salida

Grupo Zamna y ROVI CRM enlazan a sus sitios, y esos sitios respondieron. Sirven para sostener la marca. También sacan al visitante antes de pedir el diagnóstico. Sin analítica no se puede decir cuántos se van; sí se puede decir que la salida existe.

## Copia local

`the-close-factory/index.html` reconstruye la oferta y también lleva `noindex`, porque esta carpeta no está publicada. No es un clon del HTML de Vercel. Dos diferencias importan al leer este análisis:

- Después de este análisis, la copia local se rediseñó. «Conocer el sistema» abre la línea, cada WhatsApp indica de qué sección viene y los socios enlazan a sus sitios. En la página pública, «Conocer el sistema» sigue en `#como-funciona` y los seis llamados comparten un solo mensaje.

## Qué no se puede afirmar

No hay Search Console, analítica ni exportación de WhatsApp en esta carpeta. No sé cuántas personas llegan, cuánto tarda la primera respuesta ni si el `noindex` fue deliberado para un dominio futuro. Hasta tener eso, el hallazgo útil es de la página misma: explica el proceso con prudencia y todavía no puede demostrar ni atribuir un diagnóstico.
