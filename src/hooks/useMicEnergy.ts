/**
 * Captures microphone with Web Audio FFT and produces a smoothed energy value (0..1).
 * Falls back to null if permission denied or unsupported.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { useStore } from '../state/store'

export function useMicEnergy() {
  const micReactive = useStore(s => s.micReactive)
  const micPermission = useStore(s => s.micPermission)
  const setMicPermission = useStore(s => s.setMicPermission)

  const [energy, setEnergy] = useState<number | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const dataRef = useRef<Uint8Array | null>(null)
  const rafRef = useRef<number | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const smoothingRef = useRef(0)

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    streamRef.current?.getTracks().forEach(t => t.stop())
    streamRef.current = null
    analyserRef.current?.disconnect()
    analyserRef.current = null
    dataRef.current = null
    setEnergy(null)
  }, [])

  const start = useCallback(async () => {
    if (!micReactive) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } })
      setMicPermission('granted')
      streamRef.current = stream
      const ctx = new AudioContext()
      const src = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      analyser.smoothingTimeConstant = 0.6
      src.connect(analyser)
      analyserRef.current = analyser
      dataRef.current = new Uint8Array(analyser.frequencyBinCount)

      const loop = () => {
        if (!analyserRef.current || !dataRef.current) return
        analyserRef.current.getByteFrequencyData(dataRef.current)
        // Compute average magnitude (RMS-like)
        let sum = 0
        for (let i = 0; i < dataRef.current.length; i++) {
          const v = dataRef.current[i] / 255
          sum += v * v
        }
        const rms = Math.sqrt(sum / dataRef.current.length)
        // Smooth dynamic range mapping
        const target = Math.min(1, Math.pow(rms * 1.9, 1.2))
        smoothingRef.current += (target - smoothingRef.current) * 0.12
        setEnergy(smoothingRef.current)
        rafRef.current = requestAnimationFrame(loop)
      }
      rafRef.current = requestAnimationFrame(loop)
    } catch (e) {
      setMicPermission('denied')
      stop()
    }
  }, [micReactive, setMicPermission, stop])

  useEffect(() => {
    if (micReactive && micPermission === 'granted' && !analyserRef.current) {
      start()
    }
    if (!micReactive) {
      stop()
    }
    return () => { stop() }
  }, [micReactive, micPermission, start, stop])

  const requestPermission = useCallback(() => {
    if (!micReactive) return
    if (micPermission === 'unknown' || micPermission === 'denied') {
      start()
    }
  }, [micReactive, micPermission, start])

  return { energy, requestPermission, micPermission }
}