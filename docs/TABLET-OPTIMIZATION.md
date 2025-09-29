# SMT77U Tablet Optimization Notes

Device: Samsung Galaxy Tab S7 FE (SMT77U series)

- Orientation: Landscape preferred; the UI adapts to portrait gracefully.
- Touch targets: Min 56x56 px for all interactive elements.
- Fullscreen: App requests fullscreen on load and provides a manual toggle in Settings.
- Wake lock: Attempts Screen Wake Lock; falls back to a silent oscillation to keep audio context active.
- Battery-aware: Suggests dimming visuals below 30%/15% battery.
- Performance: 
  - WebGL powerPreference "high-performance"
  - DPR capped [1, 2] to avoid overdraw
  - Particle counts and bloom tuned for smooth 60fps on S7 FE GPU
- Prevent sleep:
  - Enable Android system "Keep screen on" in Developer options or use a charger.
  - Keep the app in foreground; backgrounding may pause audio/lock wake lock.
- Browser:
  - Chrome/Edge on Android recommended
  - Add to Home screen for true fullscreen (PWA manifest provided)