<script setup>
import modalImg from '@/assets/img/modal.png'
import { FEEDBACK_SURVEY_URL } from '@/config/feedback'

// 问卷链接统一维护在 @/config/feedback.js
function openSurvey() {
  window.open(FEEDBACK_SURVEY_URL, '_blank')
}
</script>

<template>
  <div class="feedback-page">
    <div class="feedback-card">
      <h2 class="feedback-title">意见与反馈</h2>
      <p class="feedback-desc">扫描下方二维码，填写问卷告诉我们您的建议和意见</p>
      <div class="qr-wrapper">
        <img :src="modalImg" alt="反馈问卷二维码" class="qr-image" />
      </div>
      <div class="feedback-action">
        <el-button type="primary" size="large" round @click="openSurvey">点击前往问卷</el-button>
      </div>
      <p class="feedback-hint">感谢您的反馈，帮助我们做得更好</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.feedback-page {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh;

  .feedback-card {
    background: #fff;
    border-radius: 20px;
    padding: 48px 56px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
    /* 顶部留白：配合垂直居中让卡片视觉重心略下移 */
    margin-top: 96px;

    .feedback-title {
      font-size: 28px;
      font-weight: bold;
      color: #333;
      margin: 0 0 12px 0;
    }

    .feedback-desc {
      font-size: 16px;
      color: #888;
      margin: 0 0 32px 0;
    }

    .qr-wrapper {
      display: inline-block;
      padding: 16px;
      background: #f9f9fb;
      border-radius: 16px;

      .qr-image {
        width: 280px;
        height: auto;
        border-radius: 8px;
      }
    }

    .feedback-action {
      margin-top: 28px;

      .el-button {
        font-weight: 600;
        padding: 20px 40px;
      }
    }

    .feedback-hint {
      font-size: 14px;
      color: #aaa;
      margin: 24px 0 0 0;
    }
  }
}
</style>
