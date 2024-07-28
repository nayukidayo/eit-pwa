import { createTheme, rem, Button, Select } from '@mantine/core'

const theme = createTheme({
  focusRing: 'never',
  fontFamily: 'system-ui',
  headings: { fontFamily: 'system-ui' },
  components: {
    Button: Button.extend({
      vars: (_, props) => {
        if (props.size === 'compact-md') {
          return {
            root: {
              fontWeight: 'normal',
            },
          }
        }
        return {}
      },
    }),
    Select: Select.extend({
      vars: (_, props) => {
        if (props.size === 'sm') {
          return {
            input: {
              '--input-size': rem(30),
              '--input-height': rem(30),
              '--input-fz': rem(16),
            },
            option: {
              '--combobox-option-fz': rem(16),
            },
          }
        }
        return {}
      },
    }),
  },
})

export default theme
