<template>
    <div id="examPage">
        <topBar>
            <template v-slot:left>
                <div class="goBack">
                    <i class="el-icon-arrow-left" @click="goBack()"></i>
                </div>
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

export default {
    data() {
        return {
            list: [],
            option: ["A", "B", "C", "D", "E", "正确", "错误"],
            userSelections: [],
            input: []
        }
    },
    created() {
        let lesson = this.$route.params.lesson
        let seq = this.$route.params.id
        this.list = require(`../assets/cura/${lesson}_${seq}.json`)
        this.userSelections = []
    },
    components: {
        topBar
    },
    methods: {
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
            let notNull = this.userSelections.every(element => element !== null)
            for (let i = 0; i < this.input.length; i++) {
                this.userSelections[i + 50] = this.input[i]
            }
            if (notNull) {
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
                this.$alert('选项不可以为空', {
                    confirmButtonText: '确定'
                })
            }
        },
        goBack() {
            this.$router.go(-1)
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