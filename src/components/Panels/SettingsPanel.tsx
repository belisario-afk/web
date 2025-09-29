import React, { useState } from 'react'
import { useStore } from '../../state/store'
import { Toggle } from '../UI/Toggle'
import { FullscreenButton } from '../UI/FullscreenButton'
import { useMicEnergy } from '../../hooks/useMicEnergy'

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

  const cycleMs = useStore(s => s.screensaverAutoCycleMs)
  const setCycleMs = useStore(s => s.setScreensaverAutoCycleMs)

  const blendEnabled = useStore(s => s.screensaverBlendEnabled)
  const setBlendEnabled = useStore(s => s.setScreensaverBlendEnabled)
  const blendInterval = useStore(s => s.screensaverBlendIntervalMs)
  const setBlendInterval = useStore(s => s.setScreensaverBlendIntervalMs)

  const micReactive = useStore(s => s.micReactive)
  const setMicReactive = useStore(s => s.setMicReactive)
  const batShadows = useStore(s => s.batShadows)
  const setBatShadows = useStore(s => s.setBatShadows)
  const lodNear = useStore(s => s.lodNear)
  const setLodNear = useStore(s => s.setLodNear)
  const lodFar = useStore(s => s.lodFar)
  const setLodFar = useStore(s => s.setLodFar)

  const { requestPermission, micPermission } = useMicEnergy()

  const [timeoutInput, setTimeoutInput] = useState(Math.round(timeoutMs / 1000))
  const [cycleInput, setCycleInput] = useState(Math.round(cycleMs / 1000))
  const [blendInput, setBlendInput] = useState(Math.round(blendInterval / 1000))
  const [lodNearInput, setLodNearInput] = useState(lodNear)
  const [lodFarInput, setLodFarInput] = useState(lodFar)

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
            <label className="text-white/60 text-xs w-32">Timeout (s)</label>
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
          </div>
          <div className="flex items-center gap-3 mb-3">
            <label className="text-white/60 text-xs w-32">Mode cycle (s)</label>
            <input
              type="number"
              min={4}
              className="w-24 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
              value={cycleInput}
              onChange={(e) => {
                const v = parseInt(e.target.value || '0', 10)
                setCycleInput(v)
                if (v >= 4) setCycleMs(v * 1000)
              }}
            />
          </div>
          <div className="flex items-center gap-3 mb-3">
            <label className="text-white/60 text-xs w-32">Blend interval (s)</label>
            <input
              type="number"
              min={4}
              className="w-24 px-3 py-2 rounded-md bg-white/10 border border-white/20 text-white"
              value={blendInput}
              onChange={(e) => {
                const v = parseInt(e.target.value || '0', 10)
                setBlendInput(v)
                if (v >= 4) setBlendInterval(v * 1000)
              }}
              disabled={!blendEnabled}
            />
            <div className="flex items-center gap-2">
              <Toggle checked={blendEnabled} onCheckedChange={setBlendEnabled} label="Blend" />
              <span className="text-white/60 text-xs">Blend themes</span>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setScreensaverActive(true)}
              className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/25 text-sm"
              disabled={screensaverActive}
            >
              Start
            </button>
            <button
              onClick={() => setScreensaverActive(false)}
              className="px-4 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/25 text-sm"
              disabled={!screensaverActive}
            >
              Exit
            </button>
          </div>
          <p className="text-white/40 text-xs mt-2">
            Tap or key exits; ‘S’ toggles. Modes auto-cycle.
          </p>
        </div>
      </div>

      <div>
        <h3 className="text-2xl font-bold" style={{ color: theme.ui.primary }}>Bats & Audio Reactivity</h3>
        <div className="mt-4 flex items-center gap-3">
          <Toggle checked={micReactive} onCheckedChange={setMicReactive} label="Mic reactive" />
          <span className="text-white/70 text-sm">
            {micPermission === 'granted' ? 'Microphone active' :
             micPermission === 'denied' ? 'Permission denied' : 'Permission pending'}
          </span>
          <button
            onClick={requestPermission}
            disabled={!micReactive || micPermission === 'granted'}
            className="px-3 py-2 rounded-md bg-white/10 hover:bg-white/20 border border-white/25 text-xs"
          >
            {micPermission === 'granted' ? 'Granted' : 'Grant Mic Access'}
          </button>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <Toggle checked={batShadows} onCheckedChange={setBatShadows} label="Bat Shadows" />
          <span className="text-white/70 text-sm">Directional shadow (heavier)</span>
        </div>
        <div className="mt-6">
          <h4 className="text-white/80 text-sm font-semibold mb-2">LOD (Wing Deformation Fade)</h4>
          <div className="flex items-center gap-2 mb-2">
            <label className="text-white/50 w-20 text-xs">Near</label>
            <input
              type="number"
              className="w-24 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-xs"
              value={lodNearInput}
              onChange={(e) => {
                const v = parseFloat(e.target.value || '0')
                setLodNearInput(v)
                setLodNear(v)
              }}
            />
            <label className="text-white/50 w-20 text-xs">Far</label>
            <input
              type="number"
              className="w-24 px-2 py-1 rounded bg-white/10 border border-white/20 text-white text-xs"
              value={lodFarInput}
              onChange={(e) => {
                const v = parseFloat(e.target.value || '0')
                setLodFarInput(v)
                setLodFar(v)
              }}
            />
          </div>
          <p className="text-white/40 text-xs">
            Beyond Far distance, wings mostly still (saves GPU).
          </p>
        </div>
        <div className="mt-6 text-white/60 text-xs leading-relaxed">
          Energy source priority: Microphone (if enabled & granted) → Playback heuristic.
          Per-instance tint adds subtle color variance. Shadows may reduce FPS.
        </div>
      </div>
    </div>
  )
}