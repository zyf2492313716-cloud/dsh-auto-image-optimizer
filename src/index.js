/**
 * @dsh-local/dsh-auto-image-optimizer
 * DSH 智能图片上传优化器：自动下采样 Retina/4K 截屏，放宽大图限制
 */

export const name = 'auto-image-optimizer'

export function apply(ctx) {
  // 服务端生命周期：尝试放宽本地附件服务的最大尺寸限制
  ctx.on('ready', () => {
    try {
      const attachments = ctx.get ? ctx.get('attachments') : ctx.attachments
      if (attachments && attachments.imageLimits) {
        // 若属性可配置，放宽至 4096px
        try {
          if (attachments.imageLimits.maxImageDimension < 4096) {
            attachments.imageLimits.maxImageDimension = 4096
          }
        } catch {
          // Object.freeze 保护时静默跳过，前端 Canvas 会严格保障在 2000px 安全阈值内
        }
      }
    } catch {}
  })
}
