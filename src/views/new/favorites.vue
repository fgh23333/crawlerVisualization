<template>
    <div id="favorites">
        <div class="titleCover">
            <div class="title">收藏夹</div>
            <!-- <div class="selector">
                <el-select v-model="value" placeholder="请选择" class="select">
                    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
                    </el-option>
                </el-select>
            </div> -->
        </div>
        <questionCard></questionCard>
    </div>
</template>

<script>
import questionCard from '@/components/questionCard.vue';

export default {
    data() {
        return {
            options: [
                {
                    value: '',
                    label: '全部题目'
                },
                {
                    value: 'Marx',
                    label: '马原'
                },
                {
                    value: 'CMH',
                    label: '近代史'
                },
                {
                    value: 'Political',
                    label: '思政'
                },
                {
                    value: 'MaoIntro',
                    label: '毛概'
                },
                {
                    value: 'XiIntro',
                    label: '习概'
                },
                {
                    value: 'ORH',
                    label: '改开史'
                },
                {
                    value: 'NCH',
                    label: '新中国史'
                },
                // {
                //     value: '社主史',
                //     label: 'SDH',
                // },
                // {
                //     value: '党史',
                //     label: 'CCPH',
                // }
            ],
            value: ''
        }
    },
    components: {
        questionCard
    }
}
</script>

<style lang="less" scoped>
#favorites {
    .titleCover {
        text-align: left;

        .title {
            font-weight: bold;
            font-size: 36px;
            line-height: 36px;
            color: #6C5DD3;
            height: 36px;
            letter-spacing: 3px;
            display: inline-block;
            width: fit-content;
            margin-right: 36px;
        }

        .selector {
            display: inline-block;

            .select {
                width: 188px;
                height: 50px;
                color: #5A5E70;
                font-size: 24px;
                line-height: 50px;
            }

            .select ::v-deep .el-input__inner {
                border: 3px solid #6C5DD3 !important;
                border-radius: 10px !important;
                color: #5A5E70;
                font-size: 24px;
                line-height: 50px;
                font-family: '思源黑体';
                height: 50px;
                font-weight: 500;
            }

            .select ::v-deep .el-input__inner::placeholder {
                color: #5A5E70;
                font-family: '思源黑体';
                font-weight: 500;
            }

            .select ::v-deep .el-input__icon {
                height: auto;
            }
        }
    }
}
</style>