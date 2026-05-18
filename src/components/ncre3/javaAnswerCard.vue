<template>
  <div class="java-answer-card">
    <div class="card-header">
      <div class="title-section">
        <h3 class="card-title">{{ item.title }}</h3>
        <p class="card-desc">{{ item.description }}</p>
      </div>
      <div class="actions">
        <el-button :type="store.isLiked(item.id) ? 'warning' : 'default'" circle size="small" @click="toggleLike">
          <el-icon><Star /></el-icon>
        </el-button>
        <el-button :type="store.isWrong(item.id) ? 'danger' : 'default'" circle size="small" @click="toggleWrong">
          <el-icon><Flag /></el-icon>
        </el-button>
      </div>
    </div>

    <el-tabs v-model="activeTab" type="border-card" class="file-tabs">
      <el-tab-pane v-for="(file, idx) in item.files" :key="idx" :label="file.filename" :name="String(idx)">
        <codeBlock :code="file.code" :language="file.language" />
      </el-tab-pane>
    </el-tabs>

    <div v-if="item.screenshots && item.screenshots.length" class="screenshots">
      <h4>调试截图</h4>
      <div class="screenshot-grid">
        <el-image
          v-for="(ss, idx) in item.screenshots"
          :key="idx"
          :src="getScreenshotUrl(ss)"
          :preview-src-list="screenshotUrls"
          :initial-index="idx"
          fit="contain"
          class="screenshot-img"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Star, Flag } from '@element-plus/icons-vue'
import { useNcre3Store } from '@/stores/ncre3'
import codeBlock from './codeBlock.vue'

const store = useNcre3Store()
const props = defineProps({ item: { type: Object, required: true } })
const activeTab = ref('0')

function getScreenshotUrl(filename) {
  return new URL(`/src/assets/ncre3/img/${filename}`, import.meta.url).href
}

const screenshotUrls = computed(() =>
  (props.item.screenshots || []).map(ss => getScreenshotUrl(ss))
)

function toggleLike() {
  if (store.isLiked(props.item.id)) store.removeLike(props.item.id)
  else store.addLike(props.item)
}

function toggleWrong() {
  if (store.isWrong(props.item.id)) store.removeWrong(props.item.id)
  else store.addWrong(props.item)
}
</script>

<style lang="scss" scoped>
.java-answer-card {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 16px;

    .card-title {
      font-size: 16px;
      font-weight: bold;
      color: #333;
      margin: 0 0 4px 0;
    }

    .card-desc {
      font-size: 13px;
      color: #888;
      margin: 0;
    }
  }

  .file-tabs {
    border-radius: 12px;
    overflow: hidden;
    border: none;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  .screenshots {
    margin-top: 16px;

    h4 {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
    }

    .screenshot-grid {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;

      .screenshot-img {
        max-width: 300px;
        max-height: 200px;
        border-radius: 8px;
        border: 1px solid #eee;
        cursor: pointer;
      }
    }
  }
}
</style>
