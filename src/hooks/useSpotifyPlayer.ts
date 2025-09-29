import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Opts = { token: string | null }

function loadSpotifySDK(): Promise<void> {
  if ((window as any)._spotifySDKLoading) return (window as any)._spotifySDKLoading
  if (window.Spotify) return Promise.resolve()
  if (!window.onSpotifyWebPlaybackSDKReady) window.onSpotifyWebPlaybackSDKReady = () => {}
  ;(window as any)._spotifySDKLoading = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://sdk.scdn.co/spotify-player.js'
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Spotify SDK'))
    document.head.appendChild(script)
  })
  return (window as any)._spotifySDKLoading
}

export function useSpotifyPlayer({ token }: Opts) {
  const [ready, setReady] = useState(false)
  const [audioActivated, setAudioActivated] = useState(false)
  const [deviceId, setDeviceId] = useState<string | null>(null)
  const [state, setState] = useState<Spotify.PlaybackState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const playerRef = useRef<Spotify.Player | null>(null)
  const tokenRef = useRef<string | null>(token)
  tokenRef.current = token
  const disconnected = useRef(false)

  // Init / teardown
  useEffect(() => {
    let disposed = false
    async function init() {
      if (!tokenRef.current) return
      try {
        await loadSpotifySDK()
        if (!window.Spotify) return setError('SDK unavailable')
        const player = new window.Spotify.Player({
          name: 'Opel Z Dashboard',
          getOAuthToken: cb => tokenRef.current && cb(tokenRef.current),
          volume: 0.6
        })
        player.addListener('ready', ({ device_id }) => {
          if (disposed) return
          setDeviceId(device_id)
          setReady(true)
        })
        player.addListener('not_ready', () => {
          if (!disposed) setReady(false)
        })
        player.addListener('player_state_changed', st => {
          if (!disposed) setState(st)
        })
        player.addListener('initialization_error', e => setError(e.message))
        player.addListener('authentication_error', e => setError(e.message))
        player.addListener('account_error', e => setError(e.message))
        playerRef.current = player
        await player.connect()
      } catch (e: any) {
        if (!disposed) setError(e.message || 'Player init failed')
      }
    }
    init()
    return () => {
      disposed = true
      disconnected.current = true
      try { playerRef.current?.disconnect() } catch {}
      playerRef.current = null
      setReady(false)
      setAudioActivated(false)
      setDeviceId(null)
      setState(null)
    }
  }, [token])

  // Gesture unlock
  useEffect(() => {
    if (!token) return
    let done = false
    const handler = async () => {
      if (done) return
      done = true
      try { await activateAudio() } catch {}
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('touchstart', handler)
      window.removeEventListener('keydown', handler)
    }
    window.addEventListener('pointerdown', handler, { passive: true })
    window.addEventListener('touchstart', handler, { passive: true })
    window.addEventListener('keydown', handler, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('touchstart', handler)
      window.removeEventListener('keydown', handler)
    }
  }, [token])

  const activateAudio = useCallback(async () => {
    const p = playerRef.current
    if (!p) throw new Error('Player not ready')
    try {
      if (typeof p.activateElement === 'function') {
        const r = p.activateElement()
        if (r instanceof Promise) await r
      }
      setAudioActivated(true)
    } catch (e) {
      setAudioActivated(false)
      throw e
    }
  }, [])

  const safeCall = useCallback(async (fn: () => Promise<any>) => {
    if (disconnected.current) return
    try { await fn() } catch (e) { /* swallow transient */ }
  }, [])

  const togglePlay = useCallback(async () => {
    const p = playerRef.current
    if (!p) return
    try { await p.togglePlay() } catch { setAudioActivated(false) }
  }, [])
  const next = useCallback(async () => { await safeCall(() => playerRef.current!.nextTrack()) }, [safeCall])
  const previous = useCallback(async () => { await safeCall(() => playerRef.current!.previousTrack()) }, [safeCall])
  const setVolume = useCallback(async (v: number) => {
    const p = playerRef.current
    if (!p) return
    await safeCall(() => p.setVolume(Math.max(0, Math.min(1, v))))
  }, [safeCall])
  const getVolume = useCallback(async () => {
    const p = playerRef.current
    if (!p) return 0.6
    try { return await p.getVolume() } catch { return 0.6 }
  }, [])

  const transferPlayback = useCallback(async (opts?: { play?: boolean }) => {
    if (!tokenRef.current || !deviceId) return
    await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${tokenRef.current}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ device_ids: [deviceId], play: !!opts?.play })
    }).then(r => {
      if (!r.ok && r.status !== 204) throw new Error(`Transfer ${r.status}`)
    }).catch(() => {})
  }, [deviceId])

  return useMemo(() => ({
    ready,
    audioActivated,
    deviceId,
    state,
    error,
    activateAudio,
    togglePlay,
    next,
    previous,
    setVolume,
    getVolume,
    transferPlayback
  }), [ready, audioActivated, deviceId, state, error, activateAudio, togglePlay, next, previous, setVolume, getVolume, transferPlayback])
}