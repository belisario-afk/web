import React from 'react'
import clsx from 'classnames'

type Props = {
  checked: boolean
  onCheckedChange: (v: boolean) => void
  label?: string
}

export const Toggle: React.FC<Props> = ({ checked, onCheckedChange, label }) => {
  return (
    <button
      role="switch"
      aria-checked={checked}
      className={clsx(
        'w-[72px] h-[40px] rounded-full border transition relative',
        checked ? 'bg-opel-neon border-opel-neon' : 'bg-white/10 border-white/20'
      )}
      onClick={() => onCheckedChange(!checked)}
    >
      <span
        className={clsx(
          'absolute top-1 left-1 w-8 h-8 rounded-full bg-white transition',
          checked && 'translate-x-8'
        )}
      />
      {label && <span className="sr-only">{label}</span>}
    </button>
  )
}