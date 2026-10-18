<template>
    <div>
        <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
            <div class="modal-content">
                <span @click="closeModal" class="close">&times;</span>
                <h2>题库功能扩展意见征集表</h2>

                <div class="qr-code">
                    <img src="../assets/img/modal.png" alt="问卷二维码" />
                </div>

                <div class="buttons">
                    <el-button @click="goToFeedback" type="primary">去填写问卷</el-button>
                    <el-button @click="handleSubmit" type="primary">关闭</el-button>
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
            neverShowAgain: false // 是否勾选不再显示
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
        // 问卷链接统一放在意见反馈页（/newHome/feedback），弹窗只做引导
        goToFeedback() {
            this.closeModal();
            this.$router.push('/newHome/feedback');
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

<style scoped>
.modal-overlay {
    display: block;
    position: fixed;
    z-index: 9999;
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
    max-width: 500px;
    text-align: center;
    border-radius: 12px;
    position: relative;
}

.qr-code img {
    width: 200px;
    height: 200px;
    margin-bottom: 20px;
    margin-top: 20px;
}

.close {
    color: #aaa;
    position: absolute;
    right: 16px;
    top: 12px;
    font-size: 28px;
    font-weight: bold;
    cursor: pointer;
    line-height: 1;
    padding: 4px;
}

.close:hover,
.close:focus {
    color: black;
    text-decoration: none;
}

.checkbox {
    margin-top: 20px;
}
</style>