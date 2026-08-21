#!/usr/bin/env bash
set -euo pipefail

DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
CONFIG_FILE="${DSH_HOME}/config.yaml"
PLUGIN_TARGET="${DSH_HOME}/plugins/dsh-auto-image-optimizer"

echo "== 卸载 dsh-auto-image-optimizer =="

rm -rf "${PLUGIN_TARGET}"
rm -f "$HOME/node_modules/@dsh-local/dsh-auto-image-optimizer"

if [ -f "${CONFIG_FILE}" ]; then
  # 移除配置中的挂载段落
  python3 -c "
import re
p = '${CONFIG_FILE}'
with open(p, 'r', encoding='utf-8') as f:
    text = f.read()
cleaned = re.sub(r'- insert:\s*\n\s*- id: auto-image-optimizer\s*\n\s*name: [^\n]+\n?', '', text)
with open(p, 'w', encoding='utf-8') as f:
    f.write(cleaned.strip() + '\n')
" 2>/dev/null || true
  echo "✅ 已从 ${CONFIG_FILE} 移除挂载配置"
fi

echo "🎉 卸载完成，重启 dsh web 生效"
