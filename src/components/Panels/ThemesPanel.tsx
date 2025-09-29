import React from 'react'
import { useStore } from '../../state/store'
import { presets } from '../../state/themes'

export default function ThemesPanel() {
  const theme = useStore(s => s.theme)
  const setTheme = useStore(s => s.setTheme)
  return (
    <div className="text-white">
      <h3 className="text-2xl font-bold" style={{ color: theme.ui.primary }}>Themes & Visual Presets</h3>
      <div className="mt-6 grid grid-cols-2 lg:grid-cols-3 gap-4">
        {presets.map(p => (
          <button
            key={p.id}
            onClick={() => setTheme(p)}
            className="p-4 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-left"
            style={{ boxShadow: p.id === theme.id ? `0 0 0 2px ${p.ui.accent}` : undefined }}
          >
            <div className="flex items-center justify-between">
              <div className="text-lg font-semibold">{p.name}</div>
              <div className="flex -space-x-1">
                <span className="w-4 h-4 rounded-full" style={{ background: p.ui.primary }} />
                <span className="w-4 h-4 rounded-full" style={{ background: p.ui.accent }} />
                <span className="w-4 h-4 rounded-full" style={{ background: p.ui.glow }} />
              </div>
            </div>
            <div className="text-white/60 text-sm mt-2">
              Particles: {p.visuals.particles} · Bloom: {p.visuals.bloom}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}