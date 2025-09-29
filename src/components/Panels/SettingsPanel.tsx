import React, { useState } from 'react'
import { useStore } from '../../state/store'
import { Toggle } from '../UI/Toggle'
import { FullscreenButton } from '../UI/FullscreenButton'

export default function SettingsPanel() {
  const fullscreenAuto = useStore(s => s.fullscreenAuto)
  const setFullscreenAuto = useStore(s => s.setFullscreenAuto)
  const carDock = useStore(s => s.carDock)
  const setCarDock = useStore(s => s.setCarDock)
  const dspEnabled = useStore(s => s.dspEnabled)
  const setDspEnabled = useStore(s => s.setDspEnabled)
  const theme = useStore(s => s.theme)

  const screensaverActive = useStore(s => s.screensaverActive)
  const setScreensaverActive = useStore(s => s.setScreensaverActive)
  const timeoutMs = useStore(s => s.screensaverTimeoutMs)
  const setScreensaverTimeoutMs = useStore(s => s.setScreensaverTimeoutMs)

  const [timeoutInput, setTimeoutInput] = useState(Math.round(timeoutMs / 1000))

  return (
    <div className="text-white grid sm-tablet:grid-cols-2 gap-8">
      <div>
        <h3 className="text-2xl font-bold" style={{ color: theme.ui.primary }}>System & Display</h3>
        <div className="mt-4 flex items-center gap-4">
          <FullscreenButton />
          <div className="flex items-center gap-3">
            <Toggle checked={fullscreenAuto} onCheckedChange={setFullscreenAuto} label="Auto fullscreen" />
            <span className="text-white/80 text-sm">Auto fullscreen</span>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Toggle checked={carDock} onCheckedChange={setCarDock} label="Car dock" />
          <span className="text-white/80 text-sm">Car-dock mode</span>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Toggle checked={dspEnabled} onCheckedChange={setDspEnabled} label="Ambience" />
          <span className="text-white/80 text-sm">Ambient engine</span>
        </div>

        <div className="mt-8">
          <h4 className="font-semibold mb-2 text-white/90">Screensaver</h4>
          <div className="flex items-center gap-3 mb-3">
            <input
              type="number"
              min={5}
              className="w-24 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
              value={timeoutInput}
              onChange={(e) => {
                const v = parseInt(e.target.value || '0', 10)
                setTimeoutInput(v)
                if (v >= 5) setScreensaverTimeoutMs(v * 1000)
              }}
            />
            <span className="text-white/60 text-sm">Timeout (seconds)</span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setScreensaverActive(true)}
              className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/25 text-sm"
              disabled={screensaverActive}
            >
              Start Screensaver
            </button>
            <button
              onClick={() => setScreensaverActive(false)}
              className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/25 text-sm"
              disabled={!screensaverActive}
            >
              Exit Screensaver
            </button>
          </div>
          <p className="text-white/40 text-xs mt-2">
            Any touch / key / mouse movement exits automatically. Press ‘S’ to toggle, ‘Esc’ to exit.
          </p>
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-bold" style={{ color: theme.ui.primary }}>About</h3>
        <div className="mt-4 text-white/70 text-sm">
          Screensaver adds rotating Opel Bat emblem with procedural bat swarm.
        </div>
      </div>
    </div>
  )
}