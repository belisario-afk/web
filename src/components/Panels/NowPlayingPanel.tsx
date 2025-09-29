import React from 'react'
import { Button } from '../UI/Button'
import { useStore } from '../../state/store'
import { useSpotify } from '../../providers/SpotifyProvider'
import { Slider } from '../UI/Slider'
import { useVolume } from '../../hooks/useVolume'
import { SearchTracks } from '../NowPlaying/SearchTracks'

export default function NowPlayingPanel() {
  const theme = useStore(s => s.theme)
  const {
    authReady, authError, authorize, token,
    state, playerError, togglePlay, next, previous,
    playerReady, audioActivated, activateAudio, transferPlayback
  } = useSpotify()
  const { volume, setVolume } = useVolume()

  if (!authReady) return <div className="text-white">Initializing authentication...</div>

  if (!token) {
    return (
      <div className="text-white flex items-center justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-2xl font-bold" style={{ color: theme.ui.primary }}>Connect Spotify</h2>
          <p className="text-white/70 mt-2">Sign in to Spotify to control playback with the Web Playback SDK.</p>
          {authError && <p className="text-red-400 mt-2">Auth error: {authError}</p>}
        </div>
        <Button variant="accent" onClick={authorize}>Sign in</Button>
      </div>
    )
  }

  const track = state?.track_window.current_track

  return (
    <div className="text-white flex flex-col gap-6">
      <SearchTracks />

      <div className="grid grid-cols-[auto_1fr_auto] gap-6 items-start">
        <img
          src={track?.album.images[0]?.url}
          alt={track?.name || 'Album art'}
          className="w-40 h-40 object-cover rounded-2xl border border-white/10"
        />
        <div className="min-w-0">
          <h3 className="text-2xl font-bold truncate" style={{ color: theme.ui.primary }}>
            {track?.name ?? 'No track'}
          </h3>
          <p className="text-white/70 truncate">{track?.artists.map(a => a.name).join(', ')}</p>

            <div className="mt-4 flex items-center gap-4 flex-wrap">
            <Button variant="ghost" onClick={previous} disabled={!playerReady}>Prev</Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (!audioActivated) {
                  await activateAudio()
                  await transferPlayback({ play: false })
                }
                await togglePlay()
              }}
              disabled={!playerReady}
            >
              {state?.paused ? 'Play' : 'Pause'}
            </Button>
            <Button variant="ghost" onClick={next} disabled={!playerReady}>Next</Button>
          </div>

          <div className="mt-5 max-w-md">
            <Slider
              label="Volume"
              min={0}
              max={100}
              step={1}
              value={Math.round(volume * 100)}
              onChange={(v) => setVolume(v / 100)}
            />
            <div className="text-white/50 text-xs mt-1">Two-finger swipe up/down anywhere to change volume.</div>
          </div>

          {playerError && <p className="text-red-400 mt-2">Player error: {playerError}</p>}
        </div>
        <div className="text-right">
          <p className="text-white/70">Device: Opel Z Dashboard</p>
        </div>
      </div>
    </div>
  )
}