<template>
    <div id="aboutUs">
        <div class="info">
            <div class="officalLink box">
                <div class="title">官网链接</div>
                <a
                    href="http://222.73.57.153:6571/file/student/html/practiceLogin.html?id=1705139277953761280">http://222.73.57.153:6571/file/student/html/practiceLogin.html?id=1705139277953761280</a>
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
                <div class="member">爬虫 | 冯国昊 倪镭</div>
                <div class="member">网页 | 冯国昊 倪镭</div>
                <div class="member">设计 | 倪镭</div>
            </div>
            <div class="contact box">
                <div class="title">联系我们</div>
                <div class="contactTitle">作者微信号：</div>
                <div class="contactWay">倪镭 Yutian_0525</div>
                <div class="contactWay">冯国昊 635262140</div>
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
        width: max-content;
        height: auto;
        margin: 0px auto;
        margin-top: 120px;
        background-color: #FFFFFF;
        border-radius: 24px;
        padding-top: 25px;
        box-shadow: 0px 0px 12px 0 rgba(0, 0, 0, 0.15);
        font-family: 思源黑体;
        padding-right: 30px;
        padding-bottom: 10px;

        .box {
            width: 462px;
            margin-left: 32px;
            margin-bottom: 15px;
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
                overflow-wrap: break-word;
            }

            a:visited {
                color: #4F4F4F;
            }

            .member {
                text-align: left;
                margin-left: 14px;
                font-size: 18px;
                font-weight: 500;
                line-height: 32px;
            }

            .contactTitle {
                text-align: left;
                margin-left: 14px;
                font-size: 18px;
                font-weight: 500;
                line-height: 32px;
            }

            .contactWay {
                text-align: left;
                margin-left: 14px;
                font-size: 18px;
                font-weight: 500;
                line-height: 32px;
            }
        }
    }

    .info {
        opacity: 0;
        animation: fadeInUp 0.3s ease-in-out forwards;
    }
}
</style>