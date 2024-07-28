import { useEffect, useState, useRef } from 'react'
import { Button, Select, Loader, Menu, FileButton, Group, Popover } from '@mantine/core'
import { IconAlertCircle } from '@tabler/icons-react'
import ezusb from '../lib/ezusb.js'
import cs from './Box1.module.css'

const modeOption = [
  { value: '1', label: '模式一' },
  { value: '2', label: '模式二' },
  { value: '3', label: '模式三' },
  { value: '4', label: '模式四' },
  { value: '5', label: '模式五' },
  { value: '6', label: '模式六' },
  { value: '7', label: '模式七' },
  { value: '8', label: '模式八' },
]

export default function Box1() {
  const [connected, setConnected] = useState(false)
  const [cloading, setCloading] = useState(false)
  const [started, setStarted] = useState(false)
  const [mode, setMode] = useState('1')
  const [mloading, setMloading] = useState(false)
  const [uloading, setUloading] = useState(false)
  const [dev, setDev] = useState(false)

  const pmRef = useRef()
  const sdRef = useRef()

  const handleConnect = async () => {
    try {
      setCloading(true)
      await ezusb.connect()
    } catch (err) {
      console.log(err)
    } finally {
      setCloading(false)
    }
  }

  const handleModeChange = async value => {
    if (!value) return
    try {
      setMloading(true)
      await ezusb.setMode(value)
      setMode(value)
    } catch (err) {
      console.log(err)
    } finally {
      setMloading(false)
    }
  }

  const handleUrefMode7 = async () => {
    try {
      setUloading(true)
      setMloading(true)
      await ezusb.setMode('7')
      setMode('7')
    } catch (err) {
      console.log(err)
    } finally {
      setMloading(false)
      setUloading(false)
    }
  }

  const handlePMImport = file => {
    if (file === null) return
    ezusb.cirsImport('pm', file).finally(() => pmRef.current?.())
  }

  const handleSDImport = file => {
    if (file === null) return
    ezusb.cirsImport('sd', file).finally(() => sdRef.current?.())
  }

  useEffect(() => {
    const cbConn = ({ detail }) => setConnected(detail)
    const cbStart = ({ detail }) => setStarted(detail)
    ezusb.addEventListener('connected', cbConn)
    ezusb.addEventListener('started', cbStart)
    return () => {
      ezusb.removeEventListener('connected', cbConn)
      ezusb.removeEventListener('started', cbStart)
    }
  }, [])

  return (
    <div className={cs.q}>
      <span>连接设备</span>
      {connected ? (
        <Button
          size="compact-md"
          variant="light"
          color="red"
          disabled={started}
          onClick={ezusb.disconnect}
        >
          断开设备
        </Button>
      ) : (
        <Button size="compact-md" variant="light" loading={cloading} onClick={handleConnect}>
          连接设备
        </Button>
      )}
      <Group gap={5}>
        <span>检测模式</span>
        <Popover position="bottom-start" withArrow shadow="md">
          <Popover.Target>
            <IconAlertCircle size={20} color="#575757" />
          </Popover.Target>
          <Popover.Dropdown>
            <ul className={cs.u}>
              <li>模式一: 频差 10k-100k-LBP</li>
              <li>模式二: 频差 10k-50k-LBP</li>
              <li>模式三: 频差 10k-30k-LBP</li>
              <li>模式四: 频差 10k-100k-cgls</li>
              <li>模式五: 频差 10k-50k-cgls</li>
              <li>模式六: 频差 10k-30k-cgls</li>
              <li>模式七: 时差 10k-空场-LBP</li>
              <li>模式八: 时差 10k-测量-LBP</li>
            </ul>
          </Popover.Dropdown>
        </Popover>
      </Group>
      <div className={cs.s}>
        <Select
          size="sm"
          disabled={!connected || started || mloading}
          value={mode}
          onChange={handleModeChange}
          checkIconPosition="right"
          comboboxProps={{ shadow: 'md', width: 150 }}
          placeholder="检测模式"
          data={modeOption}
        />
        {mloading && <Loader className={cs.l} size={20} />}
      </div>
      <Button
        size="compact-md"
        variant="light"
        color={dev ? 'red' : 'blue'}
        onClick={() => setDev(prev => !prev)}
      >
        {dev ? '更少功能' : '更多功能'}
      </Button>
      {mode === '7' ? (
        <div className={cs.s}>
          <Button
            fullWidth
            size="compact-md"
            variant="light"
            disabled={!connected || uloading}
            onClick={handleUrefMode7}
          >
            空场标定
          </Button>
          {uloading && <Loader className={cs.l} size={20} />}
        </div>
      ) : started ? (
        <Button
          size="compact-md"
          variant="light"
          disabled={!connected}
          color="red"
          onClick={ezusb.stop}
        >
          暂停检测
        </Button>
      ) : (
        <Button size="compact-md" variant="light" disabled={!connected} onClick={ezusb.start}>
          开始检测
        </Button>
      )}
      {dev && (
        <Menu shadow="md" width={120}>
          <Menu.Target>
            <Button size="compact-md" variant="light" disabled={started}>
              CIRS导入
            </Button>
          </Menu.Target>
          <Menu.Dropdown>
            <FileButton accept=".txt" onChange={handlePMImport} resetRef={pmRef}>
              {props => (
                <Button {...props} size="compact-md" fullWidth variant="transparent">
                  平面CIRS
                </Button>
              )}
            </FileButton>
            <Menu.Divider />
            <FileButton accept=".txt" onChange={handleSDImport} resetRef={sdRef}>
              {props => (
                <Button {...props} size="compact-md" fullWidth variant="transparent">
                  深度CIRS
                </Button>
              )}
            </FileButton>
          </Menu.Dropdown>
        </Menu>
      )}
      {dev && (
        <Button size="compact-md" variant="light" disabled={!connected} onClick={ezusb.reset}>
          复位
        </Button>
      )}
      {dev && (
        <Button
          size="compact-md"
          variant="light"
          disabled={!connected || started}
          onClick={ezusb.imped}
        >
          阻抗测量
        </Button>
      )}
    </div>
  )
}
