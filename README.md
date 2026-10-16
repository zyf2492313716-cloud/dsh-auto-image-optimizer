# dsh-auto-image-optimizer

DeepSeek Harness (DSH) 客户端大图自动等比缩放与附件限制优化插件。

在浏览器端拦截超大截图（如 Mac Retina 2x/3x 全屏截图），在内存中等比下采样后再上传，避免触发 DSH 的图片准入拦截，同时显著减小上传体积。

---

## 背景

1. **Retina 截图很大**：macOS 视网膜屏按 2x/3x 渲染，全屏或大窗口截图单边尺寸常在 2800px ~ 6000px 量级，文件也大。
2. **DSH 有两道准入闸**（`packages/attachment/attachment-local`，两个都是可配置项）：
   - 单边像素上限 `maxImageDimension`，默认 **8192px**
   - 解码后总像素上限 `maxImagePixels`，默认 **64,000,000**

   超限时前端会提示 `图片宽高不能超过 {size}px，请缩小后重试`（`{size}` 填入当时的上限值）。

本插件在前端输入层做事件拦截，把超限图片等比下采样至 1999px 以内再交给上传流程，用户复制粘贴即发，不必手动裁切或压缩。

> **版本提示**：早期 DSH 的单边上限是 2000px，本插件的 1999px 目标值就是从那时来的。
> 现在默认已放宽到 8192px，因此只有超大截图才会真正触发拦截——但下采样仍有两个实际
> 收益：**明显更小的上传体积**，以及**不依赖服务端上限恰好被调高**。
>
> 如果你的图片确实需要保留 8192px 以上的原图细节，正确做法是调整服务端配置项
> （`maxImageDimension` / `maxImagePixels`），而不是在前端绕开——本插件只做缩小，不做放大。

---

## 工作机制

- **全局事件捕获**：在捕获阶段同步拦截 `paste`（剪贴板粘贴）与 `drop`（拖拽上传）事件；
- **内存平滑下采样**：检测到单边超过 1999px 的图片时，利用离屏 Canvas 保持高清晰度等比缩放；
- **单次安全分发**：生成合规的图片 Blob 后重新派发合成事件，杜绝重复上传。

---

## 系统要求

- DeepSeek Harness (`dsh`) 运行环境
- Node.js ≥ 20

---

## 安装

### 方式一：一键脚本（推荐）

```bash
git clone https://github.com/zyf2492313716-cloud/dsh-auto-image-optimizer.git
cd dsh-auto-image-optimizer
./install.sh
```

安装脚本会自动将产物同步至 `$DSH_HOME/plugins/`，并在 `$DSH_HOME/cordis.patch.yml`
（home 级 patch 层，对所有 profile 生效）中注册挂载条目，原文件会先备份。

> **如果你之前用旧版脚本装过**：旧脚本把条目写进了 `$DSH_HOME/config.yaml`，而 0.2 起
> 没有任何代码读那个文件——写进去不报错，但插件永远不会加载。重新执行一次
> `./install.sh` 即可补上正确的条目。脚本用绝对路径注册（不依赖 profile 的包解析），
> 因此在 web / desktop 任一 profile 下都能加载。

### 方式二：DSH 插件命令

```bash
dsh plugin --profile web add .
```

安装完成后，重启 `dsh web` 并刷新浏览器页面生效。

---

## 卸载

```bash
cd dsh-auto-image-optimizer
./uninstall.sh
```

---

## License

MIT
