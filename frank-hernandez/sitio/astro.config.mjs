import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // SITE_URL permite compilar para el dominio temporal de Hostinger o el definitivo:
  //   SITE_URL=https://xxxx.hostingersite.com npm run build
  site: process.env.SITE_URL ?? 'https://vivemarrealestate.com',
  integrations: [sitemap()],
  trailingSlash: 'ignore',
});
