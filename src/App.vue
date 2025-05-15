<template>
    <div class="common-layout">
        <el-container>
            <el-main class="pr">
                <MenuButton v-if="!hideMenuButton" />
                <Terminal v-if="showTerminal" @toggleMenuButton="handleToggleMenuButton" />
                <Mudlist v-if="!showTerminal" :mudlist="mudlist" @card-clicked="receive.cardClicked" />
            </el-main>
            <el-aside style="width: 28%">
                <Channel />
            </el-aside>
        </el-container>
    </div>
    <!-- <div class="app-container">
        <MenuButton v-if="!hideMenuButton" />
        <Terminal v-if="showTerminal" @toggleMenuButton="handleToggleMenuButton" />
        <Mudlist v-if="!showTerminal" :mudlist="mudlist" @card-clicked="receive.cardClicked" />
    </div> -->
</template>

<script lang="ts" setup>
import Terminal from './components/Terminal.vue';
import Mudlist from './components/MudList.vue';
import MenuButton from './components/MenuButton.vue';
import Channel from './components/Channel.vue';
import { onMounted, ref, onUnmounted } from 'vue';
import { Base } from './utils/util';

const showTerminal = ref(location.protocol == 'http:' ? true : false);
const mudlist = ref<any>({});
const hideMenuButton = ref(false);

// =======================
//    接收子组件的消息
// =======================
const receive = {
    cardClicked: () => {
        showTerminal.value = true;
    }
};

// 处理 Terminal 组件的 toggleMenuButton 事件
const handleToggleMenuButton = (shouldHide: boolean) => {
    hideMenuButton.value = shouldHide;
};

// 接收来自vscode扩展的消息
onMounted(() => {
    new Base().postMessage({ type: 'getAccount', content: '' });
});

// 组件卸载时断开观察器
onUnmounted(() => {
    window.removeEventListener('message', () => {});
});
</script>

<style lang="scss" scoped>
.app-container {
    position: relative;
    height: 100vh;
}
.el-main {
    --el-main-padding: 0px;
}
</style>
