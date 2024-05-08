<template>
    <div id="aboutUs">
        <div class="info">
            <div class="officalLink box">
                <div class="title">官网链接</div>
                <a href="http://222.73.57.150:6571/exam_exercise.html">http://222.73.57.150:6571/exam_exercise.html</a>
                <a href="https://my.shou.edu.cn">https://my.shou.edu.cn</a>
            </div>
            <div class="projectAddress box">
                <div class="title">项目地址</div>
                <a href="https://github.com">
                    <img src="@/assets/icon/github.svg" class="github">
                </a>
                <a href="https://github.com/fgh23333/crawler">https://github.com/fgh23333/crawler</a>
                <a
                    href="https://github.com/fgh23333/crawlerVisualization">https://github.com/fgh23333/crawlerVisualization</a>
            </div>
            <div class="members box">
                <div class="title">制作成员</div>
                <div class="member">爬虫 | 冯国昊</div>
                <div class="member">网页 | 冯国昊 倪镭</div>
                <div class="member">设计 | 倪镭</div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {

        }
    }
}
</script>

<style lang="less">
#aboutUs {
    .info {
        width: 580px;
        height: 499px;
        margin: 0px auto;
        margin-top: 160px;
        background-color: #FFFFFF;
        border-radius: 24px;
        padding-top: 25px;
        font-family: 思源黑体;

        .box {
            width: 462px;
            margin-left: 33px;
            margin-bottom: 25px;
            position: relative;

            .title {
                font-size: 20px;
                font-weight: bold;
                height: 39px;
                width: 133px;
                border-radius: 15px;
                background-color: #6C5DD3;
                color: white;
                line-height: 39px;
                margin: 0px 0px 14px 0px;
            }

            .github {
                position: absolute;
                top: -4px;
                left: 155px;
            }

            a {
                color: #4F4F4F;
                font-size: 18px;
                display: block;
                text-align: left;
                line-height: 37px;
                margin-left: 14px;
            }

            a:visited {
                color: #4F4F4F;
            }

            .member {
                text-align: left;
                margin-left: 14px;
                font-size: 18px;
                font-weight: medium;
                line-height: 32px;
            }
        }
    }
}
</style>