import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useConfigStore = defineStore('counter', () => {
    interface CardModel {
        isEditing: boolean
        title: string
        ip: string
        port: string
        account: string
        password: string
        name: string
    }
    // 提供符合 ConfigInfo 接口的初始值
    const configInfo = ref<CardModel>()

    const setConfig = (obj: any) => {
        configInfo.value = obj
    }
    return { setConfig, configInfo }
})
