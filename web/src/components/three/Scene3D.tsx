import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react'
import { useWebGLAvailable } from '@/hooks'

interface Scene3DProps {
  children: (active: boolean) => ReactNode
  fallback: ReactNode
  className?: string
  rootMargin?: string
}

// Safari has no requestIdleCallback.
function whenIdle(cb: () => void): () => void {
  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(cb, { timeout: 2000 })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(cb, 200)
  return () => clearTimeout(id)
}

const INTERACTIONS = ['pointerdown', 'touchstart', 'scroll', 'keydown', 'wheel'] as const

// Phones pay most for WebGL start-up, so they only get it once the visitor engages.
function whenReady(cb: () => void): () => void {
  if (!window.matchMedia('(pointer: coarse)').matches) return whenIdle(cb)
  let cancelIdle: (() => void) | undefined
  const start = () => {
    stop()
    cancelIdle = whenIdle(cb)
  }
  const stop = () => INTERACTIONS.forEach((e) => window.removeEventListener(e, start))
  INTERACTIONS.forEach((e) => window.addEventListener(e, start, { once: true, passive: true }))
  return () => {
    stop()
    cancelIdle?.()
  }
}

/**
 * Children must render a `lazy()` scene: nothing from three is fetched until
 * the host nears the viewport and the main thread is idle (and, on touch
 * devices, the visitor has interacted), so the static fallback paints first and
 * LCP never waits on WebGL.
 */
export function Scene3D({ children, fallback, className, rootMargin = '400px' }: Scene3DProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const webgl = useWebGLAvailable()
  const [ready, setReady] = useState(false)
  const [inView, setInView] = useState(false)
  const [visibleTab, setVisibleTab] = useState(true)

  useEffect(() => {
    const host = hostRef.current
    if (!host || !webgl) return

    let cancelIdle: (() => void) | undefined
    const lazyObserver = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return
        lazyObserver.disconnect()
        cancelIdle = whenReady(() => setReady(true))
      },
      { rootMargin },
    )
    const activeObserver = new IntersectionObserver(([entry]) =>
      setInView(Boolean(entry?.isIntersecting)),
    )
    lazyObserver.observe(host)
    activeObserver.observe(host)

    const onVisibility = () => setVisibleTab(document.visibilityState === 'visible')
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      cancelIdle?.()
      lazyObserver.disconnect()
      activeObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [webgl, rootMargin])

  return (
    <div ref={hostRef} className={className} aria-hidden="true">
      {ready ? <Suspense fallback={fallback}>{children(inView && visibleTab)}</Suspense> : fallback}
    </div>
  )
}
