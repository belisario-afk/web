import React from 'react'

type Props = {
  min: number
  max: number
  step?: number
  value: number
  onChange: (v: number) => void
  label?: string
}

export const Slider: React.FC<Props> = ({ min, max, step = 1, value, onChange, label }) => {
  return (
    <div className="flex flex-col gap-2">
      {label && <label className="text-sm text-white/70">{label}</label>}
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-opel-neon"
      />
      <div className="text-white/60 text-sm">{value}</div>
    </div>
  )
}