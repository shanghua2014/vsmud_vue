import { ipcMain, dialog } from 'electron/main';
// import { createRequire } from 'module';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { Utils } from '../utils/utils.js';
// const require = createRequire(import.meta.url);

const scriptFilePathMods = new Set();
const triggerMods = new Map();

/**
 * 递归读取目录下所有文件内容
 * @param {string} dirPath - 目录路径
 * @returns {Promise<Object>} - 包含文件名和对应内容的对象
 */
async function readAllFilesInDir(dirPath) {
    const files = await fs.readdir(dirPath);
    const result = {};

    for (const file of files) {
        const fullPath = path.join(dirPath, file);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
            // 递归处理子目录
            const subDirContent = await readAllFilesInDir(fullPath);
            Object.assign(result, subDirContent);
        } else {
            try {
                const content = await fs.readFile(fullPath, 'utf-8');
                // 去掉文件内容中的 \r 和 \n
                const cleanedContent = content.replace(/[\r\n]/g, '');
                result[file.split('.')[0]] = cleanedContent;
            } catch (err) {
                console.error(`读取文件 ${fullPath} 出错:`, err);
            }
        }
    }

    return result;
}

export const files = {
    getFile: async (mainWindow) => {
        ipcMain.on('siteList', async (event, cmd) => {
            const configDir = path.join(process.cwd(), 'config');
            const { content } = cmd;
            if (cmd.type === 'del') {
                // 删除configDir目录下以account为文件名的文件;
                try {
                    const filePath = path.join(configDir, `${content.account}.json`);
                    await fs.unlink(filePath);
                } catch (err) {
                    console.error('删除文件时出错:', err);
                }
                return;
            }
            if (cmd.type === 'save') {
                try {
                    // 确保 config 目录存在
                    await fs.mkdir(configDir, { recursive: true });
                    const filePath = path.join(configDir, `${content.account}.json`);
                    // 将 cmd.content 转换为 JSON 字符串并写入文件
                    await fs.writeFile(filePath, JSON.stringify(content, null, 2));
                    console.log(`文件 ${filePath} 保存成功`);
                } catch (err) {
                    console.error('保存文件时出错:', err);
                }
                return;
            }
            try {
                // 假设项目根目录下的 /config 目录
                const fileContent = await readAllFilesInDir(configDir);
                mainWindow.webContents.send('site-data', { type: 'client', content: fileContent });
            } catch (err) {
                console.error('读取 /config 目录时出错:', err);
                return {};
            }
        });
    },
    getFullme: async (filename) => {
        const fullmeDir = path.join(process.cwd(), 'fullme');
        // 使用异步方法确保 fullmeDir 存在
        await fs.mkdir(fullmeDir, { recursive: true });
        const timestamp = Date.now().toString();
        // const subdir = path.join(fullmeDir, timestamp);
        // 使用异步方法确保 subdir 存在
        // await fs.mkdir(subdir, { recursive: true });
        let fullme = {
            name: timestamp,
            data: []
        };
        for (let i = 1; i <= 4; i++) {
            try {
                console.log(filename);
                const url = `http://fullme.pkuxkx.net/robot.php?filename=${filename}`;
                const response = await axios.get(url, { responseType: 'text' });
                const html = response.data;
                console.log('html: ', html);

                // 使用正则表达式匹配 img 标签的 src 属性
                const imgSrcMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
                if (!imgSrcMatch) {
                    throw new Error('未在 HTML 中找到 img 标签');
                }
                const imgSrc = imgSrcMatch[1];
                console.log('imgUrl: ', imgUrl);
                const imgUrl = new URL(imgSrc, url).href;
                console.log('imgUrl: ', imgUrl);
                const imgResponse = await axios.get(imgUrl, { responseType: 'arraybuffer' });
                const buffer = Buffer.from(imgResponse.data, 'binary');
                fullme.data[i - 1] = buffer.toString('base64');
                const imageFilename = `${i}.jpg`;
                const filepath = path.join(fullmeDir, imageFilename);
                await fs.writeFile(filepath, buffer);
            } catch (error) {
                console.error(`Error downloading image ${i}:`, error.message);
            }
            return fullme;
        }
    }
};

export const scriptManage = {
    getTriggers: async (mainWindow) => {
        return triggerMods;
    },
    /**
     * 互操作
     * @param {*} mainWindow 主窗口
     */
    mutual: (mainWindow, telnetClient, command) => {
        // 触发脚本
        // if (command.type === 'script') {
        //     const Triggers = command.content;
        //     const triggers = JSON.parse(Triggers, Utils.deserialize);
        //     triggers.forEach((element) => {
        //         if (typeof element.cmd == 'function') {
        //             element.cmd();
        //         }
        //         element.reg
        //     });
        //     return;
        // }

        // mud命令
        if (!/^#/.test(command)) {
            telnetClient.write(command + '\r\n');
            return;
        }

        const keywords = ['#load', '#reload', '#unload', '#show', '#set'];
        const keywordHandlers = {
            '#show': async (command) => {
                let muddata = command;
                if (/^http:\/\/fullme\.pkuxkx\.net\/robot\.php\?filename=\d+/.test(muddata)) {
                    // http://fullme.pkuxkx.net/robot.php?filename=1749520803470507
                    muddata = await files.getFullme(muddata.split('=')[1]);
                    console.log('触发 fullme 2', muddata);
                }
                mainWindow.webContents.send('telnet-data', { type: 'test', content: command });
                return;
            },
            '#load': async () => {
                try {
                    const result = await dialog.showOpenDialog({
                        properties: ['openFile'],
                        filters: [{ name: 'JavaScript Files', extensions: ['js'] }]
                    });

                    if (!result.canceled && result.filePaths.length > 0) {
                        console.log('选择的文件路径:', result.filePaths);
                        const selectedFilePath = result.filePaths[0];
                        // 使用动态 import 加载 ES 模块
                        const scripts = await import(`file://${selectedFilePath}`);

                        // 记录文件路径
                        mainWindow.webContents.send('telnet-data', { type: 'mud', content: selectedFilePath + '\r\n' });
                        scriptFilePathMods.add(selectedFilePath);

                        // 获取文件名，用于后续判断是否需要重载
                        let fileName = Utils.getLastStr(selectedFilePath, '\\');
                        fileName = Utils.getFirstStr(fileName, '.');

                        // 添加新的 triggerMods
                        triggerMods.set(fileName, scripts.Triggers);
                        const serializeDatas = JSON.stringify(triggerMods, Utils.serialize);
                        mainWindow.webContents.send('telnet-data', { type: 'client', content: serializeDatas });
                        console.log(`已成功执行文件: ${selectedFilePath}`);
                    }
                } catch (err) {
                    console.error('加载文件时出错:', err);
                }
            },
            '#reload': async () => {
                try {
                    console.log(scriptFilePathMods);
                    if (scriptFilePathMods.size === 0) {
                        console.error('没有可重载的文件路径');
                        return;
                    }

                    // 清空Map中的所有模块
                    triggerMods.clear();
                    scriptFilePathMods.forEach(async (file) => {
                        // 获取文件名，用于后续判断是否需要重载
                        let fileName = Utils.getLastStr(file, '\\');
                        fileName = Utils.getFirstStr(fileName, '.');

                        // 生成时间戳参数
                        const timestamp = Date.now();
                        // 重新加载文件，添加时间戳参数
                        const scripts = await import(`file://${file}?t=${timestamp}`);

                        // 添加新的 triggerMods
                        triggerMods.set(fileName, scripts.Triggers);

                        mainWindow.webContents.send('telnet-data', { type: 'mud', content: `已重新加载文件: ${file}\r\n` });
                        const serializeDatas = JSON.stringify(scripts.Triggers, Utils.serialize);
                        mainWindow.webContents.send('telnet-data', { type: 'client', content: serializeDatas });
                        console.log(`已成功重载文件: ${file}`);
                    });
                } catch (err) {
                    console.error('重载文件时出错:', err);
                }
            },
            '#unload': async () => {
                try {
                    if (scriptFilePathMods.size === 0) {
                        console.error('没有可卸载的文件路径');
                        return;
                    }
                    // 清空 triggerMods 中的所有模块
                    triggerMods.clear();
                    // 清空记录文件路径的 scriptFilePathMods
                    scriptFilePathMods.clear();
                    mainWindow.webContents.send('telnet-data', { type: 'mud', content: '已卸载所有加载的模块\r\n' });
                    console.log('已成功卸载所有加载的模块');
                } catch (err) {
                    console.error('卸载文件时出错:', err);
                }
            }
        };
        for (const keyword of keywords) {
            // 使用 RegExp 构造函数创建动态正则表达式
            const showRegex = new RegExp(`^${keyword}\\s?(.*)*`);
            const match = showRegex.exec(command);
            if (match) {
                // isMatched = true;
                // 测试触发，不发送服务器请求
                const cmd = match[1];
                if (keywordHandlers[keyword]) {
                    // 唤起前端界面，用match['input']
                    // 后端命令用cmd
                    keywordHandlers[keyword](cmd == undefined ? match['input'] : cmd);
                }
            }
        }
    }
};
