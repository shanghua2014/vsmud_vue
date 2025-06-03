// 顶部添加以下代码模拟 __dirname（仅在 ES 模块中需要）
import { fileURLToPath } from 'url';
import { app, BrowserWindow, Menu, screen, ipcMain } from 'electron/main';
import * as path from 'path';
import { createConnection } from 'net';
import { scriptManage } from './electron/scriptManage.js';

const isPackaged = app.isPackaged;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 禁止显示默认菜单
Menu.setApplicationMenu(null);

// 主窗口
let mainWindow;
let telnetClient; // 用于存储 Telnet 客户端实例

const createWindow = () => {
    mainWindow = new BrowserWindow({
        // 默认窗口标题，如果由loadURL()加载的HTML文件中含有标签<title>，此属性将被忽略。
        title: 'Electron + Vue3',
        minWidth: 1224,
        minHeight: screen.getPrimaryDisplay().workAreaSize.height,
        maxWidth: screen.getPrimaryDisplay().workAreaSize.width,
        // 修正拼写错误 maxheight 为 maxHeight
        maxHeight: screen.getPrimaryDisplay().workAreaSize.height,
        // 在根目录中新建 build 文件夹存放图标等文件
        icon: path.resolve(__dirname, './build/icon.ico'),
        //   将此脚本(preload)附加到渲染器流程
        webPreferences: {
            preload: path.join(__dirname, './electron/electron-preload.js'),
            nodeIntegration: false, //开启true这一步很重要,目的是为了vue文件中可以引入node和electron相关的API
            contextIsolation: true, // 可以使用require方法
            enableRemoteModule: true // 可以使用remote方法
        }
    });

    // 开发环境下，打开开发者工具。
    if (!isPackaged) {
        mainWindow.webContents.openDevTools();
        mainWindow.loadURL('http://localhost:9000/'); //这样的话需要先用mpm run dev 跑起你自己的项目在跑electron才能出现页面
        //mainWindow.loadFile('./dist/index.html'); //这个是从dist下的index进行加载
    } else {
        mainWindow.webContents.openDevTools();
        mainWindow.loadFile(path.resolve(__dirname, './dist/index.html'));
    }
};

// 在应用准备就绪时调用函数
app.whenReady().then(() => {
    createWindow();

    // 加载脚本管理模块
    scriptManage.mutual(mainWindow);

    // IPC 通信：监听渲染进程的 Telnet 连接请求
    ipcMain.on('telnet-connect', async (event, config) => {
        telnetClient = createConnection(
            {
                host: config.host,
                port: config.port || 23
            },
            () => {
                // 通知渲染进程连接成功
                event.sender.send('telnet-connected');
            }
        );

        // 监听 Telnet 服务器返回的数据，并转发给渲染进程
        telnetClient.on('data', (data) => {
            console.log(data.toString());
            if (mainWindow) {
                mainWindow.webContents.send('telnet-data', { type: 'mud', content: data.toString() });
            }
        });

        telnetClient.on('error', (error) => {
            console.error('Telnet 连接错误:', error);
            // 通知渲染进程连接出错
            event.sender.send('telnet-error', error.message);
        });

        telnetClient.on('end', () => {
            // 处理连接结束逻辑，通知渲染进程连接断开
            event.sender.send('telnet-disconnected');
        });
    });

    // IPC 通信：监听渲染进程的 Telnet 命令发送请求
    ipcMain.on('telnet-send', (event, command) => {
        if (telnetClient) {
            telnetClient.write(command + '\r\n', (err) => {
                if (err) event.sender.send('telnet-error', err.message);
            });
        }
    });

    // IPC 通信：监听渲染进程的 Telnet 断开请求
    ipcMain.on('telnet-disconnect', () => {
        if (telnetClient) {
            telnetClient.end();
            telnetClient = null;
        }
    });

    app.on('activate', () => {
        // 通常在 macOS 上，当点击 dock 中的应用程序图标时，如果没有其他
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// 除了 macOS 外，当所有窗口都被关闭的时候退出程序。 因此，通常对程序和它们在任务栏上的图标来说，应当保持活跃状态，直到用户使用 Cmd + Q 退出。
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// 如果开发环境使用了 nginx 代理，禁止证书报错
if (!isPackaged) {
    // 证书的链接验证失败时，触发该事件
    app.on('certificate-error', function (event, webContents, url, error, certificate, callback) {
        event.preventDefault();
        callback(true);
    });
}
