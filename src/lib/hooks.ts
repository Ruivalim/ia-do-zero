import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

/** requestAnimationFrame loop that respects `running` and hands over dt in seconds. */
export function useRaf(callback: (dt: number, t: number) => void, running = true) {
  const cb = useRef(callback)
  cb.current = callback

  useEffect(() => {
    if (!running) return
    let frame = 0
    let last = performance.now()
    const start = last
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      cb.current(dt, (now - start) / 1000)
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [running])
}

/** Steps `fn` every `everyMs` while `running`. Good for training loops. */
export function useInterval(fn: () => void, everyMs: number, running = true) {
  const cb = useRef(fn)
  cb.current = fn
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => cb.current(), everyMs)
    return () => clearInterval(id)
  }, [everyMs, running])
}

/** Observed size of an element. Returns `[ref, {width, height}]`. */
export function useSize<T extends HTMLElement>() {
  const ref = useRef<T | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect
      setSize({ width: r.width, height: r.height })
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, size] as const
}

export type Pt = { x: number; y: number }

/**
 * Pointer position in SVG user units, for click-to-add and drag demos.
 * Works with mouse, pen and touch. Attach the returned handlers to the <svg>.
 */
export function useSvgPointer(
  svgRef: React.RefObject<SVGSVGElement | null>,
): (e: { clientX: number; clientY: number }) => Pt {
  return useCallback(
    (e) => {
      const svg = svgRef.current
      if (!svg) return { x: 0, y: 0 }
      const rect = svg.getBoundingClientRect()
      const vb = svg.viewBox.baseVal
      const w = vb && vb.width ? vb.width : rect.width
      const h = vb && vb.height ? vb.height : rect.height
      return {
        x: ((e.clientX - rect.left) / rect.width) * w + (vb?.x ?? 0),
        y: ((e.clientY - rect.top) / rect.height) * h + (vb?.y ?? 0),
      }
    },
    [svgRef],
  )
}

/** `true` once the element has been on screen — used to defer heavy canvas work. */
export function useInView<T extends HTMLElement>(rootMargin = '200px') {
  const ref = useRef<T | null>(null)
  const [seen, setSeen] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || seen) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setSeen(true)
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [seen, rootMargin])

  return [ref, seen] as const
}

export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(() =>
    typeof window === 'undefined' ? false : window.matchMedia(query).matches,
  )
  useEffect(() => {
    const mq = window.matchMedia(query)
    const on = () => setMatches(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [query])
  return matches
}

export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)')
