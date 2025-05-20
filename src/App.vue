<template>
    <div class="common-layout pr">
        <el-container>
            <el-main class="pr">
                <!-- 使用简化后的方法名 -->
                <Menu v-if="!hideMenu" :cmd="menuCmd" @checkboxChange="onCheckboxChange" @cancelSelection="onCancel" @confirmSelection="onConfirm" />
                <Terminal v-if="showTerminal" @showDownward="onShowDownward" @menuCommand="onMenuCmd" />
                <Mudlist v-if="!showTerminal" :mudlist="mudlist" @card-clicked="receive.cardClicked" />
                <Status />
                <!-- 监听 hideFullme 事件，控制组件显示隐藏 -->
                <Fullme v-if="showFullme" @hideFullme="hideFullmeComponent" />
            </el-main>
            <el-aside style="width: 28%">
                <Channel :selectedCategories="selectedCategories" />
            </el-aside>
        </el-container>
    </div>
</template>

<script lang="ts" setup>
import Terminal from './components/Terminal.vue';
import Mudlist from './components/MudList.vue';
import Menu from './components/Menu.vue';
import Channel from './components/Channel.vue';
import Status from './components/Status.vue';
import Fullme from './components/Fullme.vue';
import { onMounted, ref, onUnmounted } from 'vue';
import { Base } from './utils/util';

const showTerminal = ref(location.protocol == 'http:' ? true : false);
const mudlist = ref<any>({});
const hideMenu = ref(false);
const menuCmd = ref('');
const selectedCategories = ref<string[]>(['chat', 'rumor']);

// 控制 Fullme 组件显示隐藏
const showFullme = ref(false);

// 隐藏 Fullme 组件的方法
const hideFullmeComponent = () => {
    showFullme.value = false;
};

// =======================
//    接收子组件的消息
// =======================
const receive = {
    cardClicked: () => {
        showTerminal.value = true;
    }
};

// 显示或隐藏 “向下” 按钮
const onShowDownward = (shouldHide: boolean) => {
    hideMenu.value = shouldHide;
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

// 接收来自vscode扩展的消息
onMounted(() => {
    new Base().postMessage({ type: 'getAccount', content: '' });
});

// 组件卸载时断开观察器
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
