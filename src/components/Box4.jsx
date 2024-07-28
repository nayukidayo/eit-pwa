import { useEffect, useState } from 'react'
import { LineChart } from '@mantine/charts'
import ezusb from '../lib/ezusb.js'
import cs from './Box4.module.css'

const initialData = [
  { name: '0', value: 0 },
  { name: '1', value: 0 },
]

export default function Box4() {
  const [data, setData] = useState(initialData)
  const [withXAxis, setWithXAxis] = useState(false)

  useEffect(() => {
    const cb = ({ detail }) => {
      const chart = new Array(detail.length)
      for (let i = 0; i < detail.length; i++) {
        chart[i] = { name: i.toString(), value: detail[i] }
      }
      setData(chart)
      setWithXAxis(false)
    }
    ezusb.addEventListener('uell', cb)
    return () => {
      ezusb.removeEventListener('uell', cb)
    }
  }, [])

  useEffect(() => {
    const cb = ({ detail }) => {
      setData(detail)
      setWithXAxis(true)
    }
    ezusb.addEventListener('imped', cb)
    return () => {
      ezusb.removeEventListener('imped', cb)
    }
  }, [])

  useEffect(() => {
    const cb = () => {
      setData(initialData)
      setWithXAxis(false)
    }
    ezusb.addEventListener('reset', cb)
    return () => {
      ezusb.removeEventListener('reset', cb)
    }
  }, [])

  return (
    <div className={cs.q}>
      <LineChart
        h={'80%'}
        data={data}
        dataKey="name"
        series={[{ name: 'value', color: 'red.6' }]}
        curveType="linear"
        tickLine="none"
        withDots={false}
        withTooltip={false}
        withXAxis={withXAxis}
        yAxisProps={{
          domain: ['dataMin', 'auto'],
          interval: 'preserveStartEnd',
        }}
      />
    </div>
  )
}
