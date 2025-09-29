import React from 'react'
import { useSpotify } from '../../providers/SpotifyProvider'

export function AudioUnlockOverlay() {
  const { token, playerReady, audioActivated, activateAudio } = useSpotify()

  if (!token || !playerReady || audioActivated) return null

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="rounded-2xl border border-white/15 bg-white/10 p-6 text-center max-w-sm">
        <div className="text-white text-lg font-semibold mb-2">Enable Audio</div>
        <p className="text-white/70 mb-5">Tap once to allow playback. This is required by your browser.</p>
        <button
          className="px-4 py-3 rounded-xl border border-white/20 bg-white/20 hover:bg-white/30 text-white"
          onClick={async () => {
            try {
              await activateAudio()
            } catch {
              // ignored
            }
          }}
        >
          Tap to enable
        </button>
      </div>
    </div>
  )
}