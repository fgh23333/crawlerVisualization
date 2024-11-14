<template>
    <div id="favorites">
        <div class="titleCover">
            <span class="title">收藏夹</span>
            <el-select v-model="value" placeholder="全部题目">
                <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
                </el-option>
            </el-select>
<!--            <el-input class="input" placeholder="搜题（回车以搜索）" v-model="searchWord" @change="search" @input="changeInput"-->
<!--                clearable>-->
<!--            </el-input>-->
<!--            <el-dropdown placement="bottom" class="dropdown" @command="handleCommand">-->
<!--                <el-button icon="el-icon-s-operation" type="text" size="medium">更多功能</el-button>-->
<!--                <template #dropdown>-->
<!--                    <el-dropdown-menu>-->
<!--                        <el-dropdown-item command="savePDF">导出PDF</el-dropdown-item>-->
<!--                        <el-dropdown-item command="printPDF">打印题库</el-dropdown-item>-->
<!--                    </el-dropdown-menu>-->
<!--                </template>-->
<!--            </el-dropdown>-->
        </div>
        <questionCard :subjectOptions="value" :favList="showList"></questionCard>
    </div>
</template>

<script>
import questionCard from '@/components/questionCard.vue';
import Fuse from 'fuse.js';
import { makePdf } from "@/utils/makePdf";

export default {
    data() {
        return {
            showList: [],
            onSearch: false,
            searchWord: '',
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
            list: ''
        }
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
        // changeInput() {
        //     if (this.searchWord === "") {
        //         switch (this.value) {
        //             case 'all':
        //                 this.list = [...new Set([...this.$store.state.likeList, ...this.$store.state.wrongQuestions])]
        //                 break;
        //             case 'wrong':
        //                 this.list = this.$store.state.wrongQuestions
        //                 break;
        //             case 'favorites':
        //                 this.list = this.$store.state.likeList
        //                 break;
        //             default:
        //                 break;
        //         }
        //         this.showList = [...this.list]
        //         this.onSearch = false
        //     } else {
        //         switch (this.value) {
        //             case 'all':
        //                 this.list = [...new Set([...this.$store.state.likeList, ...this.$store.state.wrongQuestions])]
        //                 break;
        //             case 'wrong':
        //                 this.list = this.$store.state.wrongQuestions
        //                 break;
        //             case 'favorites':
        //                 this.list = this.$store.state.likeList
        //                 break;
        //             default:
        //                 break;
        //         }
        //     }
        // },
        // search() {
        //     const fuseOptions = {
        //         keys: ['questionStem']
        //     };
        //     const fuse = new Fuse(this.list, fuseOptions);
        //     let temp = this.searchWord ? fuse.search(this.searchWord).map(result => result.item) : this.list;
        //     this.showList = [...temp]
        //     this.onSearch = this.searchWord === "" ? false : true
        // }
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

        .title {
            font-weight: bold;
            font-size: 36px;
            line-height: 104px;
            color: #6C5DD3;
            height: 36px;
            letter-spacing: 3px;
            width: fit-content;
            margin-right: 36px;
            margin-left: 50px;
        }

        .selector {
            .select {
                width: 188px;
                height: 50px;
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
                height: 50px;
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