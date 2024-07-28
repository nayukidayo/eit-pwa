// @ts-check
import { zipSync } from 'fflate'

/**
 * @param {Date|number} date
 * @returns {string}
 */
export function dateTimeFormat(date) {
  const df = new Intl.DateTimeFormat(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
  return df.format(date)
}

/**
 * @param {CanvasRenderingContext2D} ctx
 * @param {Uint8ClampedArray} rgb
 */
export function draw(ctx, rgb) {
  if (rgb.length !== 3072) return
  let n = 0
  const len = Math.sqrt(rgb.length / 3)
  for (let i = 0; i < len; i++) {
    for (let j = len - 1; j >= 0; j--) {
      ctx.fillStyle = `rgb(${rgb[n * 3]} ${rgb[n * 3 + 1]} ${rgb[n * 3 + 2]})`
      ctx.fillRect(i, j, 1, 1)
      n++
    }
  }
}

/**
 * @param {CanvasImageSource} source
 * @returns {Promise<any>}
 */
export function zoom(source) {
  const canvas = document.createElement('canvas')
  canvas.width = 200
  canvas.height = 200
  const ctx = canvas.getContext('2d')
  if (ctx === null) throw new Error('Failed to get context')
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(source, 0, 0, 32, 32, 0, 0, 200, 200)
  return new Promise((res, rej) => {
    canvas.toBlob(blob => {
      if (blob === null) return rej(new Error('Failed to get blob'))
      blob.arrayBuffer().then(ab => res(new Uint8Array(ab)))
    })
  })
}

/**
 * @param {string} name
 * @param {object} data
 */
export function zipAndDownload(name, data) {
  const zipped = zipSync({ [name]: data }, { level: 0 })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([zipped], { type: 'application/zip' }))
  a.download = `${name}.zip`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}
