// @ts-check

import Matrix, { normalization, LBP, cgls } from './matrix.js'

/**
 * @param {Matrix} mat
 * @returns {number[]}
 */
export function norm(mat) {
  return normalization(mat)
}

/**
 * @param {string} name
 * @returns {Promise<ArrayBuffer>}
 */
export async function readFile(name) {
  const root = await navigator.storage.getDirectory()
  const fileHandle = await root.getFileHandle(name, { create: true })
  // @ts-expect-error
  const accessHandle = await fileHandle.createSyncAccessHandle()
  const buffer = new ArrayBuffer(accessHandle.getSize())
  accessHandle.read(buffer, { at: 0 })
  accessHandle.close()
  return buffer
}

/**
 * @param {string} name
 * @param {ArrayBuffer} data
 */
export async function writeFile(name, data) {
  const root = await navigator.storage.getDirectory()
  const fileHandle = await root.getFileHandle(name, { create: true })
  // @ts-expect-error
  const accessHandle = await fileHandle.createSyncAccessHandle()
  accessHandle.truncate(0)
  accessHandle.write(data, { at: 0 })
  accessHandle.flush()
  accessHandle.close()
}

/**
 * @param {number} rows
 * @param {number} cols
 * @param {ArrayBuffer} buffer
 * @returns {Matrix}
 */
export function bufferToCirs(rows, cols, buffer) {
  const arr = new TextDecoder().decode(buffer).split('\r\n')
  if (arr.length !== rows * cols) throw new Error('Invalid cirs length')
  let index = 0
  const mat = new Matrix(rows, cols)
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const value = Number(arr[index++])
      if (isNaN(value)) throw new Error('Invalid cirs value')
      mat.set(j, i, value)
    }
  }
  return mat
}

/**
 * @param {number[]} arr
 * @param {{mode: string, uref: Int16Array, tran: Matrix, cirs: Matrix}} option
 * @returns {Matrix}
 */
export function calcResult(arr, option) {
  const uell = Matrix.from1DArray(208, 1, arr)
  const uref = Matrix.from1DArray(208, 1, option.uref)
  switch (option.mode) {
    case '1':
    case '2':
    case '3':
      return LBP(1, uell, uref, option.tran)
    case '4':
    case '5':
    case '6':
      return cgls(10, 1, uell, uref, option.cirs, option.tran)
    default:
      return LBP(0, uell, uref, option.tran)
  }
}

/**
 * @param {number[]} y
 * @returns {Uint8ClampedArray}
 */
export function rgb(y) {
  const c = new Uint8ClampedArray(y.length * 3)
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
