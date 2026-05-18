<template>
  <div class="code-block">
    <div class="code-header">
      <span class="lang-badge">{{ langLabel }}</span>
      <el-button size="small" text @click="copyCode">
        <el-icon><DocumentCopy /></el-icon>
        {{ copied ? '已复制' : '复制' }}
      </el-button>
    </div>
    <pre><code ref="codeRef" :class="'language-' + language">{{ code }}</code></pre>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import hljs from 'highlight.js/lib/core'
import sql from 'highlight.js/lib/languages/sql'
import java from 'highlight.js/lib/languages/java'
import xml from 'highlight.js/lib/languages/xml'
import { DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

hljs.registerLanguage('sql', sql)
hljs.registerLanguage('java', java)
hljs.registerLanguage('xml', xml)

const props = defineProps({
  code: { type: String, required: true },
  language: { type: String, default: 'sql' }
})

const codeRef = ref(null)
const copied = ref(false)

const langLabel = computed(() => {
  const map = { sql: 'SQL', java: 'Java', xml: 'XML' }
  return map[props.language] || props.language.toUpperCase()
})

function highlight() {
  if (codeRef.value) {
    const result = hljs.highlight(props.code, { language: props.language })
    codeRef.value.innerHTML = result.value
  }
}

async function copyCode() {
  try {
    await navigator.clipboard.writeText(props.code)
    copied.value = true
    ElMessage.success('代码已复制到剪贴板')
    setTimeout(() => { copied.value = false }, 2000)
  } catch {
    ElMessage.error('复制失败')
  }
}

onMounted(highlight)
watch(() => props.code, highlight)
</script>

<style lang="scss" scoped>
.code-block {
  border-radius: 12px;
  overflow: hidden;
  background: #1e1e2e;
  margin: 8px 0;

  .code-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 16px;
    background: #2a2a3e;

    .lang-badge {
      font-size: 12px;
      color: #a0a0b8;
      font-weight: bold;
      letter-spacing: 1px;
    }

    .el-button {
      color: #a0a0b8;
    }
  }

  pre {
    margin: 0;
    padding: 16px;
    overflow-x: auto;

    code {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 13px;
      line-height: 1.6;
      color: #cdd6f4;
      background: transparent;
    }
  }
}
</style>
<style>
@import 'highlight.js/styles/atom-one-dark.css';
</style>
