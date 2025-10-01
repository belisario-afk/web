import sharp from 'sharp'
import { statSync, existsSync } from 'fs'

const input = 'public/screensaver/bat-opel.png'
const output = 'public/screensaver/bat-opel.webp'

if (!existsSync(input)) {
  console.error('[optimize-bat] Input file not found:', input)
  process.exit(1)
}

const info = statSync(input)
console.log(`[optimize-bat] Source size: ${(info.size/1024/1024).toFixed(2)} MB`)

try {
  await sharp(input)
    .resize({ width: 1400, withoutEnlargement: true })
    .webp({ quality: 78 })
    .toFile(output)

  const oinfo = statSync(output)
  console.log(`[optimize-bat] Output: ${output} ${(oinfo.size/1024).toFixed(1)} KB`)
  console.log('[optimize-bat] Done. Remove original PNG or exclude it from precache.')
} catch (e) {
  console.error('[optimize-bat] Failed:', e)
  process.exit(1)
}