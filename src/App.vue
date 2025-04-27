<template>
    <Terminal v-if="showTerminal" :terminalDatas="selectedCard" />
    <Mudlist v-if="!showTerminal" @card-clicked="cardClicked" />
</template>

<script lang="ts" setup>
import Terminal from './components/Terminal.vue'
import Mudlist from './components/MudList.vue'
import { onMounted, ref, onUnmounted } from 'vue'

const showTerminal = ref(false)
const selectedCard = ref<any>({})

// 处理 card-clicked 事件
const cardClicked = (card: any) => {
    selectedCard.value = card
    showTerminal.value = true
}

// 接收来自vscode扩展的消息
onMounted(() => {
    window.addEventListener('message', (event) => {})
})

// 组件卸载时断开观察器
onUnmounted(() => {
    window.removeEventListener('message', () => {})
})
</script>
