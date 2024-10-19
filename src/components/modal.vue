<template>
    <div>
        <div v-if="showModal" class="modal">
            <div class="modal-content">
                <span @click="closeModal" class="close">&times;</span>
                <h2>问卷二维码</h2>

                <div class="qr-code">
                    <img src="../assets/img/modal.png" alt="问卷二维码" />
                </div>

                <div class="buttons">
                    <el-button @click="goToSurvey" type="primary">点击前往</el-button>
                    <el-button @click="handleSubmit" type="primary">确认</el-button>
                </div>

                <div class="checkbox">
                    <el-checkbox type="checkbox" v-model="neverShowAgain">永久不再显示</el-checkbox>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {
            showModal: false, // 弹窗是否显示
            neverShowAgain: false, // 是否勾选不再显示
            surveyLink: 'https://f.wps.cn/g/jHGbzDxa/' // 跳转问卷链接
        };
    },
    created() {
        // 页面加载时检查用户是否选择了永久不再显示
        if (!localStorage.getItem('neverShowSurvey')) {
            this.showModal = true;
        }
    },
    methods: {
        closeModal() {
            this.showModal = false;
        },
        goToSurvey() {
            // 点击前往按钮，跳转到问卷链接
            window.open(this.surveyLink, '_blank');
        },
        handleSubmit() {
            // 保存永久不再显示的选择
            if (this.neverShowAgain) {
                localStorage.setItem('neverShowSurvey', 'true');
            }
            this.closeModal();
        }
    }
};
</script>

<style>
.modal {
    display: block;
    position: fixed;
    z-index: 1;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.4);
}

.modal-content {
    background-color: #fefefe;
    margin: 15% auto;
    padding: 20px;
    border: 1px solid #888;
    width: 40%;
    text-align: center;
    /* 居中对齐 */
}

.qr-code img {
    width: 200px;
    /* 设置二维码的大小 */
    height: 200px;
    margin-bottom: 20px;
    margin-top: 20px;
}

.close {
    color: #aaa;
    float: right;
    font-size: 28px;
    font-weight: bold;
}

.close:hover,
.close:focus {
    color: black;
    text-decoration: none;
    cursor: pointer;
}

.checkbox {
    margin-top: 20px;
}
</style>