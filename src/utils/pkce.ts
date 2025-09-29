// PKCE helper
export function generateCodeVerifier(length = 64) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''
  const randomValues = new Uint8Array(length)
  crypto.getRandomValues(randomValues)
  for (let i = 0; i < length; i++) {
    result += charset[randomValues[i] % charset.length]
  }
  return result
}

async function sha256(buffer: string) {
  const enc = new TextEncoder().encode(buffer)
  const digest = await crypto.subtle.digest('SHA-256', enc)
  return new Uint8Array(digest)
}

function base64UrlEncode(arrayBuffer: Uint8Array) {
  let str = ''
  const chunkSize = 0x8000
  for (let i = 0; i < arrayBuffer.length; i += chunkSize) {
    const chunk = arrayBuffer.subarray(i, i + chunkSize)
    str += String.fromCharCode.apply(null, Array.from(chunk) as unknown as number[])
  }
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function generateCodeChallenge(verifier: string) {
  const hash = await sha256(verifier)
  return base64UrlEncode(hash)
}