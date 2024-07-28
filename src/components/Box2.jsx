import { useState, useEffect } from 'react'
import { TextInput, Group, Button } from '@mantine/core'
import ezusb from '../lib/ezusb.js'
import cs from './Box2.module.css'

const dict = {
  gcv: '全局电导率变化量(ΔGCV)',
  mcv: '最大电导率变化量(ΔMCV)',
  crv: '电导率变化量范围(ΔCRV)',
  sdcv: '电导率变化量标准差(ΔSD.CV)',
}

const initialMetrics = { gcv: '', mcv: '', crv: '', sdcv: '' }

export default function Box2() {
  const [id, setID] = useState('')
  const [metrics, setMetrics] = useState(initialMetrics)

  const handleSaveMetrics = () => {
    const arr = []
    for (const key in dict) {
      if (dict.hasOwnProperty(key)) {
        arr.push({ name: dict[key], value: metrics[key] })
      }
    }
    const str = JSON.stringify(arr, null, '  ')
    ezusb.dispatchEvent(new CustomEvent('download', { detail: { id, str } }))
  }

  useEffect(() => {
    const cb = ({ detail }) => setMetrics(detail)
    ezusb.addEventListener('metrics', cb)
    return () => {
      ezusb.removeEventListener('metrics', cb)
    }
  }, [])

  useEffect(() => {
    const cb = () => setMetrics(initialMetrics)
    ezusb.addEventListener('reset', cb)
    return () => {
      ezusb.removeEventListener('reset', cb)
    }
  }, [])

  return (
    <div className={cs.q}>
      <Group align="end" wrap="nowrap" my="xs">
        <TextInput
          withAsterisk
          label="患者ID"
          value={id}
          onChange={e => setID(e.currentTarget.value)}
        />
        <Button
          flex="1 0 auto"
          variant="light"
          onClick={handleSaveMetrics}
          disabled={!id || !metrics.gcv}
        >
          保存结果
        </Button>
      </Group>
      <TextInput label={dict.gcv} disabled defaultValue={metrics.gcv} />
      <TextInput label={dict.mcv} disabled defaultValue={metrics.mcv} />
      <TextInput label={dict.crv} disabled defaultValue={metrics.crv} />
      <TextInput label={dict.sdcv} disabled defaultValue={metrics.sdcv} />
    </div>
  )
}
