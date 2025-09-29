import { create } from 'zustand'
import { presets } from './themes'

export type Panel = 'now' | 'geo' | 'themes' | 'settings'
export type ThemePreset = typeof presets[number]

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
  volume: number
  setVolume: (v: number) => void
  lastVolumeChangeAt: number
  markVolumeChanged: () => void

  // Screensaver
  screensaverActive: boolean
  setScreensaverActive: (v: boolean) => void
  screensaverTimeoutMs: number
  setScreensaverTimeoutMs: (ms: number) => void
  lastInteractionAt: number
  markInteraction: () => void
}

export const useStore = create<State>((set, get) => ({
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
  markVolumeChanged: () => set({ lastVolumeChangeAt: Date.now() }),

  // Screensaver defaults
  screensaverActive: false,
  setScreensaverActive: (v) => {
    // when leaving screensaver, mark interaction to restart timer
    if (!v) set({ lastInteractionAt: Date.now() })
    set({ screensaverActive: v })
  },
  screensaverTimeoutMs: 60000, // 60s
  setScreensaverTimeoutMs: (ms) => set({ screensaverTimeoutMs: Math.max(5000, ms) }),
  lastInteractionAt: Date.now(),
  markInteraction: () => {
    if (get().screensaverActive) {
      // ignore; exit handled externally
      return
    }
    set({ lastInteractionAt: Date.now() })
  }
}))