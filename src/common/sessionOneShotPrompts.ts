import { reactive } from 'vue';

/**
 * 本会话内「菜单区一次性提示」：用户处理过后或交叉规则压掉后，直到 {@link resetSession} 前不再显示。
 * 典型场景：Email、性格、老对长、washto、要了解的信息、老玩家出村等；与 mudSessionStart（重连）配对重置。
 */
export const SessionOneShotKey = {
    Email: 'email',
    ChooseCharacter: 'chooseCharacter',
    AskLaoHere: 'askLaoHere',
    WashTo: 'washTo',
    InfoTopics: 'infoTopics',
    LeaveVillage: 'leaveVillage',
    KuaiyiPvpPve: 'kuaiyiPvpPve',
    CloseEye: 'closeEye',
    AskLaoHuabo: 'askLaoHuabo',
    CharacterExistsPassword: 'characterExistsPassword'
} as const;

export type SessionOneShotKey = (typeof SessionOneShotKey)[keyof typeof SessionOneShotKey];

export type SessionOneShotPromptsApi = {
    /** 是否已被本会话压掉（不再展示） */
    isSuppressed: (key: SessionOneShotKey) => boolean;
    /** 用户已处理或业务要求本会话内不再出现该提示 */
    suppress: (key: SessionOneShotKey) => void;
    /** 新 MUD 会话（如连接成功）：清空所有压掉状态 */
    resetSession: () => void;
    /** 服务端希望显示 && 尚未被压掉 */
    shouldShow: (key: SessionOneShotKey, serverWantsVisible: boolean) => boolean;
};

export function createSessionOneShotPrompts(): SessionOneShotPromptsApi {
    const suppressed = reactive<Record<string, boolean>>({});

    const isSuppressed = (key: SessionOneShotKey) => !!suppressed[key];

    const suppress = (key: SessionOneShotKey) => {
        suppressed[key] = true;
    };

    const resetSession = () => {
        for (const k of Object.keys(suppressed)) {
            delete suppressed[k];
        }
    };

    const shouldShow = (key: SessionOneShotKey, serverWantsVisible: boolean) =>
        serverWantsVisible && !isSuppressed(key);

    return { isSuppressed, suppress, resetSession, shouldShow };
}
