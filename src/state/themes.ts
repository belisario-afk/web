import type { ThemePreset } from './store'

export const presets: ThemePreset[] = [
  {
    id: 'neon-street',
    name: 'Neon Street',
    ui: { primary: '#00E5FF', accent: '#FF00AA', glow: '#00E5FF', bg: '#0A0F14' },
    visuals: { particles: 4000, bloom: 1.2, trails: true, lensflare: true },
    dsp: { ambienceGain: 0.08, lowpassHz: 15000 }
  },
  {
    id: 'opel-chrome',
    name: 'Opel Chrome',
    ui: { primary: '#FFDD00', accent: '#C0C0C0', glow: '#C0C0C0', bg: '#0A0F14' },
    visuals: { particles: 2500, bloom: 0.9, trails: false, lensflare: true },
    dsp: { ambienceGain: 0.06, lowpassHz: 12000 }
  },
  {
    id: 'night-drive',
    name: 'Night Drive',
    ui: { primary: '#7C3AED', accent: '#22D3EE', glow: '#22D3EE', bg: '#05070A' },
    visuals: { particles: 6000, bloom: 1.5, trails: true, lensflare: false },
    dsp: { ambienceGain: 0.09, lowpassHz: 10000 }
  }
]