<template>
    <div id="examPage">
        <ul>
            <li v-for="(item, i) in list" class="problemCover">
                {{ ++i }}、{{ item.questionStem }}
                <span v-if="item.answer.length == 1" v-for="(opt, x) in item.option" class="problem">
                    <van-radio-group v-model="item.radio">
                        <van-radio :name="x" @click="updateUserSelection(--i, x)">
                            {{ option[x] }}、{{ item.option[x] }}
                        </van-radio>
                    </van-radio-group>
                </span>
                <span class="problem" v-if="item.option.length == 2" v-for="(opts, y) in options">
                    <van-radio-group v-model="item.radio">
                        <van-radio :name="y" @click="updateUserSelection(--i, y)">
                            {{ item.option[y] }}
                        </van-radio>
                    </van-radio-group>
                </span>
                <span class="problem" v-if="item.answer.length >= 2 && item.option.length > 2" v-for="(opts, z) in option">
                    <van-radio-group v-model="item.radio">
                        <van-radio :name="z" @click="updateUserSelection(--i, z)">
                            {{ option[z] }}、{{ item.option[z] }}
                        </van-radio>
                    </van-radio-group>
                </span>
            </li>
        </ul>
        <el-button type="text" @click="submitUserSelections()" class="submitButton">提交</el-button>
    </div>
</template>

<script>
export default {
    data() {
        return {
            list: [],
            option: ["A", "B", "C", "D", "E"],
            options: ["T", "F"],
        }
    },
    created() {
        this.list = require('../assets/political.json')
    },
    methods: {
        // updateUserSelection(questionIndex, optionIndex) {
        //     let selectedOption = this.option[optionIndex]
        //     if (selectedOption == "A") {
        //         selectedOption = 0
        //     }
        //     if (selectedOption == "B") {
        //         selectedOption = 1
        //     }
        //     if (selectedOption == "C") {
        //         selectedOption = 2
        //     }
        //     if (selectedOption == "D") {
        //         selectedOption = 3
        //     }
        //     this.userSelections[questionIndex] = selectedOption
        //     this.content = JSON.stringify(this.userSelections)
        // },
        // submitUserSelections() {
        //     let notNull = this.userSelections.every(element => element !== null)
        //     if (this.userSelections.length == this.list.length && notNull) {
        //         axios({
        //             method: "post",
        //             url: "http://127.0.0.1:3000/exam/post",
        //             data: JSON.parse(this.content)
        //         }).then(res => {
        //             this.sum = res.data.sum
        //             this.$alert(`得分${this.sum}`, '标题名称', {
        //                 confirmButtonText: '确定'
        //             });
        //         })
        //     } else {
        //         this.$alert('选项不可以为空', {
        //             confirmButtonText: '确定'
        //         })
        //     }
        // }
    }
}
</script>

<style lang="less">
#examPage {
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