/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { artist } from './src/config/artist';

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

// Injects SEO metadata from the central artist config into index.html at build/dev time.
const seo = () => ({
  name: 'artist-seo',
  transformIndexHtml(html: string) {
    const { title, description, url, image } = artist.seo;
    const abs = image.startsWith('http') ? image : url.replace(/\/$/, '') + image;
    const ld = JSON.stringify({ '@context': 'https://schema.org', '@type': 'MusicGroup', name: artist.name, url, image: abs,
      sameAs: artist.socials.map((s) => s.url).filter(Boolean) });
    const tags = `
    <title>${esc(title)}</title>
    <meta name="description" content="${esc(description)}" />
    <link rel="canonical" href="${esc(url)}" />
    <meta property="og:type" content="music.musician" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:url" content="${esc(url)}" />
    <meta property="og:image" content="${esc(abs)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="theme-color" content="${artist.colors.background}" />
    <script type="application/ld+json">${ld.replace(/</g, '\\u003c')}</script>`;
    return html.replace('<!--SEO-->', tags);
  },
});

export default defineConfig({
  plugins: [react(), seo()],
  test: { environment: 'jsdom', globals: true, setupFiles: './src/test/setup.ts', include: ['src/**/*.test.{ts,tsx}'] },
});
