/**
 * Título e meta tags por rota.
 *
 * O site é uma SPA servida pelo GitHub Pages: sem isso as 43 páginas
 * compartilham o `<title>` do index.html, e aba, histórico e link colado no
 * WhatsApp saem todos iguais. Cada página chama `usePageMeta` e o efeito
 * reescreve as tags no `<head>` — as mesmas que o index.html já traz, para o
 * primeiro paint continuar correto sem JavaScript.
 */
import { useEffect } from 'react'

export const SITE = 'IA do Zero'
const DEFAULT_TITLE = `${SITE} — inteligência artificial explicada com demos interativos`
const DEFAULT_DESCRIPTION =
  'Curso interativo de inteligência artificial em português: do perceptron aos LLMs, com demos que rodam no navegador.'

function upsert(kind: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${kind}="${key}"]`
  let tag = document.head.querySelector<HTMLMetaElement>(selector)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(kind, key)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function canonical(url: string) {
  let tag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
  if (!tag) {
    tag = document.createElement('link')
    tag.rel = 'canonical'
    document.head.appendChild(tag)
  }
  tag.href = url
}

export function usePageMeta({ title, description }: { title?: string; description?: string }) {
  useEffect(() => {
    const full = title ? `${title} · ${SITE}` : DEFAULT_TITLE
    const desc = description?.trim() || DEFAULT_DESCRIPTION
    // sem query nem hash: o mesmo capítulo não deve virar duas URLs para o crawler
    const url = `${window.location.origin}${window.location.pathname}`

    document.title = full
    upsert('name', 'description', desc)
    upsert('property', 'og:title', full)
    upsert('property', 'og:description', desc)
    upsert('property', 'og:url', url)
    upsert('name', 'twitter:title', full)
    upsert('name', 'twitter:description', desc)
    canonical(url)
  }, [title, description])
}
