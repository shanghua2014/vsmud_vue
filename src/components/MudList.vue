<template>
    <el-row class="mud-list">
        <el-card v-for="(card, index) in cards" :key="index" shadow="always" class="card-item" @click.native.stop="allowClicked(card)">
            <template #header>
                <div class="card-header aqua">
                    <!-- 动态切换为 span 或 input -->
                    <div v-if="!card.isEditing" style="height: 21px; line-height: 21px">
                        <b>{{ card.title ? card.title : '站点' }}</b>
                    </div>
                    <input v-else ref="title" placeholder="站点名称" v-model="card.title" />
                </div>
            </template>
            <div class="card-body pr">
                <!-- 动态切换为 p 或 input -->
                <template v-if="!card.isEditing">
                    <p class="chartreuse">服务器：{{ card.ip }}</p>
                    <p class="chartreuse">端口：{{ card.port }}</p>
                    <p class="yellow">账号：{{ card.account }}</p>
                    <p class="purple">普通密码：{{ card.password }}</p>
                    <p class="blueviolet">管理密码：{{ card.managePassword }}</p>
                    <p class="aqua">Email：{{ card.email }}</p>
                    <p>角色：{{ card.name }}</p>
                </template>
                <template v-else>
                    <input v-model="card.ip" placeholder="服务器" />
                    <input v-model="card.port" placeholder="端口" />
                    <input v-model="card.account" placeholder="账号（3～8个英文字母）" :disabled="!isCreated" />
                    <input v-model="card.password" placeholder="普通密码" />
                    <input v-model="card.managePassword" placeholder="管理密码" />
                    <input v-model="card.email" type="email" placeholder="Email（必填）" autocomplete="email" />
                    <input v-model="card.name" placeholder="角色（2～4个汉字）" />
                </template>
                <div class="edit-box pa" v-if="!card.isEditing && cardClick">
                    <!-- 删除按钮 -->
                    <el-button type="danger" size="small" :icon="Delete" round @click.native.stop="del(card, index)" />
                    <!-- 编辑按钮 -->
                    <el-button type="primary" size="small" :icon="Edit" round @click.native.stop="toggleEdit(card, true)" />
                </div>
                <div class="submit-box" v-if="card.isEditing">
                    <!-- 保存按钮 -->
                    <el-button type="success" size="small" :icon="Check" round @click.native.stop="saveEdit(card)" />
                    <!-- 取消按钮 -->
                    <el-button type="info" size="small" :icon="CloseBold" round @click.native.stop="cancelEdit(card)" />
                </div>
            </div>
        </el-card>
        <el-tooltip class="box-item" effect="dark" content="添加站点" placement="top">
            <el-icon class="add" @click="add"><plus style="width: 23px; height: 23px" /></el-icon>
        </el-tooltip>
    </el-row>
</template>

<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Check, Edit, CloseBold, Plus, Delete } from '@element-plus/icons-vue';
import { Base } from '@/common/common';
import { useConfigStore } from '@/stores/store';

// 是否为创建状态
const isCreated = ref(false);
const allowClick = ref(true);
// 控制卡片是否可点
const cardClick = ref(true);
// 定义title的ref
const title = ref<HTMLInputElement[]>([]);

// 定义卡片列表数据类型
interface CardModel {
    isEditing?: boolean;
    title: string;
    ip: string;
    port: string;
    account: string;
    password: string;
    managePassword: string;
    name: string;
    email: string;
}

// 定义 props 接收父级传递的 mudlist 数据
const props = defineProps<{
    mudlist: Array<CardModel>;
}>();

// 为 cards 添加默认值
// const cards = ref<CardModel[]>([
//     {
//         isEditing: false,
//         title: '示例站点',
//         ip: '127.0.0.1',
//         port: '8080',
//         account: 'example_user',
//         password: 'example_password',
//         name: '示例角色'
//     }
// ]);
const cards = ref<CardModel[]>([]);

watch(
    () => props.mudlist,
    (list) => {
        cards.value = (list ?? []).map((c) => ({
            ...c,
            managePassword: c.managePassword ?? '',
            email: c.email ?? '',
            isEditing: Boolean(c.isEditing)
        }));
    },
    { deep: true, immediate: true }
);

const base = new Base();

const del = (card: any, i: number) => {
    // 根据下标删除数据
    cards.value.splice(i, 1);
    base.sendSiteList({
        type: 'del',
        content: getTrimData(card)
    });
};

// 添加卡片
const add = () => {
    if (isCreated.value) return;
    // 添加一个新的卡片
    cards.value.push({
        isEditing: true,
        title: '',
        ip: '',
        port: '',
        account: '',
        password: '',
        managePassword: '',
        email: '',
        name: ''
    });
    allowClick.value = false;
    isCreated.value = true;
};

// 切换编辑模式
const toggleEdit = (card: any, edit: boolean) => {
    card.isEditing = edit;
    allowClick.value = !card.isEditing;
};

/** 非空时至少 6 位（与占位「非必填」一致：可留空） */
const MIN_PASSWORD_LEN = 6;

/** 账号：3～8 个英文字母（A–Z、a–z） */
function validateAccount(account: string): string | null {
    if (!/^[a-zA-Z]{3,8}$/.test(account)) {
        return '账号须为 3～8 个英文字母';
    }
    return null;
}

/** 角色名：恰好 2～4 个汉字（统一表意文字） */
function validateRoleName(name: string): string | null {
    if (!/^[\p{Unified_Ideograph}]{2,4}$/u.test(name)) {
        return '角色名须为 2～4 个汉字';
    }
    return null;
}

/** 站点卡片必填 Email */
function validateEmail(email: string): string | null {
    const t = email.trim();
    if (!t) return '请填写 Email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
        return 'Email 格式不正确';
    }
    return null;
}

function validatePasswordFields(password: string, managePassword: string): string | null {
    if (password.length > 0 && password.length < MIN_PASSWORD_LEN) {
        return '普通密码至少 6 位，或留空不填';
    }
    if (managePassword.length > 0 && managePassword.length < MIN_PASSWORD_LEN) {
        return '管理密码至少 6 位，或留空不填';
    }
    if (password.length > 0 && managePassword.length > 0 && password === managePassword) {
        return '普通密码与管理密码不能相同';
    }
    return null;
}

// 封装函数处理 card 属性的 trim 操作
const getTrimData = (card: any) => {
    return {
        title: card.title.trim(),
        ip: card.ip.trim(),
        port: card.port.trim(),
        account: card.account.trim().toLowerCase(),
        password: card.password.trim(),
        managePassword: card.managePassword.trim(),
        name: card.name.trim(),
        email: card.email.trim(),
        charset: 'gb18030' as const
    };
};

// 修改
const saveEdit = (card: any) => {
    // 更新函数调用
    const trimData = getTrimData(card);
    if (!trimData.title || !trimData.ip || !trimData.port || !trimData.account || !trimData.name || !trimData.email) {
        ElMessage({
            message: '内容不能为空（含 Email）！',
            type: 'error',
            duration: 1000 // 提示持续时间（毫秒）
        });
        return;
    }

    const emailErr = validateEmail(trimData.email);
    if (emailErr) {
        ElMessage({
            message: emailErr,
            type: 'error',
            duration: 1500
        });
        return;
    }

    if (!/(\w\.)/.test(trimData.ip)) {
        ElMessage({
            message: 'IP地址格式错误！',
            type: 'error',
            duration: 1000 // 提示持续时间（毫秒）
        });
        return;
    }

    const accountErr = validateAccount(trimData.account);
    if (accountErr) {
        ElMessage({
            message: accountErr,
            type: 'error',
            duration: 1500
        });
        return;
    }

    const pwdErr = validatePasswordFields(trimData.password, trimData.managePassword);
    if (pwdErr) {
        ElMessage({
            message: pwdErr,
            type: 'error',
            duration: 1500
        });
        return;
    }

    const nameErr = validateRoleName(trimData.name);
    if (nameErr) {
        ElMessage({
            message: nameErr,
            type: 'error',
            duration: 1500
        });
        return;
    }

    card.account = trimData.account;

    card.isEditing = false;
    allowClick.value = !card.isEditing;
    if (isCreated.value) {
        isCreated.value = false;
    }

    base.sendSiteList({
        type: 'save',
        content: getTrimData(card)
    });
};

// 取消编辑
const cancelEdit = (card: any) => {
    // 更新函数调用
    const trimData = getTrimData(card);

    if (card.isEditing && trimData.account) {
        if (!trimData.title || !trimData.ip || !trimData.port || !trimData.name || !trimData.email) {
            ElMessage({
                message: '内容不能为空！',
                type: 'error',
                duration: 1000 // 提示持续时间（毫秒）
            });
            return;
        }
    }

    if (trimData.title && trimData.ip && trimData.port && trimData.account && trimData.name && trimData.email) {
        if (card.isEditing) {
            // isEditing.value = false;
            card.isEditing = false;
            allowClick.value = !card.isEditing;
        } else {
            ElMessageBox.alert('都填完了，点击保存好吗？', '温馨提示');
            return;
        }
    }

    if (isCreated.value) {
        cards.value.pop();
        isCreated.value = false;
    }

    allowClick.value = true;
};

// 点击卡片
const allowClicked = (card: any) => {
    // 如果卡片处于编辑状态，则不触发点击事件
    if (!allowClick.value) {
        return;
    }

    const datas = getTrimData(card);
    const emailErr = validateEmail(datas.email);
    if (emailErr) {
        ElMessage({
            message: emailErr,
            type: 'error',
            duration: 1500
        });
        return;
    }

    emits('cardClicked', true);

    // 设置store
    const configStore = useConfigStore();
    configStore.setCfg(datas);

    // 等 Terminal 挂载并注册 to-vue 后再连，否则首包桥接 JSON 可能在监听器注册前到达并被丢弃
    void nextTick(() => {
        base.connect({
            type: 'telnet',
            content: datas
        });
    });
};

// =======================
//    传给父级的事件
// =======================
const emits = defineEmits<{
    (event: 'cardClicked', data: any): void;
}>();
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
        margin: 10px 0 0 10px;
    }
}
</style>
