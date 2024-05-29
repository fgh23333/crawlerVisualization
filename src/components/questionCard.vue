<template>
    <div id="questionCard">
        <div v-if="list == 0">暂无数据</div>
        <div v-else>
            <div class="breadCrumb" v-if="subjectShow.includes(lesson)">
                {{ subjectList[lesson] }} - {{ questionType[type] }} - 共{{ list.length }}题
            </div>
            <div class="questionCover" v-for="(item, i) in list" :key="i">
                <div class="questionTypeCover" v-if="list[i].option.length == 2">
                    <div class="left">
                        <span class="seq">{{ i + 1 }}</span>
                    </div>
                    <div class="right">
                        <div class="markAndLike">
                            <transition name="fade" mode="out-in">
                                <img class="mark"
                                    :src="list[i].markFlag ? require('@/assets/icon/icon-mark-active.svg') : require('@/assets/icon/icon-mark.svg')"
                                    @click="changeFlagIcon('markFlag', i)" :key="item.markFlag">
                            </transition>
                            <transition name="fade" mode="out-in">
                                <img class="like"
                                    :src="list[i].likeFlag ? require('@/assets/icon/icon-like-active.svg') : require('@/assets/icon/icon-like.svg')"
                                    @click="changeFlag('likeFlag', i)" :key="item.likeFlag">
                            </transition>
                        </div>
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
                <div class="questionTypeCover" v-if="list[i].option == ''">
                    <div class="left">
                        <span class="seq">{{ i + 1 }}</span>
                    </div>
                    <div class="right">
                        <div class="markAndLike">
                            <transition name="fade" mode="out-in">
                                <img class="mark"
                                    :src="list[i].markFlag ? require('@/assets/icon/icon-mark-active.svg') : require('@/assets/icon/icon-mark.svg')"
                                    @click="changeFlagIcon('markFlag', i)" :key="item.markFlag">
                            </transition>
                            <transition name="fade" mode="out-in">
                                <img class="like"
                                    :src="list[i].likeFlag ? require('@/assets/icon/icon-like-active.svg') : require('@/assets/icon/icon-like.svg')"
                                    @click="changeFlag('likeFlag', i)" :key="item.likeFlag">
                            </transition>
                        </div>
                        <div class="questionType">填空</div>
                        <div class="questionStem">{{ list[i].questionStem }}</div>
                        <div class="questionAnswer">
                            <span class="colorBefore"></span>
                            <span class="correctAnswer">正确答案：</span>
                            <span class="answer">{{ list[i].answer }}</span>
                        </div>
                    </div>
                </div>
                <div class="questionTypeCover" v-if="list[i].option.length == 4 && list[i].answer.length == 1">
                    <div class="left">
                        <span class="seq">{{ i + 1 }}</span>
                    </div>
                    <div class="right">
                        <div class="markAndLike">
                            <transition name="fade" mode="out-in">
                                <img class="mark"
                                    :src="list[i].markFlag ? require('@/assets/icon/icon-mark-active.svg') : require('@/assets/icon/icon-mark.svg')"
                                    @click="changeFlagIcon('markFlag', i)" :key="item.markFlag">
                            </transition>
                            <transition name="fade" mode="out-in">
                                <img class="like"
                                    :src="list[i].likeFlag ? require('@/assets/icon/icon-like-active.svg') : require('@/assets/icon/icon-like.svg')"
                                    @click="changeFlag('likeFlag', i)" :key="item.likeFlag">
                            </transition>
                        </div>
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
                            <span class="answer">{{ list[i].answer }}</span>
                        </div>
                    </div>
                </div>
                <div class="questionTypeCover" v-if="list[i].option.length > 3 && list[i].answer.length > 1">
                    <div class="left">
                        <span class="seq">{{ i + 1 }}</span>
                    </div>
                    <div class="right">
                        <div class="markAndLike">
                            <transition name="fade" mode="out-in">
                                <img class="mark"
                                    :src="list[i].markFlag ? require('@/assets/icon/icon-mark-active.svg') : require('@/assets/icon/icon-mark.svg')"
                                    @click="changeFlagIcon('markFlag', i)" :key="item.markFlag">
                            </transition>
                            <transition name="fade" mode="out-in">
                                <img class="like"
                                    :src="list[i].likeFlag ? require('@/assets/icon/icon-like-active.svg') : require('@/assets/icon/icon-like.svg')"
                                    @click="changeFlag('likeFlag', i)" :key="item.likeFlag">
                            </transition>
                        </div>
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
                            <span class="answer">{{ list[i].answer }}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    </div>
</template>

<script>
import { mapActions } from "vuex";

export default {
    data() {
        return {
            list: [],
            options: ['A', 'B', 'C', 'D', 'E'],
            newSubject: ['Marx', 'XiIntro', 'CMH', 'Political', 'MaoIntro'],
            subjectList: {
                'Marx': '马克思主义基本原理',
                'XiIntro': '习近平新时代中国特色社会主义思想概论',
                'CMH': '中国近现代史纲要',
                'Political': '思想道德与法治',
                'MaoIntro': '毛泽东思想和中国特色社会主义理论体系概论',
                'CCPH': '中国共产党史',
                'ORH': '改革开放史',
                'SDH': '社会主义发展史',
                'NCH': '新中国史'
            },
            questionType: {
                'subject': '总题库',
                'rightWrong': '判断题',
                'singleChoice': '单选题',
                'multipleChoice': '多选题',
                'fillingBlank': '填空题'
            },
            lesson: '',
            type: '',
            subjectShow: ['Marx', 'XiIntro', 'CMH', 'Political', 'MaoIntro', 'CCPH', 'ORH', 'SDH', 'NCH']
        }
    },
    created() {
        this.lesson = this.$route.params.lesson;
        this.type = this.$route.params.type;
        if (this.$route.path == "/newHome/favorites") {
            this.list = this.$store.state.wrongQuestions
        } else {
            if (this.type == 'rightWrong') {
                if (this.newSubject.includes(this.lesson)) {
                    this.list = require(`../assets/${this.lesson}_rightWrong.json`)
                    if (this.$store.state.wrongQuestions !== '') {
                        this.$store.state.wrongQuestions.forEach(subsetItem => {
                            let supersetItem = this.list.find(supersetItem => supersetItem.id == subsetItem.id);
                            if (supersetItem) {
                                supersetItem.likeFlag = true;
                            }
                        });
                    } else {
                        this.$message({
                            showClose: true,
                            message: '收藏夹是空的哦'
                        });
                    }
                } else {
                    this.list = require(`../assets/${this.lesson}_right.json`);
                    let temp = require(`../assets/${this.lesson}_wrong.json`);
                    this.list = this.list.concat(temp);
                    if (this.$store.state.wrongQuestions !== '') {
                        this.$store.state.wrongQuestions.forEach(subsetItem => {
                            let supersetItem = this.list.find(supersetItem => supersetItem.id == subsetItem.id);
                            if (supersetItem) {
                                supersetItem.likeFlag = true;
                            }
                        });
                    } else {
                        this.$message({
                            showClose: true,
                            message: '收藏夹是空的哦'
                        });
                    }
                }
            } else {
                this.list = require(`../assets/${this.lesson}_${this.type}.json`);
                if (this.$store.state.wrongQuestions !== '') {
                    this.$store.state.wrongQuestions.forEach(subsetItem => {
                        let supersetItem = this.list.find(supersetItem => supersetItem.id == subsetItem.id);
                        if (supersetItem) {
                            supersetItem.likeFlag = true;
                        }
                    });
                } else {
                    this.$message({
                        showClose: true,
                        message: '收藏夹是空的哦'
                    });
                }
            }
        }
    },
    watch: {
        '$route': function (to, from) {
            this.lesson = to.params.lesson;
            this.type = to.params.type;
            if (this.type == 'rightWrong') {
                if (this.newSubject.includes(this.lesson)) {
                    this.list = require(`../assets/${this.lesson}_rightWrong.json`)
                    if (this.$store.state.wrongQuestions !== '') {
                        this.$store.state.wrongQuestions.forEach(subsetItem => {
                            let supersetItem = this.list.find(supersetItem => supersetItem.id == subsetItem.id);
                            if (supersetItem) {
                                supersetItem.likeFlag = true;
                            }
                        });
                    } else {
                        this.$message({
                            showClose: true,
                            message: '收藏夹是空的哦'
                        });
                    }
                } else {
                    this.list = require(`../assets/${this.lesson}_right.json`);
                    let temp = require(`../assets/${this.lesson}_wrong.json`);
                    this.list = this.list.concat(temp);
                    if (this.$store.state.wrongQuestions !== '') {
                        this.$store.state.wrongQuestions.forEach(subsetItem => {
                            let supersetItem = this.list.find(supersetItem => supersetItem.id == subsetItem.id);
                            if (supersetItem) {
                                supersetItem.likeFlag = true;
                            }
                        });
                    } else {
                        this.$message({
                            showClose: true,
                            message: '收藏夹是空的哦'
                        });
                    }
                }
            } else {
                this.list = require(`../assets/${this.lesson}_${this.type}.json`);
                if (this.$store.state.wrongQuestions !== '') {
                    this.$store.state.wrongQuestions.forEach(subsetItem => {
                        let supersetItem = this.list.find(supersetItem => supersetItem.id == subsetItem.id);
                        if (supersetItem) {
                            supersetItem.likeFlag = true;
                        }
                    });
                } else {
                    this.$message({
                        showClose: true,
                        message: '收藏夹是空的哦'
                    });
                }
            }
        }
    },
    methods: {
        ...mapActions(['addFavoriteQuestion', 'removeFavoriteQuestion']),
        changeFlag(flagType, i) {
            if (this.newSubject.includes(this.$route.params.lesson) || this.$route.path == "/newHome/favorites") {
                this.list[i][flagType] = !this.list[i][flagType]
                if (this.list[i][flagType]) {
                    this.addFavoriteQuestion(this.list[i]);
                } else {
                    this.removeFavoriteQuestion(this.list[i].id)
                    if (this.$route.path == "/newHome/favorites") {
                        this.list = this.$store.state.wrongQuestions
                    }
                }
            } else {
                this.$message({
                    showClose: true,
                    message: '该学科收藏功能开发中'
                });
            }
        },
        changeFlagIcon(flagType, i) {
            this.list[i][flagType] = !this.list[i][flagType]
        }
    }
}
</script>

<style lang="less">
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.15s;
}

.fade-enter,
.fade-leave-to {
    opacity: 0;
}

#questionCard {
    .breadCrumb {
        color: #898799;
        font-size: 18px;
        font-weight: medium;
        text-align: left;
        line-height: 68px;
        font-family: 思源黑体;
        margin-left: 34px;
        height: 68px;
    }

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
                position: relative;
                width: 100%;

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