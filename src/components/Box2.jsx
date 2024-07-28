import { useEffect, useState, useRef } from 'react'
import { FileButton, Button, Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useStore } from '../lib/context.jsx'
import ezusb from '../lib/ezusb.js'
import { dateTimeFormat } from '../lib/utils.js'
import cs from './Box2.module.css'

export default function Box2() {
  const { store, setStore } = useStore()
  const [opened, { open, close }] = useDisclosure(false)
  const [storage, setStorage] = useState([])
  const uellRef = useRef(null)

  const handleLoad = () => {
    setStorage(ezusb.load())
    open()
  }

  const handleImport = async i => {
    close()
    setStore({ importing: true })
    await ezusb.import(storage[i].data).catch(() => {})
    setStore({ importing: false })
  }

  const handleUellImport = async file => {
    setStore({ uellImporting: true })
    await ezusb.uellImport(file)
    uellRef.current?.()
    setStore({ uellImporting: false })
  }

  useEffect(() => {
    if (!store.saving) return
    const data = []
    ezusb.reseted = false
    const cb = ({ detail }) => {
      if (ezusb.reseted) {
        setStore({ saving: false })
        return
      }
      if (data.length < 400) {
        data.push(detail)
      } else {
        ezusb.save(data)
        setStore({ saving: false })
      }
    }
    ezusb.addEventListener('save', cb)
    return () => {
      ezusb.removeEventListener('save', cb)
    }
  }, [store.saving])

  useEffect(() => {
    const cb = ({ detail }) => {
      setStore({ started: detail })
      if (!detail) setStore({ saving: false })
    }
    ezusb.addEventListener('started', cb)
    return () => {
      ezusb.removeEventListener('started', cb)
    }
  }, [])

  return (
    <div className={cs.q}>
      <Button
        size="compact-md"
        variant="light"
        onClick={ezusb.start}
        disabled={!store.connected || store.started || store.importing || store.uellImporting}
      >
        开始接收
      </Button>
      <Button
        size="compact-md"
        variant="light"
        onClick={ezusb.stop}
        disabled={!store.started || store.saving}
      >
        暂停接收
      </Button>
      <Button
        size="compact-md"
        variant="light"
        onClick={() => setStore({ saving: true })}
        disabled={!store.started}
        loading={store.saving}
      >
        保存数据
      </Button>
      <Button
        size="compact-md"
        variant="light"
        onClick={handleLoad}
        disabled={store.started || store.uellImporting}
        loading={store.importing}
      >
        回放数据
      </Button>
      <Button
        size="compact-md"
        variant="light"
        onClick={ezusb.imped}
        disabled={!store.connected || store.started || store.importing || store.uellImporting}
      >
        阻抗测量
      </Button>
      <FileButton accept=".json" onChange={handleUellImport} resetRef={uellRef}>
        {props => (
          <Button
            {...props}
            size="compact-md"
            variant="light"
            disabled={store.started || store.importing}
            loading={store.uellImporting}
          >
            本地数据
          </Button>
        )}
      </FileButton>
      <Button
        size="compact-md"
        variant="light"
        onClick={() => setStore({ debug: !store.debug })}
        color={store.debug ? 'red' : 'blue'}
      >
        {store.debug ? '关闭调试' : '打开调试'}
      </Button>
      <Button size="compact-md" variant="light" onClick={ezusb.reset}>
        复位
      </Button>

      <Modal opened={opened} onClose={close} title="选择回放数据" closeOnClickOutside={false}>
        {storage.length === 0 && <div className={cs.t}>没有可用的数据</div>}
        {storage.map((v, i) => (
          <Button
            key={v.timestamp}
            mb="xs"
            fullWidth
            variant="default"
            onClick={() => handleImport(i)}
          >
            {dateTimeFormat(v.timestamp)}
          </Button>
        ))}
      </Modal>
    </div>
  )
}
