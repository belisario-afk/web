import React, { useEffect, useMemo, useState } from 'react'
import { useGeolocationSpeed } from '../../hooks/useGeolocationSpeed'
import { mpsToKph } from '../../utils/math'
import { Slider } from '../UI/Slider'
import { useStore } from '../../state/store'
import { AmbientDSP } from '../../audio/dsp'

let dsp: AmbientDSP | null = null

export default function GeolocationPanel() {
  const { supported, active, speed, rawSpeed, error } = useGeolocationSpeed()
  const [fallbackKph, setFallbackKph] = useState(0)
  const setSpeed = useStore(s => s.setSpeed)
  const theme = useStore(s => s.theme)
  const dspEnabled = useStore(s => s.dspEnabled)

  useEffect(() => {
    if (supported) {
      setSpeed(speed)
    } else {
      setSpeed(fallbackKph / 3.6)
    }
  }, [supported, speed, fallbackKph, setSpeed])

  useEffect(() => {
    if (!dsp) dsp = new AmbientDSP()
    dsp.start()
  }, [])

  // Enable/disable ambience by toggle
  useEffect(() => {
    if (!dsp) return
    dsp.setEnabled(dspEnabled)
  }, [dspEnabled])

  // Adapt DSP to speed and theme when enabled
  useEffect(() => {
    if (!dsp) return
    const v = supported ? speed : fallbackKph / 3.6
    const intensity = Math.min(1, v / 50)
    dsp.setAmbienceGain(theme.dsp.ambienceGain + intensity * 0.05)
    dsp.setLowpass(theme.dsp.lowpassHz - intensity * 4000)
  }, [speed, fallbackKph, supported, theme])

  const kph = useMemo(() => Math.round(mpsToKph(speed)), [speed])

  return (
    <div className="text-white grid sm-tablet:grid-cols-2 gap-8">
      <div>
        <h3 className="text-2xl font-bold" style={{ color: theme.ui.primary }}>Geolocation & Adaptation</h3>
        <p className="text-white/70 mt-2">
          {supported ? (active ? 'GPS active' : 'Waiting for GPS...') : 'GPS not available'}
          {error && <span className="text-red-400"> · {error}</span>}
        </p>
        <div className="mt-4 text-5xl font-extrabold">
          {supported ? `${kph} km/h` : `${Math.round(fallbackKph)} km/h`}
        </div>
        <div className="mt-2 text-white/60">
          Ambient engine: {dspEnabled ? 'On' : 'Off'} (toggle in Settings)
        </div>
      </div>
      <div>
        {!supported && (
          <Slider
            label="Speed (fallback)"
            min={0}
            max={180}
            step={1}
            value={fallbackKph}
            onChange={setFallbackKph}
          />
        )}
        <div className="mt-6 text-white/70">
          Visuals and ambience adapt with speed: trails, bloom, and ambience filter.
        </div>
      </div>
    </div>
  )
}