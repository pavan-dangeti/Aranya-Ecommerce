import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { articles, products } from '@aranya/data'

const SITE_URL = (process.env.SITE_URL ?? 'https://aranya-ecommerce.vercel.app').replace(/\/$/, '')

function sitemap(): Plugin {
  const pages = [
    '/',
    '/products',
    '/journal',
    '/story',
    '/ingredients',
    ...['contact', 'shipping', 'returns', 'faq', 'privacy', 'terms', 'refund'].map(
      (t) => `/support/${t}`,
    ),
    ...products.map((p) => `/products/${p.slug}`),
    ...articles.map((a) => `/journal/${a.slug}`),
  ]
  return {
    name: 'aranya-sitemap',
    apply: 'build',
    generateBundle() {
      const urls = pages.map((p) => `  <url><loc>${SITE_URL}${p}</loc></url>`).join('\n')
      this.emitFile({
        type: 'asset',
        fileName: 'sitemap.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
      })
      this.emitFile({
        type: 'asset',
        fileName: 'robots.txt',
        source: `User-agent: *\nAllow: /\nDisallow: /admin\n\nSitemap: ${SITE_URL}/sitemap.xml\n`,
      })
    },
  }
}

// The hero and product headlines are set in these faces; preloading them keeps
// the font swap from becoming the LCP.
function preloadFonts(): Plugin {
  const faces = [/fraunces-latin-wght-normal-.*\.woff2$/, /manrope-latin-wght-normal-.*\.woff2$/]
  return {
    name: 'aranya-preload-fonts',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, ctx) {
        return Object.keys(ctx.bundle ?? {})
          .filter((file) => faces.some((re) => re.test(file)))
          .map((file) => ({
            tag: 'link',
            attrs: {
              rel: 'preload',
              as: 'font',
              type: 'font/woff2',
              href: `/${file}`,
              crossorigin: '',
            },
            injectTo: 'head' as const,
          }))
      },
    },
  }
}

// Same-origin /api in every environment, like the Vercel rewrite in production.
const apiProxy = { '/api': process.env.API_ORIGIN ?? 'http://localhost:8787' }

export default defineConfig({
  plugins: [react(), tailwindcss(), sitemap(), preloadFonts()],
  server: { proxy: apiProxy },
  preview: { proxy: apiProxy },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
