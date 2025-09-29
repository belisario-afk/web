import React from 'react'
import { useFullscreen } from '../../hooks/useFullscreen'
import { Maximize2, Minimize2 } from 'lucide-react'

export const FullscreenButton: React.FC = () => {
  const { isFullscreen, request, exit } = useFullscreen()
  return (
    <button
      className="p-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white"
      onClick={() => (isFullscreen ? exit() : request())}
      aria-label="Toggle Fullscreen"
      title="Toggle Fullscreen"
    >
      {isFullscreen ? <Minimize2 /> : <Maximize2 />}
    </button>
  )
}