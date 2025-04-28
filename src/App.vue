<template>
    <Terminal v-if="showTerminal" :terminalDatas="selectedCard" />
    <Mudlist v-if="!showTerminal" :mudlist="mudlist" @card-clicked="receive.cardClicked" />
</template>

<script lang="ts" setup>
import Terminal from './components/Terminal.vue'
import Mudlist from './components/MudList.vue'
import { onMounted, ref, onUnmounted } from 'vue'

const showTerminal = ref(false)
const selectedCard = ref<any>({})
const mudlist = ref<any>({})

// =======================
//    接收子组件的消息
// =======================
const receive = {
    cardClicked: (card: any) => {
        selectedCard.value = card
        showTerminal.value = true
    }
}

// 接收来自vscode扩展的消息
onMounted(() => {
    // window.addEventListener('message', (event) => {
    //     const message = event.data
    //     if (message.type === 'mud') {
    //         console.log('来自VS的消息:', message.data)
    //     }
    // })
    window.customParent.postMessage({ type: 'getConfig', content: '' })
})

// 组件卸载时断开观察器
onUnmounted(() => {
    window.removeEventListener('message', () => {})
})
</script>
