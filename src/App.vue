<template>
    <div class="common-layout pr" v-if="showLayout">
        <el-container>
            <el-main class="pr">
                <!-- 使用简化后的方法名 -->
                <Menu v-if="!hideMenu" :cmd="menuCmd" @checkboxChange="onCheckboxChange" @cancelSelection="onCancel" @confirmSelection="onConfirm" />
                <!-- 修改事件绑定名称 -->
                <Terminal @showDownward="onShowDownward" @menuCommand="onMenuCmd" @sendCommandToChannel="sendToChannel" />
                <Status />
                <!-- 监听 hideFullme 事件，控制组件显示隐藏 -->
                <Fullme v-if="showFullme" @hideFullme="hideFullmeComponent" />
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
import Fullme from './components/Fullme.vue';
import { onMounted, ref, onUnmounted } from 'vue';
import { Base } from './utils/util';

// 声明全局 window 对象的自定义属性
declare global {
    interface Window {
        electronAPI: {
            send: (channel: string, ...args: any[]) => void;
            on: (channel: string, listener: (...args: any[]) => void) => void;
        };
    }
}

const showLayout = ref(false);
const mudlist = ref<any>([]);
const hideMenu = ref(false);
const menuCmd = ref('');
const selectedCategories = ref<string[]>(['chat', 'rumor']);
// 修改变量名
const loadScript = ref('');

// 修改 sendToChannel 函数中使用的变量名
const sendToChannel = (command: string) => {
    loadScript.value = `${command}`;
};

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
    cardClicked: (showTerminal: boolean) => {
        showLayout.value = showTerminal;
        // const datas = { type: 'telnet', content: Object.assign({ host: 'host', port: 'port' }, data) };
        // window.electronAPI.send('telnet-connect', datas);
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
    // new Base().postMessage({ type: 'getAccount', content: '' });
    window.electronAPI.send('siteList', 1);
    window.electronAPI.on('site-data', (data: any) => {
        const { content } = data;
        for (let i in content) {
            const cont = JSON.parse(content[i]);
            mudlist.value.push(cont);
        }
    });
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
