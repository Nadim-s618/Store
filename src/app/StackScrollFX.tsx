'use client'

import { useEffect } from 'react'

export default function StackScrollFX() {
  useEffect(() => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduceMotion) return

    const sections = Array.from(document.querySelectorAll<HTMLElement>('[data-stack]'))
    if (sections.length < 2) return

    let ticking = false

    const update = () => {
      const vh = window.innerHeight
     for (let i = 0; i < sections.length - 1; i++) {
        const current = sections[i]
        const next = sections[i + 1]
        const nextTop = next.getBoundingClientRect().top

        // 0 when "next" hasn't arrived yet, 1 when it fully covers "current"
        let progress = 1 - nextTop / vh
        progress = Math.min(Math.max(progress, 0), 1)

       const translate = progress * 160  // px — let the previous section clear space for the incoming content
       const scale = 1 - progress * 0.09 // slightly stronger shrink
       const fade = 1 - progress * 0.3   // slightly stronger fade

        current.style.transform = `translateY(-${translate}px) scale(${scale})`
        current.style.opacity = String(fade)
      }
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update)
        ticking = true
      }
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return null
}
