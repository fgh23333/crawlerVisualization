<template>
    <div id="aboutUs">
        <div class="info">
            <div class="contact box">
                <div class="title">联系我们</div>
                <div class="contactWay">info@635262140.xyz</div>
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
        margin-top: 90px;
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

            .member {
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
