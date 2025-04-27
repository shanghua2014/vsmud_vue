<template>
    <el-row class="mud-list">
        <el-card v-for="(card, index) in cards" :key="index" shadow="always" class="card-item" @click.native.stop="handleCardClick(card)">
            <template #header>
                <div class="card-header">
                    <!-- 动态切换为 span 或 input -->
                    <span v-if="!card.isEditing">{{ card.headerTitle }}</span>
                    <input v-else placeholder="Mud名称" v-model="card.headerTitle" />
                </div>
            </template>
            <div class="card-body pr">
                <!-- 动态切换为 p 或 input -->
                <template v-if="!card.isEditing">
                    <p>服务器：{{ card.server }}</p>
                    <p>端口：{{ card.port }}</p>
                    <p>名称：{{ card.name }}</p>
                    <p>账号：{{ card.account }}</p>
                    <p>密码：{{ card.password }}</p>
                </template>
                <template v-else>
                    <input v-model="card.server" placeholder="服务器" />
                    <input v-model="card.port" placeholder="端口" />
                    <input v-model="card.name" placeholder="名称" />
                    <input v-model="card.account" placeholder="账号" />
                    <input v-model="card.password" placeholder="密码" />
                </template>
                <div class="edit-box pa" v-if="!card.isEditing">
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
            <el-button type="primary" :icon="Plus" round @click="addCard">添加</el-button>
        </div>
    </el-row>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Edit, CloseBold, Delete, Plus } from '@element-plus/icons-vue'

// 定义 emit 函数
const emit = defineEmits(['card-clicked'])
// 控制卡片是否可点
const cardClick = ref(true)

// 定义卡片列表
const cards = ref([
    {
        isEditing: false,
        headerTitle: '北大侠客行',
        server: '0.0.0.0',
        port: '5555',
        account: 'shanghua',
        password: '123456',
        name: '侠客'
    },
    {
        isEditing: false,
        headerTitle: '天龙八部',
        server: '192.168.1.1',
        port: '8888',
        account: 'xiaolong',
        password: 'abcdef',
        name: '天龙'
    }
])

// 切换编辑模式
const toggleEdit = (card: any) => {
    card.isEditing = true
    cardClick.value = !card.isEditing
}

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
    ElMessage({
        message: '修改成功！',
        type: 'success',
        duration: 1000 // 提示持续时间（毫秒）
    })
    card.isEditing = false
    cardClick.value = !card.isEditing
}

// 取消编辑
const cancelEdit = (card: any, index: number) => {
    // 检查是否是新添加的卡片（内容为空）
    if (!card.headerTitle.trim() && !card.server.trim() && !card.port.trim() && !card.account.trim() && !card.password.trim() && !card.name.trim()) {
        // 如果内容为空，删除该卡片
        cards.value.splice(index, 1)
        console.log('取消编辑并删除空卡片:', card)
    } else {
        // 如果内容不为空，仅退出编辑模式
        card.isEditing = false
    }
    cardClick.value = true
}

// 确认删除
const confirmDelete = (index: number) => {
    ElMessageBox.confirm('确定要删除这个IP吗？', '删除确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
    })
        .then(() => {
            deleteCard(index) // 确认后删除卡片
        })
        .catch(() => {
            console.log('取消删除')
        })
}

// 删除卡片
const deleteCard = (index: number) => {
    cards.value.splice(index, 1) // 从列表中移除对应的卡片
    console.log('删除成功，当前卡片列表:', cards.value)
}

// 添加卡片
const addCard = () => {
    cards.value.push({
        isEditing: true, // 新增卡片默认进入编辑模式
        headerTitle: '',
        server: '',
        port: '',
        account: '',
        password: '',
        name: ''
    })
    cardClick.value = false
}

const handleCardClick = (card: any) => {
    // 如果卡片处于编辑状态，则不触发点击事件
    if (!cardClick.value) {
        return
    }
    emit('card-clicked', card)
}
</script>

<style lang="scss" scoped>
.mud-list {
    flex-direction: row;
    position: relative;
    input {
        width: 100%;
        box-sizing: border-box;
    }
    .el-card {
        cursor: pointer;
    }
    .card-item {
        width: 20%;
        margin: 10px 0 0 10px;
    }
    .card-body {
        font-size: 14px;
        input {
            margin-bottom: 2px;
            padding: 2px;
            font-size: 14px;
        }
        .edit-box {
            bottom: -28px;
            right: -14px;
        }
        .submit-box {
            margin-top: 20px;
        }
    }
    .add-card {
        display: flex;
        align-items: end;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        margin-left: 10px;
        button {
            @extend .el-card;
        }
    }
}
</style>
