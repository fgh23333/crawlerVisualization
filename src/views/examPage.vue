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
            <li v-for="(item, i) in list" class="problemCover">
                {{ ++i }}、{{ item.questionStem }}
                <span class="problem" v-if="item.answer.length == 1" v-for="(opt, x) in item.option">
                    <van-radio-group v-model="item.radio">
                        <van-radio :name="x" @click="updateUserSelection(--i, x)">
                            {{ option[x] }}、{{ item.option[x] }}
                        </van-radio>
                    </van-radio-group>
                </span>
                <span class="problem" v-if="item.option.length == 2" v-for="(opts, y) in item.option">
                    <van-radio-group v-model="item.radio">
                        <van-radio :name="y" @click="updateUserSelection(--i, y)">
                            {{ item.option[y] }}
                        </van-radio>
                    </van-radio-group>
                </span>
                <span class="problem" v-if="item.answer.length >= 2 && item.option.length > 2"
                    v-for="(opts, z) in item.option">
                    <van-checkbox-group v-model="item.result">
                        <van-checkbox :name="option[z]" shape="square" @click="clickMe(item, --i)">{{ option[z] }}、{{
                            item.option[z] }}</van-checkbox>
                    </van-checkbox-group>
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
            option: ["A", "B", "C", "D", "E"],
            userSelections: []
        }
    },
    created() {
        let lesson = this.$route.params.lesson
        let seq = this.$route.params.id
        this.list = require(`../assets/${lesson}_${seq}.json`)
    },
    components: {
        topBar
    },
    methods: {
        updateUserSelection(questionIndex, optionIndex) {
            let selectedOption = this.option[optionIndex]
            if (selectedOption == "A") {
                selectedOption = 0
            }
            if (selectedOption == "B") {
                selectedOption = 1
            }
            if (selectedOption == "C") {
                selectedOption = 2
            }
            if (selectedOption == "D") {
                selectedOption = 3
            }
            this.userSelections[questionIndex] = selectedOption
        },
        clickMe(selections, questionIndex) {
            this.userSelections[questionIndex] = selections.result
        },
        submitUserSelections() {
            function arraysHaveSameElements(answer, selection) {
                if (answer.length !== selection.length) {
                    return false;
                }
                return answer.every(element => selection.includes(element));
            }
            let notNull = this.userSelections.every(element => element !== null)
            if (this.userSelections.length == this.list.length && notNull) {
                let sum = 0;
                for (let i = 0; i < 20; i++) {
                    if (this.list[i].answer == this.list[i].option[this.userSelections[i]]) {
                        sum += 1
                    } else {
                        sum += 0
                    }
                }
                for (let i = 20; i < 40; i++) {
                    if (this.list[i].answer == this.userSelections[i]) {
                        sum += 1
                    } else {
                        sum += 0
                    }
                }
                for (let i = 40; i < 60; i++) {
                    let result = arraysHaveSameElements(this.list[i].answer, this.userSelections[i])
                    if (result) {
                        sum += 1
                    } else {
                        sum += 0
                    }
                }
                this.$alert(`得分为${sum}`, {
                    confirmButtonText: '确定'
                })
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