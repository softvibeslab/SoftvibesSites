import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: process.env.SITE_URL ?? 'https://lightcoral-heron-899450.hostingersite.com',
  integrations: [sitemap({ filter: (page) => !page.includes('/analisis') && !page.includes('/gracias') })],
  trailingSlash: 'ignore',
});
