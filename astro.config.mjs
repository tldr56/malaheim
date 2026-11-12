import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// A remplacer par le nom de domaine definitif.
export default defineConfig({
  site: 'https://www.decision-entrepot.fr',
  trailingSlash: 'always',
  build: { assets: 'assets' },
  integrations: [sitemap()],
});
