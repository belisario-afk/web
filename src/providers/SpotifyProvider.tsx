import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
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

  // Serialized / debounced device transfer
  const transferred = useRef(false)
  const transferInFlight = useRef(false)
  const retryAttempt = useRef(0)
  const cancelRef = useRef(false)

  // Poll devices before transfer to avoid early 404 / 403 storms
  const fetchDevices = async () => {
    if (!accessToken) return []
    const r = await fetch('https://api.spotify.com/v1/me/player/devices', {
      headers: { Authorization: `Bearer ${accessToken}` }
    })
    if (!r.ok) return []
    const j = await r.json()
    return j.devices || []
  }

  useEffect(() => {
    if (!accessToken || !playerReady || transferred.current || transferInFlight.current) return
    let mounted = true
    transferInFlight.current = true
    cancelRef.current = false

    const attempt = async () => {
      if (cancelRef.current) return
      const devices = await fetchDevices()
      const hasDevice = devices.some((d: any) => d.id === deviceId)
      if (!hasDevice) {
        // Give the SDK time to register; backoff
        retryAttempt.current += 1
        if (retryAttempt.current > 6) {
          transferInFlight.current = false
          return
        }
        const delay = 400 * Math.pow(1.7, retryAttempt.current)
        setTimeout(attempt, delay)
        return
      }
      try {
        await transferPlayback({ play: false })
        transferred.current = true
      } catch {
        retryAttempt.current += 1
        if (retryAttempt.current <= 6) {
          const delay = 600 * Math.pow(1.5, retryAttempt.current)
          setTimeout(attempt, delay)
        }
      } finally {
        if (mounted) transferInFlight.current = false
      }
    }
    attempt()

    return () => {
      mounted = false
      cancelRef.current = true
    }
  }, [accessToken, playerReady, deviceId, transferPlayback])

  async function playTrack(uri: string) {
    if (!accessToken || !deviceId) return
    const endpoint = `https://api.spotify.com/v1/me/player/play?device_id=${encodeURIComponent(deviceId)}`
    const body = JSON.stringify({ uris: [uri] })
    const run = async () =>
      fetch(endpoint, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
        body
      })

    let r = await run()
    if (!r.ok && r.status !== 204) {
      await transferPlayback({ play: false }).catch(() => {})
      r = await run()
      if (!r.ok && r.status !== 204) throw new Error(`Play failed (${r.status})`)
    }
  }

  async function queueTrack(uri: string) {
    if (!accessToken || !deviceId) return
    const endpoint = `https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}&device_id=${encodeURIComponent(deviceId)}`
    let r = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } })
    if (!r.ok) {
      await transferPlayback({ play: false }).catch(() => {})
      r = await fetch(endpoint, { method: 'POST', headers: { Authorization: `Bearer ${accessToken}` } })
    }
  }

  const value: Ctx = useMemo(
    () => ({
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
    }),
    [
      authReady,
      authError,
      authorize,
      logout,
      accessToken,
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
      transferPlayback
    ]
  )

  return <SpotifyCtx.Provider value={value}>{children}</SpotifyCtx.Provider>
}

export function useSpotify() {
  const ctx = useContext(SpotifyCtx)
  if (!ctx) throw new Error('useSpotify must be used within SpotifyProvider')
  return ctx
}