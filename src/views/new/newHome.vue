<template>
    <div id="newHome" :class="{ 'mobile-mode': isMobile }">
        <modal></modal>
        <el-container>
    <el-aside :width="isCollapsed ? '0px' : '262px'" class="sidebar" :class="{ 'is-collapsed': isCollapsed }">
        <div class="sidebar-content">
            <router-link to="/newHome" class="logo-link">
                <div class="title">
                    <img src="@/assets/icon/icon-title.png" class="icon">
                    <div class="titleCover">
                        <span class="bigTitle">思政题库</span>
                        <span class="smallTitle">复习备考专区</span>
                    </div>
                </div>
            </router-link>
            <div class="nav" ref="nav">
                <el-menu class="el-menu-vertical-demo" :unique-opened="true" active-text-color="#8174D6" :router="true" @open="handleMenuToggle" @close="handleMenuToggle">
                    <el-sub-menu v-for="(item, i) in list" :key="i" :index="list[i].src">
                        <template #title>
                            <img :src="list[i].icon" class="menuIcon">
                            <span>{{ list[i].subject }}</span>
                        </template>
                        <el-menu-item-group>
                            <el-menu-item class="option" :index="'/newHome/subject/' + list[i].src">总题库</el-menu-item>
                            <el-menu-item class="option" :index="'/newHome/rightWrong/' + list[i].src">判断题</el-menu-item>
                            <el-menu-item class="option" :index="'/newHome/singleChoice/' + list[i].src">单选题</el-menu-item>
                            <el-menu-item class="option" :index="'/newHome/multipleChoice/' + list[i].src">多选题</el-menu-item>
                            <el-menu-item class="option" :index="'/newHome/fillingBlank/' + list[i].src">填空题</el-menu-item>
                            <el-menu-item class="option" :index="'/newHome/exam/' + list[i].src + '/1'">在线练习</el-menu-item>
                        </el-menu-item-group>
                    </el-sub-menu>
                </el-menu>
            </div>
            <div class="buttonContainer">
                <div class="buttonRow">
                <!-- AI 智能助教（智能体核心入口）：角标显示端侧 AI 可用状态 -->
                <router-link to="/newHome/chat" class="icon-btn ai-btn">
                    <div class="icon-wrap">
                        <el-icon :size="20"><MagicStick /></el-icon>
                        <span class="ai-status-dot" :class="aiStore.dotClass"
                            :title="`端侧 AI（Beta）：${aiStore.statusText}，点击查看自检`"
                            @click.stop.prevent="aiStore.openDiagnosis"></span>
                    </div>
                    <span class="icon-label">AI 助教</span>
                </router-link>

                <!-- 收藏夹 -->
                <router-link to="/newHome/favorites" class="icon-btn">
                    <div class="icon-wrap">
                        <el-icon :size="20"><Star /></el-icon>
                    </div>
                    <span class="icon-label">收藏夹</span>
                </router-link>

                <!-- 其他题库 -->
                <el-popover
                    placement="top"
                    :width="200"
                    trigger="click"
                    popper-class="sidebar-popover"
                    v-model:visible="showLibPopover"
                >
                    <template #default>
                        <div class="popover-menu">
                            <div class="popover-title">其他题库</div>
                            <router-link to="/ncre3" class="popover-item" @click="showLibPopover = false">
                                <el-icon><Monitor /></el-icon>
                                <span>计算机三级题库</span>
                            </router-link>
                            <router-link to="/computer-question" class="popover-item" @click="showLibPopover = false">
                                <el-icon><Cpu /></el-icon>
                                <span>计算机组成原理</span>
                            </router-link>
                        </div>
                    </template>
                    <template #reference>
                        <div class="icon-btn" :class="{ active: showLibPopover }">
                            <div class="icon-wrap">
                                <el-icon :size="20"><Grid /></el-icon>
                            </div>
                            <span class="icon-label">其他题库</span>
                        </div>
                    </template>
                </el-popover>

                <!-- 关于 -->
                <el-popover
                    placement="top"
                    :width="180"
                    trigger="click"
                    popper-class="sidebar-popover"
                    v-model:visible="showMorePopover"
                >
                    <template #default>
                        <div class="popover-menu">
                            <div class="popover-title">更多</div>
                            <router-link to="/newHome/about" class="popover-item" @click="showMorePopover = false">
                                <el-icon><InfoFilled /></el-icon>
                                <span>关于</span>
                            </router-link>
                        </div>
                    </template>
                    <template #reference>
                        <div class="icon-btn" :class="{ active: showMorePopover }">
                            <div class="icon-wrap">
                                <el-icon :size="20"><More /></el-icon>
                            </div>
                            <span class="icon-label">更多</span>
                        </div>
                    </template>
                </el-popover>
                </div>

                <!-- 意见反馈：专门入口，问卷链接统一在反馈页维护 -->
                <router-link to="/newHome/feedback" class="feedback-entry">
                    <el-icon :size="16"><ChatSquare /></el-icon>
                    <span>意见反馈</span>
                </router-link>
            </div>
        </div>
    </el-aside>
            <div class="toggle-bar" @click.stop="toggleSidebar" :class="{ 'is-mobile': isMobile }">
                <span v-if="!isMobile" class="arrow" :class="{ right: !isCollapsed }"></span>
                <span v-else class="hamburger">
                    <span class="line"></span>
                    <span class="line"></span>
                    <span class="line"></span>
                </span>
            </div>
            <el-container>
                <el-main @click="handleMainClick">
                    <router-view></router-view>
                    <!-- <el-popover placement="right" width="200" trigger="click">
                            <div class="menu">
                                <div class="selection" @click="open()">
                                    <span class="text">深色模式</span>
                                    <el-switch v-model="value1"></el-switch>
                                </div>
                                <div class="selection" @click="open()">
                                    <span class="text">隐藏答案</span>
                                    <el-switch v-model="value2"></el-switch>
                                </div>
                            </div>
                            <div slot="reference" class="tab" id="last">
                                <img class="image" src="@/assets/icon/icon-setting.svg">
                                <div class="text">设置</div>
                            </div>
                        </el-popover> -->
                </el-main>
            </el-container>
        </el-container>
        <!-- 端侧 AI 环境自检弹窗（全站唯一实例，状态由 ai store 管理） -->
        <AIDiagnosisModal v-model="aiStore.diagVisible"></AIDiagnosisModal>
    </div>
</template>

<script>
import modal from '@/components/modal.vue'
import AIDiagnosisModal from '@/components/AIDiagnosisModal.vue'
import { ElMessage } from 'element-plus'
import { Monitor, MagicStick, Star, Grid, Cpu, More, InfoFilled, ChatSquare } from '@element-plus/icons-vue'
import { useAiStore } from '@/stores/ai'
import grapeIcon from '@/assets/icon/grape.svg'
import juiceIcon from '@/assets/icon/juice.svg'
import pearIcon from '@/assets/icon/pear.svg'
import lemonIcon from '@/assets/icon/lemon.svg'
import cherryIcon from '@/assets/icon/cherry.svg'
import melonIcon from '@/assets/icon/melon.svg'
import breadIcon from '@/assets/icon/bread.svg'
import tomatoIcon from '@/assets/icon/tomato.svg'
import lettuceIcon from '@/assets/icon/lettuce.svg'

export default {
    setup() {
        // 端侧 AI 全局状态：角标 / 自检弹窗共享
        return { aiStore: useAiStore() }
    },
    data() {
        // 移动端判定不能只看 innerWidth：index.html 对手机设 initial-scale=0.5，
        // 布局视口翻倍（如 390pt 手机 → 780px），会落进桌面断点。需叠加与
        // 视口脚本同口径的 screen.width < 600 一起判断，保证手机走抽屉式侧栏。
        const isMobileViewport = window.innerWidth < 768
            || (typeof screen !== 'undefined' && screen.width < 600);
        return {
            isCollapsed: isMobileViewport,
            isMobile: isMobileViewport,
            list: [
                { subject: '马原', src: 'Marx', icon: grapeIcon },
                { subject: '近代史', src: 'CMH', icon: juiceIcon },
                { subject: '思政', src: 'Political', icon: pearIcon },
                { subject: '毛概', src: 'MaoIntro', icon: lemonIcon },
                { subject: '习概', src: 'XiIntro', icon: cherryIcon },
                { subject: '社主史', src: 'SDH', icon: melonIcon },
                { subject: '新中国史', src: 'NCH', icon: breadIcon },
                { subject: '党史', src: 'CCPH', icon: tomatoIcon },
                { subject: '改开史', src: 'ORH', icon: lettuceIcon }
            ],
            value1: false,
            value2: false,
            showLibPopover: false,
            showMorePopover: false,
        }
    },
    mounted() {
        window.addEventListener('resize', this.handleResize);
        // 静默检测端侧 AI 环境（内部全容错，不影响页面功能）
        this.aiStore.checkEnvironment();
        this.$nextTick(() => this.checkNavScrollable());
    },
    beforeUnmount() {
        window.removeEventListener('resize', this.handleResize);
    },
    methods: {
        open() {
            ElMessage({ showClose: true, message: '开发中，敬请期待' });
        },
        toggleSidebar() {
            this.isCollapsed = !this.isCollapsed;
        },
        handleMainClick() {
            if (this.isMobile && !this.isCollapsed) {
                this.isCollapsed = true;
            }
        },
        handleResize() {
            const mobile = window.innerWidth < 768
                || (typeof screen !== 'undefined' && screen.width < 600);
            // 桌面→移动端切换时收起抽屉，避免遮住内容；移动端→桌面恢复常驻侧栏
            if (mobile && !this.isMobile) this.isCollapsed = true;
            this.isMobile = mobile;
            if (!mobile && this.isCollapsed) {
                this.isCollapsed = false;
            }
            this.checkNavScrollable();
        },
        // 菜单子项展开/收起改变内容高度后复检（nextTick 等待 DOM 更新）
        handleMenuToggle() {
            this.$nextTick(() => this.checkNavScrollable());
        },
        // 仅当菜单内容溢出时挂 is-scrollable：以上下渐隐提示「还能滚」（滚动条已隐藏，不溢出不渐隐）
        checkNavScrollable() {
            const nav = this.$refs.nav;
            if (nav) nav.classList.toggle('is-scrollable', nav.scrollHeight > nav.clientHeight + 4);
        },
    },
    components: {
        modal,
        AIDiagnosisModal,
        Monitor, MagicStick, Star, Grid, Cpu, More, InfoFilled, ChatSquare
    }
}
</script>

<style lang="scss">
.el-popover {
    border-radius: 24px !important;
    padding: 0 !important;
    width: 240px !important;
    color: #525252;
}

.sidebar-popover.el-popover {
    border-radius: 14px !important;
    padding: 6px !important;
    box-shadow: 0 8px 24px rgba(0,0,0,0.1) !important;
    border: 1px solid #f0f0f0 !important;

    .popover-menu {
        .popover-title {
            font-size: 11px;
            color: #bbb;
            font-weight: 600;
            letter-spacing: 0.5px;
            padding: 4px 10px 6px;
            text-transform: uppercase;
        }

        .popover-item {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 9px 10px;
            border-radius: 9px;
            text-decoration: none;
            color: #555;
            font-size: 14px;
            font-weight: 500;
            transition: background 0.15s, color 0.15s;

            .el-icon {
                color: #8F95B2;
                font-size: 16px;
                flex-shrink: 0;
            }

            &:hover {
                background: #f0eefb;
                color: #6C5DD3;

                .el-icon { color: #6C5DD3; }
            }
        }
    }
}

.menu {
    height: 300px;
    padding: 20px 0px;
    font-family: 思源黑体;

    .selection {
        height: 60px;
        width: 190px;
        margin-left: 25px;
        line-height: 60px;
        position: relative;

        .text {
            font-size: 20px;
            color: #525252;
        }

        .el-switch {
            position: absolute;
            right: 0px;
            top: 20px;
        }

        .el-switch.is-checked .el-switch__core {
            background-color: #6C5DD3;
            border-color: #6C5DD3;
        }
    }
}

#newHome {
    .toggle-bar {
        width: 26px;
        cursor: pointer;
        height: 100vh;
        height: 100dvh; // 移动端随地址栏收放的动态视口高，兜底防「底部要滚动才可见」
        padding: 0;
        float: left;
        position: relative;
        top: 0;
        bottom: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        background-color: transparent;
        transition: background-color 0.25s;

        // 平时透明只留圆钮，悬停给淡色洗底提示可点
        &:hover {
            background-color: rgba(230, 232, 240, 0.45);
        }

        .arrow {
            display: block;
            position: relative;
            width: 24px;
            height: 24px;
            padding: 0;
            border: none;
            background: #fff;
            border-radius: 50%;
            box-shadow: 0 1px 6px rgba(108, 93, 211, 0.22);
            transition: box-shadow 0.25s;

            // chevron 伪元素绘制，随状态换向：折叠态指右（点开）、展开态指左（收起）
            &::before {
                content: '';
                position: absolute;
                left: 50%;
                top: 50%;
                width: 7px;
                height: 7px;
                border: solid #8F95B2;
                border-width: 0 2px 2px 0;
                border-radius: 1px;
                transition: border-color 0.2s, transform 0.3s ease;
            }

            &:not(.right)::before {
                transform: translate(-36%, -50%) rotate(-45deg);
            }

            &.right::before {
                transform: translate(-64%, -50%) rotate(135deg);
            }
        }

        &:hover .arrow {
            box-shadow: 0 2px 10px rgba(108, 93, 211, 0.35);

            &::before {
                border-color: #6C5DD3;
            }
        }
    }

    .el-main {
        background-color: #FAFBFF;
        color: #333;
        text-align: center;
        height: 100vh;
        height: 100dvh;
        padding: 0;
    }

    .sidebar {
        transition: width 0.3s ease, opacity 0.3s ease;
        overflow: hidden;
        position: relative;
        height: 100vh;
        height: 100dvh;
        background-color: #fff;
        border-right: 1px solid #f0f0f0;
    }

    .sidebar-content {
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 262px; // Fixed content width to prevent reflow during transition
    }

    .el-aside {
        text-align: center;
        height: 100vh;
        height: 100dvh;
        overflow: visible; // Allow menu popups if needed
    }

    .title {
        height: 72px;
        margin: 34px 20px;
        display: flex;
        align-items: center;

        .icon {
            width: 64px;
            height: 64px;
        }

        .titleCover {
            margin-left: 10px;
            text-align: left;
            letter-spacing: 1px;
            display: flex;
            flex-direction: column;
            justify-content: center;

            .bigTitle {
                color: #6C5DD3;
                font-weight: bold;
                font-size: 18px;
                line-height: 1.5;
            }

            .smallTitle {
                font-weight: 500;
                color: #7A7A7A;
                font-size: 14px;
                line-height: 1.5;
            }
        }
    }

    .nav {
        flex: 1; // Take remaining space
        min-height: 0; // 允许矮窗口下收缩到小于内容高度，保证真正滚得动
        overflow-y: auto;
        overflow-x: hidden;
        padding: 8px 0px;
        // 滚动条隐藏（保留滚动能力）：Chromium / Firefox / 旧 Edge
        scrollbar-width: none;
        -ms-overflow-style: none;
        &::-webkit-scrollbar { display: none; }

        // 内容溢出可滚动时，上下边缘渐隐作提示（替代被隐藏的滚动条）
        &.is-scrollable {
            -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
            mask-image: linear-gradient(to bottom, transparent 0, #000 14px, #000 calc(100% - 14px), transparent 100%);
        }

        .el-menu-vertical-demo {
            width: 216px;
            margin: 0px 23px;
            border: none;
            padding-top: 10px;

            .el-sub-menu {
                margin-bottom: 12px;
                text-align: left;
                border-radius: 12px;
                overflow: hidden; // Keep corners rounded

                .menuIcon {
                    font-size: 24px;
                    margin: 0px 10px;
                    width: 24px;
                    height: 24px;
                    vertical-align: middle;
                }

                .el-sub-menu__title {
                    border-radius: 12px;
                    background-color: #F7F7F7;
                    font-size: 16px;
                    font-weight: bold;
                    color: #8F95B2;
                    transition: all 0.3s;
                    height: 48px;
                    line-height: 48px;
                }

                .el-sub-menu__title:hover {
                    background-color: #6C5DD3;
                    color: white;
                }

                .el-sub-menu__icon-arrow {
                    font-weight: bold;
                }

                .el-sub-menu__title:hover>.el-sub-menu__icon-arrow {
                    color: white;
                }
            }
            
            // Active state styles
            .is-opened>.el-sub-menu__title {
                background-color: #6C5DD3;
                color: white;
            }
            
            .is-opened .el-sub-menu__icon-arrow {
                color: white;
            }

            .el-menu-item-group__title {
                padding: 0; // Remove default padding
            }

            .option {
                font-size: 14px;
                color: #8F95B2;
                font-weight: 500;
                margin-left: 10px;
                height: 40px;
                line-height: 40px;
                border-radius: 8px;
                margin-bottom: 4px;
            }

            .option:hover {
                background-color: #F0F2F5;
                color: #6C5DD3;
            }

            // Scope to .el-menu-item only. The unqualified `.is-active`
            // selector used to leak onto `.el-sub-menu` and `.el-sub-menu__title`
            // (Element Plus stamps `is-active` on every ancestor of the active
            // item), painting the whole submenu container lavender and leaving
            // a rounded purple strip below the last option.
            .el-menu-item.is-active {
                background-color: #E6E4F4 !important;
                color: #6C5DD3 !important;
                font-weight: bold;
            }
        }
    }

    .buttonContainer {
        width: 216px;
        margin: 16px auto 20px;
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        gap: 10px;

        .buttonRow {
            display: flex;
            justify-content: space-around;
            align-items: flex-start;
            gap: 4px;
        }

        .feedback-entry {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            height: 36px;
            border-radius: 10px;
            background: #f4f4f8;
            color: #8F95B2;
            font-size: 13px;
            font-weight: 500;
            text-decoration: none;
            transition: background 0.2s, color 0.2s;

            &:hover {
                background: #ebe9f9;
                color: #6C5DD3;
            }
        }

        .icon-btn {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            flex: 1;
            padding: 10px 4px;
            border-radius: 14px;
            text-decoration: none;
            transition: background 0.2s;

            .icon-wrap {
                width: 44px;
                height: 44px;
                border-radius: 12px;
                background: #f4f4f8;
                display: flex;
                align-items: center;
                justify-content: center;
                color: #8F95B2;
                transition: all 0.2s;
            }

            .icon-label {
                font-size: 11px;
                color: #8F95B2;
                font-weight: 500;
                white-space: nowrap;
            }

            &:hover, &.active {
                .icon-wrap {
                    background: #ebe9f9;
                    color: #6C5DD3;
                }
                .icon-label {
                    color: #6C5DD3;
                }
            }

            // AI 智能助教入口：渐变高亮，突出智能体定位
            &.ai-btn {
                .icon-wrap {
                    position: relative;
                    background: linear-gradient(135deg, #8b7cf0, #6c5dd3);
                    color: #fff;
                    box-shadow: 0 6px 16px rgba(108, 93, 211, 0.35);

                    // 端侧 AI 可用状态角标：检测中(灰)/就绪(绿)/需下载或下载中(黄)/不支持(红)
                    .ai-status-dot {
                        position: absolute;
                        top: -2px;
                        right: -2px;
                        width: 10px;
                        height: 10px;
                        border-radius: 50%;
                        border: 2px solid #fff;
                        box-sizing: content-box;
                        cursor: pointer;
                        /* 扩大点击热区但不撑大布局 */
                        &::after {
                            content: '';
                            position: absolute;
                            inset: -5px;
                        }

                        &.checking { background: #b8bec9; }
                        &.ok { background: #0BDE00; }
                        &.warn { background: #e8a51e; }
                        &.error { background: #FF3B3B; }
                    }
                }
                .icon-label {
                    color: #6c5dd3;
                    font-weight: 600;
                }
                &:hover .icon-wrap {
                    background: linear-gradient(135deg, #7c6ce8, #5b4fd6);
                    transform: translateY(-1px);
                    box-shadow: 0 8px 20px rgba(108, 93, 211, 0.45);
                }
            }
        }
    }

    .sidebar.is-collapsed {
        width: 0 !important;
        border: none;

        * {
            display: none !important;
        }
    }

    .hamburger {
        display: flex;
        flex-direction: column;
        gap: 5px;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;

        .line {
            display: block;
            width: 20px;
            height: 2px;
            background: #666;
            border-radius: 1px;
            transition: background 0.2s;
        }
    }

    .toggle-bar:hover .hamburger .line {
        background: #333;
    }

    // ── Mobile / narrow-screen responsive ──────────────────
    // 由 JS isMobile 驱动的 mobile-mode 类生效，不再依赖 @media：
    // initial-scale=0.5 的手机布局视口可达 ~780px，max-width 媒体查询会漏判，
    // 类与 data()/handleResize 的判定同源，保证手机始终走抽屉式侧栏。
    &.mobile-mode {
        .toggle-bar {
            width: 44px;
            padding: 0 10px;

            &.is-mobile {
                position: fixed;
                left: 0;
                top: 0;
                height: 48px;
                width: 48px;
                z-index: 101;
                background: rgba(255,255,255,0.95);
                border-radius: 0 12px 12px 0;
                box-shadow: 2px 2px 8px rgba(0,0,0,0.08);
                padding: 0;
            }
        }

        .sidebar {
            position: fixed;
            z-index: 100;
            left: 0;
            top: 0;
            height: 100dvh; // 抽屉精确贴合可视区，底部按钮区不被地址栏遮挡
            box-shadow: 4px 0 20px rgba(0, 0, 0, 0.12);
        }

        .sidebar.is-collapsed {
            box-shadow: none;
        }

        // 抽屉纵向空间宝贵：压缩 Logo 区，把更多高度让给导航与底部按钮
        .sidebar .title {
            height: auto;
            margin: 20px 16px 12px;

            .icon {
                width: 52px;
                height: 52px;
            }
        }

        .el-aside {
            position: static;
        }

        .el-main {
            width: 100%;
        }
    }
}
</style>
