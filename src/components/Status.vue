<template>
    <div class="status pa flex">
        <el-tooltip class="box-item" content="气血">
            <el-progress :text-inside="true" :percentage="70" status="exception" />
        </el-tooltip>
        <el-tooltip class="box-item" content="内力">
            <el-progress :text-inside="true" :percentage="50" />
        </el-tooltip>
        <el-tooltip class="box-item" content="精神">
            <el-progress :text-inside="true" :percentage="70" status="success" />
        </el-tooltip>
        <el-tooltip class="box-item" content="精力">
            <el-progress :text-inside="true" :percentage="70" :color="'#bd89e7'" />
        </el-tooltip>
        <el-tooltip class="box-item" content="食物">
            <el-progress :text-inside="true" :percentage="70" :color="'#d6aa80'" />
        </el-tooltip>
        <el-tooltip class="box-item" content="饮水">
            <el-progress :text-inside="true" :percentage="70" :color="'#95b5e0'" />
        </el-tooltip>
        <div class="flex buffs">
            <div>buff1</div>
            <div>buff2</div>
            <div class="debuff">buff3</div>
        </div>

        <div class="foe pa flex" v-if="fighting">
            <el-progress :text-inside="true" :percentage="70" status="exception" />
            <div>
                [<span><b>怪物名字</b></span
                >]
            </div>
            <div class="flex buffs">
                <div>力大无穷</div>
                <div>气把山河</div>
                <div class="debuff">buff3</div>
            </div>
        </div>
        <div class="fullme-cd pa">
            <div class="flex" style="display: none">
                <el-icon><Clock /></el-icon><span>&nbsp;{{ countdown }}&nbsp;S</span>
            </div>
            <div class="fm flex">
                <el-icon><Pointer /></el-icon><span>Fullme</span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { Clock, Pointer } from '@element-plus/icons-vue';

// 初始化倒计时时间，单位：秒
const countdown = ref(123);
let timer: any;
const fighting = ref(false);

// 开始倒计时
const startCountdown = () => {
    timer = setInterval(() => {
        if (countdown.value > 0) {
            countdown.value--;
        } else {
            clearInterval(timer!);
        }
    }, 1000);
};

onMounted(() => {
    startCountdown();
});

onUnmounted(() => {
    if (timer) {
        clearInterval(timer);
    }
});
</script>

<style lang="scss" scoped>
.fullme-cd {
    bottom: -32px;
    right: -62px;
    padding: 5px 5px;
    background-color: #fff;
    color: #000;
    z-index: 3;
    border-radius: 0 var(--el-input-border-radius, var(--el-border-radius-base)) var(--el-input-border-radius, var(--el-border-radius-base)) 0;
    > div {
        align-items: center;
    }
    .fm {
        cursor: pointer;
    }
}
.status {
    width: calc(100% - 64px);
    background: #000;
    bottom: 34px;
    left: 0;
    color: #fff;
    font-size: 14px;
    .el-progress {
        min-width: 80px;
        margin-right: 8px;
    }
    .foe {
        left: 0;
        top: -16px;
        background: #000;
        align-items: center;
        > div:not(:first-child) {
            font-size: 12px;
            margin-right: 4px;
            span {
                color: red;
            }
        }
    }
    .buffs {
        font-size: 12px;
        > div {
            padding: 0 4px;
            background: green;
            margin-right: 4px;
            border-radius: 2px;
        }
        .debuff {
            background: red;
        }
    }
}
.demo-progress .el-progress--line {
    width: 100%;
    margin-bottom: 15px;
}
</style>
<style lang="css">
.el-progress-bar__inner,
.el-progress-bar__outer {
    height: 12px !important;
    border-radius: 0 !important;
    overflow: hidden;
}
</style>
