import type { ThemePreset } from './store'

// NOTE: environmentPreset intentionally omitted to avoid HDR fetches (performance & offline).
// If you want HDR again, add environmentPreset and ensure code path re-enabled.

export const presets: ThemePreset[] = [
  {
    id: 'neon-street',
    name: 'Neon Street',
    description: 'Cyan + magenta synth glow with trails.',
    ui: { primary: '#00E5FF', accent: '#FF00AA', glow: '#00E5FF', bg: '#06090E' },
    visuals: {
      particles: 3500,
      bloom: 1.15,
      trails: true,
      lensflare: true,
      background: 'stars',
      primaryShader: 'chrome',
      hologramScanColor: '#00E5FF'
    },
    dsp: { ambienceGain: 0.08, lowpassHz: 15000 },
    tags: ['retro', 'city']
  },
  {
    id: 'opel-chrome',
    name: 'Opel Chrome',
    description: 'Yellow + chrome minimal grid.',
    ui: { primary: '#FFDD00', accent: '#C0C0C0', glow: '#C0C0C0', bg: '#0A0F14' },
    visuals: {
      particles: 1800,
      bloom: 0.85,
      trails: false,
      lensflare: true,
      background: 'grid',
      primaryShader: 'chrome',
      gridColor: '#FFDD00',
      gridOpacity: 0.12
    } as any,
    dsp: { ambienceGain: 0.06, lowpassHz: 12000 },
    tags: ['brand', 'chrome']
  },
  {
    id: 'night-drive',
    name: 'Night Drive',
    description: 'Purple horizon wire warp tunnel.',
    ui: { primary: '#7C3AED', accent: '#22D3EE', glow: '#22D3EE', bg: '#05070A' },
    visuals: {
      particles: 4200,
      bloom: 1.35,
      trails: true,
      lensflare: false,
      background: 'warp',
      primaryShader: 'wire',
      warpColor: '#22D3EE'
    },
    dsp: { ambienceGain: 0.09, lowpassHz: 10000 },
    tags: ['wireframe', 'speed']
  },
  {
    id: 'quantum-flare',
    name: 'Quantum Flare',
    description: 'Cerulean + gold energy pulses.',
    ui: { primary: '#54C2FF', accent: '#FFCF3F', glow: '#54C2FF', bg: '#030B14' },
    visuals: {
      particles: 6000,
      bloom: 1.55,
      trails: true,
      lensflare: true,
      background: 'stars',
      primaryShader: 'hologram',
      hologramScanColor: '#FFCF3F'
    },
    dsp: { ambienceGain: 0.11, lowpassHz: 14500 },
    tags: ['energy', 'pulse']
  },
  {
    id: 'bio-lumina',
    name: 'Bio Lumina',
    description: 'Abyssal teal + lime bio pulses.',
    ui: { primary: '#5CFFC4', accent: '#B3FF3F', glow: '#5CFFC4', bg: '#031619' },
    visuals: {
      particles: 5000,
      bloom: 1.2,
      trails: true,
      lensflare: false,
      background: 'warp',
      primaryShader: 'wire',
      warpColor: '#5CFFC4'
    },
    dsp: { ambienceGain: 0.09, lowpassHz: 9000 },
    tags: ['organic', 'abyss']
  },
  {
    id: 'aurora-drive',
    name: 'Aurora Drive',
    description: 'Spectral teal–violet hologram mist.',
    ui: { primary: '#7DFCCB', accent: '#8B5CF6', glow: '#7DFCCB', bg: '#020407' },
    visuals: {
      particles: 6500,
      bloom: 1.3,
      trails: true,
      lensflare: true,
      background: 'nebula',
      primaryShader: 'hologram',
      nebulaColors: ['#7DFCCB', '#8B5CF6', '#3B82F6', '#EC4899'],
      hologramScanColor: '#7DFCCB'
    },
    dsp: { ambienceGain: 0.1, lowpassHz: 13000 },
    tags: ['aurora', 'hologram']
  },
  {
    id: 'mono-wire',
    name: 'Mono Wire',
    description: 'Grayscale minimal wireframe.',
    ui: { primary: '#FFFFFF', accent: '#AAAAAA', glow: '#FFFFFF', bg: '#050505' },
    visuals: {
      particles: 1200,
      bloom: 0.55,
      trails: false,
      lensflare: false,
      background: 'grid',
      primaryShader: 'wire',
      gridColor: '#FFFFFF',
      gridOpacity: 0.10
    } as any,
    dsp: { ambienceGain: 0.05, lowpassHz: 8000 },
    tags: ['minimal', 'wire']
  }
]