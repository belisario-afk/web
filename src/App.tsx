import React, { useEffect, useMemo } from 'react'
import Dashboard3D from './components/Dashboard3D'
import PanelContainer from './components/Panels/PanelContainer'
import { GestureLayer } from './components/UI/GestureLayer'
import { VolumeGestureLayer } from './components/UI/VolumeGestureLayer'
import { VolumeOverlay } from './components/UI/VolumeOverlay'
import { AudioUnlockOverlay } from './components/UI/AudioUnlockOverlay'
import { useStore } from './state/store'
import { presets } from './state/themes'
import { useDeviceInfo } from './hooks/useDeviceInfo'
import { SpotifyProvider } from './providers/SpotifyProvider'

export default function App() {
  const theme = useStore(s => s.theme)
  const panel = useStore(s => s.panel)
  const carDock = useStore(s => s.carDock)
  const { isSMT77U, landscape } = useDeviceInfo()

  useEffect(() => {
    document.body.style.background = theme.ui.bg
    const metaTheme = document.querySelector('meta[name="theme-color"]')
    if (metaTheme) metaTheme.setAttribute('content', theme.ui.bg)
  }, [theme])

  useEffect(() => {
    if (!landscape) {
      console.log('Tip: rotate to landscape for the best experience.')
    }
  }, [landscape])

  const panelTitle = useMemo(() => {
    switch (panel) {
      case 'now': return 'Now Playing'
      case 'geo': return 'Geolocation'
      case 'themes': return 'Themes'
      case 'settings': return 'Settings'
    }
  }, [panel])

  return (
    <SpotifyProvider>
      <div className="relative h-full w-full overflow-hidden">
        <Dashboard3D />
        <header className="absolute top-[calc(16px+var(--safe-top))] left-0 right-0 z-20">
          <div className="max-w-[1400px] mx-auto px-6 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-12 h-12 rounded-2xl border border-white/10 bg-white/10 flex items-center justify-center text-2xl font-black"
                style={{ color: theme.ui.primary }}
                aria-label="Opel Z logo"
              >
                Z
              </div>
              <div className="text-white">
                <div className="text-xl font-bold" style={{ color: theme.ui.primary }}>Opel Z</div>
                <div className="text-white/60 text-sm">
                  {panelTitle} · {isSMT77U ? 'Samsung Galaxy Tab SMT77U' : 'Tablet mode'}
                </div>
              </div>
            </div>
            <nav className="flex gap-3">
              {(['now', 'geo', 'themes', 'settings'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => useStore.getState().setPanel(p)}
                  className={`px-4 py-3 rounded-xl border text-white/80 hover:bg-white/10 ${
                    panel === p ? 'border-opel-neon bg-white/10' : 'border-white/20'
                  }`}
                >
                  {p === 'now' ? 'Now' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </nav>
          </div>
        </header>

        <main className={`relative h-full ${carDock ? 'cursor-none' : ''}`}>
          <GestureLayer />
          <VolumeGestureLayer />
          <PanelContainer />
          <AudioUnlockOverlay />
          <VolumeOverlay />
        </main>

        <footer className="absolute bottom-[calc(8px+var(--safe-bottom))] left-0 right-0 z-20 text-center text-white/40 text-sm">
          Opel Z · Themes: {presets.map(p => p.name).join(' · ')}
        </footer>
      </div>
    </SpotifyProvider>
  )
}