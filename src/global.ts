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

// 公共类库
export class Base {
    public postMessage(msg: Message) {
        location.protocol != 'http:' && window.customParent.postMessage({ type: msg.type, content: msg.content })
    }
}

// xTerm 逻辑类库
export class Loginc {
    private base: Base

    constructor() {
        this.base = new Base()
    }

    public termWrite(terminal: any, message: any) {
        // console.log('vue,我收到了消息', message)
        terminal.value.write(`${message.datas}\r\n`)
        if (/你|您的英文名/.test(message.datas)) {
            // 调用 postMessage 方法
            // this.base.postMessage({
            //     type: 'command',
            //     content: { name: message.datas.account }
            // })
        }
    }
}
