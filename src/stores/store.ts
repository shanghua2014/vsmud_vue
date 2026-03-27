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
        managePassword: string
        name: string
        email: string
    }
    const cfg = ref<CardModel>()

    const setCfg = (obj: any) => {
        cfg.value = obj
    }
    return { setCfg, cfg }
})
