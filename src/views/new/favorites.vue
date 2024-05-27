<template>
    <div id="favorites">
        <div class="titleCover">
            <div class="title">收藏夹</div>
            <div class="selector">
                <el-select v-model="value" placeholder="请选择">
                    <el-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value">
                    </el-option>
                </el-select>
            </div>
        </div>
    </div>
</template>

<script>
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
    }
}
</script>