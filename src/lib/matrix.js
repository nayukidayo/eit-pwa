// @ts-check

import { Matrix, inverse } from 'ml-matrix'

export default Matrix

/**
 *
 * @param {Matrix} mat
 * @returns {number[]}
 */
export function normalization(mat) {
  const min = mat.minColumn(0)
  const max = mat.maxColumn(0)
  return mat.getColumn(0).map(v => (max === min ? 0 : (v - min) / (max - min)))
}

/**
 * @param {number} type
 * @param {Matrix} uell
 * @param {Matrix} uref
 * @returns {Matrix}
 */
function calc_b(type, uell, uref) {
  let b
  if (type === 2) {
    b = Matrix.sub(uell, Matrix.mul(uref, uref.dot(uref) / uell.dot(uref)))
  } else {
    b = Matrix.sub(uell, uref)
  }
  return b
}

/**
 *
 * @param {number} type
 * @param {Matrix} uell
 * @param {Matrix} uref
 * @param {Matrix} tran
 * @returns {Matrix}
 */
export function LBP(type, uell, uref, tran) {
  const b = calc_b(type, uell, uref)
  return tran.mmul(b)
}

/**
 *
 * @param {number} iter
 * @param {number} type
 * @param {Matrix} uell
 * @param {Matrix} uref
 * @param {Matrix} cirs
 * @param {Matrix} tran
 * @returns {Matrix}
 */
export function Landweber(iter, type, uell, uref, cirs, tran) {
  const b = calc_b(type, uell, uref)
  const r = new Matrix(cirs.columns, 1)
  for (let i = 0; i < iter; i++) {
    r.sub(tran.mmul(Matrix.sub(cirs.mmul(r), b)))
  }
  return r
}

/**
 *
 * @param {number} iter
 * @param {number} type
 * @param {Matrix} uell
 * @param {Matrix} uref
 * @param {Matrix} cirs
 * @param {Matrix} tran
 * @returns {Matrix}
 */
export function cgls(iter, type, uell, uref, cirs, tran) {
  const b = calc_b(type, uell, uref)
  const r = new Matrix(cirs.columns, 1)
  let c, s
  let d = tran.mmul(b)
  let v = d.transpose().mmul(d).get(0, 0)
  for (let i = 0; i < iter; i++) {
    c = cirs.mmul(d)
    const a = v / c.transpose().mmul(c).get(0, 0)
    b.sub(Matrix.mul(c, a))
    r.add(Matrix.mul(d, a))
    s = tran.mmul(b)
    const w = s.transpose().mmul(s).get(0, 0)
    d = Matrix.add(s, Matrix.mul(d, w / v))
    v = w
  }
  return r
}

/**
 *
 * @param {number} iter
 * @param {number} type
 * @param {Matrix} uell
 * @param {Matrix} uref
 * @param {Matrix} cirs
 * @param {Matrix} tran
 * @returns {Matrix}
 */
export function NewtonRaphson(iter, type, uell, uref, cirs, tran) {
  return Tikhonov(iter, 0.1, type, uell, uref, cirs, tran)
}

/**
 *
 * @param {number} iter
 * @param {number} coef
 * @param {number} type
 * @param {Matrix} uell
 * @param {Matrix} uref
 * @param {Matrix} cirs
 * @param {Matrix} tran
 * @returns {Matrix}
 */
export function Tikhonov(iter, coef, type, uell, uref, cirs, tran) {
  let a, c, m, t
  const b = calc_b(type, uell, uref)
  const r = new Matrix(cirs.columns, 1)
  const s = Matrix.identity(cirs.columns, cirs.columns)
  for (let i = 0; i < iter; i++) {
    a = Matrix.add(tran.mmul(cirs), Matrix.mul(s, coef))
    c = inverse(a)
    m = c.mmul(tran)
    t = Matrix.sub(cirs.mmul(r), b)
    r.sub(m.mmul(t))
  }
  return r
}

/**
 *
 * @param {number} iter
 * @param {number} coef
 * @param {number} type
 * @param {Matrix} uell
 * @param {Matrix} uref
 * @param {Matrix} cirs
 * @returns {Matrix}
 */
export function TV(iter, coef, type, uell, uref, cirs) {
  // todo
  return new Matrix(1024, 1)
}
