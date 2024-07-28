import { useEffect, useRef } from 'react'
import ezusb from '../lib/ezusb.js'
import cs from './Box5-debug.module.css'

const cols = [8, 14, 18, 20, 22, 24, 26, 28, 28, 30, 30, 30, 32, 32, 32, 32]

function draw(ctx, rgb) {
  if (rgb.length !== 2436) return
  let n = 0
  const len = cols.length * 2
  for (let i = 0; i < len; i++) {
    let min, max
    if (i < cols.length) {
      min = (len - cols[i]) / 2
      max = min + cols[i] - 1
    } else {
      min = (len - cols.at(cols.length - 1 - i)) / 2
      max = min + cols.at(cols.length - 1 - i) - 1
    }
    for (let j = max; j >= min; j--) {
      ctx.fillStyle = `rgb(${rgb[n * 3]} ${rgb[n * 3 + 1]} ${rgb[n * 3 + 2]})`
      ctx.fillRect(i, j, 1, 1)
      n++
    }
  }
}

export default function Box5Debug() {
  const ref = useRef(null)

  useEffect(() => {
    const ctx = ref.current.getContext('2d')
    const cb = ({ detail }) => {
      if (detail?.data.type) {
        draw(ctx, detail.data.rgb)
      } else {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      }
    }
    ezusb.addEventListener('image', cb)
    return () => {
      ezusb.removeEventListener('image', cb)
    }
  }, [])

  return (
    <div className={cs.q}>
      <canvas ref={ref} width={32} height={32}></canvas>
      <div className={cs.b}></div>
      <div className={cs.d}></div>
    </div>
  )
}
