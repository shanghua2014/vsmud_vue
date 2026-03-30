<template>
    <div
        v-if="
            showYnPrompt ||
            showMfPrompt ||
            showChooseCharacter ||
            showKuaiyiPvpPve ||
            showDirect14 ||
            showCloseEye ||
            showAskLaoHuabo ||
            showWashTo ||
            showBaiShi ||
            showBaiWuBo ||
            showZhaoCz ||
            showZhunCc ||
            showConfirmLeaveVillage ||
            showAskLaoHere ||
            showEmailPrompt ||
            showPageMore ||
            (showQuanMingPrompt && quanMingButtons.length > 0) ||
            (showXingShiPrompt && surnameButtons.length > 0) ||
            (showMingZiPrompt && mingZiButtons.length > 0) ||
            (showPwdSuperPrompt && pwdSuperButtons.length > 0) ||
            (showPwdNormalPrompt && pwdNormalButtons.length > 0)
        "
        class="mud-yn-actions pa"
    >
        <template v-if="terminalScrolledUp">
            <el-button
                size="small"
                type="primary"
                plain
                title="置底(alt+z)"
                @click="pickScrollTerminalToBottom"
            >
                <el-icon class="mud-yn-actions__btn-icon"><Bottom /></el-icon>
                置底
            </el-button>
        </template>
        <template v-else>
        <template v-if="showQuanMingPrompt && quanMingButtons.length > 0">
            <el-button
                v-for="(label, i) in quanMingButtons"
                :key="`qm-${i}`"
                size="small"
                type="primary"
                plain
                @click="pickQuanMing(label)"
            >
                {{ label }}
            </el-button>
        </template>
        <template v-if="showXingShiPrompt && surnameButtons.length > 0">
            <el-button
                v-for="(ch, i) in surnameButtons"
                :key="`xing-${ch}-${i}`"
                size="small"
                type="primary"
                plain
                @click="pickXingShi(ch)"
            >
                {{ ch }}
            </el-button>
        </template>
        <template v-if="showMingZiPrompt && mingZiButtons.length > 0">
            <el-button
                v-for="(ch, i) in mingZiButtons"
                :key="`ming-${ch}-${i}`"
                size="small"
                type="primary"
                plain
                @click="pickMingZi(ch)"
            >
                {{ ch }}
            </el-button>
        </template>
        <template v-if="showPwdSuperPrompt && pwdSuperButtons.length > 0">
            <el-button
                v-for="(label, i) in pwdSuperButtons"
                :key="`pwd-sup-${i}`"
                size="small"
                type="primary"
                plain
                @click="pickPwdSuper(label)"
            >
                {{ label }}
            </el-button>
        </template>
        <template v-if="showPwdNormalPrompt && pwdNormalButtons.length > 0">
            <el-button
                v-for="(label, i) in pwdNormalButtons"
                :key="`pwd-norm-${i}`"
                size="small"
                type="primary"
                plain
                @click="pickPwdNormal(label)"
            >
                {{ label }}
            </el-button>
        </template>
        <template v-if="showYnPrompt">
            <el-button size="small" type="primary" @click="pickYn('y')">是</el-button>
            <el-button size="small" type="primary" plain @click="pickYn('n')">否</el-button>
        </template>
        <template v-if="showMfPrompt">
            <el-button size="small" type="primary" @click="pickMf('m')">男</el-button>
            <el-button size="small" type="primary" plain @click="pickMf('f')">女</el-button>
        </template>
        <template v-if="showKuaiyiPvpPve && !showChooseCharacter">
            <el-button size="small" type="primary" @click="pickKuaiyiPvpPve(KY_PVP_CMD)">快意恩仇-PVP</el-button>
            <el-button size="small" type="primary" plain @click="pickKuaiyiPvpPve(KY_PVE_CMD)">
                江湖隐士-PVE
            </el-button>
        </template>
        <template v-if="showDirect14 && !showChooseCharacter">
            <el-button
                v-for="d in direct14Digits"
                :key="`d14-${d}`"
                size="small"
                type="primary"
                plain
                @click="pickDirect14(d)"
            >
                {{ d }}
            </el-button>
        </template>
        <el-button
            v-if="showCloseEye && !showChooseCharacter && !showKuaiyiPvpPve && !showDirect14"
            size="small"
            type="primary"
            plain
            @click="pickCloseEye"
        >
            闭眼
        </el-button>
        <el-button v-if="showAskLaoHuabo" size="small" type="primary" plain @click="pickLaoHuabo">
            {{ laoHuaboCooldownSec > 0 ? `找花伯 ${laoHuaboCooldownSec}s` : '找花伯' }}
        </el-button>
        <div
            v-if="(showBaiShi || showBaiWuBo || showZhaoCz || showZhunCc) && !showChooseCharacter"
            class="mud-info-bai-shi-row"
        >
            <el-button
                v-if="showBaiShi"
                size="small"
                type="primary"
                plain
                class="mud-bai-shi-btn"
                @click="pickBaiShi"
            >
                拜师
            </el-button>
            <el-button
                v-if="showBaiWuBo"
                size="small"
                type="primary"
                plain
                class="mud-bai-shi-btn"
                @click="pickBaiWuBo"
            >
                拜武伯
            </el-button>
            <el-button
                v-if="showZhaoCz"
                size="small"
                type="primary"
                plain
                class="mud-bai-shi-btn"
                @click="pickZhaoCz"
            >
                找村长
            </el-button>
            <el-button
                v-if="showZhunCc"
                size="small"
                type="primary"
                plain
                class="mud-bai-shi-btn"
                @click="pickZhunCc"
            >
                准备出村
            </el-button>
        </div>
        <el-button
            v-if="showConfirmLeaveVillage && !showChooseCharacter"
            size="small"
            type="primary"
            plain
            @click="pickConfirmLeaveVillage"
        >
            确认出村
        </el-button>
        <el-button
            v-if="showWashTo && !showChooseCharacter && !showKuaiyiPvpPve && !showCloseEye && !showAskLaoHuabo && !showConfirmLeaveVillage"
            size="small"
            type="primary"
            @click="pickWashTo"
        >
            确定
        </el-button>
        <el-button
            v-if="showAskLaoHere && !showChooseCharacter && !showWashTo && !showKuaiyiPvpPve && !showCloseEye && !showAskLaoHuabo && !showConfirmLeaveVillage"
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
        </template>
    </div>
    <div ref="docMenuRootRef" class="mud-doc-menu pa">
        <button
            type="button"
            class="mud-doc-menu__trigger"
            :aria-expanded="docMenuOpen"
            aria-haspopup="true"
            aria-label="文档菜单"
            @click="docMenuOpen = !docMenuOpen"
        >
            <el-icon><Document /></el-icon>
        </button>
        <div v-show="docMenuOpen" class="mud-doc-menu__panel" role="menu">
            <button type="button" class="mud-doc-menu__item" role="menuitem" @click="onMenuReconnect">重连</button>
            <button type="button" class="mud-doc-menu__item" role="menuitem" @click="onMenuSettings">设置</button>
            <button type="button" class="mud-doc-menu__item" role="menuitem" @click="onMenuExit">退出</button>
        </div>
    </div>
    <el-drawer v-model="openSetting" :direction="setDirection" :with-header="false" class="pr">
        <template #default>
            <el-row :gutter="20" class="drawer-row-dir">
                <el-col :span="10">
                    <el-card class="config-card drawer-dir-card">
                        <div class="card-header flex drawer-dir-header">
                            <span>方向区</span>
                            <el-checkbox v-model="dirPanelDraft" size="small">显示</el-checkbox>
                        </div>
                    </el-card>
                </el-col>
            </el-row>
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
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { Bottom, Document } from '@element-plus/icons-vue';
import { KY_PVE_CMD, KY_PVP_CMD } from '../common/mudDownlinkPrompts';
import { Utils } from '../../utils/utils';
import type { DrawerProps } from 'element-plus';

// 定义 props 接收 cmd 参数
const props = withDefaults(
    defineProps<{
    /** 是否显示终端方向区（与父 v-model:dir-panel-on 同步） */
    dirPanelOn?: boolean;
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
    showBaiShi?: boolean;
    /** 下行「你先去拜武伯」：与拜师同类 rematch */
    showBaiWuBo?: boolean;
    /** 下行 `[2;37;0m武伯决定收你…`：找村长 rematch */
    showZhaoCz?: boolean;
    /** 下行老村长相关完成提示：准备出村 rematch */
    showZhunCc?: boolean;
    /** 下行 `[1;31mask hua` 等时显示「确认出村」 */
    showConfirmLeaveVillage?: boolean;
    /** 下行匹配 1.快意恩仇 时显示 PVP / PVE */
    showKuaiyiPvpPve?: boolean;
    /** 下行 `[1;36m1. 直接`：四钮发 1～4 */
    showDirect14?: boolean;
    /** 下行匹配 closeeye 与「）」时显示「闭眼」 */
    showCloseEye?: boolean;
    /** 下行匹配 [1;36m老村长嘱咐道： 时显示「找花伯」（父组件聚合互斥） */
    showAskLaoHuabo?: boolean;
    /** 「找花伯」冷却剩余秒数（>0 时显示在按钮上） */
    laoHuaboCooldownSec?: number;
    /** 下行 [37m== 未完 时显示「下一页」「结束」 */
    showPageMore?: boolean;
    /** 终端未在底部（有回卷且 scrollTop 未到底）：本栏暂变为「置底」 */
    terminalScrolledUp?: boolean;
    /** 桥接 [1;32m姓氏：与 surnameButtons 同时满足时显示 */
    showXingShiPrompt?: boolean;
    /** 由父组件根据卡片角色名拆分（3 字 1 钮，4 字 2 钮） */
    surnameButtons?: string[];
    /** 桥接 [1;33m名字：与 mingZiButtons 同时满足时显示 */
    showMingZiPrompt?: boolean;
    /** 角色名末尾两字拆成按钮 */
    mingZiButtons?: string[];
    /** 桥接 [2;37;0m请输入您的全名：与 quanMingButtons 同时满足时显示 */
    showQuanMingPrompt?: boolean;
    /** 完整角色名，通常一项 */
    quanMingButtons?: string[];
    /** 桥接：管理密码，与 pwdSuperButtons */
    showPwdSuperPrompt?: boolean;
    pwdSuperButtons?: string[];
    /** 桥接：普通密码，与 pwdNormalButtons */
    showPwdNormalPrompt?: boolean;
    pwdNormalButtons?: string[];
}>(),
    {
        dirPanelOn: true,
        showXingShiPrompt: false,
        surnameButtons: () => [],
        showMingZiPrompt: false,
        mingZiButtons: () => [],
        showQuanMingPrompt: false,
        quanMingButtons: () => [],
        showPwdSuperPrompt: false,
        pwdSuperButtons: () => [],
        showPwdNormalPrompt: false,
        pwdNormalButtons: () => [],
        laoHuaboCooldownSec: 0,
        showConfirmLeaveVillage: false,
        showDirect14: false,
        showZhaoCz: false,
        showZhunCc: false,
        terminalScrolledUp: false
    }
);

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
    'update:dirPanelOn',
    'checkboxChange',
    'cancelSelection',
    'confirmSelection',
    'ynChoice',
    'mfChoice',
    'emailChoice',
    'characterChoice',
    'askLaoHereChoice',
    'washToChoice',
    'baiShiChoice',
    'baiWuBoChoice',
    'zhaoCzChoice',
    'zhunCcChoice',
    'confirmLeaveVillageChoice',
    'kuaiyiPvpPveChoice',
    'direct14Choice',
    'closeEyeChoice',
    'laoHuaboChoice',
    'pageMoreChoice',
    'pageEndChoice',
    'xingShiChoice',
    'mingZiChoice',
    'quanMingChoice',
    'pwdSuperChoice',
    'pwdNormalChoice',
    /** 文档菜单「退出」：父组件触发 quit 流程 */
    'clearTerminal',
    /** 文档菜单「重连」 */
    'reconnectMud',
    /** 菜单栏「置底」：xterm 滚到最新输出 */
    'scrollTerminalToBottom'
]);

/** `[1;36m1. 直接` 菜单：点击发送数字 */
const direct14Digits = ['1', '2', '3', '4'] as const;

/** label 可带与服务器一致的 ASCII/ANSI 片段，界面显示用 Utils.parseMudLabelForDisplay */
const characterChoices = [
    { label: '[2;37;0m光明磊落', command: 'choose 1' },
    { label: '[2;37;0m狡黠多变', command: 'choose 2' },
    { label: '[2;37;0m心狠手辣', command: 'choose 3' },
    { label: '[2;37;0m阴险奸诈', command: 'choose 4' }
] as const;

/** 文档图标下拉是否展开 */
const docMenuOpen = ref(false);
const docMenuRootRef = ref<HTMLElement | null>(null);

let docMenuOutsideOff: (() => void) | null = null;
function bindDocMenuOutsideClose() {
    docMenuOutsideOff?.();
    docMenuOutsideOff = null;
    if (!docMenuOpen.value) return;
    const onPointerDown = (e: PointerEvent) => {
        const root = docMenuRootRef.value;
        if (root?.contains(e.target as Node)) return;
        docMenuOpen.value = false;
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    docMenuOutsideOff = () => document.removeEventListener('pointerdown', onPointerDown, true);
}

watch(docMenuOpen, (open) => {
    docMenuOutsideOff?.();
    docMenuOutsideOff = null;
    if (open) {
        queueMicrotask(() => bindDocMenuOutsideClose());
    }
});

onUnmounted(() => {
    docMenuOutsideOff?.();
});

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
/** 方向区：仅抽屉内编辑，点「确定」后 emit 生效 */
const dirPanelDraft = ref(props.dirPanelOn);

watch(openSetting, (open) => {
    if (open) dirPanelDraft.value = props.dirPanelOn;
});

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
    dirPanelDraft.value = props.dirPanelOn;
    emits('cancelSelection', initialCategories.value);
    openSetting.value = false;
};

const confirm = () => {
    emits('update:dirPanelOn', dirPanelDraft.value);
    initialCategories.value = [...form.value.category];
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

const pickXingShi = (ch: string) => {
    emits('xingShiChoice', ch);
};

const pickMingZi = (ch: string) => {
    emits('mingZiChoice', ch);
};

const pickQuanMing = (fullName: string) => {
    emits('quanMingChoice', fullName);
};

const pickPwdSuper = (pwd: string) => {
    emits('pwdSuperChoice', pwd);
};

const pickPwdNormal = (pwd: string) => {
    emits('pwdNormalChoice', pwd);
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

const pickBaiShi = () => {
    emits('baiShiChoice');
};

const pickBaiWuBo = () => {
    emits('baiWuBoChoice');
};

const pickZhaoCz = () => {
    emits('zhaoCzChoice');
};

const pickZhunCc = () => {
    emits('zhunCcChoice');
};

const pickConfirmLeaveVillage = () => {
    emits('confirmLeaveVillageChoice');
};

const pickKuaiyiPvpPve = (cmd: string) => {
    emits('kuaiyiPvpPveChoice', cmd);
};

const pickDirect14 = (digit: string) => {
    emits('direct14Choice', digit);
};

const pickCloseEye = () => {
    emits('closeEyeChoice');
};

const pickLaoHuabo = () => {
    emits('laoHuaboChoice');
};

const pickScrollTerminalToBottom = () => {
    emits('scrollTerminalToBottom');
};

function onMenuReconnect() {
    emits('reconnectMud');
    docMenuOpen.value = false;
}

function onMenuSettings() {
    openSet();
    docMenuOpen.value = false;
}

function onMenuExit() {
    emits('clearTerminal');
    docMenuOpen.value = false;
}

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
.drawer-row-dir {
    margin-bottom: 12px;
}
.drawer-dir-header {
    justify-content: space-between;
    width: 100%;
    box-sizing: border-box;
}
.drawer-dir-card {
    width: 100%;
    max-width: 100%;
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
/* 右下角文档入口：与终端置底钮分列，勿改 right/bottom 除非同步 Terminal .down-button */
.mud-doc-menu {
    bottom: 31px;
    right: 1px;
    z-index: 50;
}
.mud-doc-menu__trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60px;
    height: 30px;
    padding: 0;
    border: 1px solid var(--el-menu-border-color);
    border-radius: var(--el-border-radius-base) var(--el-border-radius-base) 0 0;
    background: #1f1f1f;
    color: var(--el-menu-text-color);
    cursor: pointer;
}
.mud-doc-menu__panel {
    position: absolute;
    bottom: 100%;
    right: 0;
    margin-bottom: 4px;
    min-width: 100px;
    padding: 4px 0;
    background: #1f1f1f;
    border: 1px solid var(--el-menu-border-color);
    border-radius: var(--el-border-radius-base);
    box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.35);
}
.mud-doc-menu__item {
    display: block;
    width: 100%;
    padding: 8px 14px;
    border: none;
    background: transparent;
    color: rgba(255, 255, 255, 0.85);
    font-size: 13px;
    text-align: left;
    cursor: pointer;
}
.mud-doc-menu__item:hover {
    background: rgba(255, 255, 255, 0.08);
}
.mud-yn-actions {
    display: flex;
    flex-wrap: wrap;
    /* 为右侧文档菜单(≈60px) + 置底钮列(与 Terminal 一致 72px) 留白 */
    max-width: calc(100% - 80px);
    right: 72px;
    bottom: 64px;
    z-index: 50;
    gap: 6px;
    align-items: center;
    pointer-events: auto;
}
/* 与 Element Plus 小按钮内图标+文字对齐（置底等） */
.mud-yn-actions__btn-icon {
    margin-right: 4px;
    vertical-align: middle;
}
/* 拜师 / 拜武伯 / 找村长 / 准备出村 同一行 */
.mud-info-bai-shi-row {
    display: inline-flex;
    flex-direction: row;
    align-items: flex-end;
    gap: 6px;
    vertical-align: top;
}
.mud-bai-shi-btn {
    position: relative;
    z-index: 3;
}
.el-drawer {
    --el-drawer-padding-primary: var(--el-dialog-padding-primary, 10px);
}
</style>
