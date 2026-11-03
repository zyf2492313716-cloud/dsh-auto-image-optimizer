import { test } from 'node:test'
import assert from 'node:assert/strict'

const handlers = new Map()
const dispatched = []
let createdCanvas = null

class FakeFile extends Blob {
  constructor(parts, name, opts = {}) {
    super(parts, { type: opts.type })
    this.name = name
    this.lastModified = opts.lastModified ?? Date.now()
  }
}

class FakeDataTransfer {
  constructor() {
    this.items = { add: () => {} }
    this.files = []
    this.data = new Map()
  }

  setData(type, value) {
    this.data.set(type, value)
  }
}

class FakeClipboardEvent {
  constructor(type, init = {}) {
    this.type = type
    Object.assign(this, init)
  }
}

globalThis.File = FakeFile
globalThis.DataTransfer = FakeDataTransfer
globalThis.ClipboardEvent = FakeClipboardEvent
globalThis.URL.createObjectURL = () => 'blob:fake'
globalThis.URL.revokeObjectURL = () => {}
globalThis.Image = class {
  set src(_value) {
    this.width = 4000
    this.height = 3000
    queueMicrotask(() => this.onload?.())
  }
}
globalThis.document = {
  activeElement: null,
  body: {},
  createElement(tag) {
    if (tag !== 'canvas') throw new Error(`unexpected element: ${tag}`)
    createdCanvas = {
      width: 0,
      height: 0,
      getContext: () => ({ imageSmoothingEnabled: false, imageSmoothingQuality: '', drawImage() {} }),
      toBlob(callback, type) {
        callback(new Blob(['x'], { type }))
      },
    }
    return createdCanvas
  },
}
globalThis.window = {
  __dsh_image_optimizer_installed__: false,
  addEventListener(type, handler) {
    handlers.set(type, handler)
  },
  dispatchEvent(event) {
    dispatched.push(event)
  },
}

await import('../src/client/index.js')

test('paste handler downsamples oversized screenshots before redispatch', async () => {
  const file = new FakeFile(['x'], 'huge.png', { type: 'image/png' })
  let prevented = false
  let stopped = false
  const target = {
    dispatchEvent(event) {
      dispatched.push(event)
    },
  }
  const event = {
    clipboardData: {
      items: [{ kind: 'file', type: 'image/png', getAsFile: () => file }],
      getData: () => '',
    },
    target,
    preventDefault() {
      prevented = true
    },
    stopImmediatePropagation() {
      stopped = true
    },
  }

  handlers.get('paste')(event)
  await new Promise((resolve) => setTimeout(resolve, 80))

  assert.equal(prevented, true)
  assert.equal(stopped, true)
  assert.equal(dispatched.length, 1)
  assert.equal(dispatched[0].type, 'paste')
  assert.equal(createdCanvas.width, 1999)
  assert.equal(createdCanvas.height, Math.round((3000 * 1999) / 4000))
})
