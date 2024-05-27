<template>
    <div id="favorites">
        <div class="titleCover">
            <div class="title">收藏夹</div>
            <div class="selector">
                <el-select v-model="value" placeholder="请选择" class="select">
                    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
                    </el-option>
                </el-select>
            </div>
        </div>
        <!-- <questionCard></questionCard> -->
    </div>
</template>

<script>
import questionCard from '@/components/questionCard.vue';

export default {
    data() {
        return {
            options: [
                {
                    value: 'all',
                    label: '全部题目'
                },
                {
                    value: 'myFavorites',
                    label: '我收藏的'
                },
                {
                    value: 'wrongData',
                    label: '错题集'
                }
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
        .title {
            font-weight: bold;
            font-size: 36px;
            line-height: 36px;
            color: #6C5DD3;
            height: 36px;
            letter-spacing: 3px;
        }
        .selector {
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
        }
    }
}
</style>