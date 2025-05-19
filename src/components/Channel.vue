<template>
    <div ref="channelsRef" class="channels" style="font-size: 14px">
        <!-- 根据 selectedCategories 动态渲染 div 并动态绑定 class -->
        <div v-for="(item, index) in divHeights" :key="index" :style="{ height: item + 'px' }" :class="[getDivClass(selectedCategories[index])]">
            <el-scrollbar>
                <el-watermark :font="font" :content="['vsmud', '北侠-shanghua']" :rotate="-30" :gap="[50, 60]">
                    <div style="" />
                    <p v-for="(num, i) in ps">{{ num }}</p>
                </el-watermark>
            </el-scrollbar>
        </div>
        <div class="config">
            <el-scrollbar class="scripts">
                <el-checkbox v-model="checked5" label="脚本 1" size="small" />
                <el-checkbox v-model="checked6" label="脚本 2" size="small" />
                <el-checkbox v-model="checked7" label="脚本 2" size="small" />
                <el-checkbox v-model="checked8" label="脚本 2" size="small" />
            </el-scrollbar>
            1111
        </div>
    </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, nextTick, reactive, watch, defineProps } from 'vue';
// 定义 props 接收选中的 checkbox 值
const props = defineProps<{
    selectedCategories: string[];
}>();

const ps = ref([1, 2, 3, 4, 5, 67, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30]);
const checked5 = ref(false);
const checked6 = ref(false);
const checked7 = ref(false);
const checked8 = ref(false);
const checked9 = ref(false);
const checked10 = ref(false);

// <!-- 水印 -->
const font = reactive({
    color: 'rgba(255,255,255, .15)'
});

// 定义 channels 元素的 ref
const channelsRef = ref<HTMLElement | null>(null);
// 存储每个 div 的高度
const divHeights = ref<number[]>([]);
// 存储初始 divHeights
const initialDivHeights = ref<number[]>([]);

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

// 简化方法名
const updateHeights = () => {
    nextTick(() => {
        if (channelsRef.value) {
            const channelsHeight = channelsRef.value.offsetHeight;
            const checkBoxGroup = channelsRef.value.querySelector('.config') as HTMLElement;
            const checkBoxGroupHeight = checkBoxGroup ? checkBoxGroup.offsetHeight : 0;
            const remainingHeight = channelsHeight - checkBoxGroupHeight;
            const singleDivHeight = props.selectedCategories.length > 0 ? remainingHeight / props.selectedCategories.length : 0;
            divHeights.value = Array(props.selectedCategories.length).fill(singleDivHeight);
        }
    });
};

// 监听 selectedCategories 的变化
watch(
    () => props.selectedCategories,
    (newValue, oldValue) => {
        if (oldValue && newValue.length > oldValue.length) {
            // 存储初始 divHeights
            initialDivHeights.value = [...divHeights.value];
        } else if (oldValue && newValue.length < oldValue.length) {
            // 当取消选择时，恢复到之前状态
            divHeights.value = [...initialDivHeights.value];
        }
        updateHeights();
    },
    { deep: true, immediate: true }
);

onMounted(() => {
    // 使用简化后的方法名
    updateHeights();
    // 初始化存储初始 divHeights
    initialDivHeights.value = [...divHeights.value];
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
        height: 130px;
        flex: none;
        padding: 0 0 0 10px;
        flex-direction: row;
        box-sizing: border-box;
        .scripts {
            height: 30px;
        }
        .el-checkbox.el-checkbox--small {
            margin-right: 10px;
            height:20px;
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
