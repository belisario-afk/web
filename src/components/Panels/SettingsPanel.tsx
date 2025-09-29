import React, { useEffect, useState } from 'react'
import { Toggle } from '../UI/Toggle'
import { FullscreenButton } from '../UI/FullscreenButton'
import { useStore } from '../../state/store'
import { useBattery } from '../../hooks/useBattery'
import { useWakeLock } from '../../hooks/useWakeLock'
import { useSpeech } from '../../hooks/useSpeech'
import { usePWAInstall } from '../../hooks/usePWAInstall'

export default function SettingsPanel() {
  const fullscreenAuto = useStore(s => s.fullscreenAuto)
  const setFullscreenAuto = useStore(s => s.setFullscreenAuto)
  const carDock = useStore(s => s.carDock)
  const setCarDock = useStore(s => s.setCarDock)
  const theme = useStore(s => s.theme)
  const brightnessSuggestion = useStore(s => s.brightnessSuggestion)
  const dspEnabled = useStore(s => s.dspEnabled)
  const setDspEnabled = useStore(s => s.setDspEnabled)
  const { level } = useBattery()
  const { active: wakeActive, fallbackActive } = useWakeLock()
  const { speak, enabled: speechEnabled } = useSpeech()
  const [announced, setAnnounced] = useState(false)
  const { supported: pwaSupported, installed: pwaInstalled, choice, promptInstall } = usePWAInstall()

  useEffect(() => {
    if (carDock && speechEnabled && !announced) {
      speak('Car-dock mode enabled')
      setAnnounced(true)
    }
    if (!carDock) setAnnounced(false)
  }, [carDock, speak, speechEnabled, announced])

  return (
    <div className="text-white grid sm-tablet:grid-cols-2 gap-8">
      <div>
        <h3 className="text-2xl font-bold" style={{ color: theme.ui.primary }}>Display & System</h3>
        <div className="mt-4 flex items-center gap-4">
          <FullscreenButton />
          <div className="flex items-center gap-3">
            <Toggle checked={fullscreenAuto} onCheckedChange={setFullscreenAuto} label="Auto fullscreen" />
            <span className="text-white/80">Auto fullscreen</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Toggle checked={carDock} onCheckedChange={setCarDock} label="Car-dock mode" />
          <span className="text-white/80">Car-dock mode (immersive UI)</span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Toggle checked={dspEnabled} onCheckedChange={setDspEnabled} label="Ambient engine" />
          <span className="text-white/80">Ambient engine (subtle background texture)</span>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button
            className="px-4 py-3 rounded-xl border border-white/20 bg-white/10 hover:bg-white/20"
            onClick={promptInstall}
            disabled={!pwaSupported || pwaInstalled}
            title={pwaInstalled ? 'Already installed' : pwaSupported ? 'Install Opel Z' : 'Install not available yet'}
          >
            {pwaInstalled ? 'Installed' : pwaSupported ? 'Install app' : 'Install not available'}
          </button>
          {choice && <span className="text-white/60 text-sm">User choice: {choice}</span>}
        </div>

        <div className="mt-4 text-white/70">
          Wake lock: {wakeActive ? 'Active' : 'Attempting'} {fallbackActive ? '· Audio fallback active' : ''}
          · Battery: {level != null ? Math.round(level * 100) + '%' : 'n/a'}
        </div>
        <div className="mt-2 text-white/60">
          Brightness suggestion: <strong>{brightnessSuggestion}</strong>
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold" style={{ color: theme.ui.primary }}>About</h3>
        <div className="mt-4 text-white/70">
          Opel Z · Optimized for Samsung Galaxy Tab SMT77U. Swipe left/right to switch panels, swipe up to cycle themes.
        </div>
        <div className="mt-2 text-white/60">
          Speech: {speechEnabled ? 'Enabled' : 'Unavailable'}
        </div>
      </div>
    </div>
  )
}