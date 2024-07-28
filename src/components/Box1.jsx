import { useEffect, useState } from 'react'
import { Button, Select } from '@mantine/core'
import { useStore } from '../lib/context.jsx'
import ezusb from '../lib/ezusb.js'
import cs from './Box1.module.css'

const freqOption = [
  { value: '4', label: '10k' },
  { value: '8', label: '20k' },
  { value: '10', label: '30k' },
  { value: '12', label: '40k' },
  { value: '14', label: '50k' },
  { value: '16', label: '60k' },
  { value: '18', label: '70k' },
  { value: '20', label: '80k' },
  { value: '22', label: '90k' },
  { value: '24', label: '100k' },
]

const measureOption = [
  { value: '26,30', label: 'Obj-Amp' },
  { value: '28,30', label: 'Obj-Phase' },
  { value: '26,32', label: 'Ref-Amp' },
  { value: '28,32', label: 'Ref-Phase' },
]

export default function Box1() {
  const { store, setStore } = useStore()
  const [freq, setFreq] = useState('4')
  const [measure, setMeasure] = useState('26,30')
  const [rate, setRate] = useState(0)

  const handleConnect = async () => {
    try {
      await ezusb.connect()
      await ezusb.setMeasure(measure)
    } catch (err) {
      console.log('[handleConnect]', err)
    }
  }

  const handleFreqChange = value => {
    if (!value) return
    ezusb.setFreq(Number(value))
    setFreq(value)
  }

  const handleMeasureChange = async value => {
    if (!value) return
    try {
      await ezusb.setMeasure(value)
      setMeasure(value)
    } catch (err) {
      console.log('[handleMeasureChange]', err)
    }
  }

  useEffect(() => {
    const cbRate = ({ detail }) => setRate(detail)
    const cbConn = ({ detail }) => setStore({ connected: detail })
    ezusb.addEventListener('rate', cbRate)
    ezusb.addEventListener('connected', cbConn)
    return () => {
      ezusb.removeEventListener('rate', cbRate)
      ezusb.removeEventListener('connected', cbConn)
    }
  }, [])

  return (
    <div className={cs.q}>
      <span>连接设备</span>
      {store.connected ? (
        <div className={cs.w}>
          <span>EZ-USB</span>
          <Button size="compact-md" variant="light" onClick={ezusb.disconnect}>
            断开
          </Button>
        </div>
      ) : (
        <Button size="compact-md" variant="light" onClick={handleConnect}>
          连接
        </Button>
      )}
      <span>电流频率</span>
      <Select
        size="sm"
        disabled={store.importing || store.uellImporting || store.saving}
        value={freq}
        onChange={handleFreqChange}
        checkIconPosition="right"
        comboboxProps={{ shadow: 'md' }}
        data={freqOption}
      />
      <span>测量模式</span>
      <Select
        size="sm"
        disabled={!store.connected || store.started || store.importing || store.uellImporting}
        value={measure}
        onChange={handleMeasureChange}
        checkIconPosition="right"
        comboboxProps={{ shadow: 'md', width: 150 }}
        data={measureOption}
      />
      <span>成像速率</span>
      <span>
        <span>{rate}</span>&nbsp;帧/秒
      </span>
    </div>
  )
}
