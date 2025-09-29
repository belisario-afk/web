import React from 'react'

export const SettingsScreensaverFormationControls: React.FC = () => {
  return (
    <div className="mt-6 p-4 rounded-xl bg-white/5 border border-white/10 text-white/70 text-xs space-y-2">
      <div className="font-semibold text-white/80 text-sm">Screensaver Formations</div>
      <p>While the screensaver is active press <kbd>F</kbd> to cycle:
        <span className="text-white/90 font-medium ml-1">Free → Belisario → Bat Symbol → Free</span>.
      </p>
      <p>Album art drives tint; energy from playback velocity.</p>
    </div>
  )
}