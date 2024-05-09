<template>
    <div id="newHome">
        <el-container>
            <el-aside width="262px">
                <div class="title">
                    <img src="@/assets/icon/icon-title.png" class="icon">
                    <div class="titleCover">
                        <span class="bigTitle">马院题库</span>
                        <span class="smallTitle">上海海洋大学</span>
                    </div>
                </div>
                <div class="nav">
                    <el-menu class="el-menu-vertical-demo" :unique-opened="true" active-text-color="#8174D6"
                        :router="true">
                        <el-submenu v-for="(item, i) in list" :key="i" :index="list[i].src">
                            <template slot="title">
                                <img :src="list[i].icon" class="menuIcon"></img>
                                <span>{{ list[i].subject }}</span>
                            </template>
                            <el-menu-item-group>
                                <el-menu-item class="option" :index="'subject/' + list[i].src">总题库</el-menu-item>
                                <el-menu-item class="option" :index="'rightWrong/' + list[i].src">判断题</el-menu-item>
                                <el-menu-item class="option" :index="'singleChoice/' + list[i].src">单选题</el-menu-item>
                                <el-menu-item class="option" :index="'multipleChoice/' + list[i].src">多选题</el-menu-item>
                            </el-menu-item-group>
                        </el-submenu>
                    </el-menu>
                </div>
                <div class="buttonContainer">
                    <router-link to="/">
                        <div class="tab">
                            <img class="image" src="@/assets/icon/icon-favorites.svg">
                            <div class="text">收藏夹</div>
                        </div>
                    </router-link>
                    <router-link to="/test/aboutUs">
                        <div class="tab">
                            <img class="image" src="@/assets/icon/icon-info.svg">
                            <div class="text">关于</div>
                        </div>
                    </router-link>
                    <div class="tab">
                        <img class="image" src="@/assets/icon/icon-setting.svg">
                        <div class="text">设置</div>
                    </div>
                </div>
            </el-aside>
            <el-container>
                <el-main>
                    <router-view></router-view>
                </el-main>
            </el-container>
        </el-container>
    </div>
</template>

<script>
export default {
    data() {
        return {
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
            ]
        }
    }
}
</script>

<style lang="less">
#newHome {
    .backgroundImg {
        position: absolute;
        right: 0px;
        bottom: 20px;
        z-index: 1;
        width: 400px;
        height: auto;
    }

    .el-main {
        background-color: #FAFBFF;
        color: #333;
        text-align: center;
        height: 100vh;
        padding: 0;
    }

    .el-aside {
        background-color: white;
        color: #333;
        text-align: center;
        line-height: 200px;
        height: 100vh;
    }

    .title {
        height: 72px;
        width: 222px;
        margin: 34px 20px;

        .icon {
            width: 72px;
            height: 72px;
            float: left;
        }

        .titleCover {
            height: 100%;
            width: 130px;
            padding: 10px 10px;
            float: left;
            text-align: left;
            letter-spacing: 3px;


            .bigTitle {
                color: #6C5DD3;
                font-weight: bold;
                font-size: 24px;
                line-height: 36px;
                float: left;
            }

            .smallTitle {
                font-weight: medium;
                color: #7A7A7A;
                font-size: 18px;
                float: left;
                line-height: 28px
            }
        }
    }

    .nav {
        height: 460px;
        overflow: auto;
        text-align: center;
        -ms-overflow-style: none;
        scrollbar-width: none;

        .el-menu-vertical-demo {
            width: 216px;
            margin: 0px 23px;
            border: none;

            .el-submenu {
                margin-top: 0px;
                margin-bottom: 20px;
                text-align: left;

                .menuIcon {
                    font-size: 24px;
                    margin: 0px 10px;
                    position: relative;
                    left: -1000px;
                    filter: drop-shadow(#8F95B2 1000px 0);
                }

                .el-submenu__title {
                    border-radius: 12px;
                    background-color: #F7F7F7;
                    font-size: 20px;
                    font-weight: bold;
                    color: #8F95B2;
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

                .el-submenu__title:hover .menuIcon {
                    filter: drop-shadow(white 1000px 0);
                }
            }

            .option {
                font-size: 18px;
                color: #8F95B2;
                font-weight: medium;
                margin-left: 26px
            }

            .option:hover {
                background-color: white
            }

            .is-opened>.el-submenu__title {
                background-color: #6C5DD3;
                color: white;
            }

            .is-opened .el-submenu__icon-arrow {
                color: white;
            }

            .is-opened .menuIcon {
                filter: drop-shadow(white 1000px 0);
            }
        }

        .is-active {
            background-color: white !important;
        }
    }

    .nav::-webkit-scrollbar {
        display: none;
    }

    .buttonContainer {
        position: absolute;
        bottom: 10px;

        .tab {
            height: 56px;
            text-align: left;
            margin-left: 24px;
            margin-bottom: 16px;

            .image {
                height: 56px;
                width: 56px;
                float: left;
            }

            .text {
                color: #8F95B2;
                font-size: 20px;
                font-weight: bold;
                line-height: 56px;
                float: left;
                margin-left: 16px
            }
        }

        .tab:hover {
            cursor: pointer;
        }
    }
}
</style>