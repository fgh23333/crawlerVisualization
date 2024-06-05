<template>
    <div id="examPage">
        <topBar>
            <template v-slot:left>
                <div class="goBack">
                    <i class="el-icon-arrow-left" @click="goBack()"></i>
                </div>
            </template>
            <template v-slot:middle>
                <div class="paperTitle">
                    {{ lesson }} - 试卷 {{ seq }}
                </div>
            </template>
            <template v-slot:right>
                <el-select v-model="value" placeholder="试卷1">
                    <el-option v-for="item in paperOptions" :key="item.value" :label="item.label" :value="item.value">
                    </el-option>
                </el-select>
            </template>
        </topBar>
        <ul>
            <li v-for="(item, i) in list" v-if="item.option.length == 4 && item.answer.length == 1"
                class="problemCover">
                {{ i + 1 }}、{{ item.questionStem }}
                <span class="problem" v-for="(opts, x) in item.option">
                    <van-radio-group v-model="item.radio">
                        <van-radio :name="x" @click="updateUserSelection(i, x)">
                            {{ option[x] }}、{{ opts }}
                        </van-radio>
                    </van-radio-group>
                </span>
            </li>
        </ul>
        <ul>
            <li v-for="(item, j) in list" v-if="item.answer.length >= 2 && item.option.length > 2" class="problemCover">
                {{ j + 1 }}、{{ item.questionStem }}
                <span class="problem" v-for="(opts, y) in item.option">
                    <van-checkbox-group v-model="item.result">
                        <van-checkbox :name="option[y]" shape="square" @click="clickMe(item, j)">
                            {{ option[y] }}、{{ opts }}
                        </van-checkbox>
                    </van-checkbox-group>
                </span>
            </li>
        </ul>
        <ul>
            <li v-for="(item, k) in list" v-if="item.answer == '正确' || item.answer == '错误'" class="problemCover">
                {{ k + 1 }}、{{ item.questionStem }}
                <span class="problem" v-for="(opt, z) in item.option">
                    <van-radio-group v-model="item.radio">
                        <van-radio :name="z" @click="updateUserSelection(k, z + 5)">
                            {{ opt }}
                        </van-radio>
                    </van-radio-group>
                </span>
            </li>
        </ul>
        <ul>
            <li v-for="(item, l) in list" v-if="item.option == ''" class="problemCover">
                {{ l + 1 }}、{{ item.questionStem }}
                <span class="problem">
                    <el-input v-model="input[l - 50]" placeholder="多空用中文逗号分隔，不要有多余的字符"></el-input>
                </span>
            </li>
        </ul>
        <el-button type="text" @click="submitUserSelections()" class="submitButton">提交</el-button>
    </div>
</template>

<script>
import topBar from '@/components/topBar.vue'
import { mapActions } from "vuex";

export default {
    data() {
        return {
            list: [],
            option: ["A", "B", "C", "D", "E", "正确", "错误"],
            userSelections: [],
            input: [],
            lesson: '',
            seq: '',
            subjectList: {
                'Marx': {
                    name: '马克思主义基本原理',
                    num: 8
                },
                'XiIntro': {
                    name: '习近平新时代中国特色社会主义思想概论',
                    num: 8
                },
                'CMH': {
                    name: '中国近现代史纲要',
                    num: 14
                },
                'Political': {
                    name: '思想道德与法治',
                    num: 11
                },
                'MaoIntro': {
                    name: '毛泽东思想和中国特色社会主义理论体系概论',
                    num: 11
                },
                'CCPH': {
                    name: '中国共产党历史',
                    num: 6
                },
                'ORH': {
                    name: '改革开放史',
                    num: 8
                },
                'SDH': {
                    name: '社会主义发展史',
                    num: 6
                },
                'NCH': {
                    name: '新中国史',
                    num: 5
                }
            },
            abbreviationSubjectList: {
                'Marx': '马原',
                'CMH': '近代史',
                'Political': '思政',
                'MaoIntro': '毛概',
                'XiIntro': '习概',
                'SDH': '社主史',
                'NCH': '新中国史',
                'CCPH': '党史',
                'ORH': '改开史'
            },
            paperOptions: [],
            value: ''
        }
    },
    created() {
        let lesson = this.$route.params.lesson
        this.lesson = this.abbreviationSubjectList[lesson]
        this.seq = this.$route.params.id
        for (let i = 0; i < this.subjectList[lesson].num; i++) {
            let temp = {
                value: i + 1,
                label: '试卷' + (i + 1)
            }
            this.paperOptions.push(temp)
        }
        let rest = {
            value: 'residual',
            label: '剩余题目'
        }
        this.paperOptions.push(rest)
        this.list = require(`../assets/cura/${lesson}_${this.$route.params.id}.json`)
        this.userSelections.fill(0)
    },
    components: {
        topBar
    },
    methods: {
        ...mapActions(['addFavoriteQuestion']),
        updateUserSelection(questionIndex, optionIndex) {
            this.userSelections[questionIndex] = this.option[optionIndex]
            console.log(this.userSelections);
        },
        clickMe(selections, questionIndex) {
            this.userSelections[questionIndex] = selections.result
            console.log(this.input);
        },
        submitUserSelections() {
            function arraysHaveSameElements(answer, selection) {
                answer = answer.split("")
                if (answer.length !== selection.length) {
                    return false;
                }
                return answer.every(element => selection.includes(element));
            }
            let isNull = this.userSelections.find(element => element == 0)
            for (let i = 0; i < this.input.length; i++) {
                this.userSelections[i + 50] = this.input[i]
            }
            if (!isNull) {
                let sum = 0;
                for (let i = 0; i < 20; i++) {
                    if (this.list[i].answer == this.list[i]) {
                        sum += 0.5
                    } else {
                        sum += 0
                    }
                }
                for (let i = 20; i < 35; i++) {
                    let result = arraysHaveSameElements(this.list[i].answer, this.userSelections[i])
                    if (result) {
                        sum += 0.5
                    } else {
                        sum += 0
                    }
                }
                for (let i = 36; i < 50; i++) {
                    if (this.list[i].answer == this.userSelections[i]) {
                        sum += 0.5
                    } else {
                        sum += 0
                    }
                }
                for (let i = 51; i < 60; i++) {
                    if (this.list[i].answer == this.userSelections[i]) {
                        sum += 0.5
                    } else {
                        sum += 0
                    }
                }
                this.$alert(`得分为${sum}`, {
                    confirmButtonText: '确定'
                })
                this.list.forEach(item => {
                    item.radio = ''
                })
                this.userSelections = []
                this.input = []
            } else {
                this.$confirm('还有未做的题，确定提交吗', '提示', {
                    confirmButtonText: '确定',
                    cancelButtonText: '取消',
                    type: 'warning'
                }).then(() => {
                    this.$alert(`得分为${sum}`, {
                        confirmButtonText: '确定'
                    })
                }).catch(() => {

                });
            }
        },
        goBack() {
            this.$router.go(-1)
        }
    },
    watch: {
        value: function(newval, oldval) {
            this.$router.push({path: '/newHome/examPage/' + this.$route.params.lesson + '/' + newval})
            this.list = require(`../assets/cura/${this.$route.params.lesson}_${this.$route.params.id}.json`)
            this.seq = this.$route.params.id
        },
        '$route': function (to, from) {
            this.list = require(`../assets/cura/${to.params.lesson}_${to.params.id}.json`)
        }
    }
}
</script>

<style lang="less">
#examPage {
    .goBack {
        text-align: left;
        font-size: 32px;
        margin: 0 50px;

        .el-icon-arrow-left {
            border: 3px solid #333;
            border-radius: 50%;
        }
    }

    .problemCover {
        margin: 10px;
        padding: 20px;
        border: 1px solid #e0e0e0;
        border-radius: 10px;
        background-color: #f5f5f5;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        text-align: left;
        line-height: 27px;

        .question {
            font-size: 18px;
        }

        .options {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }

        .problem {
            position: relative;
            margin-top: 5px;

            .van-radio:checked+label {
                border: 2px solid #007bff;
            }
        }
    }

    .submitButton {
        display: block;
        margin: 0 auto;
        font-size: 20px;
        color: white;
        background-color: #007bff;
        border: none;
        border-radius: 5px;
        padding: 10px 20px;
        cursor: pointer;
        transition: background-color 0.3s;
        margin-bottom: 20px;

        &:hover {
            background-color: #0056b3;
        }
    }
}
</style>