import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react'
import { useSpotifyAuth } from '../hooks/useSpotifyAuth'
import { useSpotifyPlayer } from '../hooks/useSpotifyPlayer'

type Ctx = {
  authReady: boolean
  authError: string | null
  authorize: () => Promise<void> | void
  logout: () => void
  token: string | null

  playerReady: boolean
  playerError: string | null
  state: Spotify.PlaybackState | null
  deviceId: string | null

  audioActivated: boolean
  activateAudio: () => Promise<void>

  // controls
  togglePlay: () => Promise<void>
  next: () => Promise<void>
  previous: () => Promise<void>
  setVolume: (v: number) => Promise<void>
  getVolume?: () => Promise<number>

  transferPlayback: (opts?: { play?: boolean }) => Promise<void>
  playTrack: (uri: string) => Promise<void>
  queueTrack: (uri: string) => Promise<void>
}

const SpotifyCtx = createContext<Ctx | null>(null)

export const SpotifyProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { token, ready: authReady, error: authError, authorize, logout } = useSpotifyAuth()
  const {
    state,
    deviceId,
    ready: playerReady,
    error: playerError,
    activateAudio,
    audioActivated,
    togglePlay,
    next,
    previous,
    transferPlayback,
    setVolume,
    getVolume
  } = useSpotifyPlayer({ token: token ?? null })

  const transferredOnce = useRef(false)

  useEffect(() => {
    if (!transferredOnce.current && playerReady && deviceId && token) {
      transferredOnce.current = true
      transferPlayback({ play: false }).catch(() => {})
    }
  }, [playerReady, deviceId, token, transferPlayback])

  async function playTrack(uri: string) {
    if (!token || !deviceId) return
    // Ensure device active
    try {
      const res = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ uris: [uri] })
      })
      if (!res.ok && res.status !== 204) {
        if (res.status === 404 || res.status === 403) {
          await transferPlayback({ play: false })
          const retry = await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`, {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ uris: [uri] })
          })
          if (!retry.ok && retry.status !== 204) {
            throw new Error(`Play failed (${retry.status})`)
          }
        } else {
          throw new Error(`Play failed (${res.status})`)
        }
      }
    } catch (e) {
      // bubble up silently for now (UI stays optimistic)
      throw e
    }
  }

  async function queueTrack(uri: string) {
    if (!token || !deviceId) return
    const res = await fetch(
      `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}&device_id=${encodeURIComponent(deviceId)}`,
      { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
    )
    if (!res.ok) {
      if (res.status === 404) {
        await transferPlayback({ play: false })
        await fetch(
          `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}&device_id=${encodeURIComponent(deviceId)}`,
          { method: 'POST', headers: { Authorization: `Bearer ${token}` } }
        )
      }
    }
  }

  const value = useMemo<Ctx>(() => ({
    authReady,
    authError,
    authorize,
    logout,
    token: token ?? null,

    playerReady,
    playerError,
    state,
    deviceId,

    audioActivated,
    activateAudio,

    togglePlay,
    next,
    previous,
    setVolume,
    getVolume,

    transferPlayback,
    playTrack,
    queueTrack
  }), [
    authReady, authError, authorize, logout, token,
    playerReady, playerError, state, deviceId,
    audioActivated, activateAudio,
    togglePlay, next, previous, setVolume, getVolume,
    transferPlayback
  ])

  return <SpotifyCtx.Provider value={value}>{children}</SpotifyCtx.Provider>
}

export function useSpotify() {
  const ctx = useContext(SpotifyCtx)
  if (!ctx) throw new Error('useSpotify must be used within SpotifyProvider')
  return ctx
}