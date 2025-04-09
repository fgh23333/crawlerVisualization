<template>
    <div id="examCard">
        <div class="left">
            <span class="seq">{{ seq + 1 }}</span>
        </div>
        <div class="right">
            <div class="questionType">
                <span>{{ questionTypeText }}</span>
            </div>
            <div class="questionStem">{{ question.questionStem }}</div>
            <div class="questionAnswer">
                <div class="multiple" v-if="question.type == 'multiple-choice'">
                    <el-checkbox-group v-model="userAnswer" :disabled="examStatus" class="checkbox-group"
                        @change="updateAnswer">
                        <div v-for="(item, i) in question.option" :key="i" class="answer">
                            <el-checkbox :label="options[i]" :key="i" class="option checkbox-item copyable-option">
                                <span class="copyable-text">{{ options[i] + '、' + item }}</span>
                            </el-checkbox>
                        </div>
                    </el-checkbox-group>
                </div>
                <div class="single" v-if="question.type == 'judgment' || question.type == 'single-choice'">
                    <div v-for="(item, i) in question.option" :key="i" class="answer">
                        <el-radio v-model="userAnswer" :disabled="examStatus"
                            :label="question.option.length == 2 ? item : options[i]" class="option copyable-option"
                            @change="updateAnswer">
                            <span class="copyable-text">{{ options[i] + '、' + item }}</span>
                        </el-radio>
                    </div>
                </div>
                <div class="fillingBlank" v-if="question.type == 'fill-in-the-blank'">
                    <el-input class="copyable-option" v-model="userAnswer" :disabled="examStatus" @change="updateAnswer"
                        placeholder="请输入答案"></el-input>
                </div>
                <div class="trueAnswer" v-if="showCorrectAnswer">
                    <span class="colorBefore"></span>
                    <span class="answerStatus" :class="{ 'true': isCorrect, 'false': !isCorrect }">
                        {{ isCorrect ? '回答正确' : '回答错误' }}
                    </span>
                    <span class="correctAnswer">正确答案：</span>
                    <span class="answer">{{ question.answer }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useExamStore } from '../stores/exam';

const props = defineProps({
    question: {
        type: Object,
        required: true,
    },
    seq: {
        type: Number,
        required: true,
    },
    examStatus: {
        type: Boolean,
        default: false,
    },
    showCorrectAnswer: {
        type: Boolean,
        default: false,
    },
});

const emit = defineEmits(['update-answer']);
const examStore = useExamStore();
const options = ref(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']);

const questionTypeText = computed(() => {
    switch (props.question.type) {
        case 'multiple-choice':
            return '多选';
        case 'single-choice':
            return '单选';
        case 'judgment':
            return '判断';
        case 'fill-in-the-blank':
            return '填空';
        default:
            return '';
    }
});

const userAnswer = computed({
    get() {
        return examStore.userAnswers[props.question.id];
    },
    set(value) {
        emit('update-answer', props.question.id, value);
    },
});

const isCorrect = computed(() => {
    return examStore.isCorrect(props.question, userAnswer.value);
});

const updateAnswer = (value) => {
    emit('update-answer', props.question.id, value);
};
</script>

<style lang="scss" scoped>
#examCard {
    display: flex;
    border: 1px solid #ddd;
    margin-bottom: 15px;
    padding: 15px;

    .left {
        width: 50px;
        text-align: center;
        font-size: 1.2em;
        color: #333;
    }

    .right {
        flex-grow: 1;

        .questionType {
            margin-bottom: 5px;
            font-size: 0.9em;
            color: #999;
        }

        .questionStem {
            margin-bottom: 10px;
            font-weight: bold;
        }

        .questionAnswer {
            .answer {
                margin-bottom: 8px;
            }

            .trueAnswer {
                margin-top: 10px;
                font-size: 0.9em;

                .colorBefore {
                    display: inline-block;
                    width: 10px;
                    height: 10px;
                    border-radius: 50%;
                    margin-right: 5px;
                }

                .answerStatus {
                    &.true+.correctAnswer::before {
                        background-color: green;
                    }

                    &.false+.correctAnswer::before {
                        background-color: red;
                    }
                }

                .correctAnswer {
                    font-weight: bold;
                    margin-left: 15px;
                }

                .answer {
                    color: #555;
                }
            }
        }
    }
}
</style>