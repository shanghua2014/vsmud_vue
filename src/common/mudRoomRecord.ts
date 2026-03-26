import { computed, ref } from 'vue';

import { matchInfoTopicsDownlink, matchVeteranPlayerLeaveVillageDownlink } from './mudDownlinkPrompts';

/**
 * 房间记录：命中「[1;31m要了解的信息」时记为老村长房间，用于显示「信息」等菜单。
 * 「如果你是位老玩家」与教程同源，也记入同区，避免只刷出村句时尚无房间状态。
 */

export type MudRoomTag = 'unknown' | 'laocunzhang';

export const mudRoomTag = ref<MudRoomTag>('unknown');

/** 命中则认为已离开老村长相关区域（可按服端增补） */
const LEFT_LAOCUNZHANG_REGEX = /(?:离开|走出|离开了).{0,24}老村长|你已不在.{0,16}老村长/;

export const isInLaocunzhangRoom = computed(() => mudRoomTag.value === 'laocunzhang');

export function resetMudRoomRecord() {
    mudRoomTag.value = 'unknown';
}

/**
 * 每收到一段原始下行调用一次（单包即可）。
 * 与 {@link matchInfoTopicsDownlink} 使用同一套「要了解的信息」匹配，命中即写入当前房间。
 */
export function applyMudDownlinkForRoomRecord(raw: string) {
    if (!raw) return;
    if (LEFT_LAOCUNZHANG_REGEX.test(raw)) {
        mudRoomTag.value = 'unknown';
        return;
    }
    if (matchInfoTopicsDownlink(raw)) {
        mudRoomTag.value = 'laocunzhang';
    }
    if (matchVeteranPlayerLeaveVillageDownlink(raw)) {
        mudRoomTag.value = 'laocunzhang';
    }
}
