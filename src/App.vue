<template>
    <div class="app-container">
        <MenuButton />
        <Terminal v-if="showTerminal" />
        <Mudlist v-if="!showTerminal" :mudlist="mudlist" @card-clicked="receive.cardClicked" />
    </div>
</template>

<script lang="ts" setup>
import Terminal from './components/Terminal.vue';
import Mudlist from './components/MudList.vue';
import MenuButton from './components/MenuButton.vue'; // 引入 MenuButton 组件
import { onMounted, ref, onUnmounted } from 'vue';
import { Base } from './global';

const showTerminal = ref(true);
const mudlist = ref<any>({});

// =======================
//    接收子组件的消息
// =======================
const receive = {
    cardClicked: () => {
        showTerminal.value = true;
    },
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
</style>