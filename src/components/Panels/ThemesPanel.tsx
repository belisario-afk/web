import React from 'react'
import { useStore } from '../../state/store'
import { presets } from '../../state/themes'

const badgeClass =
  'px-2 py-1 rounded-full text-[10px] uppercase tracking-wide font-semibold bg-white/10 text-white/70'

export default function ThemesPanel() {
  const theme = useStore(s => s.theme)
  const setTheme = useStore(s => s.setTheme)

  return (
    <div className="text-white">
      <h3 className="text-2xl font-bold mb-2" style={{ color: theme.ui.primary }}>
        Themes & Visual Presets
      </h3>
      <p className="text-white/60 text-sm mb-6">
        Each preset changes shaders, background systems, particle counts, bloom, and UI palette.
      </p>
      <div className="grid sm-tablet:grid-cols-2 lg:grid-cols-3 gap-5">
        {presets.map(p => {
          const active = p.id === theme.id
          return (
            <button
              key={p.id}
              onClick={() => setTheme(p)}
              className={`relative flex flex-col gap-3 p-4 rounded-2xl text-left bg-white/5 border transition ${
                active
                  ? 'border-opel-neon shadow-[0_0_0_2px_rgba(0,229,255,0.4)]'
                  : 'border-white/10 hover:border-white/25 hover:bg-white/10'
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="font-semibold text-lg truncate">{p.name}</div>
                <div className="flex -space-x-1">
                  <span className="w-4 h-4 rounded-full ring-2 ring-black/30" style={{ background: p.ui.primary }} />
                  <span className="w-4 h-4 rounded-full ring-2 ring-black/30" style={{ background: p.ui.accent }} />
                  <span className="w-4 h-4 rounded-full ring-2 ring-black/30" style={{ background: p.ui.glow }} />
                </div>
              </div>
              <div className="text-xs text-white/60 line-clamp-2 min-h-[32px]">{p.description}</div>
              <div className="flex flex-wrap gap-1">
                <span className={badgeClass}>{p.visuals.background}</span>
                <span className={badgeClass}>{p.visuals.primaryShader}</span>
                {p.tags?.slice(0, 2).map(t => (
                  <span key={t} className={badgeClass}>
                    {t}
                  </span>
                ))}
                {p.visuals.trails && <span className={badgeClass}>trails</span>}
                {p.visuals.lensflare && <span className={badgeClass}>flare</span>}
              </div>
              <div className="flex justify-between items-center text-[11px] text-white/50 pt-1">
                <span>Particles {p.visuals.particles}</span>
                <span>Bloom {p.visuals.bloom}</span>
              </div>
              {active && (
                <div className="absolute top-2 right-2 text-[10px] font-bold px-2 py-1 rounded-md bg-opel-neon/20 text-opel-neon tracking-wide">
                  ACTIVE
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}