import { useEffect, useRef } from 'react'
import { zipSync } from 'fflate'
import ezusb from '../lib/ezusb.js'
import cs from './Box5.module.css'

function draw(ctx, rgb) {
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

function zoom(source) {
  const canvas = document.createElement('canvas')
  canvas.width = 200
  canvas.height = 200
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.drawImage(source, 0, 0, 32, 32, 0, 0, 200, 200)
  return new Promise((res, rej) => {
    canvas.toBlob(blob => blob.arrayBuffer().then(res, rej))
  })
}

function zipAndDownload(name, data) {
  const zipped = zipSync({ [name]: data }, { level: 0 })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(new Blob([zipped], { type: 'application/zip' }))
  a.download = `${name}.zip`
  a.click()
  setTimeout(() => URL.revokeObjectURL(a.href), 1000)
}

export default function Box5() {
  const pm = useRef(null)
  const sd = useRef(null)

  useEffect(() => {
    const ctxPm = pm.current.getContext('2d')
    const ctxSD = sd.current.getContext('2d')
    const cb = ({ detail }) => {
      switch (detail?.data.type) {
        case 'pm':
          draw(ctxPm, detail.data.rgb)
          break
        case 'sd':
          draw(ctxSD, detail.data.rgb)
          break
        default:
          ctxPm.clearRect(0, 0, ctxPm.canvas.width, ctxPm.canvas.height)
          ctxSD.clearRect(0, 0, ctxSD.canvas.width, ctxSD.canvas.height)
          break
      }
    }
    ezusb.addEventListener('image', cb)
    return () => {
      ezusb.removeEventListener('image', cb)
    }
  }, [])

  useEffect(() => {
    const cb = ({ detail }) => {
      Promise.all([zoom(pm.current), zoom(sd.current)]).then(ab => {
        const data = {
          'result.txt': detail.result,
          'flat.png': new Uint8Array(ab[0]),
          'depth.png': new Uint8Array(ab[1]),
        }
        zipAndDownload(detail.id, data)
      })
    }
    ezusb.addEventListener('download', cb)
    return () => {
      ezusb.removeEventListener('download', cb)
    }
  })

  return (
    <div className={cs.q}>
      <div>
        <span>平面</span>
        <canvas ref={pm} width={32} height={32}></canvas>
      </div>
      <div className={cs.b}></div>
      <div>
        <canvas ref={sd} width={32} height={32}></canvas>
        <span>深度</span>
      </div>
    </div>
  )
}
