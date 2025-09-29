import { create } from 'zustand'

export type Panel = 'now' | 'geo' | 'themes' | 'settings'

export type ThemePreset = {
  id: string
  name: string
  ui: {
    primary: string
    accent: string
    glow: string
    bg: string
  }
  visuals: {
    particles: number
    bloom: number
    trails: boolean
    lensflare: boolean
  }
  dsp: {
    ambienceGain: number
    lowpassHz: number
  }
}

type State = {
  panel: Panel
  setPanel: (p: Panel) => void
  theme: ThemePreset
  setTheme: (t: ThemePreset) => void
  speed: number
  setSpeed: (v: number) => void
  fullscreenAuto: boolean
  setFullscreenAuto: (v: boolean) => void
  carDock: boolean
  setCarDock: (v: boolean) => void
  brightnessSuggestion: 'normal' | 'dim' | 'dark'
  setBrightnessSuggestion: (v: State['brightnessSuggestion']) => void

  dspEnabled: boolean
  setDspEnabled: (v: boolean) => void

  // Volume state (0..1) and last change timestamp for HUD
  volume: number
  setVolume: (v: number) => void
  lastVolumeChangeAt: number
  markVolumeChanged: () => void
}

import { presets } from './themes'

export const useStore = create<State>((set) => ({
  panel: 'now',
  setPanel: (p) => set({ panel: p }),
  theme: presets[0],
  setTheme: (t) => set({ theme: t }),
  speed: 0,
  setSpeed: (v) => set({ speed: v }),
  fullscreenAuto: true,
  setFullscreenAuto: (v) => set({ fullscreenAuto: v }),
  carDock: false,
  setCarDock: (v) => set({ carDock: v }),
  brightnessSuggestion: 'normal',
  setBrightnessSuggestion: (v) => set({ brightnessSuggestion: v }),

  dspEnabled: false,
  setDspEnabled: (v) => set({ dspEnabled: v }),

  volume: 0.6,
  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)) }),
  lastVolumeChangeAt: 0,
  markVolumeChanged: () => set({ lastVolumeChangeAt: Date.now() })
}))