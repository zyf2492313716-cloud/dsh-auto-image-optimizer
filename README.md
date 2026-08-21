# dsh-auto-image-optimizer

DeepSeek Harness (DSH) 客户端大图自动等比缩放与附件限制优化插件。

在浏览器端拦截超大截屏（如 Mac Retina 2x/3x 截屏或 4K 图片），自动在内存中等比下采样至安全分辨率，解决上传图片时提示“图片宽高不能超过 2000px，请缩小后重试”的问题。

---

## 背景

1. **Retina 截屏超标**：macOS 默认开启视网膜双倍像素渲染，全屏或大窗口截图单边尺寸通常在 2800px ~ 3024px 左右。
2. **DSH 准入限制**：DSH 默认将单张图片最大单边限制为 2000px，直接粘贴或上传超标图片会触发拦截报错。

本插件在前端输入层进行事件拦截，将超标图片实时等比下采样至 1999px 以内，用户复制粘贴即发，无需借助外部工具手动裁切或压缩。

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

安装脚本会自动将产物同步至 `$DSH_HOME/plugins/`，并在 `$DSH_HOME/config.yaml` 中注册挂载条目。

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
