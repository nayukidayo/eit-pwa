import { createContext, useContext, useState, useRef } from 'react'

const initialStore = {
  // 设备连接
  connected: false,
  // 开始接收
  started: false,
  // 保存数据
  saving: false,
  // 回放数据
  importing: false,
  // 本地数据
  uellImporting: false,
  // 调试
  debug: false,
}

const StoreContext = createContext(initialStore)

export function StoreProvider({ children }) {
  const [store, setStore] = useState(initialStore)
  const mergeStore = obj => setStore(prev => ({ ...prev, ...obj }))
  return (
    <StoreContext.Provider value={{ store, setStore: mergeStore }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
