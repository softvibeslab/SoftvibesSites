import type { APIRoute } from 'astro';

export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL('https://example.com');
  return new Response([
    'User-agent: *',
    'Allow: /',
    'Disallow: /admin/',
    '',
    `Sitemap: ${new URL('/sitemap-index.xml', base).href}`,
    '',
  ].join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
