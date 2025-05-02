<template>
    <Terminal v-if="showTerminal" />
    <Mudlist v-if="!showTerminal" :mudlist="mudlist" @card-clicked="receive.cardClicked" />
</template>

<script lang="ts" setup>
import Terminal from './components/Terminal.vue'
import Mudlist from './components/MudList.vue'
import { onMounted, ref, onUnmounted } from 'vue'
import { Base } from './global'

const showTerminal = ref(false)
const mudlist = ref<any>({})

// =======================
//    接收子组件的消息
// =======================
const receive = {
    cardClicked: () => {
        showTerminal.value = true
    }
}

// 接收来自vscode扩展的消息
onMounted(() => {
    new Base().postMessage({ type: 'getConfig', content: '' })
})

// 组件卸载时断开观察器
onUnmounted(() => {
    window.removeEventListener('message', () => {})
})
</script>
