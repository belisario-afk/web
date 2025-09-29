import type { ThemePreset } from './store'

/**
 * Revised presets with safe colors (no 8-digit hex); opacity separated.
 */
export const presets: ThemePreset[] = [
  {
    id: 'neon-street',
    name: 'Neon Street',
    description: 'Classic cyan + magenta synth glow with light trails.',
    ui: { primary: '#00E5FF', accent: '#FF00AA', glow: '#00E5FF', bg: '#06090E' },
    visuals: {
      particles: 4000,
      bloom: 1.25,
      trails: true,
      lensflare: true,
      background: 'stars',
      primaryShader: 'chrome',
      environmentPreset: 'city',
      hologramScanColor: '#00E5FF'
    },
    dsp: { ambienceGain: 0.08, lowpassHz: 15000 },
    tags: ['retro', 'city']
  },
  {
    id: 'opel-chrome',
    name: 'Opel Chrome',
    description: 'Corporate chrome + yellow minimalism.',
    ui: { primary: '#FFDD00', accent: '#C0C0C0', glow: '#C0C0C0', bg: '#0A0F14' },
    visuals: {
      particles: 2500,
      bloom: 0.9,
      trails: false,
      lensflare: true,
      background: 'grid',
      primaryShader: 'chrome',
      gridColor: '#FFDD00',    // pure hex only
      gridOpacity: 0.13,
      environmentPreset: 'sunset'
    } as any,
    dsp: { ambienceGain: 0.06, lowpassHz: 12000 },
    tags: ['brand', 'chrome']
  },
  {
    id: 'night-drive',
    name: 'Night Drive',
    description: 'Purple horizon wireframe warp tunnel.',
    ui: { primary: '#7C3AED', accent: '#22D3EE', glow: '#22D3EE', bg: '#05070A' },
    visuals: {
      particles: 6000,
      bloom: 1.5,
      trails: true,
      lensflare: false,
      background: 'warp',
      primaryShader: 'wire',
      warpColor: '#22D3EE',
      environmentPreset: 'night'
    },
    dsp: { ambienceGain: 0.09, lowpassHz: 10000 },
    tags: ['wireframe', 'speed']
  },
  {
    id: 'aurora-drive',
    name: 'Aurora Drive',
    description: 'Spectral teal–violet hologram nebula curtains.',
    ui: { primary: '#7DFCCB', accent: '#8B5CF6', glow: '#7DFCCB', bg: '#020407' },
    visuals: {
      particles: 8000,
      bloom: 1.4,
      trails: true,
      lensflare: true,
      background: 'nebula',
      primaryShader: 'hologram',
      nebulaColors: ['#7DFCCB', '#8B5CF6', '#3B82F6', '#EC4899'],
      hologramScanColor: '#7DFCCB',
      environmentPreset: 'forest'
    },
    dsp: { ambienceGain: 0.1, lowpassHz: 13000 },
    tags: ['aurora', 'hologram']
  },
  {
    id: 'vapor-synth',
    name: 'Vapor Synth',
    description: 'Vaporwave grid + sunset fades + soft hologram lines.',
    ui: { primary: '#FF8AD8', accent: '#FFD685', glow: '#FF8AD8', bg: '#19081F' },
    visuals: {
      particles: 3500,
      bloom: 1.1,
      trails: false,
      lensflare: true,
      background: 'grid',
      primaryShader: 'hologram',
      gridColor: '#FF8AD8',
      gridOpacity: 0.12,
      hologramScanColor: '#FFD685',
      environmentPreset: 'dawn'
    } as any,
    dsp: { ambienceGain: 0.07, lowpassHz: 14000 },
    tags: ['vapor', 'retro']
  },
  {
    id: 'sunset-nebula',
    name: 'Sunset Nebula',
    description: 'Orange→pink particulate bloom, drifting cloud field.',
    ui: { primary: '#FF9D47', accent: '#FF5EA8', glow: '#FF5EA8', bg: '#12060A' },
    visuals: {
      particles: 9000,
      bloom: 1.6,
      trails: true,
      lensflare: true,
      background: 'nebula',
      primaryShader: 'chrome',
      nebulaColors: ['#FF9D47', '#FF5EA8', '#FFA34F', '#FF2F67'],
      environmentPreset: 'sunset'
    },
    dsp: { ambienceGain: 0.11, lowpassHz: 11500 },
    tags: ['sunset', 'nebula']
  },
  {
    id: 'bio-lumina',
    name: 'Bio Lumina',
    description: 'Abyssal teal + lime bio-luminescent warp pulses.',
    ui: { primary: '#5CFFC4', accent: '#B3FF3F', glow: '#5CFFC4', bg: '#031619' },
    visuals: {
      particles: 7000,
      bloom: 1.35,
      trails: true,
      lensflare: false,
      background: 'warp',
      primaryShader: 'wire',
      warpColor: '#5CFFC4',
      environmentPreset: 'night'
    },
    dsp: { ambienceGain: 0.09, lowpassHz: 9000 },
    tags: ['organic', 'abyss']
  },
  {
    id: 'mono-wire',
    name: 'Mono Wire',
    description: 'Hi‑contrast grayscale wireframe minimal pack.',
    ui: { primary: '#FFFFFF', accent: '#AAAAAA', glow: '#FFFFFF', bg: '#050505' },
    visuals: {
      particles: 1800,
      bloom: 0.7,
      trails: false,
      lensflare: false,
      background: 'grid',
      primaryShader: 'wire',
      gridColor: '#FFFFFF',
      gridOpacity: 0.10,
      environmentPreset: 'studio'
    } as any,
    dsp: { ambienceGain: 0.05, lowpassHz: 8000 },
    tags: ['minimal', 'wire']
  },
  {
    id: 'quantum-flare',
    name: 'Quantum Flare',
    description: 'High-energy cerulean + golden lens energy pulses.',
    ui: { primary: '#54C2FF', accent: '#FFCF3F', glow: '#54C2FF', bg: '#030B14' },
    visuals: {
      particles: 10000,
      bloom: 1.8,
      trails: true,
      lensflare: true,
      background: 'stars',
      primaryShader: 'hologram',
      hologramScanColor: '#FFCF3F',
      environmentPreset: 'night'
    },
    dsp: { ambienceGain: 0.12, lowpassHz: 15000 },
    tags: ['energy', 'pulse']
  }
]