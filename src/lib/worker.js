import { bufferToCirs, readFile, writeFile, calcResult, rgb, norm } from './helper.js'

const option = { pm: {}, sd: {} }

self.onmessage = ({ data }) => {
  self.dispatchEvent(new CustomEvent(data.event, { detail: data.data }))
}

self.addEventListener('mode', async ({ detail }) => {
  const { kind, mode, uref } = detail
  option[kind].mode = mode
  option[kind].uref = uref
  if (mode === '7') {
    await writeFile(`uref-${kind}`, uref.buffer)
  }
  if (mode === '8') {
    const buffer = await readFile(`uref-${kind}`)
    if (buffer.byteLength > 0) {
      option[kind].uref = new Int16Array(buffer)
    }
  }
})

self.addEventListener('cirs', async ({ detail }) => {
  const { kind } = detail
  const buffer = await readFile(`cirs-${kind}`)
  const cirs = bufferToCirs(208, 1024, buffer)
  option[kind].cirs = cirs
  option[kind].tran = cirs.transpose()
})

self.addEventListener('cirsImport', async ({ detail }) => {
  const { kind, buffer } = detail
  await writeFile(`cirs-${kind}`, buffer)
  const cirs = bufferToCirs(208, 1024, buffer)
  option[kind].cirs = cirs
  option[kind].tran = cirs.transpose()
})

self.addEventListener('uell', ({ detail }) => {
  const { kind, uell } = detail
  const opt = option[kind]
  if (!opt.uref || !opt.cirs || !opt.tran) return

  const result = calcResult(uell, opt)
  const msg = { event: `draw-${kind}`, data: rgb(norm(result)) }
  postMessage(msg, [msg.data.buffer])

  if (kind === 'pm') {
    const max = result.max()
    postMessage({
      event: 'metrics',
      data: {
        gcv: Math.abs(result.sum()),
        crv: Math.abs(max - result.min()),
        sdcv: Math.abs(max),
        mcv: Math.abs(result.standardDeviation()),
      },
    })
  }
})
