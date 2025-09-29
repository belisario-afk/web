import { useCallback, useEffect, useState } from 'react'
import { generateCodeChallenge, generateCodeVerifier } from '../utils/pkce'
import { generateRandomState } from '../utils/uuid'

const CLIENT_ID = '927fda6918514f96903e828fcd6bb576'
const REDIRECT_URI = 'https://belisario-afk.github.io/web/'

type Token = {
  access_token: string
  token_type: 'Bearer'
  expires_in: number
  refresh_token?: string
  scope: string
  obtained_at: number
}

const STORAGE_KEY = 'opelz_spotify_token'
const VERIFIER_KEY = 'opelz_pkce_verifier'
const STATE_KEY = 'opelz_auth_state'
const AUTH_URL_KEY = 'opelz_auth_url_cached'

export function useSpotifyAuth() {
  const [token, setToken] = useState<Token | null>(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const saveToken = useCallback((t: Token) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(t))
    setToken(t)
  }, [])

  const loadToken = useCallback(() => {
    const str = localStorage.getItem(STORAGE_KEY)
    if (!str) return null
    try {
      const t = JSON.parse(str) as Token
      return t
    } catch {
      return null
    }
  }, [])

  const isExpired = (t: Token) => Date.now() > t.obtained_at + (t.expires_in - 30) * 1000

  // Pre-generate an auth URL so the click is synchronous
  const prepareAuthUrl = useCallback(async () => {
    const verifier = generateCodeVerifier()
    const challenge = await generateCodeChallenge(verifier)
    localStorage.setItem(VERIFIER_KEY, verifier)

    // Use robust state generator (crypto.randomUUID not supported on some Android)
    const state = generateRandomState()
    localStorage.setItem(STATE_KEY, state)

    const scope = [
      'streaming',
      'user-read-email',
      'user-read-private',
      'user-read-playback-state',
      'user-modify-playback-state'
    ].join(' ')
    const params = new URLSearchParams({
      client_id: CLIENT_ID,
      response_type: 'code',
      redirect_uri: REDIRECT_URI,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      state,
      scope
    })
    const url = `https://accounts.spotify.com/authorize?${params.toString()}`
    localStorage.setItem(AUTH_URL_KEY, url)
    return url
  }, [])

  useEffect(() => {
    // Generate once at load
    prepareAuthUrl().catch(() => {})
  }, [prepareAuthUrl])

  const authorize = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen()
        } catch {}
      }
      let url = localStorage.getItem(AUTH_URL_KEY) || ''
      if (!url) {
        url = await prepareAuthUrl()
      }
      try {
        window.location.assign(url)
        return
      } catch {}
      const win = window.open(url, '_self')
      if (win) return
      const a = document.createElement('a')
      a.href = url
      a.rel = 'noopener'
      a.target = '_self'
      document.body.appendChild(a)
      a.click()
      a.remove()
    } catch (e: any) {
      setError(e?.message || 'Authorization failed')
    }
  }, [prepareAuthUrl])

  const exchangeToken = useCallback(async (code: string, storedState: string) => {
    const params = new URLSearchParams(window.location.search)
    const state = params.get('state') || ''
    if (state !== storedState) throw new Error('State mismatch')
    const verifier = localStorage.getItem(VERIFIER_KEY)
    if (!verifier) throw new Error('Missing PKCE verifier')
    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'authorization_code',
      code,
      redirect_uri: REDIRECT_URI,
      code_verifier: verifier
    })
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
    if (!res.ok) throw new Error(`Token exchange failed ${res.status}`)
    const json = (await res.json()) as Omit<Token, 'obtained_at'>
    const t: Token = { ...json, obtained_at: Date.now() }
    saveToken(t)

    const clean = new URL(window.location.href)
    clean.search = ''
    window.history.replaceState({}, '', clean.toString())
    localStorage.removeItem(VERIFIER_KEY)
    localStorage.removeItem(STATE_KEY)
    localStorage.removeItem(AUTH_URL_KEY)
  }, [saveToken])

  const refresh = useCallback(async (refresh_token: string) => {
    const body = new URLSearchParams({
      client_id: CLIENT_ID,
      grant_type: 'refresh_token',
      refresh_token
    })
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body
    })
    if (!res.ok) throw new Error(`Refresh failed ${res.status}`)
    const json = (await res.json()) as Partial<Omit<Token, 'obtained_at'>> & { access_token: string; expires_in: number; scope: string }
    const t: Token = {
      access_token: json.access_token,
      token_type: 'Bearer',
      expires_in: json.expires_in,
      scope: json.scope,
      refresh_token: json.refresh_token ?? refresh_token,
      obtained_at: Date.now()
    }
    saveToken(t)
    return t
  }, [saveToken])

  useEffect(() => {
    ;(async () => {
      try {
        const url = new URL(window.location.href)
        const code = url.searchParams.get('code')
        const errorParam = url.searchParams.get('error')
        if (errorParam) {
          setError(errorParam)
        }
        const stored = loadToken()
        if (stored && !isExpired(stored)) {
          setToken(stored)
          setReady(true)
          return
        }
        if (stored && stored.refresh_token) {
          try {
            await refresh(stored.refresh_token)
            setReady(true)
            return
          } catch {
            // proceed to exchange if code present
          }
        }
        const storedState = localStorage.getItem(STATE_KEY) || ''
        if (code) {
          await exchangeToken(code, storedState)
          setReady(true)
          return
        }
        setReady(true)
      } catch (e: any) {
        setError(e.message || 'Auth error')
        setReady(true)
      }
    })()
  }, [exchangeToken, loadToken, refresh])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setToken(null)
  }, [])

  return { token, ready, error, authorize, logout, refresh }
}