#!/usr/bin/env bash
set -euo pipefail

DSH_HOME="${DSH_HOME:-$HOME/.dsh}"
PLUGIN_NAME="dsh-auto-image-optimizer"
PLUGIN_TARGET="${DSH_HOME}/plugins/${PLUGIN_NAME}"

echo "== 卸载 ${PLUGIN_NAME} =="

rm -rf "${PLUGIN_TARGET}"
rm -f "$HOME/node_modules/@dsh-local/${PLUGIN_NAME}"

# 移除挂载条目。主位置是 cordis.patch.yml；config.yaml 是旧版脚本写过的位置，
# 0.2 起没有代码读它，但老用户可能残留，所以两边都清。
remove_entry() {
  local file="$1" label="$2"
  [ -f "${file}" ] || return 0
  grep -q "id: ${PLUGIN_NAME}" "${file}" 2>/dev/null || return 0
  cp "${file}" "${file}.bak.$(date +%s)"
  python3 - "${file}" "${PLUGIN_NAME}" <<'PYEOF'
import sys

path, name = sys.argv[1], sys.argv[2]
lines = open(path).read().split('\n')
kept, i = [], 0
while i < len(lines):
    # Drop a whole `- insert:` block whose list contains our id, keeping the rest.
    if lines[i].startswith('- insert:'):
        j = i + 1
        while j < len(lines) and (not lines[j].strip() or lines[j].startswith(('    ', '\t'))):
            j += 1
        block = '\n'.join(lines[i:j])
        if f'- id: {name}\n' in block + '\n':
            i = j
            continue
        kept.extend(lines[i:j])
        i = j
        continue
    kept.append(lines[i])
    i += 1
text = '\n'.join(kept)
# A comments-only (or empty) patch file fails boot: dsh requires a top-level
# YAML array. Collapse to `[]` when no entries remain.
if not any(ln.lstrip().startswith('- ') for ln in text.split('\n')):
    head = [ln for ln in text.split('\n') if ln.lstrip().startswith('#')]
    text = ('\n'.join(head).rstrip('\n') + '\n' if head else '') + '[]\n'
open(path, 'w').write(text)
PYEOF
  echo "✅ 已从 ${label} 移除挂载条目"
}

remove_entry "${DSH_HOME}/cordis.patch.yml" "cordis.patch.yml"
remove_entry "${DSH_HOME}/config.yaml" "config.yaml（旧版遗留）"

echo "🎉 卸载完成，重启 dsh web 生效"
