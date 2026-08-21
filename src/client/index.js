/**
 * @dsh-local/dsh-auto-image-optimizer
 * 客户端图片上传优化器：全局同步拦截超大截图与图片，自动在内存中高质量等比缩放至 1999px 安全尺寸。
 */

const MAX_SAFE_DIMENSION = 1999

async function optimizeImageFile(file) {
  if (!file.type.startsWith('image/')) return file

  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const img = new Image()

    img.onload = () => {
      URL.revokeObjectURL(url)
      const { width, height } = img

      if (Math.max(width, height) <= MAX_SAFE_DIMENSION) {
        resolve(file)
        return
      }

      const scale = MAX_SAFE_DIMENSION / Math.max(width, height)
      const targetW = Math.max(1, Math.round(width * scale))
      const targetH = Math.max(1, Math.round(height * scale))

      const canvas = document.createElement('canvas')
      canvas.width = targetW
      canvas.height = targetH

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(file)
        return
      }

      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'
      ctx.drawImage(img, 0, 0, targetW, targetH)

      const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg'
      const quality = outputType === 'image/jpeg' ? 0.92 : undefined

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          resolve(
            new File([blob], file.name || 'screenshot.png', {
              type: outputType,
              lastModified: Date.now(),
            })
          )
        },
        outputType,
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      resolve(file)
    }

    img.src = url
  })
}

function initImageOptimizer() {
  if (typeof window === 'undefined' || window.__dsh_image_optimizer_installed__) return
  window.__dsh_image_optimizer_installed__ = true

  // 1. 全局拦截剪贴板粘贴（Cmd + V）
  window.addEventListener(
    'paste',
    (e) => {
      if (e.__dsh_optimized__) return

      const clipboardData = e.clipboardData
      if (!clipboardData || !clipboardData.items) return

      const imageItems = Array.from(clipboardData.items).filter(
        (item) => item.kind === 'file' && item.type.startsWith('image/')
      )
      if (imageItems.length === 0) return

      const files = imageItems.map((item) => item.getAsFile()).filter(Boolean)
      const text = clipboardData.getData('text/plain') || ''

      // 同步切断默认冒泡，避免原生重复接收
      e.preventDefault()
      e.stopImmediatePropagation()

      const target = e.target || document.activeElement || document.body
      Promise.all(files.map((f) => optimizeImageFile(f))).then((optimizedFiles) => {
        const dt = new DataTransfer()
        for (const f of optimizedFiles) dt.items.add(f)
        if (text) dt.setData('text/plain', text)

        const syntheticEvent = new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: dt,
        })
        syntheticEvent.__dsh_optimized__ = true
        target.dispatchEvent(syntheticEvent)
      })
    },
    true
  )

  // 2. 全局拦截拖拽上传（Drop）
  window.addEventListener(
    'drop',
    (e) => {
      if (e.__dsh_optimized__) return

      const dt = e.dataTransfer
      if (!dt || !dt.files || dt.files.length === 0) return

      const imageFiles = Array.from(dt.files).filter((f) => f.type.startsWith('image/'))
      if (imageFiles.length === 0) return

      e.preventDefault()
      e.stopImmediatePropagation()

      const target = e.target || document.body
      Promise.all(imageFiles.map((f) => optimizeImageFile(f))).then((optimizedFiles) => {
        const newDt = new DataTransfer()
        for (const f of optimizedFiles) newDt.items.add(f)

        const syntheticEvent = new DragEvent('drop', {
          bubbles: true,
          cancelable: true,
          dataTransfer: newDt,
        })
        syntheticEvent.__dsh_optimized__ = true
        target.dispatchEvent(syntheticEvent)
      })
    },
    true
  )
}

initImageOptimizer()

export function apply() {
  initImageOptimizer()
}
