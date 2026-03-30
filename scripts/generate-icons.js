// Run once: node scripts/generate-icons.js
// Requires: yarn add -D canvas

const { createCanvas } = require('canvas')
const fs = require('fs')
const path = require('path')

function generateIcon(size, filename) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background — espresso
  ctx.fillStyle = '#2C1F14'
  ctx.fillRect(0, 0, size, size)

  // Letter U — cream
  ctx.fillStyle = '#F5F0E8'
  ctx.font = `${size * 0.5}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('U', size / 2, size / 2)

  const buffer = canvas.toBuffer('image/png')
  const outPath = path.join(__dirname, '../public', filename)
  fs.writeFileSync(outPath, buffer)
  console.log(`✓ Generated ${filename}`)
}

generateIcon(192, 'icon-192.png')
generateIcon(512, 'icon-512.png')