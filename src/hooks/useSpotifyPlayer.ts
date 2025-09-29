import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type Opts = { token: string | null }

function loadSpotifySDK(): Promise<void> {
  if ((window as any)._spotifySDKLoading) return (window as any)._spotifySDKLoading
  if (window.Spotify) return Promise.resolve()

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

  useEffect(() => {
    tokenRef.current = token
  }, [token])

  // Initialize SDK and Player
  useEffect(() => {
    let disposed = false

    async function init() {
      try {
        if (!tokenRef.current) return
        await loadSpotifySDK()

        await new Promise<void>((resolve) => {
          if (window.Spotify) return resolve()
          window.onSpotifyWebPlaybackSDKReady = () => resolve()
        })

        if (disposed) return

        if (playerRef.current) {
          try { playerRef.current.disconnect() } catch {}
          playerRef.current = null
        }

        const player = new window.Spotify!.Player({
          name: 'Opel Z Dashboard',
          getOAuthToken: (cb) => {
            if (tokenRef.current) cb(tokenRef.current)
          },
          volume: 0.6
        })

        player.addListener('ready', ({ device_id }) => {
          if (disposed) return
          setDeviceId(device_id)
          setReady(true)
        })

        player.addListener('not_ready', () => {
          if (disposed) return
          setReady(false)
        })

        player.addListener('player_state_changed', (s) => {
          if (disposed) return
          setState(s)
        })

        player.addListener('initialization_error', (e) => setError(e.message))
        player.addListener('authentication_error', (e) => setError(e.message))
        player.addListener('account_error', (e) => setError(e.message))

        playerRef.current = player
        await player.connect()
      } catch (e: any) {
        if (!disposed) setError(e?.message || 'Player init failed')
      }
    }

    init()
    return () => {
      disposed = true
      try { playerRef.current?.disconnect() } catch {}
      playerRef.current = null
      setReady(false)
      setAudioActivated(false)
      setDeviceId(null)
      setState(null)
    }
  }, [token])

  // Auto-unlock on first user gesture if token present and not yet activated
  useEffect(() => {
    if (!token) return
    let once = false
    const handler = async () => {
      if (once) return
      once = true
      try {
        await activateAudio()
      } catch {
        // ignore; overlay/button can retry
      }
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('keydown', handler)
      window.removeEventListener('touchstart', handler)
    }
    window.addEventListener('pointerdown', handler, { passive: true })
    window.addEventListener('keydown', handler, { passive: true })
    window.addEventListener('touchstart', handler, { passive: true })
    return () => {
      window.removeEventListener('pointerdown', handler)
      window.removeEventListener('keydown', handler)
      window.removeEventListener('touchstart', handler)
    }
  }, [token])

  const activateAudio = useCallback(async () => {
    const player = playerRef.current
    if (!player) throw new Error('Player not ready')
    try {
      if (typeof player.activateElement === 'function') {
        const res = player.activateElement()
        if (res instanceof Promise) await res
      } else {
        // Fallback: poke an AudioContext to satisfy gesture gate
        const AC = (window as any).AudioContext || (window as any).webkitAudioContext
        if (AC) {
          const ctx = new AC()
          if (ctx.state === 'suspended') {
            await ctx.resume().catch(() => {})
          }
          try { await ctx.close() } catch {}
        }
        await player.resume().catch(() => {}) // best-effort
      }
      setAudioActivated(true)
    } catch (e) {
      setAudioActivated(false)
      throw e
    }
  }, [])

  const togglePlay = useCallback(async () => {
    const player = playerRef.current
    if (!player) return
    try {
      await player.togglePlay()
    } catch (e: any) {
      // If blocked by autoplay policy, surface activation requirement
      setAudioActivated(false)
      throw e
    }
  }, [])

  const next = useCallback(async () => {
    await playerRef.current?.nextTrack()
  }, [])

  const previous = useCallback(async () => {
    await playerRef.current?.previousTrack()
  }, [])

  const setVolume = useCallback(async (v: number) => {
    const player = playerRef.current
    if (!player) return
    await player.setVolume(Math.max(0, Math.min(1, v)))
  }, [])

  const getVolume = useCallback(async () => {
    const player = playerRef.current
    if (!player) return 0.6
    return await player.getVolume()
  }, [])

  const transferPlayback = useCallback(async (opts?: { play?: boolean }) => {
    if (!tokenRef.current || !deviceId) return
    const res = await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${tokenRef.current}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ device_ids: [deviceId], play: !!opts?.play })
    })
    if (!res.ok && res.status !== 204) {
      throw new Error(`Transfer failed ${res.status}`)
    }
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