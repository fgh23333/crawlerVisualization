<template>
    <div id="favorites">
        <div class="titleCover">
            <span class="title">收藏夹</span>
            <el-select v-model="value" placeholder="全部题目">
                <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
                </el-option>
            </el-select>
            <el-checkbox-group v-model="selectedTypes" size="small" class="typeSelector">
                <el-checkbox-button v-for="item in questionType" :key="item.value" :label="item.label">{{ item.value
                    }}</el-checkbox-button>
            </el-checkbox-group>
        </div>
        <questionCard :subjectOptions="value" :favList="list" :selectedTypes="selectedTypes"></questionCard>
    </div>
</template>

<script>
import questionCard from '@/components/questionCard.vue';
import { makePdf } from "@/utils/makePdf";

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
                    label: '全部题目'
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
            list: []
        }
    },
    watch: {
        '$route': function (to, from) {
            if (this.$route.path == "/newHome/favorites") {
                switch (this.value) {
                    case 'all':
                        this.list = [...new Set([...this.$store.state.likeList, ...this.$store.state.wrongQuestions])]
                        break
                    case 'favorites':
                        this.list = this.$store.state.likeList
                        break
                    case 'wrong':
                        this.list = this.$store.state.wrongQuestions
                        break
                    default:
                        return
                }
            } else {
                return
            }
        },
    },
    methods: {
        handleCommand(e) {
            let list = []
            switch (this.value) {
                case 'all':
                    list = [...new Set([...this.$store.state.likeList, ...this.$store.state.wrongQuestions])]
                    break;
                case 'wrong':
                    list = this.$store.state.wrongQuestions
                    break;
                case 'favorites':
                    list = this.$store.state.likeList
                    break;
                default:
                    break;
            }
            if (e === "savePDF") {
                makePdf("save", list, "收藏夹", this.$store, this.$message);
            }
            if (e === "printPDF") {
                makePdf("print", list, "收藏夹", this.$store, this.$message);
            }
        },
    },
    created() {
        switch (this.value) {
            case 'all':
                this.list = [...new Set([...this.$store.state.likeList, ...this.$store.state.wrongQuestions])]
                break
            case 'favorites':
                this.list = this.$store.state.likeList
                break
            case 'wrong':
                this.list = this.$store.state.wrongQuestions
                break
            default:
                return
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
        text-align: left;
        line-height: 100px;
        height: 100px;
        position: relative;

        .title {
            font-weight: bold;
            font-size: 30px;
            color: #6C5DD3;
            letter-spacing: 2px;
            width: fit-content;
            margin-left: 16px;
        }

        .el-select {
            width: 100px;
            height: 40px;
            line-height: 40px;
            position: absolute;
            left: 120px;
            top: 30px;
        }

        .typeSelector {
            position: absolute;
            left: 230px;
            top: 0px;
            font-size: 20px;
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