<template>
    <div
        v-if="
            showYnPrompt ||
            showMfPrompt ||
            showChooseCharacter ||
            showKuaiyiPvpPve ||
            showCloseEye ||
            showAskLaoHuabo ||
            showWashTo ||
            showInfoTopics ||
            showLeaveVillage ||
            showAskLaoHere ||
            showEmailPrompt ||
            showPageMore
        "
        class="mud-yn-actions pa"
    >
        <template v-if="showYnPrompt">
            <el-button size="small" type="primary" @click="pickYn('y')">是</el-button>
            <el-button size="small" type="primary" plain @click="pickYn('n')">否</el-button>
        </template>
        <template v-if="showMfPrompt">
            <el-button size="small" type="primary" @click="pickMf('m')">男</el-button>
            <el-button size="small" type="primary" plain @click="pickMf('f')">女</el-button>
        </template>
        <template v-if="showKuaiyiPvpPve && !showChooseCharacter">
            <el-button size="small" type="primary" @click="pickKuaiyiPvpPve(KUAIYI_CHOOSE_PVP_COMMAND)">快意恩仇-PVP</el-button>
            <el-button size="small" type="primary" plain @click="pickKuaiyiPvpPve(KUAIYI_CHOOSE_PVE_COMMAND)">
                江湖隐士-PVE
            </el-button>
        </template>
        <el-button
            v-if="showCloseEye && !showChooseCharacter && !showKuaiyiPvpPve"
            size="small"
            type="primary"
            plain
            @click="pickCloseEye"
        >
            闭眼
        </el-button>
        <el-button v-if="showAskLaoHuabo" size="small" type="primary" plain @click="pickLaoHuabo">找花伯</el-button>
        <div v-if="showInfoTopics && !showChooseCharacter" class="mud-info-topics-block">
            <div v-if="infoTopicsExpanded" class="mud-info-topic-float">
                <div class="mud-info-topic-grid">
                    <el-button
                        v-for="n in infoTopicNumbers"
                        :key="n"
                        size="small"
                        type="primary"
                        plain
                        class="mud-info-topic-num"
                        @click="pickInfoTopic(n)"
                    >
                        {{ n }}
                    </el-button>
                </div>
            </div>
            <el-button size="small" type="primary" plain class="mud-info-toggle-btn" @click="toggleInfoTopicsNumbers">
                信息
            </el-button>
        </div>
        <el-button
            v-if="showLeaveVillage && !showChooseCharacter"
            size="small"
            type="primary"
            plain
            @click="pickLeaveVillage"
        >
            出村
        </el-button>
        <el-button
            v-if="showWashTo && !showChooseCharacter && !showKuaiyiPvpPve && !showCloseEye && !showAskLaoHuabo"
            size="small"
            type="primary"
            @click="pickWashTo"
        >
            确定
        </el-button>
        <el-button
            v-if="showAskLaoHere && !showChooseCharacter && !showWashTo && !showKuaiyiPvpPve && !showCloseEye && !showAskLaoHuabo"
            size="small"
            type="primary"
            plain
            @click="pickAskLaoHere"
        >
            老村长
        </el-button>
        <el-button v-if="showEmailPrompt" size="small" type="primary" @click="pickEmail">Email</el-button>
        <el-button v-if="showPageMore" size="small" type="primary" plain @click="pickPageMore">下一页</el-button>
        <el-button v-if="showPageMore" size="small" type="primary" plain @click="pickPageEnd">结束</el-button>
        <template v-if="showChooseCharacter">
            <el-button
                v-for="opt in characterChoices"
                :key="opt.command"
                size="small"
                type="primary"
                plain
                @click="pickCharacter(opt.command)"
            >
                {{ Utils.parseMudLabelForDisplay(opt.label) }}
            </el-button>
        </template>
    </div>
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
import { ref, watch, onMounted } from 'vue';
import { Document } from '@element-plus/icons-vue'; // 导入图标组件
import { Base } from '../common/common';
import {
    INFO_TOPICS_COUNT,
    KUAIYI_CHOOSE_PVE_COMMAND,
    KUAIYI_CHOOSE_PVP_COMMAND
} from '../common/mudDownlinkPrompts';
import { Utils } from '../../utils/utils.js';
import type { DrawerProps } from 'element-plus';

// 定义 props 接收 cmd 参数
const props = defineProps<{
    cmd: string;
    showYnPrompt?: boolean;
    showMfPrompt?: boolean;
    /** 是否显示 Email：由父组件聚合互斥条件（如 App 的 showEmailPromptForMenu） */
    showEmailPrompt?: boolean;
    showChooseCharacter?: boolean;
    /** 下行匹配 ask lao 提示时显示「老对长」 */
    showAskLaoHere?: boolean;
    /** 下行匹配 washto 指令格式时显示「确定」 */
    showWashTo?: boolean;
    /** 下行匹配「要了解的信息」时显示「信息」及展开数字 */
    showInfoTopics?: boolean;
    /** 下行匹配老玩家提示时显示「出村」 */
    showLeaveVillage?: boolean;
    /** 下行匹配 1.快意恩仇 时显示 PVP / PVE */
    showKuaiyiPvpPve?: boolean;
    /** 下行匹配 closeeye 与「）」时显示「闭眼」 */
    showCloseEye?: boolean;
    /** 下行匹配 [1;36m老村长嘱咐道： 时显示「找花伯」（父组件聚合互斥） */
    showAskLaoHuabo?: boolean;
    /** 下行 [37m== 未完 时显示「下一页」「结束」 */
    showPageMore?: boolean;
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
        label: 'Option1'
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
const emits = defineEmits([
    'checkboxChange',
    'cancelSelection',
    'confirmSelection',
    'ynChoice',
    'mfChoice',
    'emailChoice',
    'characterChoice',
    'askLaoHereChoice',
    'washToChoice',
    'infoTopicChoice',
    'leaveVillageChoice',
    'kuaiyiPvpPveChoice',
    'closeEyeChoice',
    'laoHuaboChoice',
    'pageMoreChoice',
    'pageEndChoice'
]);

const infoTopicNumbers = Array.from({ length: INFO_TOPICS_COUNT }, (_, i) => i + 1);
const infoTopicsExpanded = ref(false);

/** label 可带与服务器一致的 ASCII/ANSI 片段，界面显示用 Utils.parseMudLabelForDisplay */
const characterChoices = [
    { label: '[2;37;0m光明磊落', command: 'choose 1' },
    { label: '[2;37;0m狡黠多变', command: 'choose 2' },
    { label: '[2;37;0m心狠手辣', command: 'choose 3' },
    { label: '[2;37;0m阴险奸诈', command: 'choose 4' }
] as const;

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

const pickYn = (v: 'y' | 'n') => {
    emits('ynChoice', v);
};

const pickMf = (v: 'm' | 'f') => {
    emits('mfChoice', v);
};

const pickEmail = () => {
    emits('emailChoice');
};

const pickPageMore = () => {
    emits('pageMoreChoice');
};

const pickPageEnd = () => {
    emits('pageEndChoice');
};

const pickCharacter = (cmd: string) => {
    emits('characterChoice', cmd);
};

const pickAskLaoHere = () => {
    emits('askLaoHereChoice');
};

const pickWashTo = () => {
    emits('washToChoice');
};

const pickInfoTopic = (n: number) => {
    emits('infoTopicChoice', n);
};

/** 连续点击「信息」展开/收起 1～13 数字按钮 */
const toggleInfoTopicsNumbers = () => {
    infoTopicsExpanded.value = !infoTopicsExpanded.value;
};

const pickLeaveVillage = () => {
    emits('leaveVillageChoice');
};

const pickKuaiyiPvpPve = (cmd: string) => {
    emits('kuaiyiPvpPveChoice', cmd);
};

const pickCloseEye = () => {
    emits('closeEyeChoice');
};

const pickLaoHuabo = () => {
    emits('laoHuaboChoice');
};

watch(
    () => props.showInfoTopics,
    (v) => {
        if (!v) infoTopicsExpanded.value = false;
    }
);

const handleSelect = (key: string, keyPath: string[]) => {
    base.sendMessage(keyPath[2] ?? key);
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
.mud-yn-actions {
    display: flex;
    flex-wrap: wrap;
    max-width: calc(100% - 8px);
    right: 1px;
    bottom: 64px;
    z-index: 2;
    gap: 6px;
    align-items: center;
}
/* 信息：数字区绝对定位浮在「信息」按钮正上方 */
.mud-info-topics-block {
    --mud-info-num-size: 2.25rem;
    position: relative;
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    vertical-align: top;
}
.mud-info-topic-float {
    position: absolute;
    bottom: 100%;
    right: 0;
    left: auto;
    z-index: 4;
    margin-bottom: 6px;
    padding: 6px;
    background: #1a1a1a;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: var(--el-border-radius-base);
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.35);
}
.mud-info-topic-grid {
    display: grid;
    grid-template-columns: repeat(4, var(--mud-info-num-size));
    gap: 6px;
}
.mud-info-topic-num.el-button {
    width: var(--mud-info-num-size);
    min-width: var(--mud-info-num-size) !important;
    max-width: var(--mud-info-num-size);
    height: var(--mud-info-num-size);
    padding: 0 !important;
    margin: 0 !important;
    box-sizing: border-box;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-variant-numeric: tabular-nums;
}
.mud-info-toggle-btn {
    position: relative;
    z-index: 3;
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
