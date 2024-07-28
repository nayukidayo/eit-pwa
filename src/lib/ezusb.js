// @ts-check

class EZUSB extends EventTarget {
  /**
   * @type {USBDevice}
   */
  #device

  #vendorId = 0x04b4
  #productId = 0x1004

  #started = false

  /**
   * @type {number[]|null}
   */
  #uell = null

  /**
   * @returns {boolean}
   */
  #isOpen() {
    return Boolean(this.#device?.opened)
  }

  /**
   * @param {number} len
   * @returns {Promise<Int16Array>}
   */
  async #transfer(len) {
    await this.#device.transferOut(2, new Uint8Array(len))
    const resultIn = await this.#device.transferIn(6, 512)
    if (!resultIn.data) throw new Error('No data')
    return new Int16Array(resultIn.data.buffer)
  }

  /**
   * @typedef {object} Storage
   * @property {number} timestamp
   * @property {Array} data
   */

  /**
   * @param {string} key
   * @param {Storage} value
   */
  #storageWrite(key, value) {
    const arr = this.#storageRead(key)
    if (arr.length >= 5) arr.pop()
    arr.unshift(value)
    localStorage.setItem(key, JSON.stringify(arr))
  }

  /**
   * @param {string} key
   * @returns {Storage[]}
   */
  #storageRead(key) {
    return JSON.parse(localStorage.getItem(key) || '[]')
  }

  /**
   * @param {number} ms
   * @returns {Promise<void>}
   */
  #timeout(ms) {
    return new Promise((_, rej) => setTimeout(rej, ms))
  }

  /**
   * @param {number} ms
   * @returns {Promise<void>}
   */
  #delay(ms) {
    return new Promise(res => setTimeout(res, ms))
  }

  #callback = new Map()

  #onmessage() {
    this.worker.onmessage = e => {
      if (e.data.event) {
        this.dispatchEvent(new CustomEvent(e.data.event, { detail: e.data }))
      }
      if (this.#callback.has(e.data.id)) {
        this.#callback.get(e.data.id)(e.data.data)
        this.#callback.delete(e.data.id)
      }
    }
  }

  #onDisconnect() {
    navigator.usb.addEventListener('disconnect', () => {
      this.disconnect().catch(console.log)
    })
  }

  /**
   * @param {Worker} worker
   */
  constructor(worker) {
    super()
    this.freq = 4
    this.reseted = false
    this.worker = worker
    this.#onmessage()
    this.#onDisconnect()
  }

  /**
   * @typedef {object} Msg
   * @property {string} [event]
   * @property {any} [data]
   * @property {number} [id]
   * @property {Function} [cb]
   */

  /**
   * @param {Msg} msg
   */
  postMessage = msg => {
    const { cb, ...args } = msg
    if (cb) this.#callback.set(msg.id, cb)
    this.worker.postMessage(args)
  }

  // box1
  connect = async () => {
    const devices = await navigator.usb.getDevices()
    this.#device = devices.filter(
      v => v.vendorId === this.#vendorId && v.productId === this.#productId
    )[0]
    if (!this.#device) {
      this.#device = await navigator.usb.requestDevice({
        filters: [{ vendorId: this.#vendorId, productId: this.#productId }],
      })
    }
    await this.#device.open()
    await this.#device.selectConfiguration(1)
    await this.#device.claimInterface(0)
    this.dispatchEvent(new CustomEvent('connected', { detail: true }))
  }

  disconnect = async () => {
    this.reset()
    await this.#delay(200)
    await this.#device.close().catch(() => {})
    this.dispatchEvent(new CustomEvent('connected', { detail: false }))
  }

  /**
   * @param {number} value
   */
  setFreq = value => {
    this.freq = value
  }

  /**
   * @param {string} value
   * @returns {Promise<void>}
   */
  setMeasure = async value => {
    const lens = value.split(',').map(Number)
    await this.#transfer(lens[0])
    await this.#transfer(lens[1])
  }

  // box2
  start = async () => {
    this.#started = true
    this.dispatchEvent(new CustomEvent('started', { detail: this.#started }))
    try {
      let t1 = performance.now()
      while (this.#started) {
        const buf = await this.#transfer(this.freq)
        if (!this.#started) break
        this.#uell = new Array(buf.length)
        const chart = new Array(buf.length)
        for (let i = 0; i < buf.length; i++) {
          this.#uell[i] = buf[i]
          chart[i] = { name: i.toString(), value: buf[i] }
        }
        const t2 = performance.now()
        this.postMessage({ event: 'uell', data: this.#uell })
        this.dispatchEvent(new CustomEvent('save', { detail: this.#uell }))
        this.dispatchEvent(new CustomEvent('rate', { detail: ((1 / (t2 - t1)) * 1000) | 0 }))
        this.dispatchEvent(new CustomEvent('chart', { detail: { data: chart } }))
        t1 = t2
      }
    } catch (_) {
      this.stop()
    }
  }

  stop = () => {
    this.#started = false
    this.dispatchEvent(new CustomEvent('started', { detail: this.#started }))
    this.dispatchEvent(new CustomEvent('rate', { detail: 0 }))
  }

  /**
   * @param {number[][]} data
   */
  save = data => {
    this.#storageWrite('ezusb-data', { timestamp: Date.now(), data })
  }

  load = () => {
    return this.#storageRead('ezusb-data')
  }

  /**
   * @param {number[][]} data
   */
  import = async data => {
    this.reseted = false
    for (let i = 0; i < data.length; i++) {
      if (this.reseted) break
      const chart = data[i].map((v, j) => ({ name: j.toString(), value: v }))
      this.postMessage({ event: 'uell', data: data[i] })
      this.dispatchEvent(new CustomEvent('chart', { detail: { data: chart } }))
      await this.#delay(30)
    }
  }

  send = async () => {
    try {
      await this.#device.transferOut(2, new Uint8Array(2))
    } catch (_) {}
  }

  clear = async () => {
    try {
      await Promise.race([this.#device.transferIn(6, 512), this.#timeout(200)])
    } catch (_) {
      await this.send()
    }
  }

  imped = async () => {
    try {
      const lens = [4, 8, 10, 12, 14, 16, 18, 20, 22, 24]
      const data = new Array(lens.length)
      for (let i = 0; i < lens.length; i++) {
        const buf = await this.#transfer(lens[i])
        const sum = buf.reduce((a, b) => a + b, 0)
        data[i] = { name: `${(i + 1) * 10}k`, value: (sum / buf.length) | 0 }
      }
      this.dispatchEvent(new CustomEvent('chart', { detail: { data, withXAxis: true } }))
    } catch (_) {}
  }

  reset = () => {
    this.reseted = true
    this.#uell = null
    this.stop()
    setTimeout(() => {
      this.dispatchEvent(new CustomEvent('chart'))
      this.dispatchEvent(new CustomEvent('image'))
      this.dispatchEvent(new CustomEvent('injury'))
    }, 1)
  }

  /**
   * @param {File|null} file
   */
  uellImport = async file => {
    try {
      if (!file) throw new Error()
      const text = await file.text()
      await this.import(JSON.parse(text))
    } catch (_) {}
  }

  // box3
  /**
   * @param {string} type
   * @param {File|null} file
   */
  cirsImport = async (type, file) => {
    try {
      if (!file) throw new Error()
      const text = await file.text()
      this.postMessage({ event: 'cirs', data: { type, text } })
    } catch (_) {}
  }

  hasFrame = () => {
    return Boolean(this.#uell)
  }

  frameMark = () => {
    this.postMessage({ event: `uref`, data: this.#uell })
  }

  frameSave = () => {
    if (!this.#uell) return
    this.#storageWrite('ezusb-frame', { timestamp: Date.now(), data: this.#uell })
  }

  frameLoad = () => {
    return this.#storageRead('ezusb-frame')
  }

  /**
   * @param {number[]} data
   */
  frameImport = data => {
    this.postMessage({ event: `uref`, data })
  }

  /**
   * @param {File|null} file
   */
  urefImport = async file => {
    try {
      if (!file) throw new Error()
      const text = await file.text()
      this.postMessage({ event: `uref`, data: JSON.parse(text) })
    } catch (_) {}
  }
}

const worker = new Worker(new URL('../lib/worker.js', import.meta.url), {
  type: 'module',
})

const ezusb = new EZUSB(worker)

export default ezusb
