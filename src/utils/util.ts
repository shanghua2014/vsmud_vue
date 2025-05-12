import { useConfigStore } from '../stores/sotre' // 请确保路径正确，如果错误请修正

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
    private cmdHistory: string[] = []
    private historyIndex: number = -1

    constructor() {
        this.base = new Base()
    }

    public termWrite(terminal: any, msg: any) {
        terminal.value.write(`${msg}\r\n`)
        const configStore = useConfigStore()
        if (/((你|您)的英文名)|(人物请输入new。)/.test(msg)) {
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
        if (/即将开始检测你的客户端/.test(msg)) {
            const password = configStore.configInfo?.password.trim()
            if (password) {
                this.base.postMessage({
                    type: 'command',
                    content: 'y'
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

    // 监听滚动事件并触发 toggleMenuButton 事件
    public setupScrollListener(terminalContainer: any, showDownBtn: any, emits: any) {
        let scrollListener: () => void
        if (terminalContainer.value) {
            const viewportElement = terminalContainer.value.querySelector('.xterm-viewport') as HTMLElement | null
            if (viewportElement) {
                scrollListener = () => {
                    const scrollTop = viewportElement.scrollTop
                    const scrollHeight = viewportElement.scrollHeight
                    const clientHeight = viewportElement.clientHeight
                    // 计算距离底部的距离
                    const distanceToBottom = scrollHeight - scrollTop - clientHeight
                    showDownBtn.value = distanceToBottom > 10
                    // 直接触发 emit 事件
                    emits('toggleMenuButton', showDownBtn.value)
                }
                viewportElement.addEventListener('scroll', scrollListener)
                return () => {
                    if (viewportElement && scrollListener) {
                        viewportElement.removeEventListener('scroll', scrollListener)
                    }
                }
            }
        }
        return () => {}
    }

    // 监听 Alt+Z 组合键
    public setupAltZListener(terminal: any) {
        const keyDownListener = (event: KeyboardEvent) => {
            if (event.ctrlKey && event.key.toLowerCase() === 'z') {
                if (terminal.value) {
                    terminal.value.scrollToBottom()
                }
            }
        }
        window.addEventListener('keydown', keyDownListener)
        return () => {
            window.removeEventListener('keydown', keyDownListener)
        }
    }

    // 监听事件集合
    public eventListener(terminal: any, inputRef: any, fitAddon: any, ElMessage: any) {
        // 监听终端内容变化事件
        terminal.value.onData(() => {
            this.resetLetterSpacing()
        })
        let i = 0
        if (navigator.userAgent.indexOf('Windows') != -1) {
            terminal.value.onKey((event: KeyboardEvent) => {
                switch (event.key) {
                    case '\u0003':
                        // 检测 Ctrl+C 组合键
                        if (terminal.value && i === 0) {
                            navigator.clipboard
                                .writeText(terminal.value.getSelection())
                                .then(() => {
                                    ElMessage({
                                        message: '复制成功',
                                        type: 'success',
                                        plain: true
                                    })
                                    inputRef.value?.focus()
                                    setTimeout(() => {
                                        i = 0
                                    }, 1000)
                                })
                                .catch((err) => {
                                    console.error('复制失败:', err)
                                })
                            i++
                        }
                        break
                }
            })
        } else {
            window.addEventListener('keydown', (event: KeyboardEvent) => {
                if (event.metaKey && event.key.toLowerCase() === 'c') {
                    // 检测 cmd+C 组合键
                    if (terminal.value && i == 0) {
                        navigator.clipboard
                            .writeText(terminal.value.getSelection())
                            .then(() => {
                                ElMessage({
                                    message: '复制成功',
                                    type: 'success',
                                    plain: true
                                })
                                inputRef.value?.focus()
                                setTimeout(() => {
                                    i = 0
                                }, 1000)
                            })
                            .catch((err) => {
                                console.error('复制失败:', err)
                            })
                        i++
                    }
                }
            })
        }

        // 监听窗口大小变化，动态调整终端尺寸
        window.addEventListener('resize', () => {
            fitAddon.fit()
            if (terminal.value) {
                terminal.value.scrollToBottom() // 确保调整尺寸后光标在最底部
            }
        })
    }

    // 添加命令到历史记录
    public addCommandToHistory(command: string) {
        this.cmdHistory.push(command)
        // 检查命令历史记录长度，若超过 100 条则移除最旧的命令
        if (this.cmdHistory.length > 100) {
            this.cmdHistory.shift()
        }
        this.historyIndex = this.cmdHistory.length
    }

    // 回滚到上一条命令
    public getPreviousCommand() {
        if (this.historyIndex > 0) {
            this.historyIndex--
            return this.cmdHistory[this.historyIndex]
        }
        return null
    }

    // 翻到下一条命令
    public getNextCommand() {
        if (this.historyIndex < this.cmdHistory.length - 1) {
            this.historyIndex++
            return this.cmdHistory[this.historyIndex]
        }
        // 若已到最新命令，返回空字符串
        this.historyIndex = this.cmdHistory.length
        return ''
    }
}
