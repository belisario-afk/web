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
  // tokenObj is full object returned from hook; we only pass the access_token string into player hook
  const { token: tokenObj, ready: authReady, error: authError, authorize, logout } = useSpotifyAuth()
  const accessToken = tokenObj?.access_token ?? null

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
  } = useSpotifyPlayer({ token: accessToken })

  const transferredOnce = useRef(false)
  useEffect(() => {
    if (!transferredOnce.current && playerReady && deviceId && accessToken) {
      transferredOnce.current = true
      transferPlayback({ play: false }).catch(() => {})
    }
  }, [playerReady, deviceId, accessToken, transferPlayback])

  async function playTrack(uri: string) {
    if (!accessToken || !deviceId) return
    const endpoint = `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`
    const body = JSON.stringify({ uris: [uri] })
    const res = await fetch(endpoint, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body
    })
    if (!res.ok && res.status !== 204) {
      // Try transfer then retry once
      await transferPlayback({ play: false }).catch(() => {})
      const retry = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body
      })
      if (!retry.ok && retry.status !== 204) {
        throw new Error(`Play failed (${retry.status})`)
      }
    }
  }

  async function queueTrack(uri: string) {
    if (!accessToken || !deviceId) return
    const endpoint = `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}&device_id=${encodeURIComponent(deviceId)}`
    const res = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } })
    if (!res.ok) {
      await transferPlayback({ play: false }).catch(() => {})
      await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } })
    }
  }

  const value: Ctx = useMemo(() => ({
    authReady,
    authError,
    authorize,
    logout,
    token: accessToken,

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
    authReady, authError, authorize, logout, accessToken,
    playerReady, playerError, state, deviceId,
    audioActivated, activateAudio,
    togglePlay, next, previous, setVolume, getVolume, transferPlayback
  ])

  return <SpotifyCtx.Provider value={value}>{children}</SpotifyCtx.Provider>
}

export function useSpotify() {
  const ctx = useContext(SpotifyCtx)
  if (!ctx) throw new Error('useSpotify must be used within SpotifyProvider')
  return ctx
}