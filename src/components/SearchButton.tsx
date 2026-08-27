'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './Navbar.module.css'

type Suggestion = { slug: string; name: string; price: number; imageUrl: string | null }

function SearchIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}><circle cx="10.5" cy="10.5" r="6" /><path d="m15.2 15.2 4.3 4.3" /></svg>
}

export default function SearchButton() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const search = query.trim()
    if (search.length < 2) {
      return
    }
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setIsLoading(true)
      try {
        const response = await fetch(`/api/products?search=${encodeURIComponent(search)}`, { signal: controller.signal })
        if (response.ok) setSuggestions(await response.json() as Suggestion[])
      } catch (error) {
        if ((error as { name?: string }).name !== 'AbortError') setSuggestions([])
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }, 180)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const search = query.trim()
    router.push(search ? `/shop?search=${encodeURIComponent(search)}` : '/shop')
    setIsOpen(false)
  }

  function chooseSuggestion(slug: string) {
    setIsOpen(false)
    setSuggestions([])
    router.push(`/product/${slug}`)
  }

  function updateQuery(value: string) {
    setQuery(value)
    if (value.trim().length < 2) setSuggestions([])
  }

  if (!isOpen) return <button type="button" className={styles.iconButton} aria-label="Search" onClick={() => setIsOpen(true)}><SearchIcon /></button>

  return <div className={styles.searchWrap}>
    <form className={styles.searchForm} onSubmit={submitSearch}>
      <SearchIcon />
      <input ref={inputRef} value={query} onChange={(event) => updateQuery(event.target.value)} placeholder="Search pieces" aria-label="Search products" aria-controls="search-suggestions" />
      <button type="button" className={styles.searchClose} aria-label="Close search" onClick={() => { setIsOpen(false); setSuggestions([]) }}>×</button>
    </form>
    {(isLoading || suggestions.length > 0 || query.trim().length >= 2) && <div id="search-suggestions" className={styles.suggestions} role="listbox">
      {isLoading ? <p className={styles.suggestionMessage}>Searching…</p> : suggestions.length > 0 ? suggestions.map((suggestion) => <button type="button" role="option" aria-selected="false" className={styles.suggestion} key={suggestion.slug} onClick={() => chooseSuggestion(suggestion.slug)}>
        <span className={styles.suggestionImage}>{suggestion.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={suggestion.imageUrl} alt="" />
        ) : null}</span>
        <span><strong>{suggestion.name}</strong><small>${suggestion.price.toFixed(2)}</small></span>
        <span className={styles.suggestionArrow} aria-hidden="true">↗</span>
      </button>) : <p className={styles.suggestionMessage}>No pieces found. Press Enter to view all results.</p>}
    </div>}
  </div>
}
