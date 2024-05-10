<template>
    <div id="questionCard">
        <div class="questionCover" v-for="(item, i) in list" :key="i">
            <div class="questionTypeCover" v-if="list[i].option.length == 2">
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
            list: [
                {
                    "questionStem": "“按劳分配”有其历史局限性，它默认劳动者的天赋能力差别，实质上是不平等的。",
                    "option": [
                        "正确",
                        "错误"
                    ],
                    "answer": "正确"
                },
                {
                    "questionStem": "马克思主义的鲜明特征，如果用一句话来概括就是科学性与革命性的统一。",
                    "option": [
                        "正确",
                        "错误"
                    ],
                    "answer": "正确"
                },
                {
                    "questionStem": "随着科学技术的发展，人类已经制造出诸如醋酸纤维、聚苯乙烯、合成橡胶等自然界原本不存在的化合物，其数量已经达到数百万种。这说明物质世界是人类创造的。",
                    "option": [
                        "正确",
                        "错误"
                    ],
                    "answer": "错误"
                },
                {
                    "questionStem": "真象反映事物的本质，假象不反映事物的本质。",
                    "option": [
                        "正确",
                        "错误"
                    ],
                    "answer": "错误"
                },
                {
                    "questionStem": "资本是能够带来剩余价值的价值。",
                    "option": [
                        "正确",
                        "错误"
                    ],
                    "answer": "正确"
                },
                {
                    "questionStem": "对“劳动是财富之父，土地是财富之母”这句话的正确解释是",
                    "option": [
                        "劳动和土地都是价值的源泉",
                        "劳动创造使用价值，土地形成价值",
                        "劳动是创造价值的外部条件，土地是价值的真正源泉",
                        "劳动必须和自然物相结合才能创造出物质财富"
                    ],
                    "answer": [
                        "D"
                    ]
                },
                {
                    "questionStem": "把同质的事物区分开来的依据是",
                    "option": [
                        "事物的度",
                        "事物的属性和量",
                        "事物内在的规定性",
                        "事物的特殊矛盾"
                    ],
                    "answer": [
                        "B"
                    ]
                },
                {
                    "questionStem": "“哲学家们只是用不同的方式解释世界，问题在于改变世界”。这一观点是说",
                    "option": [
                        "认识世界没有必要",
                        "认识的目的在于指导实践",
                        "实践无需认识指导",
                        "实践是认识的本质"
                    ],
                    "answer": [
                        "B"
                    ]
                },
                {
                    "questionStem": "辩证唯物主义认为",
                    "option": [
                        "动者恒动，静者恒静",
                        "动即是静，静即是动",
                        "静止是物质运动的特殊状态",
                        "只有绝对的运动，没有相对的静止"
                    ],
                    "answer": [
                        "C"
                    ]
                },
                {
                    "questionStem": "社会基本矛盾发展的最终原因是",
                    "option": [
                        "生产力的发展",
                        "生产关系的发展",
                        "经济基础的发展",
                        "上层建筑的发展"
                    ],
                    "answer": [
                        "A"
                    ]
                },
                {
                    "questionStem": "马克思主义认为，人的自由而全面的发展",
                    "option": [
                        "是社会发展的根本目标",
                        "是社会进步的重要内容",
                        "既是社会发展的结果，又是社会发展的原因",
                        "与社会政治、经济、文化的发展互为前提"
                    ],
                    "answer": [
                        "A",
                        "B",
                        "C",
                        "D"
                    ]
                },
                {
                    "questionStem": "下列有关资本主义历史局限性的说法正确的是",
                    "option": [
                        "资本主义基本矛盾阻碍社会生产力的发展",
                        "资本主义制度下财富占有两极分化，引发经济危机",
                        "资产阶级支配和控制资本主义经济和政治的发展和运行，不断激化社会矛盾和冲突",
                        "资本主义历史局限性是可以在资本主义生产方式范围内根本消除的"
                    ],
                    "answer": [
                        "A",
                        "B",
                        "C"
                    ]
                },
                {
                    "questionStem": "下列选项中正确表达了马克思主义科学内涵的有(  )",
                    "option": [
                        "马克思和恩格斯创立并为后继者所不断发展的科学理论体系",
                        "关于自然、社会和人类思维发展一般规律的学说",
                        "关于社会主义必然代替资本主义、最终实现共产主义的学说",
                        "关于无产阶级解放、全人类解放和每个人自由而全面发展的学说，是指引人民创造美好生活的行动指南"
                    ],
                    "answer": [
                        "A",
                        "B",
                        "C",
                        "D"
                    ]
                },
                {
                    "questionStem": "价值的基本特性是(  )",
                    "option": [
                        "主体性",
                        "客观性",
                        "多维性",
                        "社会历史性"
                    ],
                    "answer": [
                        "A",
                        "B",
                        "C",
                        "D"
                    ]
                }
            ],
            options: ['A', 'B', 'C', 'D']
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