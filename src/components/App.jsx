import { MantineProvider } from '@mantine/core'
import { StoreProvider, useStore } from '../lib/context.jsx'
import Box1 from './Box1.jsx'
import Box2 from './Box2.jsx'
import Box3 from './Box3.jsx'
import Box4 from './Box4.jsx'
import Box5 from './Box5.jsx'
import Box5Debug from './Box5-debug.jsx'
import Box6 from './Box6.jsx'
import Box7 from './Box7.jsx'
import theme from '../lib/theme.js'
import cs from './App.module.css'

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <StoreProvider>
        <div className={cs.q}>
          <Box1 />
          <Box2 />
          <Box3 />
          <Box4 />
          <Box5Wrapper />
          <Box6 />
          <Box7 />
        </div>
      </StoreProvider>
    </MantineProvider>
  )
}

function Box5Wrapper() {
  const { store } = useStore()
  return store.debug ? <Box5Debug /> : <Box5 />
}
