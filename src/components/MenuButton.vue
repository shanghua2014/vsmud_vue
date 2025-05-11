<template>
    <el-menu :default-active="activeIndex" class="el-menu-demo pa" mode="horizontal" :ellipsis="false" @select="handleSelect" :collapse="true">
        <el-sub-menu index="2">
            <template #title
                ><el-icon><Document /></el-icon
            ></template>
            <el-sub-menu index="1-1">
                <template #title>脚本1</template>
                <el-menu-item index="1-1-1">重载1</el-menu-item>
            </el-sub-menu>
            <el-sub-menu index="2-4">
                <template #title>脚本</template>
                <el-menu-item index="2-4-1">重载</el-menu-item>
            </el-sub-menu>
        </el-sub-menu>
    </el-menu>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Document } from '@element-plus/icons-vue' // 导入图标组件

const activeIndex = ref('1')
const handleSelect = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
}
</script>

<style lang="scss">
ul.el-menu-demo {
    height: 30px;
    width: 60px;
    bottom: 34px;
    right: 3px;
    background: #1f1f1f;
    border: 1px solid var(--el-menu-border-color);
    justify-content: center;
    z-index: 1;
}
ul.el-menu--popup {
    padding: 0;
    min-width: auto;
}
.el-menu--horizontal .el-menu .el-menu-item,
.el-menu--horizontal .el-menu .el-sub-menu__title {
    justify-content: space-around;
}
div.el-menu--horizontal .el-menu .el-sub-menu__title {
    padding: 0;
    width: 90px;
}
div.el-popper.is-pure:first-child {
    inset: auto 0 70px auto !important;
}
.el-menu--horizontal > .el-menu-item:nth-child(1) {
    margin-right: auto;
}
.el-menu--horizontal > .el-sub-menu.is-active .el-sub-menu__title,
.el-sub-menu.is-active .el-sub-menu__title {
    border: none !important;
}
/* 隐藏默认图标 */
.el-menu--horizontal .el-sub-menu__title .el-sub-menu__icon-arrow {
    display: none;
}
</style>
