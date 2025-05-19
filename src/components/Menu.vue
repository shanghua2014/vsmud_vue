<template>
    <el-menu
        :default-active="activeIndex"
        class="el-menu-demo pa"
        mode="horizontal"
        :ellipsis="false"
        @select="handleSelect"
        :collapse="true"
        menu-trigger="hover"
    >
        <el-sub-menu index="0">
            <template #title>
                <el-icon><Document /></el-icon>
            </template>
            <el-sub-menu index="3-1">
                <template #title>账号</template>
                <el-menu-item index="#reconnect">重连(#rec)</el-menu-item>
            </el-sub-menu>
            <el-sub-menu index="2-1">
                <template #title>界面</template>
                <el-menu-item index="#setting" @click="openSet">设置(#set)</el-menu-item>
            </el-sub-menu>
            <el-sub-menu index="1-1">
                <template #title>脚本</template>
                <el-menu-item index="#reload">重载(#re)</el-menu-item>
            </el-sub-menu>
        </el-sub-menu>
    </el-menu>
    <el-drawer v-model="openSetting" :direction="setDirection" :with-header="false" class="pr">
        <template #default>
            <el-row :gutter="20">
                <el-col :span="10">
                    <el-card class="config-card">
                        <div class="card-header flex">
                            <span>频道</span>
                        </div>
                        <el-checkbox-group v-model="form.category" size="small" @change="handleSelected">
                            <el-checkbox v-for="(item, i) in listCategory" border :value="item.value" :label="item.label">{{ item.label }}</el-checkbox>
                        </el-checkbox-group>
                    </el-card>
                </el-col>
                <el-col :span="10">
                    <el-card class="config-card">
                        <div class="card-header flex">
                            <span>字体</span>
                        </div>
                        <div class="card-sys flex">
                            <div>
                                字体：
                                <el-select v-model="fontSize" placeholder="Select" style="width: 100px">
                                    <el-option v-for="(item, i) in options" :key="item.value" :label="item.label" :value="item.value" />
                                </el-select>
                            </div>
                            <div>字号： <el-input v-model="fontSizeInput" style="width: 40px" placeholder="Please input" /></div>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
        </template>
        <template #footer>
            <div style="flex: auto">
                <el-button @click="cancel">取消</el-button>
                <el-button type="primary" @click="confirm">确定</el-button>
            </div>
        </template>
    </el-drawer>
</template>

<script lang="ts" setup>
import { ref, defineProps, watch, onMounted } from 'vue';
import { Document } from '@element-plus/icons-vue'; // 导入图标组件
import { Base } from '../utils/util';
import type { DrawerProps } from 'element-plus';

// 引入 defineEmits
import { defineEmits } from 'vue';

// 定义 props 接收 cmd 参数
const props = defineProps<{
    cmd: string;
}>();

const qq = ref(false);
const newbie = ref(false);
const chat = ref(false);
const rumor = ref(false);
const hood = ref(false);
const help = ref(false);
const family = ref(false);
const task = ref(false);
const divCount = ref(0);
const fontSizeInput = ref(14);
const fontSize = ref('');
const options = [
    {
        value: 'Option1',
        label: 'Option1Option1Option1Option1Option1Option1'
    },
    {
        value: 'Option3',
        label: 'Option3'
    },
    {
        value: 'Option4',
        label: 'Option4'
    },
    {
        value: 'Option5',
        label: 'Option5'
    }
];

// 定义 emit 事件
const emits = defineEmits(['checkboxChange', 'cancelSelection', 'confirmSelection']);

const base = new Base();
const activeIndex = ref('1');

const form = ref({
    // 初始化时添加 'chat' 让闲聊选项默认选中
    category: ['chat'] as string[]
});

// 只保留一次声明，确保在 form 定义之后
const initialCategories = ref([...form.value.category]);

const listCategory = [
    { value: 'qq', label: 'QQ' },
    { value: 'newbie', label: '新手' },
    { value: 'chat', label: '闲聊' },
    { value: 'rumor', label: '谣言' },
    { value: 'hood', label: '江湖' },
    { value: 'help', label: '求助' },
    { value: 'family', label: '门派' },
    { value: 'task', label: '任务/保卫' }
];

// 抽屉组件的显示控制
const openSetting = ref(false);
const setDirection = ref<DrawerProps['direction']>('ttb');

onMounted(() => {
    divCount.value = form.value.category.length;
});

// 定义 handleSelected 函数
const handleSelected = (value: string[]) => {
    divCount.value = value.length;
    console.log('Selected values:', value);
    // 触发 emit 事件，传递选中的值
    emits('checkboxChange', value);
};

const openSet = () => {
    openSetting.value = true;
};
const cancel = () => {
    // 触发 cancelSelection 事件，传递初始选中项
    emits('cancelSelection', initialCategories.value);
    openSetting.value = false;
};

const confirm = () => {
    // 更新初始选中项
    initialCategories.value = [...form.value.category];
    // 触发 confirmSelection 事件，传递当前选中项
    emits('confirmSelection', form.value.category);
    openSetting.value = false;
};

const handleSelect = (key: string, keyPath: string[]) => {
    base.postMessage({ type: 'command', content: keyPath[2] });
};

// 监听 props.cmd 的变化，将其赋值给新变量
watch(
    () => props.cmd,
    (newCmd: any) => {
        console.log('Vue消息:', newCmd);
        const ccc = newCmd.command;
        if (ccc === '#set') {
            openSet();
        }
        // 可以在这里添加更多基于新变量的处理逻辑
    }
);
</script>

<style lang="scss">
.el-drawer.ttb {
    height: 25% !important;
}
.config-card {
    .el-card__body {
        padding: calc(var(--el-card-padding) - 5px);
        display: flex;
        justify-content: center;
        align-items: baseline;
    }
    .card-header {
        padding-right: 10px;
        font-size: 14px;
        align-items: center;
    }
    .card-sys {
        font-size: 12px;
        justify-content: center;
        > div {
            padding-right: 10px;
        }
    }
}
.el-drawer__body {
    padding: 10px !important;
}
.el-drawer__footer {
    position: absolute;
    bottom: 0;
    right: 0;
    padding: 10px !important;
}
ul.el-menu-demo {
    height: 30px;
    width: 60px;
    bottom: 31px;
    right: 1px;
    background: #1f1f1f;
    border: 1px solid var(--el-menu-border-color);
    justify-content: center;
    z-index: 1;
    border-radius: var(--el-border-radius-base) var(--el-border-radius-base) 0 0;
}
ul.el-menu--popup {
    padding: 0;
    min-width: auto;
}
.el-menu--horizontal .el-menu .el-menu-item,
.el-menu--horizontal .el-menu .el-sub-menu__title {
    justify-content: space-around;
}
div.el-menu--horizontal .el-menu .el-sub-menu__title {
    padding: 0;
    width: 90px;
}
// 从左侧偏移
div.el-popper.is-pure:first-child {
    transform: translateX(-31px) !important;
}
.el-sub-menu .el-popper.is-pure.el-tooltip {
    transform: translateX(-192px) !important;
    min-width: 90px;
}
.el-menu--horizontal > .el-menu-item:nth-child(1) {
    margin-right: auto;
}
.el-menu--horizontal > .el-sub-menu.is-active .el-sub-menu__title,
.el-sub-menu.is-active .el-sub-menu__title {
    border: none !important;
}
/* 隐藏默认图标 */
.el-menu--horizontal .el-sub-menu__title .el-sub-menu__icon-arrow {
    display: none;
}
.el-drawer {
    --el-drawer-padding-primary: var(--el-dialog-padding-primary, 10px);
}
</style>
