// Generates build/icon.{icns,ico,png} and a build/icons/ size set from a
// single source image. Run with `npm run generate-icons`.
import { execFileSync } from 'child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import sharp from 'sharp'
import pngToIco from 'png-to-ico'

const SOURCE = '/Users/johnlauron/Downloads/图片信息-removebg-preview-2.png'
const BUILD_DIR = new URL('../build', import.meta.url).pathname
const ICON_SIZES = [16, 24, 32, 48, 64, 128, 256, 512, 1024]

async function squareMaster() {
  const img = sharp(SOURCE)
  const meta = await img.metadata()
  const { width, height } = meta
  if (!width || !height) throw new Error('Could not read source image dimensions')

  const side = Math.min(width, height)
  const left = Math.floor((width - side) / 2)
  const top = Math.floor((height - side) / 2)

  return img.extract({ left, top, width: side, height: side }).resize(1024, 1024).png().toBuffer()
}

async function main() {
  if (!existsSync(SOURCE)) throw new Error(`Source icon not found: ${SOURCE}`)
  mkdirSync(BUILD_DIR, { recursive: true })
  const iconsDir = join(BUILD_DIR, 'icons')
  mkdirSync(iconsDir, { recursive: true })

  const master = await squareMaster()

  // build/icons/{size}x{size}.png — used for Linux desktop icon fidelity.
  for (const size of ICON_SIZES) {
    await sharp(master).resize(size, size).png().toFile(join(iconsDir, `${size}x${size}.png`))
  }

  // build/icon.png — 512x512 flat icon (Linux / AppImage default).
  await sharp(master).resize(512, 512).png().toFile(join(BUILD_DIR, 'icon.png'))

  // build/icon.ico — Windows, multi-resolution.
  const icoSizes = [16, 32, 48, 64, 128, 256]
  const icoBuffers = await Promise.all(
    icoSizes.map((size) => sharp(master).resize(size, size).png().toBuffer())
  )
  const ico = await pngToIco(icoBuffers)
  writeFileSync(join(BUILD_DIR, 'icon.ico'), ico)

  // build/icon.icns — macOS, via the native iconutil + a staged .iconset.
  const stagingRoot = mkdtempSync(join(tmpdir(), 'torbox-iconset-'))
  const iconset = join(stagingRoot, 'icon.iconset')
  mkdirSync(iconset)
  const icnsMap = [
    ['icon_16x16.png', 16],
    ['icon_16x16@2x.png', 32],
    ['icon_32x32.png', 32],
    ['icon_32x32@2x.png', 64],
    ['icon_128x128.png', 128],
    ['icon_128x128@2x.png', 256],
    ['icon_256x256.png', 256],
    ['icon_256x256@2x.png', 512],
    ['icon_512x512.png', 512],
    ['icon_512x512@2x.png', 1024]
  ]
  for (const [name, size] of icnsMap) {
    await sharp(master).resize(size, size).png().toFile(join(iconset, name))
  }
  execFileSync('iconutil', ['-c', 'icns', iconset, '-o', join(BUILD_DIR, 'icon.icns')])
  rmSync(stagingRoot, { recursive: true, force: true })

  console.log('Generated:')
  console.log('  build/icon.icns')
  console.log('  build/icon.ico')
  console.log('  build/icon.png')
  console.log(`  build/icons/ (${ICON_SIZES.length} sizes)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
