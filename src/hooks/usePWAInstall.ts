import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function usePWAInstall() {
  const deferred = useRef<BeforeInstallPromptEvent | null>(null)
  const [supported, setSupported] = useState(false)
  const [installed, setInstalled] = useState(false)
  const [choice, setChoice] = useState<'accepted' | 'dismissed' | null>(null)

  useEffect(() => {
    const standalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      // @ts-ignore iOS
      (window.navigator as any).standalone === true
    setInstalled(standalone)

    const onEvent = (e: Event) => {
      e.preventDefault()
      deferred.current = e as BeforeInstallPromptEvent
      setSupported(true)
    }

    const onInstalled = () => {
      setInstalled(true)
      deferred.current = null
      setSupported(false)
    }

    window.addEventListener('beforeinstallprompt', onEvent as EventListener)
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onEvent as EventListener)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const promptInstall = useCallback(async () => {
    const e = deferred.current
    if (!e) return
    await e.prompt()
    const result = await e.userChoice
    setChoice(result.outcome)
    if (result.outcome === 'accepted') {
      deferred.current = null
      setSupported(false)
    }
  }, [])

  return useMemo(
    () => ({
      supported,
      installed,
      choice,
      promptInstall
    }),
    [supported, installed, choice, promptInstall]
  )
}