import { useRef, useState } from 'react'
import { FileButton, Button, Modal } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useStore } from '../lib/context.jsx'
import ezusb from '../lib/ezusb.js'
import { dateTimeFormat } from '../lib/utils.js'
import cs from './Box3.module.css'

export default function Box3() {
  const { store } = useStore()
  const [opened, { open, close }] = useDisclosure(false)
  const [storage, setStorage] = useState([])
  const pmRef = useRef()
  const sdRef = useRef()
  const urefRef = useRef()

  const handlePMImport = file => {
    ezusb.cirsImport('pm', file).finally(() => pmRef.current?.())
  }

  const handleSDImport = file => {
    ezusb.cirsImport('sd', file).finally(() => sdRef.current?.())
  }

  const handleFrameLoad = () => {
    setStorage(ezusb.frameLoad())
    open()
  }

  const handleFrameImport = v => {
    close()
    ezusb.frameImport(storage[v].data)
  }

  const handleUrefImport = file => {
    ezusb.urefImport(file).finally(() => urefRef.current?.())
  }

  return (
    <div className={cs.q}>
      <span className={cs.c}>平面</span>
      <span className={cs.c}>深度</span>
      <FileButton accept=".json" onChange={handlePMImport} resetRef={pmRef}>
        {props => (
          <Button {...props} size="compact-md" variant="light" disabled={store.started}>
            CirS导入
          </Button>
        )}
      </FileButton>
      <FileButton accept=".json" onChange={handleSDImport} resetRef={sdRef}>
        {props => (
          <Button {...props} size="compact-md" variant="light" disabled={store.started}>
            CirS导入
          </Button>
        )}
      </FileButton>
      <hr />
      <Button
        size="compact-md"
        variant="light"
        onClick={ezusb.frameMark}
        disabled={!ezusb.hasFrame() || store.started || store.importing || store.uellImporting}
      >
        空场标定
      </Button>
      <Button
        size="compact-md"
        variant="light"
        onClick={ezusb.frameSave}
        disabled={!ezusb.hasFrame() || store.started || store.importing || store.uellImporting}
      >
        空场保存
      </Button>
      <Button size="compact-md" variant="light" onClick={handleFrameLoad} disabled={store.started}>
        空场导入
      </Button>
      <FileButton accept=".json" onChange={handleUrefImport} resetRef={urefRef}>
        {props => (
          <Button {...props} size="compact-md" variant="light" disabled={store.started}>
            本地空场
          </Button>
        )}
      </FileButton>

      <Modal opened={opened} onClose={close} title="选择数据" closeOnClickOutside={false}>
        {storage.length === 0 && <div className={cs.t}>没有可用的数据</div>}
        {storage.map((v, i) => (
          <Button
            key={v.timestamp}
            mb="xs"
            fullWidth
            variant="default"
            onClick={() => handleFrameImport(i)}
          >
            {dateTimeFormat(v.timestamp)}
          </Button>
        ))}
      </Modal>
    </div>
  )
}
