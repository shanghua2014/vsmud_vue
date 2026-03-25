<template>
    <div class="common-layout pr" v-if="showLayout">
        <el-container>
            <el-main class="pr">
                <!-- 使用简化后的方法名 -->
                <Menu
                    :cmd="menuCmd"
                    :show-yn-prompt="showYnPrompt"
                    :show-mf-prompt="showMfPrompt"
                    :show-help-start-prompt="showHelpStartPrompt"
                    :show-email-prompt="showEmailPrompt"
                    @checkboxChange="onCheckboxChange"
                    @cancelSelection="onCancel"
                    @confirmSelection="onConfirm"
                    @ynChoice="onYnChoice"
                    @mfChoice="onMfChoice"
                    @helpChoice="onHelpChoice"
                    @emailChoice="onEmailChoice"
                />
                <!-- 修改事件绑定名称 -->
                <Terminal
                    ref="terminalRef"
                    @showDownward="onShowDownward"
                    @menuCommand="onMenuCmd"
                    @sendCommandToChannel="sendToChannel"
                    @ynPrompt="showYnPrompt = $event"
                    @mfPrompt="showMfPrompt = $event"
                    @helpPrompt="showHelpStartPrompt = $event"
                    @emailPrompt="onEmailPrompt"
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
import { ref, onUnmounted } from 'vue';
import { loadSitesFromStorage, type SiteCard } from './common/common';

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
const showHelpStartPrompt = ref(false);
const showEmailPrompt = ref(false);
const terminalRef = ref<{ sendMudQuick?: (cmd: string) => void; focusEmailInput?: () => void } | null>(null);

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

const onHelpChoice = (cmd: 'help start' | 'help start2') => {
    terminalRef.value?.sendMudQuick?.(cmd);
    showHelpStartPrompt.value = false;
};

const onEmailPrompt = (v: boolean) => {
    if (v) showEmailPrompt.value = true;
};

const onEmailChoice = () => {
    terminalRef.value?.focusEmailInput?.();
    showEmailPrompt.value = false;
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
