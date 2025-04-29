import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore('counter', () => {
    const configInfo = ref({})

    const setConfig = (obj: any) => {
        configInfo.value = obj
    }
    return { setConfig, configInfo }
})
