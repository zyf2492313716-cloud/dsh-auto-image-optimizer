#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
CONFIG_FILE="${DSH_HOME}/config.yaml"
PLUGIN_TARGET="${DSH_HOME}/plugins/dsh-auto-image-optimizer"

echo "== 安装 dsh-auto-image-optimizer =="

# 1. 确保目标目录
mkdir -p "${DSH_HOME}/plugins"
mkdir -p "${PLUGIN_TARGET}"

# 2. 同步产物与配置
cp -R "${SCRIPT_DIR}/lib" "${PLUGIN_TARGET}/"
cp -f "${SCRIPT_DIR}/package.json" "${PLUGIN_TARGET}/"
cp -f "${SCRIPT_DIR}/auto-image-optimizer.cordis.yml" "${PLUGIN_TARGET}/"

# 3. 注册别名软链接
mkdir -p "$HOME/node_modules/@dsh-local"
ln -sf "${PLUGIN_TARGET}" "$HOME/node_modules/@dsh-local/dsh-auto-image-optimizer"

# 4. 配置挂载
mkdir -p "${DSH_HOME}"
touch "${CONFIG_FILE}"
if ! grep -q "auto-image-optimizer" "${CONFIG_FILE}" 2>/dev/null; then
  cat << 'ENTRY' >> "${CONFIG_FILE}"

- insert:
    - id: auto-image-optimizer
      name: '@dsh-local/dsh-auto-image-optimizer'
ENTRY
  echo "✅ 已向 ${CONFIG_FILE} 添加插件挂载配置"
else
  echo "ℹ️ ${CONFIG_FILE} 中已存在挂载配置，跳过写入"
fi

echo "🎉 安装完成，请重启 dsh web 并刷新页面生效"
