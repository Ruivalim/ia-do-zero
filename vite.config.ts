import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import mdx from '@mdx-js/rollup'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

// sem @types/node no projeto; só o que este arquivo usa
declare const process: { env: Record<string, string | undefined> }

export default defineConfig({
  // GitHub Pages de projeto serve em /<repo>/. Passe BASE_PATH=/ia-do-zero/ no build.
  base: process.env.BASE_PATH ?? '/',
  plugins: [
    { enforce: 'pre', ...mdx({
      providerImportSource: '@mdx-js/react',
      remarkPlugins: [remarkGfm, remarkMath],
      rehypePlugins: [rehypeKatex],
    }) },
    react({ include: /\.(jsx|js|mdx|md|tsx|ts)$/ }),
    tailwindcss(),
  ],
})
