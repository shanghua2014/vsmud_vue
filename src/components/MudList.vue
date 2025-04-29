<template>
    <el-row class="mud-list">
        <el-card v-for="(card, index) in cards" :key="index" shadow="always" class="card-item" @click.native.stop="emits.cardClicked(card)">
            <template #header>
                <div class="card-header">
                    <!-- 动态切换为 span 或 input -->
                    <span v-if="!card.isEditing">{{ card.headerTitle }}</span>
                    <input v-else ref="headerTitle" placeholder="Mud名称" v-model="card.headerTitle" />
                </div>
            </template>
            <div class="card-body pr">
                <!-- 动态切换为 p 或 input -->
                <template v-if="!card.isEditing">
                    <p>服务器：{{ card.server }}</p>
                    <p>端口：{{ card.port }}</p>
                    <p>账号：{{ card.account }}</p>
                    <p>密码：{{ card.password }}</p>
                    <p>名称：{{ card.name }}</p>
                </template>
                <template v-else>
                    <input v-model="card.server" placeholder="服务器" />
                    <input v-model="card.port" placeholder="端口" />
                    <input v-model="card.account" placeholder="账号" :disabled="!isCreated" />
                    <input v-model="card.password" placeholder="密码" />
                    <input v-model="card.name" placeholder="名称" />
                </template>
                <div class="edit-box pa" v-if="!card.isEditing && cardClick">
                    <!-- 编辑按钮 -->
                    <el-button type="primary" size="small" :icon="Edit" round @click.native.stop="toggleEdit(card)" />
                    <!-- 删除按钮 -->
                    <el-button type="danger" size="small" :icon="Delete" round @click.native.stop="confirmDelete(index)" />
                </div>
                <div class="submit-box" v-if="card.isEditing">
                    <!-- 保存按钮 -->
                    <el-button type="success" size="small" :icon="Check" round @click.native.stop="saveChanges(card)" />
                    <!-- 取消按钮 -->
                    <el-button type="danger" size="small" :icon="CloseBold" round @click.native.stop="cancelEdit(card, index)" />
                </div>
            </div>
        </el-card>
        <!-- 添加按钮 -->
        <div class="add-card">
            <el-button type="primary" :icon="Plus" round @click="addCard" :disabled="!cardClick">添加</el-button>
        </div>
    </el-row>
</template>

<script lang="ts" setup>
import { ref, nextTick, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Edit, CloseBold, Delete, Plus } from '@element-plus/icons-vue'
import { Base } from '@/global'

declare global {
    interface Window {
        customParent: {
            postMessage: (message: any) => void
        }
    }
}

// 是否为创建状态
const isCreated = ref(false)
// 定义 emit 函数
const emit = defineEmits(['card-clicked'])
// 控制卡片是否可点
const cardClick = ref(true)
// 定义headerTitle的ref
const headerTitle = ref<HTMLInputElement[]>([])
// 定义卡片列表
interface CardModel {
    isEditing: boolean
    headerTitle: string
    server: string
    port: string
    account: string
    password: string
    name: string
}
const cards = ref<CardModel[]>([])

// 切换编辑模式
const toggleEdit = (card: any) => {
    card.isEditing = true
    cardClick.value = !card.isEditing
}

const base = new Base()

// 保存修改
const saveChanges = (card: any) => {
    if (!card.headerTitle.trim()) {
        ElMessage({
            message: '请输入Mud名称！',
            type: 'error',
            duration: 1000 // 提示持续时间（毫秒）
        })
        return
    }
    if (!card.server.trim()) {
        ElMessage({
            message: '请输入服务器地址！',
            type: 'error',
            duration: 1000 // 提示持续时间（毫秒）
        })
        return
    }
    if (!card.server.trim()) {
        ElMessage({
            message: '请输入端口号！',
            type: 'error',
            duration: 1000 // 提示持续时间（毫秒）
        })
        return
    }
    if (!card.account.trim()) {
        ElMessage({
            message: '请输入账号！',
            type: 'error',
            duration: 1000 // 提示持续时间（毫秒）
        })
        return
    }
    if (isCreated.value) {
        base.postMessage({
            type: 'config',
            content: {
                headerTitle: card.headerTitle,
                server: card.server,
                port: card.port,
                account: card.account,
                password: card.password,
                name: card.name
            }
        })
    }
    ElMessage({
        message: isCreated.value ? '添加成功！' : '修改成功！',
        type: 'success',
        duration: 1000 // 提示持续时间（毫秒）
    })
    isCreated.value = false
    card.isEditing = false
    cardClick.value = !card.isEditing
}

// 取消编辑
const cancelEdit = (card: any, index: number) => {
    // 检查是否是新添加的卡片（内容为空）
    if (!card.headerTitle.trim() && !card.server.trim() && !card.port.trim() && !card.account.trim() && !card.password.trim() && !card.name.trim()) {
        // 如果内容为空，删除该卡片
        cards.value.splice(index, 1)
    } else {
        // 创建模式，删除该卡片
        if (isCreated.value) {
            cards.value.splice(index, 1)
        }
        // 编辑模式，直接退出
        card.isEditing = false
    }
    cardClick.value = true
    isCreated.value ? (isCreated.value = false) : ''
}

// 确认删除
const confirmDelete = (index: number) => {
    ElMessageBox.confirm('确定要删除这个IP吗？', '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    })
        .then(() => {
            const deleted = ref(deleteCard(index)) // 确认后删除卡片
            console.log('删除的卡片:', deleted.value[0].account)
            window.customParent.postMessage({
                type: 'delete',
                content: { account: deleted.value[0].account }
            })
        })
        .catch((e) => {
            console.log('取消删除', e)
        })
}

// 删除卡片
const deleteCard = (index: number) => {
    return cards.value.splice(index, 1) // 从列表中移除对应的卡片
}

// 添加卡片
const addCard = () => {
    cards.value.push({
        isEditing: true,
        headerTitle: '',
        server: '',
        port: '',
        account: '',
        password: '',
        name: ''
    })
    cardClick.value = false
    isCreated.value = true

    // 在下一个tick中聚焦到最后一个输入框
    nextTick(() => {
        const lastInput = headerTitle.value[headerTitle.value.length - 1]
        lastInput?.focus()
    })
}

// =======================
//    传给父级的事件
// =======================
const emits = {
    cardClicked: (card: any) => {
        // 如果卡片处于编辑状态，则不触发点击事件
        if (!cardClick.value) {
            return
        }
        // 创建新卡片时，给服务器发送消息
        location.protocol != 'http:' &&
            window.customParent.postMessage({
                type: 'config',
                content: {
                    headerTitle: card.headerTitle,
                    server: card.server,
                    port: card.port,
                    account: card.account,
                    password: card.password,
                    name: card.name
                }
            })
        emit('card-clicked', card)
    }
}

onMounted(() => {
    window.addEventListener('message', (event) => {
        const message = event.data
        if (message.type === 'getConfig') {
            console.log('VS-MudList组件：', message.data)
            cards.value = message.data
        }
    })
})
</script>

<style lang="scss" scoped>
@import url(./mudlist.scss);
</style>
