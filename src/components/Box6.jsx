import { useEffect, useState } from 'react'
import { LineChart } from '@mantine/charts'
import ezusb from '../lib/ezusb.js'
import cs from './Box6.module.css'

const defaultData = [
  { name: '0', value: 0 },
  { name: '1', value: 0 },
]

export default function Box6() {
  const [data, setData] = useState(defaultData)
  const [withXAxis, setWithXAxis] = useState(false)

  useEffect(() => {
    const cb = ({ detail }) => {
      if (detail?.data) {
        setData(detail.data)
        setWithXAxis(Boolean(detail.withXAxis))
      } else {
        setData(defaultData)
        setWithXAxis(false)
      }
    }
    ezusb.addEventListener('chart', cb)
    return () => {
      ezusb.removeEventListener('chart', cb)
    }
  }, [])

  return (
    <div className={cs.q}>
      <LineChart
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
