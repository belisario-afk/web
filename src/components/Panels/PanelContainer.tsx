import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useStore } from '../../state/store'
import NowPlayingPanel from './NowPlayingPanel'
import GeolocationPanel from './GeolocationPanel'
import ThemesPanel from './ThemesPanel'
import SettingsPanel from './SettingsPanel'

const variants = {
  initial: { opacity: 0, y: 40, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 14 } },
  exit: { opacity: 0, y: -40, scale: 0.98, transition: { duration: 0.2 } }
}

export default function PanelContainer() {
  const panel = useStore(s => s.panel)

  return (
    <div className="absolute bottom-0 left-0 right-0 p-6 pb-[calc(24px+var(--safe-bottom))] z-20 pointer-events-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={panel}
          variants={variants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="mx-auto max-w-[1400px] pointer-events-auto"
        >
          <div className="bg-black/40 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm-tablet:p-8">
            {panel === 'now' && <NowPlayingPanel />}
            {panel === 'geo' && <GeolocationPanel />}
            {panel === 'themes' && <ThemesPanel />}
            {panel === 'settings' && <SettingsPanel />}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}