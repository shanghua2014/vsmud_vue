export interface Message {
    type: string
    content: any // 根据实际内容调整类型
}

declare global {
    interface Window {
        customParent: {
            postMessage: (message: any) => void
        }
    }
}

export class Base {
    public postMessage(msg: Message) {
        location.protocol != 'http:' && window.customParent.postMessage({ type: msg.type, data: msg.content })
    }
}
