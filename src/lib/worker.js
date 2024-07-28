import Matrix, {
  normalization,
  LBP,
  Landweber,
  cgls,
  NewtonRaphson,
  Tikhonov,
  TV,
} from './matrix.js'

const callback = new Map()

self.onmessage = e => {
  if (e.data.event) {
    self.dispatchEvent(new CustomEvent(e.data.event, { detail: e.data }))
  }
  if (callback.has(e.data.id)) {
    callback.get(e.data.id)(e.data.data)
    callback.delete(e.data.id)
  }
}

let cirsPM = null
let tranPM = null
let cirsSD = null
let tranSD = null
self.addEventListener('cirs', ({ detail }) => {
  try {
    const arr = JSON.parse(detail.data.text)
    if (!Array.isArray(arr)) throw new Error()
    if (detail.data.type === 'pm') {
      cirsPM = new Matrix(arr)
      tranPM = cirsPM.transpose()
    } else {
      cirsSD = new Matrix(arr)
      tranSD = cirsSD.transpose()
    }
  } catch (err) {
    console.log('[cirs]', err)
  }
})

let uref = null
self.addEventListener('uref', ({ detail }) => {
  if (Array.isArray(detail.data)) {
    uref = Matrix.from1DArray(208, 1, detail.data)
  } else {
    uref = null
  }
})

let paramPM = null
let paramSD = null
self.addEventListener('param', ({ detail }) => {
  paramPM = detail.data.pm
  paramSD = detail.data.sd
})

self.addEventListener('uell', ({ detail }) => {
  if (!Array.isArray(detail.data) || !uref) return
  const uell = Matrix.from1DArray(208, 1, detail.data)

  if (cirsPM) {
    const result = calcResult(
      paramPM.func,
      Number(paramPM.iter),
      Number(paramPM.coef),
      Number(paramPM.type),
      uell,
      uref,
      cirsPM,
      tranPM
    )
    postMessage({ event: 'image', data: { type: 'pm', rgb: rgb(result) } })
  }

  if (cirsSD) {
    const result = calcResult(
      paramSD.func,
      Number(paramSD.iter),
      Number(paramSD.coef),
      Number(paramSD.type),
      uell,
      uref,
      cirsSD,
      tranSD
    )
    postMessage({ event: 'image', data: { type: 'sd', rgb: rgb(result) } })
  }
})

function calcResult(func, iter, coef, type, uell, uref, cirs, tran) {
  let result
  switch (func) {
    case 'Tiknonov':
      result = Tikhonov(iter, coef, type, uell, uref, cirs, tran)
      break
    case 'TV':
      result = TV(iter, coef, type, uell, uref, cirs, tran)
      break
    case 'Landweber':
      result = Landweber(iter, type, uell, uref, cirs, tran)
      break
    case 'NewtonRaphson':
      result = NewtonRaphson(iter, type, uell, uref, cirs, tran)
      break
    case 'cgls':
      result = cgls(iter, type, uell, uref, cirs, tran)
      break
    default:
      result = LBP(type, uell, uref, tran)
  }

  const max = result.max()
  postMessage({
    event: 'injury',
    data: {
      gcv: Math.abs(result.sum()),
      crv: Math.abs(max - result.min()),
      sdcv: Math.abs(max),
      mcv: Math.abs(result.standardDeviation()),
    },
  })

  return normalization(result)
}

function rgb(y) {
  const c = new Array(y.length * 3)
  for (let i = 0; i < y.length; i++) {
    const r = i * 3
    const g = r + 1
    const b = g + 1
    switch (true) {
      case y[i] <= 0.125:
        c[r] = 0
        c[g] = 0
        c[b] = y[i] * 1020 + 127.5
        break
      case y[i] <= 0.25:
        c[r] = 0
        c[g] = y[i] * 1020 - 127.5
        c[b] = 255
        break
      case y[i] <= 0.375:
        c[r] = 0
        c[g] = y[i] * 1020 - 127.5
        c[b] = 255
        break
      case y[i] <= 0.5:
        c[r] = y[i] * 1020 - 382.5
        c[g] = 255
        c[b] = 637.5 - y[i] * 1020
        break
      case y[i] <= 0.625:
        c[r] = y[i] * 1020 - 382.5
        c[g] = 255
        c[b] = 637.5 - y[i] * 1020
        break
      case y[i] <= 0.75:
        c[r] = 255
        c[g] = 892.5 - y[i] * 1020
        c[b] = 0
        break
      case y[i] <= 0.875:
        c[r] = 255
        c[g] = 892.5 - y[i] * 1020
        c[b] = 0
        break
      case y[i] <= 1:
        c[r] = 1147.5 - y[i] * 1020
        c[g] = 0
        c[b] = 0
        break
      default:
        c[r] = 0
        c[g] = 0
        c[b] = 0
        break
    }
  }
  return c
}
