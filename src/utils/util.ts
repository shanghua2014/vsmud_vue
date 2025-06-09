import { useConfigStore } from '../stores/store'; // 请确保路径正确，如果错误请修正

export interface Message {
    type: string;
    content: any; // 根据实际内容调整类型
}

declare global {
    interface Window {
        electronAPI: {
            send: (channel: string, ...args: any[]) => void;
            on: (channel: string, listener: (...args: any[]) => void) => void;
        };
    }
}

// 公共类库
export class Base {
    // 登录界面数据交互
    public sendSiteList(msg: Message) {
        window.electronAPI.send('siteList', msg);
    }
    public connect(msg: Message) {
        window.electronAPI.send('telnet-connect', msg);
    }
    public sendMessage(cmd: string) {
        window.electronAPI.send('telnet-send', cmd);
    }
}

// xTerm 逻辑类库
export class xTermLoginc {
    private base: Base;
    private cmdHistory: string[] = [];
    private historyIndex: number = -1;
    private scrollTop: number = 0;
    private viewportElement: HTMLElement | null;

    constructor() {
        this.base = new Base();
        this.viewportElement = null;
        this.scrollTop = 0;
    }

    public termWrite(terminal: any, data: any) {
        const { content, type } = data;
        terminal.value.write(`${content}`);
        console.log('写入数据：', content);
        const configStore = useConfigStore();
        if (/((你|您)的英文名)|(人物请输入new。)/.test(content)) {
            const account = configStore.configInfo?.account.trim();
            if (account) {
                console.log('发送账号', account);
                this.base.sendMessage(account);
            }
        }
        if (/，请输入密码/.test(content)) {
            const password = configStore.configInfo?.password.trim();
            if (password) {
                console.log('发送密码', password);
                this.base.sendMessage(password);
            }
        }
        if (/即将开始检测你的客户端/.test(content)) {
            const password = configStore.configInfo?.password.trim();
            if (password) {
                this.base.sendMessage('y');
            }
        }
    }

    // 处理字符对齐
    private resetLetterSpacing() {
        const spans = document.querySelectorAll('.xterm-rows span');
        spans.forEach((span) => {
            const htmlSpan = span as HTMLElement;
            htmlSpan.style.letterSpacing = 'normal';
        });
    }

    // 监听滚动事件并触发 showDownward 事件
    public setupScrollListener(terminalContainer: any, showDownBtn: any, emits: any) {
        let scrollListener: () => void;
        if (terminalContainer.value) {
            this.viewportElement = terminalContainer.value.querySelector('.xterm-viewport');
            const viewEle = this.viewportElement;
            if (viewEle) {
                scrollListener = () => {
                    const scrollTop = viewEle.scrollTop;
                    // 记录滚动位置
                    this.scrollTop = scrollTop;
                    const scrollHeight = viewEle.scrollHeight;
                    const clientHeight = viewEle.clientHeight;
                    // 计算距离底部的距离
                    const distanceToBottom = scrollHeight - scrollTop - clientHeight;
                    showDownBtn.value = distanceToBottom > 10;
                    // 直接触发 emit 事件
                    emits('showDownward', showDownBtn.value);
                };
                viewEle.addEventListener('scroll', scrollListener);
                return () => {
                    if (viewEle && scrollListener) {
                        viewEle.removeEventListener('scroll', scrollListener);
                    }
                };
            }
        }
        return () => {};
    }

    // 监听 Alt+Z 组合键
    private setupAltZListener(terminal: any) {
        const keyDownListener = (event: KeyboardEvent) => {
            if (event.altKey && event.key.toLowerCase() === 'z') {
                if (terminal.value) {
                    console.log('触发了 Alt+Z 组合键');
                    terminal.value.scrollToBottom();
                }
            }
        };
        window.addEventListener('keydown', keyDownListener);
        return () => {
            window.removeEventListener('keydown', keyDownListener);
        };
    }

    // 复制文本
    private copyText(terminal: any, inputRef: any, ElMessage: any) {
        navigator.clipboard
            .writeText(terminal.value.getSelection())
            .then(() => {
                ElMessage({
                    message: '复制成功',
                    type: 'success',
                    plain: true
                });
                inputRef.value?.focus();
            })
            .catch((err) => {
                console.error('复制失败:', err);
            });
    }

    // 监听事件集合
    public eventListener(terminal: any, inputRef: any, fitAddon: any, ElMessage: any) {
        // 监听终端内容变化事件
        terminal.value.onData(() => {
            this.resetLetterSpacing();
        });

        // 监听 Alt+Z 组合键
        this.setupAltZListener(terminal);

        // 监听键盘事件
        let i = 0;
        if (navigator.userAgent.indexOf('Windows') != -1) {
            terminal.value.onKey((event: KeyboardEvent) => {
                let currentScrollTop = 0;
                // 记录当前滚动位置
                if (this.viewportElement) {
                    currentScrollTop = this.viewportElement.scrollTop;
                }
                switch (event.key) {
                    case '\u0003':
                        // 检测 Ctrl+C 组合键
                        if (terminal.value && i === 0) {
                            setTimeout(() => {
                                i = 0;
                            }, 1000);
                            i++;
                            this.copyText(terminal, inputRef, ElMessage);
                        }
                        break;
                }

                // 延迟 1 秒恢复滚动位置和滚动条
                setTimeout(() => {
                    if (this.viewportElement) {
                        this.viewportElement.scrollTop = currentScrollTop;
                    }
                }, 50);
            });
        } else {
            window.addEventListener('keydown', (event: KeyboardEvent) => {
                if (event.metaKey && event.key.toLowerCase() === 'c') {
                    // 检测 cmd+C 组合键
                    if (terminal.value && i === 0) {
                        setTimeout(() => {
                            i = 0;
                        }, 1000);
                        i++;
                        this.copyText(terminal, inputRef, ElMessage);
                    }
                }
            });
        }

        // 监听窗口大小变化，动态调整终端尺寸
        window.addEventListener('resize', () => {
            fitAddon.fit();
        });
    }

    // 添加命令到历史记录
    public addCommandToHistory(command: string) {
        this.cmdHistory.push(command);
        // 检查命令历史记录长度，若超过 100 条则移除最旧的命令
        if (this.cmdHistory.length > 100) {
            this.cmdHistory.shift();
        }
        this.historyIndex = this.cmdHistory.length;
    }

    // 回滚到上一条命令
    public getPreviousCommand() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            return this.cmdHistory[this.historyIndex];
        }
        return null;
    }

    // 翻到下一条命令
    public getNextCommand() {
        if (this.historyIndex < this.cmdHistory.length - 1) {
            this.historyIndex++;
            return this.cmdHistory[this.historyIndex];
        }
        // 若已到最新命令，返回空字符串
        this.historyIndex = this.cmdHistory.length;
        return '';
    }
}
