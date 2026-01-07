<template>
    <div id="favorites">
        <div class="titleCover">
            <span class="title">收藏夹</span>
            <div class="controls">
                <el-select v-model="value" placeholder="全部题目" size="small" class="type-select">
                    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
                    </el-option>
                </el-select>
                <el-checkbox-group v-model="selectedTypes" size="small" class="typeSelector">
                    <el-checkbox-button v-for="item in questionType" :key="item.value" :label="item.label">{{ item.value
                        }}</el-checkbox-button>
                </el-checkbox-group>
                <el-button type="danger" size="small" class="clearBtn" @click="clearList">清空当前列表</el-button>
            </div>
        </div>
        <questionCard :subjectOptions="value" :favList="list" :selectedTypes="selectedTypes"></questionCard>
    </div>
</template>

<script>
import questionCard from '@/components/questionCard.vue';
import { makePdf } from "@/utils/makePdf";
import { mapActions } from 'vuex';

export default {
    data() {
        return {
            questionType: [
                {
                    value: '判断',
                    label: 'rightWrong'
                },
                {
                    value: '单选',
                    label: 'singleChoice'
                },
                {
                    value: '多选',
                    label: 'multipleChoice'
                },
                {
                    value: '填空',
                    label: 'fillingBlank'
                }
            ],
            selectedTypes: ['rightWrong', 'singleChoice', 'multipleChoice', 'fillingBlank'],
            options: [
                {
                    value: 'all',
                    label: '全部'
                },
                {
                    value: 'wrong',
                    label: '错题'
                },
                {
                    value: 'favorites',
                    label: '我的收藏'
                }
            ],
            subjects: [
                {
                    value: '',
                    label: '全部题目'
                },
                {
                    value: 'Marx',
                    label: '马原'
                },
                {
                    value: 'CMH',
                    label: '近代史'
                },
                {
                    value: 'Political',
                    label: '思政'
                },
                {
                    value: 'MaoIntro',
                    label: '毛概'
                },
                {
                    value: 'XiIntro',
                    label: '习概'
                },
                {
                    value: 'ORH',
                    label: '改开史'
                },
                {
                    value: 'NCH',
                    label: '新中国史'
                },
                {
                    value: '社主史',
                    label: 'SDH',
                },
                {
                    value: '党史',
                    label: 'CCPH',
                }
            ],
            value: 'all',
        }
    },
    computed: {
        list() {
            switch (this.value) {
                case 'all':
                    // Use a Map to deduplicate by ID if objects are not strictly identical references
                    // or just rely on Set if references are shared. Assuming shared references for now.
                    // If IDs are unique, filtering by ID is safer.
                    const combined = [...this.$store.state.likeList, ...this.$store.state.wrongQuestions];
                    const unique = new Map();
                    combined.forEach(item => unique.set(item.id, item));
                    return Array.from(unique.values());
                case 'favorites':
                    return this.$store.state.likeList;
                case 'wrong':
                    return this.$store.state.wrongQuestions;
                default:
                    return [];
            }
        }
    },
    methods: {
        ...mapActions(['clearLikeList', 'clearWrongQuestions']),
        handleCommand(e) {
            if (e === "savePDF") {
                makePdf("save", this.list, "收藏夹", this.$store, this.$message);
            }
            if (e === "printPDF") {
                makePdf("print", this.list, "收藏夹", this.$store, this.$message);
            }
        },
        clearList() {
            this.$confirm('此操作将清空当前列表, 是否继续?', '提示', {
                confirmButtonText: '确定',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
                if (this.value === 'favorites') {
                    this.clearLikeList();
                    this.$message({
                        type: 'success',
                        message: '收藏夹已清空!'
                    });
                } else if (this.value === 'wrong') {
                    this.clearWrongQuestions();
                    this.$message({
                        type: 'success',
                        message: '错题本已清空!'
                    });
                } else if (this.value === 'all') {
                    this.clearLikeList();
                    this.clearWrongQuestions();
                    this.$message({
                        type: 'success',
                        message: '所有列表已清空!'
                    });
                }
            }).catch(() => {
                this.$message({
                    type: 'info',
                    message: '已取消删除'
                });
            });
        }
    },
    components: {
        questionCard
    }
}
</script>

<style lang="less" scoped>
.el-selector {
    top: -8px;
}

#favorites {
    .titleCover {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 34px;
        height: 80px;

        .title {
            font-weight: bold;
            font-size: 30px;
            color: #6C5DD3;
            letter-spacing: 2px;
            flex-shrink: 0;
        }

        .controls {
            display: flex;
            align-items: center;
            gap: 15px;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .type-select {
            width: 120px;
        }

        .selector {
            .select {
                color: #5A5E70;
                font-size: 24px;
                line-height: 50px;
            }

            .select ::v-deep .el-input__inner {
                border: 3px solid #6C5DD3 !important;
                border-radius: 10px !important;
                color: #5A5E70;
                font-size: 24px;
                line-height: 50px;
                font-family: '思源黑体';
                height: 40px;
                font-weight: 500;
            }

            .select ::v-deep .el-input__inner::placeholder {
                color: #5A5E70;
                font-family: '思源黑体';
                font-weight: 500;
            }

            .select ::v-deep .el-input__icon {
                height: auto;
            }
        }
    }
}
</style>
