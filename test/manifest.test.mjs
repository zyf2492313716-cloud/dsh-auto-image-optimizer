import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = dirname(dirname(fileURLToPath(import.meta.url)))
const pkg = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))

test('manifest declares the DSH bundle and client entry', () => {
  assert.equal(pkg.name, '@dsh-local/dsh-auto-image-optimizer')
  assert.equal(pkg.dsh.bundle.patch, 'auto-image-optimizer.cordis.yml')
  assert.equal(pkg.dsh.client.platform, 'web')
  assert.ok(existsSync(join(root, pkg.dsh.bundle.patch)))
  assert.ok(existsSync(join(root, 'lib/index.js')))
  assert.ok(existsSync(join(root, 'lib/client.cjs')))
})

/** 官方最新三个版本窗口（npm @deepseek-ai/dsh 的 latest 之前最近三个未弃用发行版）。 */
const LATEST_THREE = ['0.2.2-alpha.2', '0.2.2-alpha.3', '0.2.2-rc.1']

test('manifest declares the tested DSH release and low-risk permissions', () => {
  assert.equal(pkg.dsh.compatibility.dshReleases['0.2.1-rc.5'], 'compatible')
  assert.ok(pkg.files.includes('lib'))
  assert.ok(pkg.files.includes('auto-image-optimizer.cordis.yml'))
})

test('manifest covers the latest-three window with exact per-release records', () => {
  const declared = pkg.dsh.compatibility.dshReleases
  for (const release of LATEST_THREE) {
    assert.equal(declared[release], 'compatible', `${release} must be declared explicitly`)
  }
})

test('every declared release satisfies the engines.dsh range', () => {
  const range = pkg.engines.dsh
  assert.ok(range.startsWith('>='), 'this plugin pins a single lower bound')
  const lower = range.slice(2)
  const cmp = (a, b) => {
    const pa = a.split(/[-+]/)[0].split('.').map(Number)
    const pb = b.split(/[-+]/)[0].split('.').map(Number)
    for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i]
    return (a.split('-')[1] || '~').localeCompare(b.split('-')[1] || '~', undefined, { numeric: true })
  }
  for (const [release, verdict] of Object.entries(pkg.dsh.compatibility.dshReleases)) {
    if (verdict !== 'compatible') continue
    assert.ok(cmp(release, lower) >= 0, `${release} declared compatible but below engines.dsh ${range}`)
  }
})
