import React, { useEffect, useRef } from 'react'
import { useGestures } from '../../hooks/useGestures'
import { useStore } from '../../state/store'

export const GestureLayer: React.FC = () => {
  const ref = useRef<HTMLDivElement>(null)
  const panel = useStore(s => s.panel)
  const setPanel = useStore(s => s.setPanel)
  const theme = useStore(s => s.theme)
  const setTheme = useStore(s => s.setTheme)
  const panels: ReturnType<typeof useStore.getState>['panel'][] = ['now', 'geo', 'themes', 'settings']

  useGestures(ref.current, {
    onSwipeLeft: () => {
      const idx = panels.indexOf(panel)
      setPanel(panels[(idx + 1) % panels.length])
    },
    onSwipeRight: () => {
      const idx = panels.indexOf(panel)
      setPanel(panels[(idx - 1 + panels.length) % panels.length])
    },
    onSwipeUp: () => {
      // Cycle theme
      const list = useStore.getState().theme
      const presets = (useStore as any).getState().themeList as typeof theme[]
      // but we don't store themeList; fallback to import
      import('../../state/themes').then(({ presets }) => {
        const idx = presets.findIndex(p => p.id === theme.id)
        setTheme(presets[(idx + 1) % presets.length])
      })
    }
  })

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.touchAction = 'none'
  }, [])

  return <div ref={ref} className="absolute inset-0 z-10" aria-hidden="true" />
}