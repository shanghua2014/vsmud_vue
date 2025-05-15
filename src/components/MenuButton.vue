<template>
    <el-menu
        :default-active="activeIndex"
        class="el-menu-demo pa"
        mode="horizontal"
        :ellipsis="false"
        @select="handleSelect"
        :collapse="true"
        menu-trigger="hover"
    >
        <el-sub-menu index="2">
            <template #title
                ><el-icon><Document /></el-icon
            ></template>
            <el-sub-menu index="2-1">
                <template #title>账号</template>
                <el-menu-item index="#reconnect">重连(#rec)</el-menu-item>
            </el-sub-menu>
            <el-sub-menu index="1-1">
                <template #title>脚本</template>
                <el-menu-item index="#reload">重载(#re)</el-menu-item>
            </el-sub-menu>
        </el-sub-menu>
    </el-menu>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { Document } from '@element-plus/icons-vue'; // 导入图标组件
import { Base } from '../utils/util';

const base = new Base();
const activeIndex = ref(1);
const handleSelect = (key: string, keyPath: string[]) => {
    base.postMessage({ type: 'command', content: keyPath[2] });
};
</script>

<style lang="scss">
ul.el-menu-demo {
    height: 30px;
    width: 60px;
    bottom: 34px;
    right: 0;
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
// 从左侧偏移
div.el-popper.is-pure:first-child {
    transform: translateX(-31px) !important;
}
.el-popper.is-pure.el-tooltip {
    transform: translateX(-192px) !important;
    min-width: 90px;
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
