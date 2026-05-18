<template>
  <div class="ncre3-home-content">
    <h1 class="page-title">计算机三级实操题库</h1>
    <p class="page-desc">全国计算机等级考试三级 - 软件测试技术答案参考</p>

    <div class="category-grid">
      <div v-for="cat in categories" :key="cat.key" class="category-card" @click="$router.push(`/ncre3/${cat.key}`)">
        <div class="icon-circle" :style="{ background: cat.color }">
          <el-icon :size="32" color="#fff"><component :is="cat.icon" /></el-icon>
        </div>
        <h3 class="cat-title">{{ cat.label }}</h3>
        <p class="cat-desc">{{ cat.desc }}</p>
        <div class="cat-count">{{ cat.count }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Coin, Connection, Cpu, Edit, DataAnalysis } from '@element-plus/icons-vue'

const categories = [
  {
    key: 'sql',
    label: 'SQL 数据库题',
    desc: 'MySQL 数据库操作，包括外键约束、查询、更新等',
    icon: Coin,
    color: '#6C5DD3',
    count: '49 题 / 5 套'
  },
  {
    key: 'java_network',
    label: 'Java 网络编程',
    desc: 'TCP/UDP Socket 编程，多线程通信',
    icon: Connection,
    color: '#4ECDC4',
    count: '5 套'
  },
  {
    key: 'java_debug',
    label: 'Java 调试题',
    desc: '数组处理、字符串操作、文件读写、文本分析',
    icon: Cpu,
    color: '#FF6B6B',
    count: '5 套'
  },
  {
    key: 'uml',
    label: 'UML 设计题',
    desc: '类图、ER图、状态机图等 UML 建模',
    icon: Edit,
    color: '#FFD93D',
    count: '10 套'
  },
  {
    key: 'software_testing',
    label: '软件测试题',
    desc: '表单验证测试用例设计（等价类/边界值）',
    icon: DataAnalysis,
    color: '#95E1D3',
    count: '5 套'
  }
]
</script>

<style lang="scss" scoped>
.ncre3-home-content {
  max-width: 900px;
  margin: 0 auto;

  .page-title {
    font-size: 28px;
    font-weight: bold;
    color: #333;
    margin-bottom: 8px;
  }

  .page-desc {
    font-size: 15px;
    color: #888;
    margin-bottom: 32px;
  }

  .category-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
    gap: 20px;
  }

  .category-card {
    background: #fff;
    border-radius: 20px;
    padding: 28px 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    cursor: pointer;
    transition: all 0.3s;
    position: relative;
    overflow: hidden;

    &:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(108, 93, 211, 0.15);
    }

    .icon-circle {
      width: 56px;
      height: 56px;
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 16px;
    }

    .cat-title {
      font-size: 17px;
      font-weight: bold;
      color: #333;
      margin: 0 0 8px 0;
    }

    .cat-desc {
      font-size: 13px;
      color: #888;
      margin: 0;
      line-height: 1.6;
    }

    .cat-count {
      position: absolute;
      top: 20px;
      right: 20px;
      font-size: 12px;
      color: #aaa;
      background: #f5f5fa;
      padding: 4px 10px;
      border-radius: 8px;
    }
  }
}
</style>
