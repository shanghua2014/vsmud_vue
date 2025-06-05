<template>
    <el-row class="mud-list">
        <el-card v-for="(card, index) in cards" :key="index" shadow="always" class="card-item" @click.native.stop="allowClicked(card)">
            <template #header>
                <div class="card-header aqua">
                    <!-- 动态切换为 span 或 input -->
                    <span v-if="!isCreated">
                        <b>{{ card.title ? card.title : '站点' }}</b>
                    </span>
                    <input v-else ref="title" placeholder="站点名称" v-model="card.title" />
                </div>
            </template>
            <div class="card-body pr">
                <!-- 动态切换为 p 或 input -->
                <template v-if="!isCreated">
                    <p class="chartreuse">服务器：{{ card.ip }}</p>
                    <p class="chartreuse">端口：{{ card.port }}</p>
                    <p class="yellow">账号：{{ card.account }}</p>
                    <p class="blueviolet">密码：{{ card.password }}</p>
                    <p>角色：{{ card.name }}</p>
                </template>
                <template v-else>
                    <input v-model="card.ip" placeholder="服务器" />
                    <input v-model="card.port" placeholder="端口" />
                    <input v-model="card.account" placeholder="账号" disabled="false" />
                    <input v-model="card.password" placeholder="密码（非必填）" />
                    <input v-model="card.name" placeholder="角色" />
                </template>
                <div class="edit-box pa" v-if="!isCreated && cardClick">
                    <!-- 编辑按钮 -->
                    <el-button type="primary" size="small" :icon="Edit" round @click.native.stop="toggleEdit(card, true)" />
                </div>
                <div class="submit-box" v-if="isCreated">
                    <!-- 保存按钮 -->
                    <el-button type="success" size="small" :icon="Check" round @click.native.stop="saveEdit(card)" />
                    <!-- 取消按钮 -->
                    <el-button type="danger" size="small" :icon="CloseBold" round @click.native.stop="cancelEdit(card)" />
                </div>
            </div>
        </el-card>
        <el-tooltip class="box-item" effect="dark" content="添加站点" placement="top">
            <el-icon class="add"><plus style="width: 23px; height: 23px" /></el-icon>
        </el-tooltip>
    </el-row>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Check, Edit, CloseBold, Plus } from '@element-plus/icons-vue';
import { Base } from '@/utils/util';
import { useConfigStore } from '@/stores/store';

// 是否为创建状态
const isCreated = ref(false);
const allowClick = ref(true);
// 控制卡片是否可点
const cardClick = ref(true);
// 定义title的ref
const title = ref<HTMLInputElement[]>([]);
// 定义卡片列表
interface CardModel {
    isEditing?: boolean;
    title: string;
    ip: string;
    port: string;
    account: string;
    password: string;
    name: string;
}

// 为 cards 添加默认值
const cards = ref<CardModel[]>([
    {
        title: '示例站点',
        ip: '127.0.0.1',
        port: '8080',
        account: 'example_user',
        password: 'example_password',
        name: '示例角色'
    },
    {
        title: '示例站点',
        ip: '127.0.0.1',
        port: '8080',
        account: 'example_user',
        password: 'example_password',
        name: '示例角色'
    },
    {
        title: '示例站点',
        ip: '127.0.0.1',
        port: '8080',
        account: 'example_user',
        password: 'example_password',
        name: '示例角色'
    },
    {
        title: '示例站点',
        ip: '127.0.0.1',
        port: '8080',
        account: 'example_user',
        password: 'example_password',
        name: '示例角色'
    },
    {
        title: '示例站点',
        ip: '127.0.0.1',
        port: '8080',
        account: 'example_user',
        password: 'example_password',
        name: '示例角色'
    }
]);

// 切换编辑模式
const toggleEdit = (card: any, edit: boolean) => {
    card.isEditing = edit;
    isCreated.value = true;
    allowClick.value = !card.isEditing;
};

const base = new Base();

// 封装函数处理 card 属性的 trim 操作
const getTrimData = (card: any) => {
    return {
        title: card.title.trim(),
        ip: card.ip.trim(),
        port: card.port.trim(),
        account: card.account.trim(),
        password: card.password.trim(),
        name: card.name.trim()
    };
};

// 添加、修改
const saveEdit = (card: any) => {
    console.log('添加、修改');
    // 更新函数调用
    const trimData = getTrimData(card);
    if (!trimData.title || !trimData.ip || !trimData.port || !trimData.name) {
        ElMessage({
            message: '内容不能为空！',
            type: 'error',
            duration: 1000 // 提示持续时间（毫秒）
        });
        return;
    }
    isCreated.value = false;
    card.isEditing = false;
    allowClick.value = !card.isEditing;

    setTimeout(() => {
        base.postMessage({
            type: 'save',
            content: trimData
        });
    }, 500);
};

// 取消编辑
const cancelEdit = (card: any) => {
    // 更新函数调用
    const trimData = getTrimData(card);

    if (card.isEditing && trimData.account) {
        if (!trimData.title || !trimData.ip || !trimData.port || !trimData.name) {
            ElMessage({
                message: '内容不能为空！',
                type: 'error',
                duration: 1000 // 提示持续时间（毫秒）
            });
            return;
        }
    }

    if (trimData.title && trimData.ip && trimData.port && trimData.account && trimData.name) {
        if (card.isEditing) {
            isCreated.value = false;
            card.isEditing = false;
            allowClick.value = !card.isEditing;
        } else {
            ElMessageBox.alert('都填完了，点击保存好吗？', '温馨提示');
            return;
        }
    }
    if (isCreated.value) {
        if (!trimData.title || !trimData.ip || !trimData.port || !trimData.account || !trimData.name) {
            ElMessageBox.alert('请填写所有信息！', '温馨提示');
            return;
        }
        if (trimData.title && trimData.ip && trimData.port && trimData.account && trimData.name) {
            ElMessageBox.alert('如想关闭，请直接关闭.vmud文件', '温馨提示');
            return;
        }
    }

    allowClick.value = true;
    isCreated.value ? (isCreated.value = false) : '';
};

// 点击卡片
const allowClicked = (card: any) => {
    // 如果卡片处于编辑状态，则不触发点击事件
    if (!allowClick.value) {
        return;
    }

    const datas = {
        title: card.title,
        ip: card.ip,
        port: card.port,
        account: card.account,
        password: card.password,
        name: card.name
    };
    emits('cardClicked', '通知父级');

    // 设置store
    const configStore = useConfigStore();
    configStore.setConfig(datas);

    base.postMessage({
        type: 'connect',
        content: datas
    });
};

// =======================
//    传给父级的事件
// =======================
const emits = defineEmits<{
    (event: 'cardClicked', data: any): void;
}>();

onMounted(() => {
    window.addEventListener('message', (event) => {
        const message = event.data;
        // console.log('收到消息', message)
        try {
            if (message.type === 'getConfig') {
                console.log(message.datas);
                message.datas = JSON.parse(message.datas);
                const { ip, account } = message.datas;
                if (!ip) {
                    // 创建模式
                    isCreated.value = true;
                    // 禁止点击卡片
                    allowClick.value = false;
                    cards.value.push({
                        isEditing: false,
                        title: '',
                        ip: '',
                        port: '',
                        account: account,
                        password: '',
                        name: ''
                    });
                } else {
                    // 正常模式
                    isCreated.value = false;
                    allowClick.value = true;
                    cards.value.push(message.datas);
                }
            }
        } catch (error) {
            console.log('error', error);
        }
    });
});
</script>

<style lang="scss" scoped>
.mud-list {
    flex-direction: row;
    position: relative;
    align-items: flex-end;
    input {
        width: 100%;
        box-sizing: border-box;
    }
    .el-card {
        cursor: pointer;
    }
    .card-item {
        width: 18%;
        margin: 10px 0 0 10px;
        .edit-box {
            position: absolute;
            bottom: -28px;
            right: -14px;
            display: none;
        }
        &:hover .edit-box {
            display: block;
        }
    }
    .card-body {
        font-size: 14px;
        input {
            margin-bottom: 2px;
            padding: 2px;
            font-size: 14px;
        }
        .submit-box {
            margin-top: 20px;
        }
    }
    .add {
        color: #fff;
        background: green;
        cursor: pointer;
        width: 25px;
        height: 25px;
        border-radius: 2px;
        margin-left: 10px;
    }
}
</style>
