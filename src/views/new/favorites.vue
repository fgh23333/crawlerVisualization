<template>
    <div id="favorites">
        <div class="titleCover">
            <span class="title">收藏夹</span>
            <el-select v-model="value" placeholder="全部题目">
                <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
                </el-option>
            </el-select>
            <el-dropdown placement="bottom" class="dropdown" @command="handleCommand">
                <el-button icon="el-icon-s-operation" type="text" size="medium">更多功能</el-button>
                <template #dropdown>
                    <el-dropdown-menu>
                        <el-dropdown-item command="savePDF">导出PDF</el-dropdown-item>
                        <el-dropdown-item command="printPDF">打印题库</el-dropdown-item>
                    </el-dropdown-menu>
                </template>
            </el-dropdown>
        </div>
        <questionCard :subjectOptions="value"></questionCard>
    </div>
</template>

<script>
import questionCard from '@/components/questionCard.vue';
import axios from 'axios';

export default {
    data() {
        return {
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
            value: 'all'
        }
    },
    methods: {
        handleCommand(e) {
            if (e === "savePDF") {
                this.testMakePDF("save")
            }
            if (e === "printPDF") {
                this.testMakePDF("print")
            }
        },
        formatDateTime() {
            const date = new Date();
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');

            return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
        },
        async testMakePDF(method) {
            const response = await axios.get('https://fonts.635262140.xyz/vfs_fonts.js');

            // 使用 eval 将字体文件内容解析并赋值给 pdfMake.vfs
            const vfsFonts = eval(response.data); // 请确保来源可信
            pdfMake.vfs = vfsFonts.pdfMake ? vfsFonts.pdfMake.vfs : vfsFonts;

            // 定义字体
            pdfMake.fonts = {
                // webfont是字体名，可以自定义，下面需要用这个名字配置字体
                webfont: {
                    // FZYTK.TTF 这个文件已经在 我们生成的 vfs_font.js 文件中，且已经引入，所以可以直接使用
                    normal: "MiSans-Medium.ttf",
                    bold: "MiSans-Heavy.ttf",
                    italics: "MiSans-Medium.ttf",
                    bolditalics: "MiSans-Medium.ttf",
                }
            };
            let temp = [];
            let title = "题库";

            // if (this.subjectShow.includes(this.lesson) && this.onSearch) {
            //     title = `${this.subjectList[this.lesson]} - ${this.questionType[this.type]} - '${this.searchWord}'搜索结果共${this.showList.length}题`
            //     temp.push({
            //         text: title,
            //         fontSize: 16
            //     })
            // }
            // if (this.subjectShow.includes(this.lesson) && !this.onSearch) {
            //     title = `${this.subjectList[this.lesson]} - ${this.questionType[this.type]} - 共${this.list.length}题`
            //     temp.push({
            //         text: title,
            //         fontSize: 16
            //     });
            // }
            temp.push({
                text: this.formatDateTime(),
                fontSize: 10
            });
            temp.push({
                text: `题库网站：https://bank.635262140.xyz/newHome`,
                fontSize: 10
            });
            temp.push({
                text: "\n"
            })
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

            list.forEach((item, index) => {
                if (item.option.length == 2) {
                    temp.push({
                        text: index + 1 + "、[判断]" + item.questionStem, fontSize: 14
                    })
                    temp.push({
                        text: "\t答案 | " + item.answer, fontSize: 14
                    })
                } else if (item.option.length > 3 && item.answer.length > 1) {
                    temp.push({
                        text: index + 1 + "、[多选]" + item.questionStem, fontSize: 14
                    })
                    item.option.forEach((item, index) => {
                        temp.push({
                            text: "\t" + this.options[index] + "  " + item, fontSize: 14
                        })
                    })
                    temp.push({
                        text: "\t答案 | " + item.answer, fontSize: 14
                    })
                } else if (item.option.length == 4 && item.answer.length == 1) {
                    temp.push({
                        text: index + 1 + "、[单选]" + item.questionStem, fontSize: 14
                    })
                    item.option.forEach((item, index) => {
                        temp.push({
                            text: "\t" + this.options[index] + "  " + item, fontSize: 14
                        })
                    })
                    temp.push({
                        text: "\t答案 | " + item.answer, fontSize: 14
                    })
                } else if (item.option == '') {
                    temp.push({
                        text: index + 1 + "、[填空]" + item.questionStem, fontSize: 14
                    })
                    temp.push({
                        text: "\t答案 | " + item.answer, fontSize: 14
                    })
                }
                temp.push({
                    text: "\n"
                })
            })
            var docDefinition = {
                content: temp,
                defaultStyle: {
                    font: "webfont",
                },
            };
            if (method === "save") {
                pdfMake.createPdf(docDefinition).download(title, () => {
                    console.log("complete");
                });
            }
            if (method === "print") {
                pdfMake.createPdf(docDefinition).print();
            }
        },
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