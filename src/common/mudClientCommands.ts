/**
 * 菜单发往 MUD 的固定命令与信息主题索引（下行匹配在 nt7_node，不在浏览器打包）。
 */

export const ALH_CMD = 'ask lao about here';
export const WASH_CMD = 'washto 20 20 20 20';
export const INF_N = 12;
/** 拜师：`Terminal.sendBaiShiChoice` 按 `;` 切分后逐条发送 */
export const BAISHI_CMD = 'ask lao about 107;ask lao about ok';
/** 拜武伯：同上 */
export const BAIWUBO_CMD = 'walk 练武场;bai wu bo';
export const LV_CONFIRM_CMD = 'ask hua about 出村';
export const KY_PVP_CMD = 'choose 1';
export const KY_PVE_CMD = 'choose 2';
export const CE_CMD = 'closeeye';
export const HB_CMD = 'walk 村口';

export function infTopicCmd(index: number): string {
    const n = Math.trunc(index);
    return `ask lao about ${n}`;
}
