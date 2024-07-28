import { useState, useEffect } from 'react'
import { Tabs, TextInput, Group, Button } from '@mantine/core'
import { useStore } from '../lib/context.jsx'
import ezusb from '../lib/ezusb.js'
import cs from './Box7.module.css'

const dict = {
  gcv: '全局电导率变化量(ΔGCV)',
  sdcv: '最大电导率变化量(ΔMCV)',
  crv: '电导率变化量范围(ΔCRV)',
  mcv: '电导率变化量标准差(ΔSD.CV)',
}

export default function Box7() {
  const { store } = useStore()
  const [id, setID] = useState('')
  const [injury, setInjury] = useState({ gcv: '', crv: '', sdcv: '', mcv: '' })

  const handleSave = () => {
    let str = ''
    for (const key in dict) {
      if (dict.hasOwnProperty(key)) {
        str += `${dict[key]}: ${injury[key]}\n`
      }
    }
    ezusb.dispatchEvent(
      new CustomEvent('download', {
        detail: { id, result: new TextEncoder().encode(str) },
      })
    )
  }

  useEffect(() => {
    const cb = ({ detail }) => {
      if (detail) {
        setInjury(detail.data)
      } else {
        setInjury({ gcv: '', crv: '', sdcv: '', mcv: '' })
      }
    }
    ezusb.addEventListener('injury', cb)
    return () => {
      ezusb.removeEventListener('injury', cb)
    }
  }, [])

  return (
    <div className={cs.q}>
      <Tabs defaultValue="debug">
        <Tabs.List grow>
          <Tabs.Tab value="debug">指标数值</Tabs.Tab>
          <Tabs.Tab value="prod">伤情评估</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="debug">
          <Group align="end" wrap="nowrap" my="xs">
            <TextInput
              withAsterisk
              label="患者ID"
              value={id}
              onChange={e => setID(e.currentTarget.value)}
            />
            <Button
              flex="1 0 auto"
              onClick={handleSave}
              disabled={store.debug || !id || !injury.gcv}
            >
              保存结果
            </Button>
          </Group>
          <TextInput label={dict.gcv} disabled defaultValue={injury.gcv} />
          <TextInput label={dict.sdcv} disabled defaultValue={injury.sdcv} />
          <TextInput label={dict.crv} disabled defaultValue={injury.crv} />
          <TextInput label={dict.mcv} disabled defaultValue={injury.mcv} />
        </Tabs.Panel>

        <Tabs.Panel value="prod" className={cs.w}>
          <span>患者ID</span>
          <input disabled></input>
          <span>肌酐</span>
          <input disabled></input>
          <span>血钾</span>
          <input disabled></input>
          <span>钠</span>
          <input disabled></input>
          <span>损伤等级</span>
          <input disabled></input>
          <span>损伤参数</span>
          <input disabled></input>
        </Tabs.Panel>
      </Tabs>
    </div>
  )
}
