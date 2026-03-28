import { ref, type Ref } from 'vue';

/**
 * 本会话内「菜单区一次性提示」：用户处理过后或交叉规则压掉后，直到 resetSession 前不再显示。
 */
export const S1 = {
    Em: 'em',
    ChSel: 'chSel',
    Alh: 'alh',
    Wash: 'wash',
    InfT: 'infT',
    Ky: 'ky',
    CEye: 'cEye',
    LHb: 'lHb',
    CxPwd: 'cxPwd',
    XsNm: 'xsNm',
    MzNm: 'mzNm',
    QmNm: 'qmNm',
    Ps: 'ps',
    Pn: 'pn'
} as const;

export type S1Key = (typeof S1)[keyof typeof S1];

export type S1Api = {
    isSuppressed: (key: S1Key) => boolean;
    suppress: (key: S1Key) => void;
    resetSession: () => void;
    shouldShow: (key: S1Key, serverWantsVisible: boolean) => boolean;
};

export function createS1(): S1Api {
    const suppressed: Ref<Record<string, boolean>> = ref({});

    const isSuppressed = (key: S1Key) => !!suppressed.value[key];

    const suppress = (key: S1Key) => {
        suppressed.value = { ...suppressed.value, [key]: true };
    };

    const resetSession = () => {
        suppressed.value = {};
    };

    const shouldShow = (key: S1Key, serverWantsVisible: boolean) =>
        serverWantsVisible && !isSuppressed(key);

    return { isSuppressed, suppress, resetSession, shouldShow };
}
