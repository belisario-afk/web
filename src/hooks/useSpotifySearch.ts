import { useEffect, useRef, useState } from 'react'
import { useSpotify } from '../providers/SpotifyProvider'

export interface SimpleTrack {
  uri: string
  name: string
  artists: string
  albumArt: string | null
  durationMs: number
}

interface UseSpotifySearchResult {
  results: SimpleTrack[]
  loading: boolean
  error: string | null
  query: string
  setQuery: (q: string) => void
  clear: () => void
}

/**
 * Debounced Spotify track search.
 */
export function useSpotifySearch(debounceMs = 400): UseSpotifySearchResult {
  const { token } = useSpotify()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SimpleTrack[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<number | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!token) {
      setResults([])
      return
    }
    if (timerRef.current) window.clearTimeout(timerRef.current)
    if (abortRef.current) abortRef.current.abort()

    if (!query || query.trim().length < 2) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    timerRef.current = window.setTimeout(async () => {
      setLoading(true)
      setError(null)
      abortRef.current = new AbortController()
      try {
        const url = new URL('https://api.spotify.com/v1/search')
        url.searchParams.set('q', query.trim())
        url.searchParams.set('type', 'track')
        url.searchParams.set('limit', '12')
        const res = await fetch(url.toString(), {
          headers: { Authorization: `Bearer ${token}` },
          signal: abortRef.current.signal
        })
        if (!res.ok) {
          throw new Error(`Search failed (${res.status})`)
        }
        const json = await res.json()
        const tracks = (json.tracks?.items || []) as any[]
        const mapped: SimpleTrack[] = tracks.map(t => ({
          uri: t.uri,
            name: t.name,
            artists: t.artists.map((a: any) => a.name).join(', '),
            albumArt: t.album?.images?.[2]?.url || t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || null,
            durationMs: t.duration_ms
        }))
        setResults(mapped)
      } catch (e: any) {
        if (e.name === 'AbortError') return
        setError(e.message || 'Search error')
      } finally {
        setLoading(false)
      }
    }, debounceMs)

    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      if (abortRef.current) abortRef.current.abort()
    }
  }, [query, token, debounceMs])

  const clear = () => {
    setResults([])
    setQuery('')
    setError(null)
  }

  return { results, loading, error, query, setQuery, clear }
}