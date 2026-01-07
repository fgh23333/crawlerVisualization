<template>
    <div id="aboutUs">
        <div class="info-card">
            <div class="logo-section">
                <img src="@/assets/logo.png" alt="Logo" class="app-logo">
                <h1 class="app-name">思政题库</h1>
                <p class="app-desc">高效复习 · 轻松备考</p>
            </div>
            
            <div class="content-section">
                <div class="info-item">
                    <div class="label">关于项目</div>
                    <div class="text">本项目致力于为广大学生提供一个便捷、高效的思政课刷题平台，涵盖马原、毛概、思修等多个科目。</div>
                </div>
                
                <div class="info-item">
                    <div class="label">联系我们</div>
                    <div class="text contact-email">
                        <i class="el-icon-message"></i> info@635262140.xyz
                    </div>
                </div>
            </div>
            
            <div class="footer">
                &copy; 2026 Political Exam System
            </div>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        return {}
    }
}
</script>

<style lang="less" scoped>
#aboutUs {
    display: flex;
    justify-content: center;
    height: 80%;
    margin-top: 5%;
    
    .info-card {
        width: 600px;
        background-color: #FFFFFF;
        border-radius: 24px;
        box-shadow: 0 10px 30px rgba(108, 93, 211, 0.1);
        padding: 40px;
        font-family: 'HarmonyOS Sans SC', '思源黑体', sans-serif;
        text-align: center;
        animation: fadeInUp 0.5s ease-out forwards;
        opacity: 0;
        transform: translateY(20px);
        
        .logo-section {
            margin-bottom: 40px;
            
            .app-logo {
                width: 80px;
                height: 80px;
                margin-bottom: 15px;
                border-radius: 16px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            }
            
            .app-name {
                font-size: 28px;
                font-weight: bold;
                color: #333;
                margin: 0 0 10px;
            }
            
            .app-desc {
                font-size: 16px;
                color: #888;
                margin: 0;
            }
        }
        
        .content-section {
            text-align: left;
            padding: 0 20px;
            
            .info-item {
                margin-bottom: 25px;
                
                .label {
                    font-size: 14px;
                    color: #6C5DD3;
                    font-weight: bold;
                    margin-bottom: 8px;
                    text-transform: uppercase;
                    letter-spacing: 1px;
                }
                
                .text {
                    font-size: 16px;
                    color: #555;
                    line-height: 1.6;
                    
                    &.contact-email {
                        color: #333;
                        font-weight: 500;
                        font-family: monospace;
                        background: #f5f5f5;
                        padding: 8px 12px;
                        border-radius: 8px;
                        display: inline-block;
                    }
                }
            }
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #999;
            font-size: 12px;
        }
    }
}

@keyframes fadeInUp {
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
