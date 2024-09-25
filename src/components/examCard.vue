<template>
    <div id="examCard">
        <div class="left">
            <span class="seq">{{ seq + 1 }}</span>
        </div>
        <div class="right">
            <div class="questionType">
                <span>{{ questionType }}</span>
            </div>
            <div class="questionStem">{{ question.questionStem }}</div>
            <div class="questionAnswer" v-if="questionType !== '填空'">
                <div class="multiple" v-if="questionType == '多选'">
                    <el-checkbox-group v-model="checkList">
                        <div v-for="(item, i) in question.option" class="answer">
                            <el-checkbox :label="options[i] + '、' + item" :key="i" class="option"></el-checkbox>
                        </div>
                    </el-checkbox-group>
                </div>
                <div class="single" v-else>
                    <div v-for="(item, i) in question.option" class="answer">
                        <el-radio v-model="radio" :label="options[i] + '、' + item" :key="i" class="option"></el-radio>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            radio: '',
            checkList: '',
            options: ['A', 'B', 'C', 'D', 'E'],
        }
    },
    props: {
        question: {
            type: Object,
            default: () => {
                return {}
            }
        },
        seq: {
            type: Number,
            default: 0
        }
    },
    computed: {
        questionType() {
            if (this.question.option == '') {
                return '填空'
            } else if (this.question.option.length == 2) {
                return '判断'
            } else if (this.question.answer.length == 1) {
                return '单选'
            } else {
                return '多选'
            }
        }
    }
}
</script>

<style lang="less">
#examCard {
    background-color: #FFFFFF;
    padding: 14px 18px;
    margin: 15px 34px;
    border-radius: 24px;
    box-shadow:
        0px -1px 8px 0px rgba(230, 232, 240, 0.9),
        -1px 0px 8px 0px rgba(230, 232, 240, 0.9),
        1px 0px 8px 0px rgba(230, 232, 240, 0.9),
        0px 1px 8px 0px rgba(230, 232, 240, 0.9);
    font-family: HarmonyOS Sans SC;
    display: flex;
    justify-content: flex-start;

    .left {
        width: fit-content;
        margin-right: 10px;

        .seq {
            height: 30px;
            font-size: 20px;
            font-weight: bold;
            color: white;
            background-color: #6C5DD3;
            border-radius: 10px;
            padding: 0px 10px;
            line-height: 30px;
            display: inline-block;
        }
    }

    .right {
        text-align: justify;
        position: relative;
        width: 94%;
        
        .markAndLike {
            width: 72px;
            height: 32px;
            position: absolute;
            top: 0px;
            right: 0px;

            .mark {
                display: inline-block;
                margin-right: 8px;
            }

            .like {
                display: inline-block;
            }
        }

        .questionType {
            letter-spacing: 3px;
            height: 30px;
            line-height: 30px;
            font-size: 18px;
            font-weight: bold;
            color: #877BD1;
            margin-bottom: 10px;
        }

        .questionStem {
            font-weight: 500;
            letter-spacing: 1px;
            font-size: 18px;
            margin-bottom: 4px;
            line-height: 30px;
        }

        .questionAnswer {
            letter-spacing: 1px;
            height: fit-content;
            line-height: 30px;
            margin-top: 8px;
            display: flex;
            justify-content: flex-start;
            margin-bottom: 10px;

            .answer {
                line-height: 30px;
                color: #5F89D3;

                .el-radio__label {
                    font-size: 18px !important;
                }
            }
        }
    }
}
</style>