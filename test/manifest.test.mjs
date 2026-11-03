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

test('manifest declares the tested DSH release and low-risk permissions', () => {
  assert.equal(pkg.dsh.compatibility.dshReleases['0.2.1-rc.5'], 'compatible')
  assert.ok(pkg.files.includes('lib'))
  assert.ok(pkg.files.includes('auto-image-optimizer.cordis.yml'))
})
