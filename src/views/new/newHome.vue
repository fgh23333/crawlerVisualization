<template>
    <div id="newHome">
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
            <div class="nav">
                <el-menu class="el-menu-vertical-demo" :unique-opened="true" active-text-color="#8174D6" :router="true">
                    <el-submenu v-for="(item, i) in list" :key="i" :index="list[i].src">
                        <template slot="title">
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
                    </el-submenu>
                </el-menu>
            </div>
            <div class="buttonContainer">
                <router-link to="/">
                    <div class="tab">
                        <img class="image" src="@/assets/icon/icon-back.svg">
                        <div class="text">返回旧版</div>
                    </div>
                </router-link>
                <router-link to="/newHome/chat">
                    <div class="tab">
                        <img class="image" src="@/assets/icon/icon-chat.svg">
                        <div class="text">AI对话(Beta)</div>
                    </div>
                </router-link>
                <router-link to="/newHome/favorites">
                    <div class="tab">
                        <img class="image" src="@/assets/icon/icon-favorites.svg">
                        <div class="text">收藏夹</div>
                    </div>
                </router-link>
                <router-link to="/newHome/about">
                    <div class="tab">
                        <img class="image" src="@/assets/icon/icon-info.svg">
                        <div class="text">关于</div>
                    </div>
                </router-link>
            </div>
        </div>
    </el-aside>
            <div class="toggle-bar" @click="toggleSidebar">
                <span class="arrow" :class="{ right: !isCollapsed }"></span>
            </div>
            <el-container>
                <el-main>
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
    </div>
</template>

<script>
import modal from '@/components/modal.vue'

export default {
    data() {
        return {
            isCollapsed: false,
            list: [
                {
                    subject: '马原',
                    src: 'Marx',
                    icon: require('@/assets/icon/grape.svg')
                },
                {
                    subject: '近代史',
                    src: 'CMH',
                    icon: require('@/assets/icon/juice.svg')
                },
                {
                    subject: '思政',
                    src: 'Political',
                    icon: require('@/assets/icon/pear.svg')
                },
                {
                    subject: '毛概',
                    src: 'MaoIntro',
                    icon: require('@/assets/icon/lemon.svg')
                },
                {
                    subject: '习概',
                    src: 'XiIntro',
                    icon: require('@/assets/icon/cherry.svg')
                },
                {
                    subject: '社主史',
                    src: 'SDH',
                    icon: require('@/assets/icon/melon.svg')
                },
                {
                    subject: '新中国史',
                    src: 'NCH',
                    icon: require('@/assets/icon/bread.svg')
                },
                {
                    subject: '党史',
                    src: 'CCPH',
                    icon: require('@/assets/icon/tomato.svg')
                },
                {
                    subject: '改开史',
                    src: 'ORH',
                    icon: require('@/assets/icon/lettuce.svg')
                }
            ],
            value1: false,
            value2: false
        }
    },
    methods: {
        open() {
            this.$message({
                showClose: true,
                message: '开发中，敬请期待'
            });
        },
        toggleSidebar() {
            this.isCollapsed = !this.isCollapsed;
        },
    },
    components: {
        modal
    }
}
</script>

<style lang="less">
.el-popover {
    border-radius: 24px !important;
    padding: 0 !important;
    width: 240px !important;
    color: #525252;
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
        width: 24px;
        cursor: pointer;
        height: 100vh;
        padding: 0px 6px;
        float: left;
        position: relative;
        top: 0;
        bottom: 0;
        left: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 10;
        background-color: rgba(230, 232, 240, 0.4);
        transition: all 0.3s;
    }

    .toggle-bar:hover {
        background-color: rgba(230, 232, 240, 0.8);
    }

    .arrow {
        border: solid #bbb;
        border-width: 0 4px 4px 0;
        display: block;
        padding: 6px;
        transform: rotate(-45deg);
        transition: transform 0.3s ease;
    }

    .arrow.right {
        transform: rotate(135deg);
        margin-left: -4px;
    }

    .el-main {
        background-color: #FAFBFF;
        color: #333;
        text-align: center;
        height: 100vh;
        padding: 0;
    }

    .sidebar {
        transition: width 0.3s ease, opacity 0.3s ease;
        overflow: hidden;
        position: relative;
        height: 100vh;
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
        overflow-y: auto;
        overflow-x: hidden;
        padding: 8px 0px;
        // Keep the subtle shadow for depth
        box-shadow:
            inset 0px -1px 8px 0px rgba(230, 232, 240, 0.5);

        .el-menu-vertical-demo {
            width: 216px;
            margin: 0px 23px;
            border: none;
            padding-top: 10px;

            .el-submenu {
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

                .el-submenu__title {
                    border-radius: 12px;
                    background-color: #F7F7F7;
                    font-size: 16px; // Slightly smaller for better fit
                    font-weight: bold;
                    color: #8F95B2;
                    transition: all 0.3s;
                }

                .el-submenu__title:hover {
                    background-color: #6C5DD3;
                    color: white;
                }

                .el-submenu__icon-arrow {
                    font-weight: bold;
                }

                .el-submenu__title:hover>.el-submenu__icon-arrow {
                    color: white;
                }
            }
            
            // Active state styles
            .is-opened>.el-submenu__title {
                background-color: #6C5DD3;
                color: white;
            }
            
            .is-opened .el-submenu__icon-arrow {
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

            .is-active {
                background-color: #E6E4F4 !important;
                color: #6C5DD3 !important;
                font-weight: bold;
            }
        }
    }

    .nav::-webkit-scrollbar {
        width: 4px;
    }
    .nav::-webkit-scrollbar-thumb {
        background: #ccc;
        border-radius: 4px;
    }

    .buttonContainer {
        width: 216px;
        margin: 20px auto;
        flex-shrink: 0; // Don't shrink

        .tab {
            height: 56px;
            display: flex;
            align-items: center;
            margin-bottom: 12px;
            border-radius: 12px;
            padding: 0 16px;
            box-shadow: 0 2px 12px 0 rgba(0,0,0,0.05);
            background-color: white;
            transition: all 0.3s;

            .image {
                height: 32px;
                width: 32px;
                object-fit: contain;
            }

            .text {
                color: #8F95B2;
                font-size: 16px;
                font-weight: bold;
                margin-left: 16px;
            }
        }

        .tab:hover {
            cursor: pointer;
            transform: translateY(-2px);
            box-shadow: 0 4px 16px 0 rgba(108, 93, 211, 0.2);

            .text {
                color: #6C5DD3;
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
}
</style>
