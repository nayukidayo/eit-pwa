import { useEffect, useState } from 'react'
import { Select } from '@mantine/core'
import ezusb from '../lib/ezusb.js'
import cs from './Box4.module.css'

const initial = {
  type: '0',
  func: 'LBP',
  coef: '0.1',
  iter: '1',
}

const typeOption = [
  { value: '0', label: '时差' },
  { value: '1', label: '频差' },
  { value: '2', label: '加权频差' },
]

const funcOption = [
  { value: 'LBP', label: 'LBP' },
  { value: 'Landweber', label: 'Landweber' },
  { value: 'cgls', label: 'cgls' },
  { value: 'NewtonRaphson', label: 'NewtonRaphson' },
  { value: 'Tiknonov', label: 'Tiknonov' },
  { value: 'TV', label: 'TV' },
]

const iterOption = [
  { value: '1', label: '1' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5' },
  { value: '6', label: '6' },
  { value: '7', label: '7' },
  { value: '8', label: '8' },
  { value: '9', label: '9' },
  { value: '10', label: '10' },
]

export default function Box4() {
  const [pm, setPM] = useState(initial)
  const [sd, setSD] = useState(initial)

  useEffect(() => {
    ezusb.postMessage({
      event: 'param',
      data: { pm, sd },
    })
  }, [pm, sd])

  return (
    <div className={cs.q}>
      <span></span>
      <span className={cs.c}>平面</span>
      <span className={cs.c}>深度</span>

      <span>时/频差</span>
      <Select
        size="sm"
        value={pm.type}
        onChange={v => v && setPM(prev => ({ ...prev, type: v }))}
        checkIconPosition="right"
        comboboxProps={{ shadow: 'md', position: 'bottom-end', width: 150 }}
        data={typeOption}
      />
      <Select
        size="sm"
        value={sd.type}
        onChange={v => v && setSD(prev => ({ ...prev, type: v }))}
        checkIconPosition="right"
        comboboxProps={{ shadow: 'md', position: 'bottom-end', width: 150 }}
        data={typeOption}
      />

      <span>算法</span>
      <Select
        size="sm"
        value={pm.func}
        onChange={v => v && setPM(prev => ({ ...prev, func: v }))}
        checkIconPosition="right"
        comboboxProps={{ shadow: 'md', position: 'bottom-end', width: 200 }}
        data={funcOption}
      />
      <Select
        size="sm"
        value={sd.func}
        onChange={v => v && setSD(prev => ({ ...prev, func: v }))}
        checkIconPosition="right"
        comboboxProps={{ shadow: 'md', position: 'bottom-end', width: 200 }}
        data={funcOption}
      />

      <span>系数</span>
      <input type="text" disabled value={pm.coef} />
      <input type="text" disabled value={sd.coef} />

      <span>迭代次数</span>
      <Select
        size="sm"
        value={pm.iter}
        onChange={v => v && setPM(prev => ({ ...prev, iter: v }))}
        checkIconPosition="right"
        comboboxProps={{ shadow: 'md' }}
        data={iterOption}
      />
      <Select
        size="sm"
        value={sd.iter}
        onChange={v => v && setSD(prev => ({ ...prev, iter: v }))}
        checkIconPosition="right"
        comboboxProps={{ shadow: 'md' }}
        data={iterOption}
      />
    </div>
  )
}
