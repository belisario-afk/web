import { describe, it, expect } from 'vitest'
import { generateCodeVerifier, generateCodeChallenge } from '../src/utils/pkce'

describe('pkce', () => {
  it('generates verifier of expected length', () => {
    const v = generateCodeVerifier(64)
    expect(v.length).toBe(64)
  })
  it('generates code challenge', async () => {
    const v = 'testverifier_STRING.123'
    const c = await generateCodeChallenge(v)
    expect(typeof c).toBe('string')
    expect(c.length).toBeGreaterThan(10)
  })
})