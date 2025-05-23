const { contextBridge, ipcRenderer } = require('electron');

// 暴露需要的 IPC 方法到渲染进程的 window 对象
contextBridge.exposeInMainWorld('electronAPI', {
    send: (channel, data) => ipcRenderer.send(channel, data), // 发送消息
    on: (channel, callback) => ipcRenderer.on(channel, (event, ...args) => callback(...args)) // 监听消息
});

// 原 DOMContentLoaded 事件监听保持不变
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    };

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
});
