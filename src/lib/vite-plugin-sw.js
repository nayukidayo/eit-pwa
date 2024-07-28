import { readdir, stat, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { normalizePath } from 'vite'

export default function vitePluginSW() {
  let base, publicDir

  return {
    name: 'vite-plugin-sw',
    enforce: 'post',
    apply: 'build',

    configResolved(config) {
      base = config.base
      publicDir = config.publicDir
    },

    async generateBundle(_, assets) {
      const arr = await preCached(base, publicDir, Object.keys(assets))
      const head = `const PRE_CACHED = ${JSON.stringify(arr)}`
      const code = await readFile(new URL('./sw.js', import.meta.url), 'utf-8')
      this.emitFile({
        type: 'asset',
        fileName: 'sw.js',
        source: `${head}\n${code}`,
      })
    },
  }
}

async function preCached(base, publicDir, assets) {
  const arr = [base]
  const files = await readdir(publicDir, { recursive: true })
  for (const name of files) {
    const f = await stat(join(publicDir, name))
    if (f.isDirectory()) continue
    arr.push(normalizePath(base + name))
  }
  for (const name of assets) {
    arr.push(normalizePath(base + name))
  }
  return arr
}
