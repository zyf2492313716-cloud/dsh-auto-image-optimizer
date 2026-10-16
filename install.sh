#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
PLUGIN_NAME="dsh-auto-image-optimizer"
PLUGIN_TARGET="${DSH_HOME}/plugins/${PLUGIN_NAME}"
PATCH_FILE="${DSH_HOME}/cordis.patch.yml"

echo "== 安装 ${PLUGIN_NAME} =="

# 1. 确保目标目录
mkdir -p "${DSH_HOME}/plugins"
mkdir -p "${PLUGIN_TARGET}"

# 2. 同步产物与配置
cp -R "${SCRIPT_DIR}/lib" "${PLUGIN_TARGET}/"
cp -f "${SCRIPT_DIR}/package.json" "${PLUGIN_TARGET}/"
cp -f "${SCRIPT_DIR}/auto-image-optimizer.cordis.yml" "${PLUGIN_TARGET}/"

# 3. 注册别名软链接
mkdir -p "$HOME/node_modules/@dsh-local"
ln -sf "${PLUGIN_TARGET}" "$HOME/node_modules/@dsh-local/${PLUGIN_NAME}"

# 4. 注册挂载条目
# 写 $DSH_HOME/cordis.patch.yml，不要写 config.yaml —— 0.2 起没有任何代码读
# config.yaml，写进去不报错但永远不生效（表现为"装完了插件却不存在"）。
python3 - "${PATCH_FILE}" "${PLUGIN_NAME}" "${PLUGIN_TARGET}/lib/index.js" <<'PYEOF'
import sys, os, re, shutil, time

path, plugin_id, entry_name = sys.argv[1], sys.argv[2], sys.argv[3]

text = ''
if os.path.exists(path):
    shutil.copy2(path, f"{path}.bak.{int(time.time())}")
    text = open(path).read()

if re.search(rf'^\s*-\s*id:\s*{re.escape(plugin_id)}\s*$', text, re.M):
    print(f'[skip] {path} 已含 {plugin_id} 条目')
    sys.exit(0)

# 剥掉独立的 `[]`：DSH 自己生成的 patch 模板就是「注释头 + []」，
# 在它后面直接追加 `- insert:` 会变成两个 YAML 文档，解析失败会让 DSH 起不来。
lines = [ln for ln in text.split('\n') if ln.strip() != '[]']
body = '\n'.join(lines).rstrip('\n')

block = (
    f"\n- insert:\n"
    f"    - id: {plugin_id}\n"
    f"      name: '{entry_name}'\n"
)

if not re.search(r'^\s*-\s', body, re.M):
    body = '\n'.join(ln for ln in lines if ln.strip().startswith('#'))
    body = body.rstrip('\n') + '\n' if body.strip() else ''

open(path, 'w').write(body + block)
print(f'[ok] {path} 已添加挂载条目')
PYEOF

echo "✅ 安装完成，请重启 dsh web 并刷新页面生效"
echo "   （若此前用旧版脚本装过，本次已把条目补写到 ${PATCH_FILE}）"
