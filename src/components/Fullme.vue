<template>
    <!-- 使用 v-for 指令循环 4 次，动态绑定 style 属性设置 top 值 -->
    <div v-for="index in 4" :key="index" :style="{ top: (index - 1) * 125 + 'px' }" class="fullme pa">
        <Transition name="image-fade">
            <img v-if="showImage" src="https://pic7.huanxi.com/qaac9b302a5683479f92f63fc0a33cb741.png" />
        </Transition>
    </div>
    <el-icon @click="cancel" class="close"><CloseBold /></el-icon>
</template>

<script lang="ts" setup>
import { defineEmits, ref, onMounted } from 'vue';
import { CloseBold } from '@element-plus/icons-vue';

// 定义 emit 事件
const emits = defineEmits(['hideFullme']);

// 控制图片显示
const showImage = ref(false);

// 定义 cancel 方法，触发 hideFullme 事件
const cancel = () => {
    emits('hideFullme');
};

onMounted(() => {
    // 延迟显示图片以触发过渡动画
    setTimeout(() => {
        showImage.value = true;
    }, 0);
});
</script>

<style lang="scss" scoped>
.fullme {
    width: 280px;
    height: 120px;
    background-color: #ccc;
    position: absolute; // 确保 top 属性生效
    right: 5px;
    img {
        width: 100%;
        height: 100%;
    }
}

.close {
    position: absolute; // 确保 top 属性生效
    top: 490px;
    right: -1px; // 距离右侧 0 像素
    color: #fff;
    font-size: 36px;
    cursor: pointer;
}

// 定义过渡动画样式，仅控制透明度
.image-fade-enter-active,
.image-fade-leave-active {
    transition: opacity 0.5s ease;
}
.image-fade-enter-from,
.image-fade-leave-to {
    opacity: 0;
}
.image-fade-enter-to,
.image-fade-leave-from {
    opacity: 1;
}
</style>
