<template>
    <div id="questionCard">
        <div class="questionCover" v-for="(item, i) in list" :key="i">
            <div class="questionTypeCover" v-if="list[i].option.length == 2 || list[i].option == ''">
                <div class="left">
                    <span class="seq">{{ i + 1 }}</span>
                </div>
                <div class="right">
                    <div class="questionType">判断</div>
                    <div class="questionStem">{{ list[i].questionStem }}</div>
                    <div class="questionAnswer">
                        <span class="colorBefore"></span>
                        <span class="correctAnswer">正确答案：</span>
                        <span class="true" v-if="list[i].answer == '正确'">{{ list[i].answer }}</span>
                        <span class="false" v-if="list[i].answer == '错误'">{{ list[i].answer }}</span>
                    </div>
                </div>
            </div>
            <div class="questionTypeCover" v-if="list[i].option.length == 4 && list[i].answer.length == 1">
                <div class="left">
                    <span class="seq">{{ i + 1 }}</span>
                </div>
                <div class="right">
                    <div class="questionType">单选</div>
                    <div class="questionStem">{{ list[i].questionStem }}</div>
                    <div class="questionOpt">
                        <div class="option" v-for="(item, k) in list[i].option" :key="k">
                            <div class="dot"></div>
                            <div class="optText">{{ options[k] }}、{{ list[i].option[k] }}</div>
                        </div>
                    </div>
                    <div class="questionAnswer">
                        <span class="colorBefore"></span>
                        <span class="correctAnswer">正确答案：</span>
                        <span class="answer">{{ list[i].answer[0] }}</span>
                    </div>
                </div>
            </div>
            <div class="questionTypeCover" v-if="list[i].option.length > 3 && list[i].answer.length > 1">
                <div class="left">
                    <span class="seq">{{ i + 1 }}</span>
                </div>
                <div class="right">
                    <div class="questionType">多选</div>
                    <div class="questionStem">{{ list[i].questionStem }}</div>
                    <div class="questionOpt">
                        <div class="option" v-for="(item, k) in list[i].option" :key="k">
                            <div class="dot"></div>
                            <div class="optText">{{ options[k] }}、{{ list[i].option[k] }}</div>
                        </div>
                    </div>
                    <div class="questionAnswer">
                        <span class="colorBefore"></span>
                        <span class="correctAnswer">正确答案：</span>
                        <span class="answer" v-for="(ans, j) in list[i].answer" :key="j">{{ list[i].answer[j] }}</span>
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
            list: [],
            options: ['A', 'B', 'C', 'D', 'E']
        }
    },
    created() {
        this.lesson = this.$route.params.lesson
        this.type = this.$route.params.type
        if (this.type == 'rightWrong') {
            this.list = require(`../assets/${this.lesson}_right.json`)
            let temp = require(`../assets/${this.lesson}_wrong.json`)
            this.list = this.list.concat(temp)
        } else {
            this.list = require(`../assets/${this.lesson}_${this.type}.json`)
        }
    },
    watch: {
        '$route': function (to, from) {
            this.lesson = to.params.lesson
            this.type = to.params.type
            if (this.type == 'rightWrong') {
                this.list = require(`../assets/${this.lesson}_right.json`)
                let temp = require(`../assets/${this.lesson}_wrong.json`)
                this.list = this.list.concat(temp)
            } else {
                this.list = require(`../assets/${this.lesson}_${this.type}.json`)
            }
        }
    }
}
</script>

<style lang="less">
#questionCard {
    .questionCover {
        background-color: #FFFFFF;
        padding: 14px 18px;
        margin: 15px 34px;
        border-radius: 24px;
        box-shadow:
            0px -1px 8px 0px rgba(230, 232, 240, 0.9),
            -1px 0px 8px 0px rgba(230, 232, 240, 0.9),
            1px 0px 8px 0px rgba(230, 232, 240, 0.9),
            0px 1px 8px 0px rgba(230, 232, 240, 0.9);

        .questionTypeCover {
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
                text-align: left;

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
                    font-weight: medium;
                    letter-spacing: 1px;
                    font-size: 18px;
                    margin-bottom: 4px;
                    line-height: 30px;
                }

                .questionOpt {
                    .option {
                        line-height: 28px;
                        font-size: 18px;
                        letter-spacing: 1px;
                        position: relative;

                        .dot {
                            width: 14px;
                            height: 14px;
                            border-radius: 50%;
                            background-color: #6C5DD3;
                            position: absolute;
                            top: 7px;
                        }

                        .optText {
                            text-indent: 22px;
                        }
                    }
                }

                .questionAnswer {
                    letter-spacing: 1px;
                    height: 30px;
                    line-height: 30px;
                    margin-top: 18px;
                    display: flex;
                    justify-content: flex-start;
                    margin-bottom: 10px;

                    .colorBefore {
                        background-color: #6C5DD3;
                        width: 8px;
                        height: 30px;
                        display: inline-block;
                        border-radius: 4px;
                        margin-right: 4px;
                    }

                    .correctAnswer {
                        color: #707070;
                        display: inline-block;
                        height: 30px;
                        line-height: 30px;
                        font-size: 18px;
                    }

                    .true {
                        color: #FF3B3B;
                        display: inline-block;
                        height: 30px;
                        line-height: 30px;
                        font-size: 18px;
                    }

                    .false {
                        color: #0BDE00;
                        display: inline-block;
                        height: 30px;
                        line-height: 30px;
                        font-size: 18px;
                    }

                    .answer {
                        display: inline-block;
                        height: 30px;
                        line-height: 30px;
                        font-size: 18px;
                        color: #5F89D3;
                    }
                }
            }
        }
    }
}
</style>