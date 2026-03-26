<template>
    <div class="common-layout pr" v-if="showLayout">
        <el-container>
            <el-main class="pr">
                <!-- 使用简化后的方法名 -->
                <Menu
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
                    :show-leave-village="showLeaveVillage"
                    @characterChoice="onCharacterChoice"
                    @askLaoHereChoice="onAskLaoHereChoice"
                    @washToChoice="onWashToChoice"
                    @infoTopicChoice="onInfoTopicChoice"
                    @leaveVillageChoice="onLeaveVillageChoice"
                    :show-kuaiyi-pvp-pve="showKuaiyiPvpPve"
                    @kuaiyiPvpPveChoice="onKuaiyiPvpPveChoice"
                    :show-close-eye="showCloseEye"
                    @closeEyeChoice="onCloseEyeChoice"
                    :show-ask-lao-huabo="showAskLaoHuabo"
                    @laoHuaboChoice="onLaoHuaboChoice"
                    :show-page-more="showPageMore"
                    @pageMoreChoice="onPageMoreChoice"
                    @pageEndChoice="onPageEndChoice"
                />
                <!-- 修改事件绑定名称 -->
                <Terminal
                    ref="terminalRef"
                    @showDownward="onShowDownward"
                    @menuCommand="onMenuCmd"
                    @sendCommandToChannel="sendToChannel"
                    @ynPrompt="showYnPrompt = $event"
                    @mfPrompt="showMfPrompt = $event"
                    @emailPrompt="onEmailPrompt"
                    @chooseCharacterPrompt="onChooseCharacterPrompt"
                    @askLaoHerePrompt="onAskLaoHerePrompt"
                    @washToPrompt="onWashToPrompt"
                    @infoTopicsPrompt="onInfoTopicsPrompt"
                    @leaveVillagePrompt="onLeaveVillagePrompt"
                    @kuaiyiPvpPvePrompt="onKuaiyiPvpPvePrompt"
                    @closeEyePrompt="onCloseEyePrompt"
                    @laoHuaboPrompt="onLaoHuaboPrompt"
                    @pageMorePrompt="onPageMorePrompt"
                    @mudSessionStart="onMudSessionStart"
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
import { ref, computed, onUnmounted } from 'vue';
import { loadSitesFromStorage, type SiteCard } from './common/common';
import {
    ASK_LAO_HERE_COMMAND,
    ASK_LAO_LEAVE_VILLAGE_COMMAND,
    CLOSE_EYE_COMMAND,
    ASK_LAO_HUABO_COMMAND,
    WASH_TO_CONFIRM_COMMAND,
    buildInfoTopicChoiceCommand
} from './common/mudDownlinkPrompts';
import { isInLaocunzhangRoom, resetMudRoomRecord } from './common/mudRoomRecord';
import { createSessionOneShotPrompts, SessionOneShotKey } from './common/sessionOneShotPrompts';

const showLayout = ref(false);
/** 与 localStorage（vsmud_sites）同步，首屏即可展示已保存站点 */
const mudlist = ref<SiteCard[]>(loadSitesFromStorage());
const hideMenu = ref(false);
const menuCmd = ref('');
const selectedCategories = ref<string[]>(['chat', 'rumor']);
// 修改变量名
const loadScript = ref('');
const showYnPrompt = ref(false);
const showMfPrompt = ref(false);
/** 终端侧原始信号（未套「本会话只出现一次」） */
const emailPromptFromServer = ref(false);
const chooseCharacterFromServer = ref(false);
const askLaoHereFromServer = ref(false);
const washToFromServer = ref(false);
const leaveVillageFromServer = ref(false);
const kuaiyiPvpPveFromServer = ref(false);
const closeEyeFromServer = ref(false);
const askLaoHuaboFromServer = ref(false);
/** 终端下行 [37m== 未完：菜单栏「下一页」「结束」 */
const pageMoreFromServer = ref(false);
const sessionOneShot = createSessionOneShotPrompts();

/** 菜单区性格四选一：服务端有提示且本会话内尚未选过 */
const showChooseChar = computed(() =>
    sessionOneShot.shouldShow(SessionOneShotKey.ChooseCharacter, chooseCharacterFromServer.value)
);

/** 快意恩仇 PVP / 江湖隐士 PVE；性格四选一时让位 */
const showKuaiyiPvpPve = computed(
    () =>
        sessionOneShot.shouldShow(SessionOneShotKey.KuaiyiPvpPve, kuaiyiPvpPveFromServer.value) &&
        !showChooseChar.value
);

/** 下行含 closeeye 与「）」；性格四选一时让位；快意恩仇条出现时让位 */
const showCloseEye = computed(
    () =>
        sessionOneShot.shouldShow(SessionOneShotKey.CloseEye, closeEyeFromServer.value) &&
        !showChooseChar.value &&
        !showKuaiyiPvpPve.value
);

/** 「老村长嘱咐道：」下行；性格/快意恩仇/闭眼 条出现时让位 */
const showAskLaoHuabo = computed(
    () =>
        sessionOneShot.shouldShow(SessionOneShotKey.AskLaoHuabo, askLaoHuaboFromServer.value) &&
        !showChooseChar.value &&
        !showKuaiyiPvpPve.value &&
        !showCloseEye.value
);

/** washto 指令格式提示：确定按钮；性格/PVP·PVE/闭眼/找花伯 条出现时让位 */
const showWashTo = computed(
    () =>
        sessionOneShot.shouldShow(SessionOneShotKey.WashTo, washToFromServer.value) &&
        !showChooseChar.value &&
        !showKuaiyiPvpPve.value &&
        !showCloseEye.value &&
        !showAskLaoHuabo.value
);

/** 菜单区「老对长」：下行匹配 ask lao 提示且本会话未点过；性格/washto/PVP·PVE/闭眼/找花伯 条出现时让位 */
const showAskLao = computed(
    () =>
        sessionOneShot.shouldShow(SessionOneShotKey.AskLaoHere, askLaoHereFromServer.value) &&
        !showChooseChar.value &&
        !showWashTo.value &&
        !showKuaiyiPvpPve.value &&
        !showCloseEye.value &&
        !showAskLaoHuabo.value
);

/**
 * 「信息」：一旦下行命中「要了解的信息」并记入老村长房间后显示，直至离开判定/重连；
 * 不再依赖缓冲里是否仍含该片段。性格/PVP·PVE/闭眼/找花伯 条出现时让位。
 */
const showInfoTopics = computed(
    () =>
        isInLaocunzhangRoom.value &&
        !showChooseChar.value &&
        !showKuaiyiPvpPve.value &&
        !showCloseEye.value &&
        !showAskLaoHuabo.value
);

/** 老玩家出村：仅推断在老村长房间时显示；性格/PVP·PVE/闭眼/找花伯 条出现时让位 */
const showLeaveVillage = computed(
    () =>
        isInLaocunzhangRoom.value &&
        sessionOneShot.shouldShow(SessionOneShotKey.LeaveVillage, leaveVillageFromServer.value) &&
        !showChooseChar.value &&
        !showKuaiyiPvpPve.value &&
        !showCloseEye.value &&
        !showAskLaoHuabo.value
);

/** 菜单栏「下一页」：性格四选一时让位 */
const showPageMore = computed(
    () => pageMoreFromServer.value && !showChooseChar.value
);

/** 菜单区 Email：服务端有提示且本会话未点过、其它菜单条显示时让位 */
const showEmailMenu = computed(() => {
    const emailVisible = sessionOneShot.shouldShow(SessionOneShotKey.Email, emailPromptFromServer.value);
    return (
        emailVisible &&
        !showChooseChar.value &&
        !showAskLao.value &&
        !showWashTo.value &&
        !showInfoTopics.value &&
        !showLeaveVillage.value &&
        !showKuaiyiPvpPve.value &&
        !showCloseEye.value &&
        !showAskLaoHuabo.value
    );
});
const terminalRef = ref<{
    sendMudQuick?: (cmd: string) => void;
    focusEmailInput?: () => void;
    sendCharacterChoice?: (cmd: string) => void;
    sendAskLaoHereChoice?: (cmd: string) => void;
    sendWashToChoice?: (cmd: string) => void;
    sendInfoTopicChoice?: (cmd: string) => void;
    sendLeaveVillageChoice?: (cmd: string) => void;
    sendKuaiyiPvpPveChoice?: (cmd: string) => void;
    sendCloseEyeChoice?: (cmd: string) => void;
    sendLaoHuaboChoice?: (cmd: string) => void;
    sendNextPageEnter?: () => void;
    sendPageEndQuit?: () => void;
} | null>(null);

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
    terminalRef.value?.sendMudQuick?.(v);
    showYnPrompt.value = false;
};

const onMfChoice = (v: 'm' | 'f') => {
    terminalRef.value?.sendMudQuick?.(v);
    showMfPrompt.value = false;
};

const onEmailPrompt = (v: boolean) => {
    emailPromptFromServer.value = v;
};

const onEmailChoice = () => {
    terminalRef.value?.focusEmailInput?.();
    sessionOneShot.suppress(SessionOneShotKey.Email);
};

const onChooseCharacterPrompt = (v: boolean) => {
    chooseCharacterFromServer.value = v;
    if (v) sessionOneShot.suppress(SessionOneShotKey.Email);
};

const onAskLaoHerePrompt = (v: boolean) => {
    askLaoHereFromServer.value = v;
    if (v) sessionOneShot.suppress(SessionOneShotKey.Email);
};

const onWashToPrompt = (v: boolean) => {
    washToFromServer.value = v;
    if (v) sessionOneShot.suppress(SessionOneShotKey.Email);
};

const onInfoTopicsPrompt = (v: boolean) => {
    if (v) sessionOneShot.suppress(SessionOneShotKey.Email);
};

const onLeaveVillagePrompt = (v: boolean) => {
    leaveVillageFromServer.value = v;
    if (v) sessionOneShot.suppress(SessionOneShotKey.Email);
};

const onKuaiyiPvpPvePrompt = (v: boolean) => {
    kuaiyiPvpPveFromServer.value = v;
    if (v) sessionOneShot.suppress(SessionOneShotKey.Email);
};

const onCloseEyePrompt = (v: boolean) => {
    closeEyeFromServer.value = v;
    if (v) sessionOneShot.suppress(SessionOneShotKey.Email);
};

const onLaoHuaboPrompt = (v: boolean) => {
    askLaoHuaboFromServer.value = v;
    if (v) sessionOneShot.suppress(SessionOneShotKey.Email);
};

const onPageMorePrompt = (v: boolean) => {
    pageMoreFromServer.value = v;
    if (v) sessionOneShot.suppress(SessionOneShotKey.Email);
};

const onPageMoreChoice = () => {
    terminalRef.value?.sendNextPageEnter?.();
};

const onPageEndChoice = () => {
    terminalRef.value?.sendPageEndQuit?.();
};

const onMudSessionStart = () => {
    sessionOneShot.resetSession();
    resetMudRoomRecord();
};

const onCharacterChoice = (cmd: string) => {
    terminalRef.value?.sendCharacterChoice?.(cmd);
    sessionOneShot.suppress(SessionOneShotKey.ChooseCharacter);
};

const onAskLaoHereChoice = () => {
    terminalRef.value?.sendAskLaoHereChoice?.(ASK_LAO_HERE_COMMAND);
    sessionOneShot.suppress(SessionOneShotKey.AskLaoHere);
};

const onWashToChoice = () => {
    terminalRef.value?.sendWashToChoice?.(WASH_TO_CONFIRM_COMMAND);
    sessionOneShot.suppress(SessionOneShotKey.WashTo);
};

const onInfoTopicChoice = (index: number) => {
    terminalRef.value?.sendInfoTopicChoice?.(buildInfoTopicChoiceCommand(index));
};

const onLeaveVillageChoice = () => {
    terminalRef.value?.sendLeaveVillageChoice?.(ASK_LAO_LEAVE_VILLAGE_COMMAND);
    sessionOneShot.suppress(SessionOneShotKey.LeaveVillage);
};

const onKuaiyiPvpPveChoice = (cmd: string) => {
    terminalRef.value?.sendKuaiyiPvpPveChoice?.(cmd);
    sessionOneShot.suppress(SessionOneShotKey.KuaiyiPvpPve);
};

const onCloseEyeChoice = () => {
    terminalRef.value?.sendCloseEyeChoice?.(CLOSE_EYE_COMMAND);
    sessionOneShot.suppress(SessionOneShotKey.CloseEye);
};

const onLaoHuaboChoice = () => {
    terminalRef.value?.sendLaoHuaboChoice?.(ASK_LAO_HUABO_COMMAND);
    sessionOneShot.suppress(SessionOneShotKey.AskLaoHuabo);
};

onUnmounted(() => {
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
