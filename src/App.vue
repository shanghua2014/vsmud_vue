<template>
    <div class="common-layout pr" v-if="showLayout">
        <el-container>
            <el-main class="pr">
                <!-- 终端先渲染，菜单/桥接浮动层后渲染并提高 z-index，避免被终端盖住 -->
                <Terminal
                    ref="terminalRef"
                    :dir-panel-on="dirPanelOn"
                    @showDownward="onShowDownward"
                    @menuCommand="onMenuCmd"
                    @sendCommandToChannel="sendToChannel"
                    @yn="showYnPrompt = $event"
                    @mf="showMfPrompt = $event"
                    @em="onEmailPrompt"
                    @chSel="onChSel"
                    @alh="onAlh"
                    @wash="onWash"
                    @infT="onInfT"
                    @baiShi="onBaiShi"
                    @baiWuBo="onBaiWuBo"
                    @cfLv="onCfLv"
                    @ky="onKy"
                    @d14="onD14"
                    @cEye="onCEye"
                    @lHb="onLHb"
                    @pgM="onPgM"
                    @xsP="xingShiSrv = $event"
                    @mzP="mingZiSrv = $event"
                    @qmP="quanMingSrv = $event"
                    @psP="pwdSuperSrv = $event"
                    @pnP="pwdNormalSrv = $event"
                    @psBoth="pwdSuperBothPhasesSeenSrv = $event"
                    @pn2="pwdNormalSecondSeenSrv = $event"
                    @mudSess="onMudSess"
                    @quitListComplete="onQuitListComplete"
                />
                <Menu
                    v-model:dir-panel-on="dirPanelOn"
                    :show-xing-shi-prompt="showXingShiMenu"
                    :surname-buttons="surnameButtons"
                    :show-ming-zi-prompt="showMingZiMenu"
                    :ming-zi-buttons="mingZiButtons"
                    :show-quan-ming-prompt="showQuanMingMenu"
                    :quan-ming-buttons="quanMingButtons"
                    :show-pwd-super-prompt="showPwdSuperMenu"
                    :pwd-super-buttons="pwdSuperButtons"
                    :show-pwd-normal-prompt="showPwdNormalMenu"
                    :pwd-normal-buttons="pwdNormalButtons"
                    :cmd="menuCmd"
                    :show-yn-prompt="showYnPrompt"
                    :show-mf-prompt="showMfPrompt"
                    :show-email-prompt="showEmailMenu"
                    @checkboxChange="onCheckboxChange"
                    @cancelSelection="onCancel"
                    @confirmSelection="onConfirm"
                    @ynChoice="onYnChoice"
                    @mfChoice="onMfChoice"
                    @emailChoice="onEmailChoice"
                    :show-choose-character="showChooseChar"
                    :show-ask-lao-here="showAskLao"
                    :show-wash-to="showWashTo"
                    :show-info-topics="showInfoTopics"
                    :show-bai-shi="showBaiShi"
                    :show-bai-wu-bo="showBaiWuBo"
                    :show-confirm-leave-village="showConfirmLeaveVillage"
                    @characterChoice="onCharacterChoice"
                    @askLaoHereChoice="onAskLaoHereChoice"
                    @washToChoice="onWashToChoice"
                    @infoTopicChoice="onInfoTopicChoice"
                    @baiShiChoice="onBaiShiChoice"
                    @baiWuBoChoice="onBaiWuBoChoice"
                    @confirmLeaveVillageChoice="onConfirmLeaveVillageChoice"
                    :show-kuaiyi-pvp-pve="showKuaiyiPvpPve"
                    :show-direct-14="showDirect14Menu"
                    @kuaiyiPvpPveChoice="onKuaiyiPvpPveChoice"
                    @direct14Choice="onDirect14Choice"
                    :show-close-eye="showCloseEye"
                    @closeEyeChoice="onCloseEyeChoice"
                    :show-ask-lao-huabo="showAskLaoHuabo"
                    :lao-huabo-cooldown-sec="laoHuaboCooldownSec"
                    @laoHuaboChoice="onLaoHuaboChoice"
                    :show-page-more="showPageMore"
                    @pageMoreChoice="onPageMoreChoice"
                    @pageEndChoice="onPageEndChoice"
                    @xingShiChoice="onXingShiChoice"
                    @mingZiChoice="onMingZiChoice"
                    @quanMingChoice="onQuanMingChoice"
                    @pwdSuperChoice="onPwdSuperChoice"
                    @pwdNormalChoice="onPwdNormalChoice"
                    @clearTerminal="onClearTerminal"
                    @reconnectMud="onReconnectMud"
                />
                <Status />
            </el-main>
            <!-- 修改传递的属性名 -->
            <el-aside style="width: 28%">
                <Channel :loadScript="loadScript" :selectedCategories="selectedCategories" />
            </el-aside>
        </el-container>
    </div>
    <Mudlist v-if="!showLayout" :mudlist="mudlist" @card-clicked="receive.cardClicked" />
</template>

<script lang="ts" setup>
import Terminal from './components/Terminal.vue';
import Mudlist from './components/MudList.vue';
import Menu from './components/Menu.vue';
import Channel from './components/Channel.vue';
import Status from './components/Status.vue';
import { ref, computed, watch, onUnmounted, nextTick } from 'vue';
import { ElMessage } from 'element-plus';
import {
    loadSites,
    loadDirPan,
    saveDirPan,
    nameToSurnameBtns,
    nameToMingZiBtns,
    nameToFullNameBtns,
    pwdSuperBtns,
    pwdNormBtns,
    type SiteCard,
    Base
} from './common/common';
import { storeToRefs } from 'pinia';
import { useConfigStore } from './stores/store';
import {
    ALH_CMD,
    BAISHI_CMD,
    BAIWUBO_CMD,
    CE_CMD,
    HB_CMD,
    LV_CONFIRM_CMD,
    WASH_CMD,
    infTopicCmd
} from './common/mudDownlinkPrompts';
import { createS1, S1 } from './common/sessionOneShotPrompts';
import {
    createHiddenUntilRematchState,
    onHiddenUntilRematchSignal,
    markHiddenUntilRematchClicked,
    resetHiddenUntilRematchState
} from './common/promptReopenState';

const { cfg } = storeToRefs(useConfigStore());
/** 桥接 [1;32m姓氏：由当前站点卡片角色名拆成按钮 */
const xingShiSrv = ref(false);
const surnameButtons = computed(() => nameToSurnameBtns(cfg.value?.name));
/** 桥接 [1;33m名字：角色名末两字 */
const mingZiSrv = ref(false);
const mingZiButtons = computed(() => nameToMingZiBtns(cfg.value?.name));
const quanMingSrv = ref(false);
const quanMingButtons = computed(() => nameToFullNameBtns(cfg.value?.name));
const pwdSuperSrv = ref(false);
const pwdSuperButtons = computed(() => pwdSuperBtns(cfg.value?.managePassword));
const pwdNormalSrv = ref(false);
const pwdNormalButtons = computed(() => pwdNormBtns(cfg.value?.password));
/** 桥接：缓冲内是否已同时出现过两段密码提示（此时点击才收起菜单） */
const pwdSuperBothPhasesSeenSrv = ref(false);
const pwdNormalSecondSeenSrv = ref(false);
/** 普通密码条点击次数：桥接未及时标二段时，第 2 次点击强制收起 */
const pwdNormalMenuClickCount = ref(0);

/** 设置抽屉内开关：是否显示终端方向区（持久化到 localStorage） */
const dirPanelOn = ref(loadDirPan());
watch(dirPanelOn, (on) => saveDirPan(on));

const showLayout = ref(false);
/** 与 localStorage（vsmud_sites）同步，首屏即可展示已保存站点 */
const mudlist = ref<SiteCard[]>(loadSites());
const hideMenu = ref(false);
const menuCmd = ref('');
const selectedCategories = ref<string[]>(['chat', 'rumor']);
// 修改变量名
const loadScript = ref('');
const showYnPrompt = ref(false);
const showMfPrompt = ref(false);
/** 终端侧原始信号（未套「本会话只出现一次」） */
const emailSrv = ref(false);
const chooseCharSrv = ref(false);
const askLaoSrv = ref(false);
const washToSrv = ref(false);
/** 终端下行「要了解的信息」提示 */
const infTSrv = ref(false);
const baiShiSrv = ref(false);
/** 点「拜师」后隐藏；再次匹配成功（false->true）后恢复 */
const baiShiReopen = createHiddenUntilRematchState();
const baiWuBoSrv = ref(false);
const baiWuBoReopen = createHiddenUntilRematchState();
const kuaiyiSrv = ref(false);
/** 下行 `[1;36m1. 直接`：菜单数字 1～4 */
const d14Srv = ref(false);
/** 点 1～4 后隐藏；再次匹配成功（false->true）后恢复显示 */
const d14Reopen = createHiddenUntilRematchState();
const closeEyeSrv = ref(false);
const huaboSrv = ref(false);
/** 终端下行 [37m== 未完：菜单栏「下一页」「结束」 */
const pageMoreSrv = ref(false);
/** 下行 `[1;31mask hua` 等：「确认出村」 */
const cfLvSrv = ref(false);
/** 点「确认出村」后隐藏；再次匹配成功（false->true）后恢复显示 */
const cfLvReopen = createHiddenUntilRematchState();
const s1 = createS1();

/** 重连用（与 Terminal/MudList 同一模块级 WebSocket） */
const mudBase = new Base();

/** 姓名三步：桥接互斥（全名 > 名字 > 姓氏）且各步点选一次后本会话不再显示 */
const quanMingVisible = computed(() =>
    s1.shouldShow(S1.QmNm, quanMingSrv.value)
);
const mingZiVisible = computed(() =>
    s1.shouldShow(S1.MzNm, mingZiSrv.value)
);
const xingShiVisible = computed(() =>
    s1.shouldShow(S1.XsNm, xingShiSrv.value)
);
const pwdSuperVisible = computed(() =>
    s1.shouldShow(S1.Ps, pwdSuperSrv.value)
);
const pwdNormalVisible = computed(() =>
    s1.shouldShow(S1.Pn, pwdNormalSrv.value)
);

const showQuanMingMenu = computed(
    () => quanMingVisible.value && !pwdSuperVisible.value && !pwdNormalVisible.value
);
const showMingZiMenu = computed(
    () =>
        mingZiVisible.value &&
        !quanMingVisible.value &&
        !pwdSuperVisible.value &&
        !pwdNormalVisible.value
);
const showXingShiMenu = computed(
    () =>
        xingShiVisible.value &&
        !mingZiVisible.value &&
        !quanMingVisible.value &&
        !pwdSuperVisible.value &&
        !pwdNormalVisible.value
);

/** 与姓名/全名条互斥：桥接五选一；各步点选一次后本会话不再显示 */
const showPwdSuperMenu = computed(
    () =>
        pwdSuperVisible.value &&
        !quanMingVisible.value &&
        !mingZiVisible.value &&
        !xingShiVisible.value &&
        !pwdNormalVisible.value
);
const showPwdNormalMenu = computed(
    () =>
        pwdNormalVisible.value &&
        !quanMingVisible.value &&
        !mingZiVisible.value &&
        !xingShiVisible.value &&
        !pwdSuperVisible.value
);

/** 菜单区性格四选一：服务端有提示且本会话内尚未选过 */
const showChooseChar = computed(() =>
    s1.shouldShow(S1.ChSel, chooseCharSrv.value)
);

/** 快意恩仇 PVP / 江湖隐士 PVE；性格四选一时让位 */
const showKuaiyiPvpPve = computed(
    () =>
        s1.shouldShow(S1.Ky, kuaiyiSrv.value) &&
        !showChooseChar.value
);

/** 下行含 closeeye 与「）」；性格四选一时让位；快意恩仇条出现时让位 */
const showCloseEye = computed(
    () =>
        s1.shouldShow(S1.CEye, closeEyeSrv.value) &&
        !showChooseChar.value &&
        !showKuaiyiPvpPve.value
);

/** 「老村长嘱咐道：」下行；性格/快意恩仇/闭眼 条出现时让位 */
const showAskLaoHuabo = computed(
    () =>
        s1.shouldShow(S1.LHb, huaboSrv.value) &&
        !showChooseChar.value &&
        !showKuaiyiPvpPve.value &&
        !showCloseEye.value
);

/** 下行 ask hua（`cfLv`）：确认出村；点击后暂隐，再次匹配后恢复 */
const showConfirmLeaveVillage = computed(
    () =>
        cfLvSrv.value &&
        !cfLvReopen.hiddenAfterClick.value &&
        !showChooseChar.value &&
        !showKuaiyiPvpPve.value &&
        !showCloseEye.value &&
        !showAskLaoHuabo.value
);

/** `[1;36m1. 直接`：四钮发 1～4；点击后暂隐，再次匹配后恢复（快意/闭眼/花伯/确认出村 仍优先） */
const showDirect14Menu = computed(
    () =>
        d14Srv.value &&
        !d14Reopen.hiddenAfterClick.value &&
        !showChooseChar.value &&
        !showKuaiyiPvpPve.value &&
        !showCloseEye.value &&
        !showAskLaoHuabo.value &&
        !showConfirmLeaveVillage.value
);

/** washto 指令格式提示：确定按钮；性格/PVP·PVE/闭眼/找花伯/确认出村 条出现时让位 */
const showWashTo = computed(
    () =>
        s1.shouldShow(S1.Wash, washToSrv.value) &&
        !showChooseChar.value &&
        !showKuaiyiPvpPve.value &&
        !showCloseEye.value &&
        !showAskLaoHuabo.value &&
        !showConfirmLeaveVillage.value &&
        !showDirect14Menu.value
);

/** 菜单区「老对长」：下行匹配 ask lao 提示且本会话未点过；性格/washto/PVP·PVE/闭眼/找花伯/确认出村 条出现时让位 */
const showAskLao = computed(
    () =>
        s1.shouldShow(S1.Alh, askLaoSrv.value) &&
        !showChooseChar.value &&
        !showWashTo.value &&
        !showKuaiyiPvpPve.value &&
        !showCloseEye.value &&
        !showAskLaoHuabo.value &&
        !showConfirmLeaveVillage.value &&
        !showDirect14Menu.value
);

/** 「信息」：下行 `infT` 且本会话未 suppress；不因点数字隐藏（仅「信息」展开/收起在 Menu 内） */
const showInfoTopics = computed(
    () =>
        s1.shouldShow(S1.InfT, infTSrv.value) &&
        !showChooseChar.value &&
        !showKuaiyiPvpPve.value &&
        !showCloseEye.value &&
        !showAskLaoHuabo.value &&
        !showConfirmLeaveVillage.value &&
        !showDirect14Menu.value
);

/** 「拜师」：与「信息」相同互斥；下行 + rematch（本会话非 S1） */
const showBaiShi = computed(
    () =>
        baiShiSrv.value &&
        !baiShiReopen.hiddenAfterClick.value &&
        !showChooseChar.value &&
        !showKuaiyiPvpPve.value &&
        !showCloseEye.value &&
        !showAskLaoHuabo.value &&
        !showConfirmLeaveVillage.value &&
        !showDirect14Menu.value
);

/** 「拜武伯」：与拜师同类 rematch */
const showBaiWuBo = computed(
    () =>
        baiWuBoSrv.value &&
        !baiWuBoReopen.hiddenAfterClick.value &&
        !showChooseChar.value &&
        !showKuaiyiPvpPve.value &&
        !showCloseEye.value &&
        !showAskLaoHuabo.value &&
        !showConfirmLeaveVillage.value &&
        !showDirect14Menu.value
);

/** 菜单栏「下一页」：性格四选一时让位 */
const showPageMore = computed(
    () => pageMoreSrv.value && !showChooseChar.value && !showDirect14Menu.value
);

/** 菜单区 Email：服务端有提示且本会话未点过、其它菜单条显示时让位 */
const showEmailMenu = computed(() => {
    const emailVisible = s1.shouldShow(S1.Em, emailSrv.value);
    return (
        emailVisible &&
        !showChooseChar.value &&
        !showAskLao.value &&
        !showWashTo.value &&
        !showInfoTopics.value &&
        !showBaiShi.value &&
        !showBaiWuBo.value &&
        !showKuaiyiPvpPve.value &&
        !showCloseEye.value &&
        !showAskLaoHuabo.value &&
        !showConfirmLeaveVillage.value &&
        !showDirect14Menu.value
    );
});
const terminalRef = ref<{
    sendMq?: (cmd: string) => void;
    sendXs?: (ch: string) => void;
    sendMz?: (ch: string) => void;
    sendQm?: (fullName: string) => void;
    sendPs?: (pwd: string, finalize?: boolean) => void;
    sendPn?: (pwd: string, finalize?: boolean) => void;
    sendRegEm?: (email: string) => void;
    sendChSel?: (cmd: string) => void;
    sendAlhChoice?: (cmd: string) => void;
    sendWashChoice?: (cmd: string) => void;
    sendInfTopicChoice?: (cmd: string) => void;
    sendBaiShiChoice?: (cmd: string) => void;
    sendBaiWuBoChoice?: (cmd: string) => void;
    sendCfLvChoice?: (cmd: string) => void;
    sendKyChoice?: (cmd: string) => void;
    sendDirect14?: (digit: string) => void;
    sendCeChoice?: (cmd: string) => void;
    sendHbChoice?: (cmd: string) => void;
    sendPgEnter?: () => void;
    sendPgEnd?: () => void;
    mudDisconnect?: () => void;
    clearTerminal?: () => void;
    printLocalLine?: (text: string) => void;
    startQuitAndReturnList?: () => void;
} | null>(null);

/** 「找花伯」按钮出现后 10 秒内点击不发命令，仅终端提示；按钮上显示剩余秒数 */
const LAOHUABO_COOLDOWN_MS = 10_000;
/** 倒计时显示结束后，再静默 1 秒才允许发命令（无终端提示） */
const LAOHUABO_SILENT_AFTER_MS = 1000;
const laoHuaboCooldownUntil = ref(0);
/** 早于此时戳的点击一律不发命令（含可见倒计时 + 静默 1 秒） */
const laoHuaboEffectiveUntil = ref(0);
const laoHuaboCooldownSec = ref(0);
let laoHuaboTick: ReturnType<typeof setInterval> | null = null;

function clearLaoHuaboTick() {
    if (laoHuaboTick) {
        clearInterval(laoHuaboTick);
        laoHuaboTick = null;
    }
}

function updateLaoHuaboSec() {
    const u = laoHuaboCooldownUntil.value;
    if (!u) {
        laoHuaboCooldownSec.value = 0;
        return;
    }
    const left = Math.max(0, Math.ceil((u - Date.now()) / 1000));
    laoHuaboCooldownSec.value = left;
    if (left === 0) clearLaoHuaboTick();
}

watch(showAskLaoHuabo, (show) => {
    clearLaoHuaboTick();
    if (show) {
        const t0 = Date.now();
        laoHuaboCooldownUntil.value = t0 + LAOHUABO_COOLDOWN_MS;
        laoHuaboEffectiveUntil.value = t0 + LAOHUABO_COOLDOWN_MS + LAOHUABO_SILENT_AFTER_MS;
        updateLaoHuaboSec();
        laoHuaboTick = setInterval(updateLaoHuaboSec, 250);
    } else {
        laoHuaboCooldownUntil.value = 0;
        laoHuaboEffectiveUntil.value = 0;
        laoHuaboCooldownSec.value = 0;
    }
});

// 修改 sendToChannel 函数中使用的变量名
const sendToChannel = (command: string) => {
    loadScript.value = `${command}`;
};

// =======================
//    接收子组件的消息
// =======================
const receive = {
    cardClicked: (showTerminal: boolean) => {
        showLayout.value = showTerminal;
    }
};

/** 文档菜单「退出」：先发 quit，下行匹配放弃账号则静默发 y；结束后整页刷新 */
const onClearTerminal = () => {
    terminalRef.value?.startQuitAndReturnList?.();
};

/** quit 流程结束（含超时）：整页刷新，不再回到站点列表 */
const onQuitListComplete = () => {
    window.location.reload();
};

/** 站点卡片 Email 校验（与 MudList 一致） */
function validateEmailForReconnect(email: string): string | null {
    const t = email.trim();
    if (!t) return '请填写 Email';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) {
        return 'Email 格式不正确';
    }
    return null;
}

/** 文档菜单「重连」：校验 Email 后断开并重新连接当前站点 */
const onReconnectMud = () => {
    const err = validateEmailForReconnect(cfg.value?.email ?? '');
    if (err) {
        ElMessage.warning(err);
        return;
    }
    const c = cfg.value;
    if (!c?.ip?.trim() || !c?.port?.trim()) {
        ElMessage.warning('站点配置不完整');
        return;
    }
    terminalRef.value?.mudDisconnect?.();
    void nextTick(() => {
        void nextTick(() => {
            mudBase.connect({
                type: 'telnet',
                content: c as SiteCard
            });
        });
    });
};

// 显示或隐藏 “向下” 按钮
const onShowDownward = (shouldHide: boolean) => {
    hideMenu.value = false;
};
// 唤起前端界面
const onMenuCmd = (cmd: string) => {
    console.log('唤起前端界面 ', cmd);
    menuCmd.value = cmd;
};

// 处理 checkbox 变化事件
const onCheckboxChange = (value: string[]) => {
    selectedCategories.value = value;
};

const onCancel = (value: string[]) => {
    selectedCategories.value = value;
};

const onConfirm = (value: string[]) => {
    selectedCategories.value = value;
};

const onYnChoice = (v: 'y' | 'n') => {
    terminalRef.value?.sendMq?.(v);
    showYnPrompt.value = false;
};

const onMfChoice = (v: 'm' | 'f') => {
    terminalRef.value?.sendMq?.(v);
    showMfPrompt.value = false;
};

const onEmailPrompt = (v: boolean) => {
    emailSrv.value = v;
};

const onEmailChoice = () => {
    const email = cfg.value?.email?.trim();
    if (!email) {
        ElMessage.warning('请先在站点卡片填写 Email');
        return;
    }
    terminalRef.value?.sendRegEm?.(email);
    s1.suppress(S1.Em);
};

const onChSel = (v: boolean) => {
    chooseCharSrv.value = v;
    if (v) s1.suppress(S1.Em);
};

const onAlh = (v: boolean) => {
    askLaoSrv.value = v;
    if (v) s1.suppress(S1.Em);
};

const onWash = (v: boolean) => {
    washToSrv.value = v;
    if (v) s1.suppress(S1.Em);
};

const onInfT = (v: boolean) => {
    infTSrv.value = v;
    if (v) s1.suppress(S1.Em);
};

const onBaiShi = (v: boolean) => {
    baiShiSrv.value = v;
    if (v) s1.suppress(S1.Em);
    onHiddenUntilRematchSignal(baiShiReopen, v);
};

const onBaiWuBo = (v: boolean) => {
    baiWuBoSrv.value = v;
    if (v) s1.suppress(S1.Em);
    onHiddenUntilRematchSignal(baiWuBoReopen, v);
};

const onCfLv = (v: boolean) => {
    cfLvSrv.value = v;
    if (v) s1.suppress(S1.Em);
    onHiddenUntilRematchSignal(cfLvReopen, v);
};

const onKy = (v: boolean) => {
    kuaiyiSrv.value = v;
    if (v) s1.suppress(S1.Em);
};

const onD14 = (v: boolean) => {
    d14Srv.value = v;
    if (v) s1.suppress(S1.Em);
    onHiddenUntilRematchSignal(d14Reopen, v);
};

const onCEye = (v: boolean) => {
    closeEyeSrv.value = v;
    if (v) s1.suppress(S1.Em);
};

const onLHb = (v: boolean) => {
    huaboSrv.value = v;
    if (v) s1.suppress(S1.Em);
};

const onPgM = (v: boolean) => {
    pageMoreSrv.value = v;
    if (v) s1.suppress(S1.Em);
};

const onPageMoreChoice = () => {
    terminalRef.value?.sendPgEnter?.();
};

const onPageEndChoice = () => {
    terminalRef.value?.sendPgEnd?.();
};

const onMudSess = () => {
    s1.resetSession();
    infTSrv.value = false;
    baiShiSrv.value = false;
    resetHiddenUntilRematchState(baiShiReopen);
    baiWuBoSrv.value = false;
    resetHiddenUntilRematchState(baiWuBoReopen);
    cfLvSrv.value = false;
    resetHiddenUntilRematchState(cfLvReopen);
    d14Srv.value = false;
    resetHiddenUntilRematchState(d14Reopen);
    xingShiSrv.value = false;
    mingZiSrv.value = false;
    quanMingSrv.value = false;
    pwdSuperSrv.value = false;
    pwdNormalSrv.value = false;
    pwdSuperBothPhasesSeenSrv.value = false;
    pwdNormalSecondSeenSrv.value = false;
    pwdNormalMenuClickCount.value = 0;
};

const onXingShiChoice = (ch: string) => {
    terminalRef.value?.sendXs?.(ch);
    s1.suppress(S1.XsNm);
};

const onMingZiChoice = (ch: string) => {
    terminalRef.value?.sendMz?.(ch);
    s1.suppress(S1.MzNm);
};

const onQuanMingChoice = (fullName: string) => {
    terminalRef.value?.sendQm?.(fullName);
    s1.suppress(S1.QmNm);
};

const onPwdSuperChoice = (pwd: string) => {
    const finalize = pwdSuperBothPhasesSeenSrv.value;
    terminalRef.value?.sendPs?.(pwd, finalize);
    if (finalize) {
        s1.suppress(S1.Ps);
        pwdSuperSrv.value = false;
    }
};

const onPwdNormalChoice = (pwd: string) => {
    pwdNormalMenuClickCount.value += 1;
    const finalize =
        pwdNormalSecondSeenSrv.value || pwdNormalMenuClickCount.value >= 2;
    terminalRef.value?.sendPn?.(pwd, finalize);
    if (finalize) {
        s1.suppress(S1.Pn);
        pwdNormalSrv.value = false;
        pwdNormalMenuClickCount.value = 0;
    }
};

const onCharacterChoice = (cmd: string) => {
    terminalRef.value?.sendChSel?.(cmd);
    s1.suppress(S1.ChSel);
};

const onAskLaoHereChoice = () => {
    terminalRef.value?.sendAlhChoice?.(ALH_CMD);
    s1.suppress(S1.Alh);
};

const onWashToChoice = () => {
    terminalRef.value?.sendWashChoice?.(WASH_CMD);
    s1.suppress(S1.Wash);
};

const onInfoTopicChoice = (index: number) => {
    terminalRef.value?.sendInfTopicChoice?.(infTopicCmd(index));
};

const onBaiShiChoice = () => {
    terminalRef.value?.sendBaiShiChoice?.(BAISHI_CMD);
    markHiddenUntilRematchClicked(baiShiReopen, baiShiSrv.value);
};

const onBaiWuBoChoice = () => {
    terminalRef.value?.sendBaiWuBoChoice?.(BAIWUBO_CMD);
    markHiddenUntilRematchClicked(baiWuBoReopen, baiWuBoSrv.value);
};

const onConfirmLeaveVillageChoice = () => {
    terminalRef.value?.sendCfLvChoice?.(LV_CONFIRM_CMD);
    markHiddenUntilRematchClicked(cfLvReopen, cfLvSrv.value);
};

const onKuaiyiPvpPveChoice = (cmd: string) => {
    terminalRef.value?.sendKyChoice?.(cmd);
    s1.suppress(S1.Ky);
};

const onDirect14Choice = (digit: string) => {
    terminalRef.value?.sendDirect14?.(digit);
    markHiddenUntilRematchClicked(d14Reopen, d14Srv.value);
};

const onCloseEyeChoice = () => {
    terminalRef.value?.sendCeChoice?.(CE_CMD);
    s1.suppress(S1.CEye);
};

const onLaoHuaboChoice = () => {
    const now = Date.now();
    if (now < laoHuaboEffectiveUntil.value) {
        if (now < laoHuaboCooldownUntil.value) {
            terminalRef.value?.printLocalLine?.('稍等系统喘息中。。。');
        }
        return;
    }
    terminalRef.value?.sendHbChoice?.(HB_CMD);
    s1.suppress(S1.LHb);
};

onUnmounted(() => {
    clearLaoHuaboTick();
    window.removeEventListener('message', () => {});
});
</script>

<style lang="scss" scoped>
.app-container {
    position: relative;
    height: 100vh;
}
.el-main {
    overflow-x: hidden;
    --el-main-padding: 0px;
}
</style>
