import { create } from 'zustand'
import { presets } from './themes'

export type Panel = 'now' | 'geo' | 'themes' | 'settings'
export type ThemePreset = typeof presets[number]

/** Screensaver overlay modes */
export type ScreensaverMode = 'logo' | 'clock' | 'battery' | 'route'

interface State {
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

  // Screensaver / inactivity
  screensaverActive: boolean
  setScreensaverActive: (v: boolean) => void
  screensaverTimeoutMs: number
  setScreensaverTimeoutMs: (ms: number) => void
  lastInteractionAt: number
  markInteraction: () => void

  // Screensaver modes
  screensaverMode: ScreensaverMode
  setScreensaverMode: (m: ScreensaverMode) => void
  screensaverAutoCycleMs: number
  setScreensaverAutoCycleMs: (ms: number) => void

  // Theme blending while screensaver active
  screensaverBlendEnabled: boolean
  setScreensaverBlendEnabled: (v: boolean) => void
  screensaverBlendIntervalMs: number
  setScreensaverBlendIntervalMs: (ms: number) => void
  _originalThemeId: string | null        // internal
  _blendedThemeOverride: ThemePreset | null
  setBlendedThemeOverride: (t: ThemePreset | null) => void

  // Route tracking (geo path)
  routePositions: { x: number; y: number }[]
  pushRoutePoint: (x: number, y: number) => void
  clearRoute: () => void
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

  screensaverActive: false,
  setScreensaverActive: (v) => {
    const st = get()
    if (v) {
      // save original theme id if first activation
      if (!st._originalThemeId) set({ _originalThemeId: st.theme.id })
    } else {
      // restore original theme if we were blending
      if (st._originalThemeId) {
        const orig = presets.find(p => p.id === st._originalThemeId)
        if (orig) set({ theme: orig })
      }
      set({ _blendedThemeOverride: null, _originalThemeId: null })
    }
    // reset interaction timestamp when leaving
    if (!v) set({ lastInteractionAt: Date.now() })
    set({ screensaverActive: v })
  },

  screensaverTimeoutMs: 60000,
  setScreensaverTimeoutMs: (ms) => set({ screensaverTimeoutMs: Math.max(5000, ms) }),
  lastInteractionAt: Date.now(),
  markInteraction: () => {
    if (!get().screensaverActive) set({ lastInteractionAt: Date.now() })
  },

  screensaverMode: 'logo',
  setScreensaverMode: (m) => set({ screensaverMode: m }),
  screensaverAutoCycleMs: 15000,
  setScreensaverAutoCycleMs: (ms) => set({ screensaverAutoCycleMs: Math.max(4000, ms) }),

  screensaverBlendEnabled: true,
  setScreensaverBlendEnabled: (v) => set({ screensaverBlendEnabled: v }),
  screensaverBlendIntervalMs: 12000,
  setScreensaverBlendIntervalMs: (ms) => set({ screensaverBlendIntervalMs: Math.max(4000, ms) }),
  _originalThemeId: null,
  _blendedThemeOverride: null,
  setBlendedThemeOverride: (t) => set({ _blendedThemeOverride: t }),

  routePositions: [],
  pushRoutePoint: (x, y) => {
    const arr = get().routePositions
    arr.push({ x, y })
    if (arr.length > 400) arr.splice(0, arr.length - 400)
    set({ routePositions: [...arr] })
  },
  clearRoute: () => set({ routePositions: [] })
}))