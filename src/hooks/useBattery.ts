import { useEffect, useState } from 'react'
import { useStore } from '../state/store'

type BatteryManagerLike = {
  charging: boolean
  level: number
  onlevelchange: ((this: any, ev: Event) => any) | null
}

export function useBattery() {
  const [level, setLevel] = useState<number | null>(null)
  const [charging, setCharging] = useState<boolean | null>(null)
  const setSuggestion = useStore((s) => s.setBrightnessSuggestion)

  useEffect(() => {
    let battery: BatteryManagerLike | null = null
    const setup = async () => {
      try {
        // @ts-expect-error navigator.getBattery is not typed
        const b = (await navigator.getBattery?.()) as BatteryManagerLike | undefined
        if (!b) return
        battery = b
        setLevel(b.level)
        // @ts-expect-error
        setCharging(b.charging)
        ;(b as any).addEventListener?.('levelchange', () => setLevel(b.level))
        ;(b as any).addEventListener?.('chargingchange', () => setCharging((b as any).charging))
      } catch {}
    }
    setup()
    return () => {
      // best-effort cleanup if supported
    }
  }, [])

  useEffect(() => {
    if (level == null) return
    if (level < 0.15) setSuggestion('dark')
    else if (level < 0.3) setSuggestion('dim')
    else setSuggestion('normal')
  }, [level, setSuggestion])

  return { level, charging }
}