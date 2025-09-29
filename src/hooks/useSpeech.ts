import { useCallback, useEffect, useRef, useState } from 'react'

export function useSpeech() {
  const [enabled, setEnabled] = useState<boolean>(false)
  const [speaking, setSpeaking] = useState(false)
  const synthRef = useRef(window.speechSynthesis)

  useEffect(() => {
    setEnabled(!!window.speechSynthesis)
  }, [])

  const speak = useCallback((text: string) => {
    if (!synthRef.current) return
    const utter = new SpeechSynthesisUtterance(text)
    utter.rate = 1.05
    utter.pitch = 1.0
    utter.volume = 0.9
    utter.onstart = () => setSpeaking(true)
    utter.onend = () => setSpeaking(false)
    synthRef.current.speak(utter)
  }, [])

  return { enabled, speaking, speak }
}