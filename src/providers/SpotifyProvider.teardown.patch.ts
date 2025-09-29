// Add this snippet (or integrate) in your root (e.g., App.tsx) after mounting SpotifyProvider,
// OR inside SpotifyProvider useEffect, to proactively disconnect and silence deregister errors.
import { useEffect } from 'react'
import { useSpotify } from './providers/SpotifyProvider'

export function SpotifyTeardownGuard() {
  const { logout } = useSpotify()
  useEffect(() => {
    const before = () => {
      try {
        // The SDK will handle internal disconnect; explicit logout (optional) reduces noise
        logout()
      } catch {}
    }
    window.addEventListener('beforeunload', before)
    return () => window.removeEventListener('beforeunload', before)
  }, [logout])
  return null
}