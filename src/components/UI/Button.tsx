import React from 'react'
import clsx from 'classnames'

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'accent'
}

export const Button: React.FC<Props> = ({ variant = 'primary', className, ...props }) => {
  const base =
    'px-6 py-4 rounded-xl font-semibold text-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 active:scale-95 transition transform select-none'
  const styles = {
    primary:
      'bg-opel-yellow text-black shadow-[0_0_20px_rgba(255,221,0,0.35)] hover:brightness-95 focus-visible:ring-opel-yellow/60',
    ghost:
      'bg-white/5 text-white hover:bg-white/10 border border-white/10 focus-visible:ring-white/30',
    accent:
      'bg-opel-neon text-black shadow-[0_0_20px_rgba(0,229,255,0.45)] hover:brightness-95 focus-visible:ring-opel-neon/60'
  } as const
  return <button className={clsx(base, styles[variant], className)} {...props} />
}