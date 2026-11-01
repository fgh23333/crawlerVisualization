<template>
    <div id="statsView">
        <div class="stats-header">
            <div class="titleCover">
                <h2 class="pageTitle">学习统计</h2>
                <p class="subtitle">
                    数据保存在本机浏览器 · 已索引 {{ indexedCount }} 题元数据
                    <span v-if="indexStatus.building" class="indexing">（正在扫描本地缓存 {{ indexStatus.done }}/{{ indexStatus.total }}）</span>
                </p>
            </div>
            <el-button size="small" :loading="onlineLoading" @click="enrichOnline">联网补全部科目题库</el-button>
        </div>

        <el-empty v-if="!hasRecords" description="暂无学习记录，去题库刷几题再来看看吧" :image-size="100" />

        <template v-else>
            <!-- KPI 概览 -->
            <div class="kpi-row">
                <div class="kpi-tile">
                    <div class="kpi-num">{{ kpis ? kpis.totalAttempts : '—' }}</div>
                    <div class="kpi-label">累计作答</div>
                </div>
                <div class="kpi-tile">
                    <div class="kpi-num">{{ kpis && kpis.accuracy !== null ? accuracyText(kpis.accuracy) : '—' }}</div>
                    <div class="kpi-label">总体正确率</div>
                </div>
                <router-link to="/newHome/favorites" class="kpi-tile link">
                    <div class="kpi-num">{{ kpis ? kpis.dueCount : '—' }}</div>
                    <div class="kpi-label">待复习题 · 去复习</div>
                </router-link>
                <div class="kpi-tile">
                    <div class="kpi-num">{{ kpis ? kpis.examCount : '—' }}</div>
                    <div class="kpi-label">考试场次</div>
                </div>
            </div>

            <!-- 考试成绩趋势 -->
            <div class="stats-card">
                <div class="card-head">
                    <span class="card-title">考试成绩趋势</span>
                    <el-select v-model="trendLesson" size="small" style="width: 130px">
                        <el-option v-for="opt in subjectOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
                    </el-select>
                </div>
                <svg v-if="trendGeom" class="trend-svg" :viewBox="`0 0 ${trendGeom.W} ${trendGeom.H}`" role="img"
                    aria-label="考试成绩趋势图">
                    <!-- 纵轴网格线与刻度（0-100% 得分率） -->
                    <g v-for="gl in trendGeom.ylabels" :key="'y' + gl.text">
                        <line :x1="trendGeom.padL" :x2="trendGeom.W - trendGeom.padR" :y1="gl.y" :y2="gl.y"
                            stroke="#ececf4" stroke-width="1" />
                        <text :x="trendGeom.padL - 8" :y="gl.y + 4" text-anchor="end" class="axis-text">{{ gl.text }}</text>
                    </g>
                    <!-- 折线主序列 -->
                    <polyline :points="trendGeom.path" fill="none" stroke="#6C5DD3" stroke-width="2"
                        stroke-linejoin="round" stroke-linecap="round" />
                    <!-- 逐点标记：原生 title 作悬停提示（SVG 内最稳） -->
                    <circle v-for="(c, i) in trendGeom.coords" :key="'p' + i" :cx="c.cx" :cy="c.cy" r="4" fill="#6C5DD3"
                        stroke="#fff" stroke-width="1.5">
                        <title>{{ c.p.date }} · {{ c.p.label }}{{ paperLabel(c.p.paperId) }} · {{ c.p.score }}/{{ c.p.total }}（{{ c.p.rate }}%）</title>
                    </circle>
                    <!-- 稀疏横轴日期标签 -->
                    <text v-for="(xl, i) in trendGeom.xlabels" :key="'x' + i" :x="xl.x" :y="trendGeom.H - 10"
                        text-anchor="middle" class="axis-text">{{ xl.text }}</text>
                </svg>
                <el-empty v-else description="还没有考试记录，去侧栏「在线练习」考一场吧" :image-size="80" />
                <div v-if="trend.summary.count" class="trend-summary">
                    共 {{ trend.summary.count }} 场 · 平均得分率 {{ trend.summary.avgRate }}%
                    <span v-if="trendTruncated" class="muted">（仅展示最近 {{ trendGeom.coords.length }} 场）</span>
                </div>
            </div>

            <!-- 科目正确率 -->
            <div class="stats-card">
                <div class="card-head">
                    <span class="card-title">科目正确率</span>
                </div>
                <div v-if="subjectRows.length" class="bar-list">
                    <div v-for="row in subjectRows" :key="row.subject" class="bar-row">
                        <span class="bar-label">{{ row.label }}</span>
                        <div class="bar-track">
                            <div class="bar-fill" :style="{ width: pct(row.accuracy) }"></div>
                        </div>
                        <span class="bar-value">{{ accuracyText(row.accuracy) }} · {{ row.attempted }} 次作答</span>
                    </div>
                </div>
                <el-empty v-else description="暂无科目作答数据" :image-size="60" />
                <div v-if="subjectUncovered > 0" class="footnote">另有 {{ subjectUncovered }} 条作答记录暂无法归入九科（如计算机三级题，不计入上图）</div>
            </div>

            <!-- 题型正确率 -->
            <div class="stats-card">
                <div class="card-head">
                    <span class="card-title">题型正确率</span>
                </div>
                <div v-if="typeRows.length" class="bar-list">
                    <div v-for="row in typeRows" :key="row.type" class="bar-row">
                        <span class="bar-label">{{ row.type }}</span>
                        <div class="bar-track">
                            <div class="bar-fill" :style="{ width: pct(row.accuracy) }"></div>
                        </div>
                        <span class="bar-value">{{ accuracyText(row.accuracy) }} · {{ row.attempted }} 次作答</span>
                    </div>
                </div>
                <el-empty v-else description="暂无题型作答数据" :image-size="60" />
            </div>

            <!-- 正确率榜单 -->
            <div class="rank-grid">
                <div class="stats-card">
                    <div class="card-head">
                        <span class="card-title">正确率最低 TOP10</span>
                        <el-select :model-value="worstMinAttempts" size="small" style="width: 120px"
                            @update:model-value="worstMinAttempts = $event">
                            <el-option :value="3" label="最少 3 次作答" />
                            <el-option :value="5" label="最少 5 次作答" />
                            <el-option :value="10" label="最少 10 次作答" />
                        </el-select>
                    </div>
                    <div v-if="worstRows.length" class="rank-list">
                        <div v-for="(row, i) in worstRows" :key="row.id" class="rank-row">
                            <span class="rank-no" :class="{ top: i < 3 }">{{ i + 1 }}</span>
                            <div class="rank-main">
                                <div class="rank-stem" :class="{ unknown: !row.stem }" :title="row.stem || row.id">
                                    {{ row.stem ? row.stem : `题目 ${row.id}（题干待补全）` }}
                                </div>
                                <div class="rank-meta">
                                    <el-tag size="small" effect="plain" type="info">{{ row.label }}{{ row.type ? ' · ' + row.type : '' }}</el-tag>
                                    <el-tag v-if="row.due" size="small" effect="plain" type="warning">待复习</el-tag>
                                </div>
                            </div>
                            <div class="rank-score">
                                <span class="acc">{{ accuracyText(row.accuracy) }}</span>
                                <span class="att">{{ row.attempted }} 次</span>
                            </div>
                        </div>
                    </div>
                    <el-empty v-else :description="`暂无作答满 ${worstMinAttempts} 次的题目`" :image-size="60" />
                </div>

                <div class="stats-card">
                    <div class="card-head">
                        <span class="card-title">正确率最高 TOP10</span>
                        <el-select :model-value="bestMinAttempts" size="small" style="width: 120px"
                            @update:model-value="bestMinAttempts = $event">
                            <el-option :value="3" label="最少 3 次作答" />
                            <el-option :value="5" label="最少 5 次作答" />
                            <el-option :value="10" label="最少 10 次作答" />
                        </el-select>
                    </div>
                    <div v-if="bestRows.length" class="rank-list">
                        <div v-for="(row, i) in bestRows" :key="row.id" class="rank-row">
                            <span class="rank-no" :class="{ top: i < 3 }">{{ i + 1 }}</span>
                            <div class="rank-main">
                                <div class="rank-stem" :class="{ unknown: !row.stem }" :title="row.stem || row.id">
                                    {{ row.stem ? row.stem : `题目 ${row.id}（题干待补全）` }}
                                </div>
                                <div class="rank-meta">
                                    <el-tag size="small" effect="plain" type="info">{{ row.label }}{{ row.type ? ' · ' + row.type : '' }}</el-tag>
                                </div>
                            </div>
                            <div class="rank-score">
                                <span class="acc">{{ accuracyText(row.accuracy) }}</span>
                                <span class="att">{{ row.attempted }} 次</span>
                            </div>
                        </div>
                    </div>
                    <el-empty v-else :description="`暂无作答满 ${bestMinAttempts} 次的题目`" :image-size="60" />
                </div>
            </div>
        </template>
    </div>
</template>

<script>
import { ElMessage } from 'element-plus'
import { useQuestionStore } from '@/stores/question'
import { loadQuestionBank } from '@/utils/loadJson'
import {
  SUBJECT_CODES, SUBJECT_LABELS,
  buildListIndex, buildBankIndexFromCache,
  subjectAggregates, typeAggregates, rankQuestions, examTrend, overallKpis
} from '@/utils/statsAggregate'

// 趋势图最多渲染最近 60 个点，避免长期使用后 SVG 过密
const TREND_MAX_POINTS = 60

export default {
  setup() {
    return { store: useQuestionStore() }
  },
  data() {
    return {
      kpis: null,
      subjectRows: [],
      subjectUncovered: 0,
      typeRows: [],
      worstRows: [],
      bestRows: [],
      trendLesson: '',
      worstMinAttempts: 3,
      bestMinAttempts: 5,
      indexStatus: { done: 0, total: 0, building: true },
      indexedCount: 0,
      onlineLoading: false
    }
  },
  computed: {
    hasRecords() {
      return Object.keys(this.store.userRecords || {}).length > 0
    },
    subjectOptions() {
      return [
        { value: '', label: '全部科目' },
        ...SUBJECT_CODES.map(c => ({ value: c, label: SUBJECT_LABELS[c] }))
      ]
    },
    trend() {
      return examTrend(this.store.examHistory, { lesson: this.trendLesson || undefined })
    },
    trendTruncated() {
      return this.trend.points.length > TREND_MAX_POINTS
    },
    // SVG 几何（一次性按当前点集计算；0-100% 固定值域便于跨科目对比）
    trendGeom() {
      const pts = this.trend.points.slice(-TREND_MAX_POINTS)
      if (!pts.length) return null
      const W = 640, H = 240
      const padL = 44, padR = 16, padT = 16, padB = 34
      const n = pts.length
      const x = i => n === 1 ? padL + (W - padL - padR) / 2 : padL + (W - padL - padR) * i / (n - 1)
      const y = rate => padT + (H - padT - padB) * (1 - rate / 100)
      const coords = pts.map((p, i) => ({ cx: x(i), cy: y(p.rate), p }))
      const step = Math.max(1, Math.ceil(n / 6))
      const xlabels = pts
        .map((p, i) => (i % step === 0 || i === n - 1) ? { x: x(i), text: String(p.date).slice(5, 10) } : null)
        .filter(Boolean)
      const ylabels = [0, 25, 50, 75, 100].map(r => ({ y: y(r), text: r + '%' }))
      return { W, H, padL, padR, padT, padB, coords, path: coords.map(c => `${c.cx},${c.cy}`).join(' '), xlabels, ylabels }
    }
  },
  watch: {
    worstMinAttempts() { this.recomputeRanks() },
    bestMinAttempts() { this.recomputeRanks() }
  },
  async created() {
    // 元数据索引不放 data：万级 Map 不做响应式代理，快照式重算
    // 第一层：错题/收藏/标记三张持久化列表（同步、零网络）
    this._metaIndex = buildListIndex([this.store.wrongQuestions, this.store.likeList, this.store.markList])
    this.indexedCount = this._metaIndex.size
    this.recompute()

    // 第二层：历史加载过的题库缓存（分块扫描防卡 UI）
    try {
      const { index } = await buildBankIndexFromCache((done, total) => {
        this.indexStatus = { done, total, building: true }
      })
      for (const [k, v] of index) {
        if (!this._metaIndex.has(k)) this._metaIndex.set(k, v)
      }
    } finally {
      this.indexStatus = { done: 0, total: 0, building: false }
    }
    this.indexedCount = this._metaIndex.size
    this.recompute()
  },
  methods: {
    metaOf(id) {
      return this._metaIndex ? this._metaIndex.get(String(id)) : null
    },
    recompute() {
      const records = this.store.userRecords
      this.kpis = overallKpis(records, this.store.wrongQuestions, this.store.examHistory)
      const s = subjectAggregates(records, this.metaOf)
      this.subjectRows = s.rows
      this.subjectUncovered = s.uncovered
      this.typeRows = typeAggregates(records, this.metaOf).rows
      this.recomputeRanks()
    },
    recomputeRanks() {
      this.worstRows = rankQuestions(this.store.userRecords, this.metaOf,
        { minAttempts: this.worstMinAttempts, order: 'worst' })
      this.bestRows = rankQuestions(this.store.userRecords, this.metaOf,
        { minAttempts: this.bestMinAttempts, order: 'best' })
    },
    accuracyText(acc) {
      return (acc === null || acc === undefined) ? '—' : Math.round(acc * 100) + '%'
    },
    pct(acc) {
      return (acc === null || acc === undefined) ? '0%' : Math.min(100, Math.max(0, acc * 100)).toFixed(1) + '%'
    },
    paperLabel(paperId) {
      return paperId === 'random' ? '随机卷' : ' 试卷 ' + paperId
    },
    // 版本热更新清过 qb_ 缓存时的兜底：按科拉总题库（同时重建缓存），再重建索引
    async enrichOnline() {
      this.onlineLoading = true
      try {
        for (const lesson of SUBJECT_CODES) {
          await loadQuestionBank(lesson, 'subject')
        }
        const { index } = await buildBankIndexFromCache()
        for (const [k, v] of index) {
          if (!this._metaIndex.has(k)) this._metaIndex.set(k, v)
        }
        this.indexedCount = this._metaIndex.size
        this.recompute()
        ElMessage.success('九科题库元数据已补全')
      } catch (e) {
        ElMessage.error('补全失败：' + (e?.message || '网络异常'))
      } finally {
        this.onlineLoading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
#statsView {
  max-width: 980px;
  margin: 24px auto 40px;
  padding: 0 20px;
  text-align: left;

  .stats-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 18px;

    .pageTitle {
      font-size: 22px;
      font-weight: bold;
      color: #333;
      margin: 0 0 6px;
    }

    .subtitle {
      font-size: 13px;
      color: #999;
      margin: 0;

      .indexing {
        color: #6C5DD3;
      }
    }
  }

  .kpi-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
    margin-bottom: 18px;

    .kpi-tile {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 6px 18px rgba(108, 93, 211, 0.08);
      padding: 18px 16px 14px;
      text-align: center;
      text-decoration: none;
      transition: transform 0.15s, box-shadow 0.15s;

      .kpi-num {
        font-size: 26px;
        font-weight: bold;
        color: #333;
        line-height: 1.2;
      }

      .kpi-label {
        margin-top: 6px;
        font-size: 12px;
        color: #999;
      }

      &.link {
        cursor: pointer;

        .kpi-label {
          color: #6C5DD3;
          font-weight: 500;
        }

        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(108, 93, 211, 0.14);
        }
      }
    }
  }

  .stats-card {
    background: #fff;
    border-radius: 16px;
    box-shadow: 0 6px 18px rgba(108, 93, 211, 0.08);
    padding: 18px 22px;
    margin-bottom: 18px;

    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;

      .card-title {
        font-size: 15px;
        font-weight: bold;
        color: #444;
      }
    }

    .trend-svg {
      width: 100%;
      height: auto;
      display: block;

      .axis-text {
        font-size: 11px;
        fill: #b0b0bc;
      }
    }

    .trend-summary {
      margin-top: 8px;
      font-size: 13px;
      color: #777;
      text-align: center;

      .muted {
        color: #bbb;
      }
    }

    .bar-list {
      display: flex;
      flex-direction: column;
      gap: 12px;

      .bar-row {
        display: grid;
        grid-template-columns: 72px 1fr 170px;
        align-items: center;
        gap: 12px;

        .bar-label {
          font-size: 14px;
          color: #555;
          font-weight: 500;
          text-align: right;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .bar-track {
          height: 12px;
          background: #f0eff7;
          border-radius: 6px;
          overflow: hidden;

          .bar-fill {
            height: 100%;
            background: #6C5DD3;
            border-radius: 6px;
            transition: width 0.4s ease;
          }
        }

        .bar-value {
          font-size: 13px;
          color: #777;
          white-space: nowrap;
        }
      }
    }

    .footnote {
      margin-top: 12px;
      font-size: 12px;
      color: #b0b0bc;
    }
  }

  .rank-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;

    .rank-list {
      display: flex;
      flex-direction: column;

      .rank-row {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 10px 2px;
        border-bottom: 1px solid #f4f4f8;

        &:last-child {
          border-bottom: none;
        }

        .rank-no {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: #f0eff7;
          color: #8F95B2;
          font-size: 12px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;

          &.top {
            background: #6C5DD3;
            color: #fff;
          }
        }

        .rank-main {
          flex: 1;
          min-width: 0;

          .rank-stem {
            font-size: 14px;
            color: #444;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;

            &.unknown {
              color: #b8b8c2;
            }
          }

          .rank-meta {
            margin-top: 4px;
            display: flex;
            gap: 6px;
            flex-wrap: wrap;
          }
        }

        .rank-score {
          text-align: right;
          flex-shrink: 0;

          .acc {
            display: block;
            font-size: 15px;
            font-weight: bold;
            color: #6C5DD3;
          }

          .att {
            display: block;
            font-size: 12px;
            color: #a0a0aa;
          }
        }
      }
    }
  }

  // 窄屏：KPI 与榜单退回单列/双列，条形值文本并入下一行
  @media (max-width: 720px) {
    .kpi-row {
      grid-template-columns: repeat(2, 1fr);
    }

    .rank-grid {
      grid-template-columns: 1fr;
    }

    .stats-card .bar-list .bar-row {
      grid-template-columns: 60px 1fr;

      .bar-value {
        grid-column: 1 / -1;
        text-align: right;
      }
    }
  }
}
</style>
