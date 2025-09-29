import { useEffect, useState } from 'react'

export function useDeviceInfo() {
  const [isSMT77U, setIsSMT77U] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [landscape, setLandscape] = useState(window.matchMedia('(orientation: landscape)').matches)

  useEffect(() => {
    const ua = navigator.userAgent
    // Heuristic for Samsung Galaxy Tab S7 FE (SM-T736B/T737)
    setIsSMT77U(/SM-T77|SMT77|SM\-T77/i.test(ua))
    setIsTablet(/Tablet|SM\-T|iPad|Android(?!.*Mobile)/i.test(ua))
    const mql = window.matchMedia('(orientation: landscape)')
    const onChange = () => setLandscape(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return { isSMT77U, isTablet, landscape }
}