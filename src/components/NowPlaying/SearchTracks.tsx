import React, { useCallback, useState } from 'react'
import { useSpotify } from '../../providers/SpotifyProvider'
import { useSpotifySearch } from '../../hooks/useSpotifySearch'
import { useStore } from '../../state/store'
import { Button } from '../UI/Button'

export const SearchTracks: React.FC = () => {
  const theme = useStore(s => s.theme)
  const { results, loading, error, query, setQuery, clear } = useSpotifySearch()
  const { playTrack, audioActivated, activateAudio, transferPlayback, playerReady } = useSpotify() as any
  const [playingUri, setPlayingUri] = useState<string | null>(null)

  const onPlay = useCallback(async (uri: string) => {
    if (!playerReady) return
    setPlayingUri(uri)
    try {
      if (!audioActivated) {
        await activateAudio()
        await transferPlayback({ play: false })
      }
      await playTrack(uri)
      // Success – clear list to reduce clutter
      clear()
    } catch (e) {
      // leave results so user can retry
    } finally {
      setPlayingUri(null)
    }
  }, [playerReady, audioActivated, activateAudio, transferPlayback, playTrack, clear])

  return (
    <div className="mb-6">
      <div className="flex items-end gap-4 flex-wrap">
        <div className="flex-1 min-w-[260px]">
          <label className="block text-sm font-medium text-white/70 mb-1">
            Search Tracks
          </label>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type at least 2 characters..."
              className="w-full px-5 py-4 rounded-xl bg-white/10 border border-white/15 text-white placeholder-white/40 text-lg focus:outline-none focus:ring-2 focus:ring-opel-neon/60"
              type="text"
              inputMode="search"
              autoCorrect="off"
              spellCheck={false}
            />
        </div>
        {query && (
          <Button
            variant="ghost"
            onClick={clear}
            className="h-[56px]"
          >
            Clear
          </Button>
        )}
      </div>
      {(loading || error || results.length > 0) && (
        <div className="mt-4 rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl max-h-[360px] overflow-auto p-2">
          {loading && (
            <div className="p-4 text-white/60 text-sm">Searching...</div>
          )}
          {error && !loading && (
            <div className="p-4 text-red-400 text-sm">Error: {error}</div>
          )}
          {!loading && !error && results.length === 0 && query.length >= 2 && (
            <div className="p-4 text-white/50 text-sm">No results.</div>
          )}
          <ul className="space-y-1">
            {results.map(track => (
              <li key={track.uri}>
                <button
                  onClick={() => onPlay(track.uri)}
                  className="w-full flex items-center gap-4 text-left px-3 py-3 rounded-xl hover:bg-white/10 focus:bg-white/10 focus:outline-none border border-transparent focus:border-white/20"
                  disabled={playingUri === track.uri}
                >
                  <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-white/5 border border-white/10">
                    {track.albumArt && (
                      <img
                        src={track.albumArt}
                        alt=""
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">{track.name}</div>
                    <div className="text-white/60 text-sm truncate">{track.artists}</div>
                  </div>
                  <div
                    className="text-xs px-3 py-1 rounded-full bg-white/10 text-white/70"
                    style={{ border: `1px solid ${theme.ui.accent}33` }}
                  >
                    {playingUri === track.uri ? 'Playing...' : 'Play'}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="text-white/40 text-xs mt-2">
        Tap a result to start playback immediately. Uses Spotify’s /search and /me/player/play endpoints.
      </p>
    </div>
  )
}