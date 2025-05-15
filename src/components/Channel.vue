<template>
    <div class="channels">
        <div class="cyan-line">1111</div>
        <div class="purple-line">222</div>
        <div class="dodger-blue-line">333</div>
        <!-- 使用 @change 事件绑定 handleSelected 函数 -->
        <el-checkbox-group v-model="form.category" size="small" class="config" @change="handleSelected">
            <el-checkbox v-for="item in listCategory" border :value="item.value" :label="item.label">{{ item.label }}</el-checkbox>
        </el-checkbox-group>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, onUnmounted } from 'vue';
import { ElInput, ElMessage, ElButton } from 'element-plus';
import TerminalAside from './components/Terminal-aside.vue';

const qq = ref(false);
const newbie = ref(false);
const chat = ref(false);
const rumor = ref(false);

const form = ref({
    category: [] as string[]
});

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

// 定义 handleSelected 函数
const handleSelected = (value: string[]) => {
    console.log(value);
};

onMounted(() => {
    form.value.category = ['qq', 'newbie'];
});
</script>

<style lang="scss" scoped>
.channels {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    color: #fff;
    justify-content: space-between;

    > div {
        flex: 1;
        box-shadow: inset 0 -4px 8px -2px rgba(245, 245, 245, 0.6);
    }
    .config {
        flex: unset;
        padding: 5px 0;
    }

    .cyan-line {
        box-shadow: inset 0 -4px 8px -2px rgba(0, 255, 255, 0.6);
    }
    .purple-line {
        box-shadow: inset 0 -4px 8px -2px rgba(160, 32, 240, 0.6);
    }
    .dodger-blue-line {
        box-shadow: inset 0 -4px 8px -2px var(--el-color-primary);
    }
}
</style>
