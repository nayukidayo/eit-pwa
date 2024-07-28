// @ts-check

class EZUSB extends EventTarget {
  #vendorId = 0x04b4
  #productId = 0x1004

  async #connect() {
    const devices = await navigator.usb.getDevices()
    this.device = devices.filter(
      v => v.vendorId === this.#vendorId && v.productId === this.#productId
    )[0]
    if (!this.device) {
      this.device = await navigator.usb.requestDevice({
        filters: [{ vendorId: this.#vendorId, productId: this.#productId }],
      })
    }
    await this.device.open()
    await this.device.selectConfiguration(1)
    await this.device.claimInterface(0)
  }

  /**
   * @param {number} len
   * @returns {Promise<Int16Array>}
   */
  async #transfer(len) {
    if (!this.device?.opened) throw new Error('Device not open')
    await this.device.transferOut(2, new Uint8Array(len))
    const resultIn = await this.device.transferIn(6, 512)
    if (!resultIn.data) throw new Error('No data')
    return new Int16Array(resultIn.data.buffer)
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

  /**
   * @param {string} event
   * @param {any} [data]
   */
  #emit(event, data) {
    this.dispatchEvent(new CustomEvent(event, { detail: data }))
  }

  /**
   * @param {Worker} worker
   */
  #onmessage(worker) {
    worker.onmessage = ({ data }) => this.#emit(data.event, data.data)
  }

  #createWorker() {
    this.pm = new Worker(new URL('../lib/worker.js', import.meta.url), { type: 'module' })
    this.sd = new Worker(new URL('../lib/worker.js', import.meta.url), { type: 'module' })
    this.#onmessage(this.pm)
    this.#onmessage(this.sd)
  }

  #onDisconnect() {
    navigator.usb.addEventListener('disconnect', async () => {
      this.stop()
      await this.#delay(200)
      this.#emit('connected', false)
      this.#emit('reset')
    })
  }

  /**
   * @param {string} mode
   * @returns {number}
   */
  #modeToFreq(mode) {
    switch (mode) {
      case '1':
      case '4':
        return 24
      case '2':
      case '5':
        return 14
      case '3':
      case '6':
        return 10
      default:
        return 4
    }
  }

  constructor() {
    super()
    this.#createWorker()
    this.#onDisconnect()
    this.mode = '1'
  }

  connect = async () => {
    await this.#connect()
    this.pm?.postMessage({ event: 'cirs', data: { kind: 'pm' } })
    this.sd?.postMessage({ event: 'cirs', data: { kind: 'sd' } })
    await this.#delay(100)
    await this.#transfer(26) // Obj-Amp
    await this.#transfer(30)
    await this.setMode(this.mode)
    this.#emit('connected', true)
  }

  disconnect = async () => {
    await this.reset()
    await this.#delay(200)
    await this.device?.close()
    this.#emit('connected', false)
  }

  /**
   * @param {string} mode
   */
  setMode = async mode => {
    this.mode = mode
    await this.#transfer(4) // 10k
    const uref = await this.#transfer(4)
    this.pm?.postMessage({ event: 'mode', data: { kind: 'pm', mode, uref } })
    this.sd?.postMessage({ event: 'mode', data: { kind: 'sd', mode, uref } })
  }

  start = async () => {
    this.started = true
    this.#emit('started', true)
    try {
      let t1 = performance.now()
      const freq = this.#modeToFreq(this.mode)
      while (this.started) {
        const uell = await this.#transfer(freq)
        if (!this.started) break
        this.#emit('uell', uell)
        this.pm?.postMessage({ event: 'uell', data: { kind: 'pm', uell } })
        this.sd?.postMessage({ event: 'uell', data: { kind: 'sd', uell } })
        const t2 = performance.now()
        this.#emit('rate', Math.ceil((1 / (t2 - t1)) * 1000))
        t1 = t2
      }
    } catch (_) {
      this.stop()
    }
  }

  stop = () => {
    this.started = false
    this.#emit('started', false)
    this.#emit('rate', 0)
  }

  /**
   * @param {string} kind
   * @param {File} file
   */
  cirsImport = async (kind, file) => {
    const buffer = await file.arrayBuffer()
    if (kind === 'pm') {
      this.pm?.postMessage({ event: 'cirsImport', data: { kind: 'pm', buffer } }, [buffer])
    } else {
      this.pm?.postMessage({ event: 'cirsImport', data: { kind: 'sd', buffer } }, [buffer])
    }
  }

  imped = async () => {
    const lens = [4, 8, 10, 12, 14, 16, 18, 20, 22, 24]
    const data = new Array(lens.length)
    for (let i = 0; i < lens.length; i++) {
      const buf = await this.#transfer(lens[i])
      const sum = buf.reduce((a, b) => a + b, 0)
      data[i] = { name: `${(i + 1) * 10}k`, value: (sum / buf.length) | 0 }
    }
    this.#emit('imped', data)
  }

  reset = async () => {
    this.stop()
    await this.#delay(10)
    this.#emit('reset')
  }
}

export default new EZUSB()
