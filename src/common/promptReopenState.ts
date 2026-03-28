import { ref, type Ref } from 'vue';

export interface HiddenUntilRematchState {
    hiddenAfterClick: Ref<boolean>;
    seenLowSinceClick: Ref<boolean>;
    prevSignal: Ref<boolean>;
}

/**
 * 通用按钮状态机：
 * - 点击后先隐藏
 * - 观察到一次 false 后
 * - 下一次 false->true 视为“再次匹配成功”，恢复显示
 */
export function createHiddenUntilRematchState(): HiddenUntilRematchState {
    return {
        hiddenAfterClick: ref(false),
        seenLowSinceClick: ref(false),
        prevSignal: ref(false)
    };
}

export function onHiddenUntilRematchSignal(
    state: HiddenUntilRematchState,
    signal: boolean
): void {
    const prev = state.prevSignal.value;
    if (!state.hiddenAfterClick.value) {
        state.prevSignal.value = signal;
        return;
    }

    if (!signal) {
        state.seenLowSinceClick.value = true;
    }

    if (state.seenLowSinceClick.value && signal && !prev) {
        state.hiddenAfterClick.value = false;
        state.seenLowSinceClick.value = false;
    }

    state.prevSignal.value = signal;
}

export function markHiddenUntilRematchClicked(
    state: HiddenUntilRematchState,
    currentSignal: boolean
): void {
    state.hiddenAfterClick.value = true;
    state.seenLowSinceClick.value = !currentSignal;
}

export function resetHiddenUntilRematchState(
    state: HiddenUntilRematchState
): void {
    state.hiddenAfterClick.value = false;
    state.seenLowSinceClick.value = false;
    state.prevSignal.value = false;
}
