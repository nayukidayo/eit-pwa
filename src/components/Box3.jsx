import { useState, useEffect, useRef } from 'react'
import ezusb from '../lib/ezusb.js'
import { draw, zoom, zipAndDownload } from '../lib/utils.js'
import cs from './Box3.module.css'

export default function Box3() {
  const pm = useRef(null)
  const sd = useRef(null)
  const [rate, setRate] = useState(0)

  useEffect(() => {
    const ctxpm = pm.current.getContext('2d')
    const ctxsd = sd.current.getContext('2d')
    const cbpm = ({ detail }) => draw(ctxpm, detail)
    const cbsd = ({ detail }) => draw(ctxsd, detail)
    const cbReset = () => {
      ctxpm.clearRect(0, 0, ctxpm.canvas.width, ctxpm.canvas.height)
      ctxsd.clearRect(0, 0, ctxsd.canvas.width, ctxsd.canvas.height)
    }
    ezusb.addEventListener('draw-pm', cbpm)
    ezusb.addEventListener('draw-sd', cbsd)
    ezusb.addEventListener('reset', cbReset)
    return () => {
      ezusb.removeEventListener('draw-pm', cbpm)
      ezusb.removeEventListener('draw-sd', cbsd)
      ezusb.removeEventListener('reset', cbReset)
    }
  }, [])

  useEffect(() => {
    const cb = ({ detail }) => setRate(detail)
    ezusb.addEventListener('rate', cb)
    return () => {
      ezusb.removeEventListener('rate', cb)
    }
  }, [])

  useEffect(() => {
    const cb = async ({ detail }) => {
      try {
        const all = await Promise.all([zoom(pm.current), zoom(sd.current)])
        zipAndDownload(detail.id, {
          '指标数值.json': new TextEncoder().encode(detail.str),
          '平面成像.png': all[0],
          '深度成像.png': all[1],
        })
      } catch (err) {
        console.log(err)
      }
    }
    ezusb.addEventListener('download', cb)
    return () => {
      ezusb.removeEventListener('download', cb)
    }
  }, [])

  return (
    <div className={cs.q}>
      <div className={cs.c}>
        <span>平面成像</span>
        <canvas ref={pm} width={32} height={32}></canvas>
      </div>
      <div className={cs.b}></div>
      <div className={cs.c}>
        <span>深度成像</span>
        <canvas ref={sd} width={32} height={32}></canvas>
      </div>
      <div className={cs.f}>{rate}&nbsp;FPS</div>
    </div>
  )
}
