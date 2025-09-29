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
  const disposedRef = useRef(false)

  // Init
  useEffect(() => {
    let disposed = false
    ;(async () => {
      if (!tokenRef.current) return
      try {
        await loadSpotifySDK()
        if (disposed) return
        if (!window.Spotify) {
          setError('Spotify SDK unavailable')
          return
        }
        const player = new window.Spotify.Player({
          name: 'Opel Z Dashboard',
          getOAuthToken: (cb) => tokenRef.current && cb(tokenRef.current),
          volume: 0.6
        })
        player.addListener('ready', ({ device_id }) => {
          if (!disposed) {
            setDeviceId(device_id)
            setReady(true)
          }
        })
        player.addListener('not_ready', () => !disposed && setReady(false))
        player.addListener('player_state_changed', (st) => !disposed && setState(st))
        player.addListener('initialization_error', (e) => setError(e.message))
        player.addListener('authentication_error', (e) => setError(e.message))
        player.addListener('account_error', (e) => setError(e.message))
        playerRef.current = player
        await player.connect()
      } catch (e: any) {
        if (!disposed) setError(e.message || 'Player init failed')
      }
    })()
    return () => {
      disposed = true
      disposedRef.current = true
      try {
        playerRef.current?.disconnect()
      } catch {}
      playerRef.current = null
      setReady(false)
      setDeviceId(null)
      setState(null)
      setAudioActivated(false)
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
    } catch {
      setAudioActivated(false)
      throw new Error('Activate failed')
    }
  }, [])

  const guarded = useCallback(
    async (fn: () => Promise<any>) => {
      if (disposedRef.current) return
      try {
        await fn()
      } catch {
        /* ignore transient */
      }
    },
    []
  )

  const togglePlay = useCallback(async () => {
    const p = playerRef.current
    if (!p) return
    try {
      await p.togglePlay()
    } catch {
      setAudioActivated(false)
    }
  }, [])

  const next = useCallback(async () => {
    await guarded(() => playerRef.current!.nextTrack())
  }, [guarded])

  const previous = useCallback(async () => {
    await guarded(() => playerRef.current!.previousTrack())
  }, [guarded])

  const setVolume = useCallback(async (v: number) => {
    const p = playerRef.current
    if (!p) return
    await guarded(() => p.setVolume(Math.max(0, Math.min(1, v))))
  }, [guarded])

  const getVolume = useCallback(async () => {
    const p = playerRef.current
    if (!p) return 0.6
    try {
      return await p.getVolume()
    } catch {
      return 0.6
    }
  }, [])

  const transferPlayback = useCallback(async (opts?: { play?: boolean }) => {
    if (!tokenRef.current || !deviceId) return
    try {
      const r = await fetch('https://api.spotify.com/v1/me/player', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${tokenRef.current}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ device_ids: [deviceId], play: !!opts?.play })
      })
      if (!r.ok && r.status !== 204) throw new Error('transfer fail')
    } catch {
      /* swallow; retry logic upstream */
    }
  }, [deviceId])

  return useMemo(
    () => ({
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
    }),
    [
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
    ]
  )
}