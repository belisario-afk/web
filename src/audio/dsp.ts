// Ambient DSP bed that adapts to speed and theme. Spotify audio is not accessible to Web Audio API.
export class AmbientDSP {
  ctx: AudioContext
  noise: AudioBufferSourceNode
  filter: BiquadFilterNode
  gain: GainNode
  started = false
  enabled = false
  targetGain = 0.06

  constructor() {
    this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    this.noise = this.ctx.createBufferSource()
    const buffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 2, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (data[i - 1] || 0) * 0.98 + white * 0.02
    }
    this.noise.buffer = buffer
    this.noise.loop = true
    this.filter = this.ctx.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.frequency.value = 12000
    this.gain = this.ctx.createGain()
    // start muted by default; user can enable
    this.gain.gain.value = 0
    this.noise.connect(this.filter).connect(this.gain).connect(this.ctx.destination)
  }

  start() {
    if (this.started) return
    this.noise.start()
    this.started = true
  }

  setEnabled(v: boolean) {
    this.enabled = v
    const target = v ? this.targetGain : 0
    this.gain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.2)
  }

  setAmbienceGain(v: number) {
    this.targetGain = v
    if (this.enabled) {
      this.gain.gain.linearRampToValueAtTime(v, this.ctx.currentTime + 0.2)
    }
  }

  setLowpass(freq: number) {
    this.filter.frequency.linearRampToValueAtTime(freq, this.ctx.currentTime + 0.2)
  }

  dispose() {
    try {
      this.noise.stop()
    } catch {}
    this.gain.disconnect()
    this.filter.disconnect()
    this.ctx.close().catch(() => {})
    this.started = false
    this.enabled = false
  }
}