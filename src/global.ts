import { useConfigStore } from './stores/sotre'

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
export class xTermLoginc {
    private base: Base

    constructor() {
        this.base = new Base()
    }

    public termWrite(terminal: any, msg: any) {
        terminal.value.write(`${msg}\r\n`)
        const configStore = useConfigStore()
        if (/(你|您)的英文名/.test(msg)) {
            const account = configStore.configInfo?.account.trim()
            if (account) {
                setTimeout(() => {
                    console.log('发送账号')
                    this.base.postMessage({
                        type: 'command',
                        content: account
                    })
                }, 1000)
            }
        }
        if (/，请输入密码/.test(msg)) {
            const password = configStore.configInfo?.password.trim()
            if (password) {
                this.base.postMessage({
                    type: 'command',
                    content: password
                })
            }
        }
    }

    // 处理字符对齐
    private resetLetterSpacing() {
        const spans = document.querySelectorAll('.xterm-rows span')
        spans.forEach((span) => {
            const htmlSpan = span as HTMLElement
            htmlSpan.style.letterSpacing = 'normal'
        })
    }

    // 监听事件集合
    public eventListener(terminal: any, inputRef: any, fitAddon: any, logic: any) {
        // 监听终端内容变化事件
        terminal.value.onData(() => {
            this.resetLetterSpacing()
        })

        // 滚动到底部，自动聚焦到 el-input
        const xtermView = document.getElementsByClassName('xterm-viewport')[0] as HTMLElement
        xtermView.addEventListener('scroll', () => {
            // 表示滚动条的当前位置加上视口高度，代表滚动条的底部位置。
            let h1 = xtermView.scrollTop + xtermView.clientHeight
            let h2 = xtermView.scrollHeight
            if (h1 >= h2) {
                inputRef.value?.focus()
            } else {
                if (h1 - h2 < 10) {
                    // console.log('显示置底按钮')
                }
            }
        })

        terminal.value.onKey((event: any) => {
            if (event.key === '\u0003') {
                // 检测 Ctrl+C 组合键
                if (terminal.value) {
                    navigator.clipboard
                        .writeText(terminal.value.getSelection())
                        .then(() => {
                            console.log('复制成功:')
                        })
                        .catch((err) => {
                            console.error('复制失败:', err)
                        })
                }
            }
        })

        // 监听窗口大小变化，动态调整终端尺寸
        window.addEventListener('resize', () => {
            fitAddon.fit()
            if (terminal.value) {
                terminal.value.scrollToBottom() // 确保调整尺寸后光标在最底部
            }
        })
    }
}
