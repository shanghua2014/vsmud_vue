<template>
    <div ref="channelsRef" class="channels" style="font-size: 14px">
        <!-- 根据 divCount 动态渲染 div 并动态绑定 class -->
        <div v-for="(item, index) in divHeights" :key="index" :style="{ height: item + 'px' }" :class="[getDivClass(form.category[index])]">
            <el-scrollbar>
                <el-watermark :font="font" :content="['vsmud', '北侠-shanghua']" :rotate="-30" :gap="[50, 60]">
                    <div style="" />
                    <p v-for="num in ps">{{ num }}</p>
                </el-watermark>
            </el-scrollbar>
        </div>
        <!-- 使用 @change 事件绑定 handleSelected 函数 -->
        <el-checkbox-group v-model="form.category" size="small" class="config flex" @change="handleSelected">
            <el-checkbox v-for="item in listCategory" border :value="item.value" :label="item.label">{{ item.label }}</el-checkbox>
        </el-checkbox-group>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, nextTick, reactive, watch } from 'vue';
import { ElInput, ElMessage, ElButton } from 'element-plus';
import TerminalAside from './Terminal-aside.vue';

// <!-- 水印 -->
const font = reactive({
    color: 'rgba(255,255,255, .15)'
});

// 定义 channels 元素的 ref
const channelsRef = ref<HTMLElement | null>(null);
// 存储每个 div 的高度
const divHeights = ref<number[]>([]);

const qq = ref(false);
const newbie = ref(false);
const chat = ref(false);
const rumor = ref(false);

const form = ref({
    // 初始化时添加 'chat' 让闲聊选项默认选中
    category: ['chat'] as string[]
});
const ps = ref([1, 2, 3, 4, 5, 67, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);

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

// 定义 div 的数量，使用 const 声明
const divCount = ref(0);

// 定义根据选中项返回对应 class 的函数
const getDivClass = (selectedValue: string) => {
    if (selectedValue === 'chat') {
        return 'cyan-line';
    } else if (selectedValue === 'rumor') {
        return 'purple-line';
    } else if (selectedValue === 'family') {
        return 'family-line';
    } else if (selectedValue === 'qq') {
        return 'qq-line';
    } else if (selectedValue === 'help') {
        return 'help-line';
    } else if (selectedValue === 'task') {
        return 'task-line';
    } else {
        return '';
    }
};

// 定义 handleSelected 函数
const handleSelected = (value: string[]) => {
    divCount.value = value.length;
    console.log('Selected values:', value);
    updateDivHeights();
};

// 更新 div 高度的函数
const updateDivHeights = () => {
    nextTick(() => {
        if (channelsRef.value) {
            const channelsHeight = channelsRef.value.offsetHeight;
            const checkBoxGroup = channelsRef.value.querySelector('.config') as HTMLElement;
            const checkBoxGroupHeight = checkBoxGroup ? checkBoxGroup.offsetHeight : 0;
            const remainingHeight = channelsHeight - checkBoxGroupHeight;
            const singleDivHeight = divCount.value > 0 ? remainingHeight / divCount.value : 0;
            divHeights.value = Array(divCount.value).fill(singleDivHeight);
        }
    });
};

onMounted(() => {
    // 初始化时设置 divCount 为默认选中项数量
    divCount.value = form.value.category.length;
    updateDivHeights();
});
</script>

<style lang="scss" scoped>
// 提取 rgba 颜色值为变量
$default-shadow-color: rgba(245, 245, 245, 0.6);
$cyan-shadow-color: rgba(0, 255, 255, 0.6);
$purple-shadow-color: rgba(160, 32, 240, 0.6);
$family-shadow-color: var(--el-color-primary-dark-2);
$qq-shadow-color: var(--el-color-info-dark-2);
$help-shadow-color: var(--el-color-success);

.channels {
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    color: #fff;
    justify-content: space-between;
    align-items: flex-start;

    > div {
        // 使用提取的变量
        box-shadow: inset 0 -4px 8px -2px $default-shadow-color;
        width: 100%;
        p {
            margin: 0;
            width: 100%;
            word-break: break-all;
            word-wrap: break-word;
            padding: 3px 0 3px 5px;
        }
        overflow: auto;
    }
    .config {
        flex: none;
        padding: 10px 0 0 10px;
        flex-direction: row;
        box-sizing: border-box;
        label {
            margin-bottom: 10px;
        }
    }

    .cyan-line {
        box-shadow: inset 0 -4px 8px -2px $cyan-shadow-color;
        p {
            color: $cyan-shadow-color;
        }
    }
    .purple-line {
        box-shadow: inset 0 -4px 8px -2px $purple-shadow-color;
        p {
            color: $purple-shadow-color;
        }
    }
    .family-line {
        box-shadow: inset 0 -4px 8px -2px $family-shadow-color; // 示例样式，可按需修改
        p {
            color: $family-shadow-color;
        }
    }
    .qq-line {
        box-shadow: inset 0 -4px 8px -2px $qq-shadow-color; // 示例样式，可按需修改
        p {
            color: $qq-shadow-color;
        }
    }
    .help-line {
        box-shadow: inset 0 -4px 8px -2px $help-shadow-color; // 示例样式，可按需修改
        p {
            color: $help-shadow-color;
        }
    }
    .task-line {
        box-shadow: inset 0 -4px 8px -2px yellow; // 示例样式，可按需修改
        p {
            color: yellow;
        }
    }
}
</style>
