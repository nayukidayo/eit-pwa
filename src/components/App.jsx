import { MantineProvider } from '@mantine/core'
import Box1 from './Box1.jsx'
import Box2 from './Box2.jsx'
import Box3 from './Box3.jsx'
import Box4 from './Box4.jsx'
import theme from '../lib/theme.js'
import cs from './App.module.css'

export default function App() {
  return (
    <MantineProvider theme={theme}>
      <div className={cs.q}>
        <Box1 />
        <Box2 />
        <Box3 />
        <Box4 />
      </div>
    </MantineProvider>
  )
}
