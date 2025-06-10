import { ipcMain, dialog } from 'electron/main';
import { createRequire } from 'module';
import fs from 'fs/promises';
import path from 'path';
import axios from 'axios';
import { Utils } from '../utils/utils.js';
const require = createRequire(import.meta.url);

const loadedMods = new Set();

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
    /**
     * 互操作
     * @param {*} mainWindow 主窗口
     */
    mutual: (mainWindow, telnetClient, command) => {
        if (command.type === 'script') {
            const Triggers = command.content;
            console.log('Triggers:');
            console.log(JSON.parse(Triggers, Utils.deserialize));
            // const Triggers = JSON.parse(command.content).Triggers;
            // Triggers.forEach((element) => {
            //     console.log(element.cmd);
            //     console.log(element.reg);
            // });
            return;
        }
        // mud命令
        if (!/^#/.test(command)) {
            telnetClient.write(command + '\r\n');
            return;
        }

        const keywords = ['#load', '#re', '#show', '#set'];
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
                        const selectedFilePath = result.filePaths[0];
                        const scripts = require(selectedFilePath);
                        mainWindow.webContents.send('telnet-data', { type: 'mud', content: selectedFilePath + '\r\n' });
                        console.log('scripts.Triggers: ', scripts.Triggers);
                        mainWindow.webContents.send('telnet-data', { type: 'client', content: JSON.stringify(scripts.Triggers, Utils.serialize) });
                        loadedMods.add(selectedFilePath);
                        console.log(`已成功执行文件: ${selectedFilePath}`);
                    }
                } catch (err) {
                    console.error('加载文件时出错:', err);
                }
            },
            '#re': () => {
                try {
                    // 修改变量名
                    for (const filePath of loadedMods) {
                        // 清除模块缓存
                        if (require.cache[require.resolve(filePath)]) {
                            delete require.cache[require.resolve(filePath)];
                        }
                        // 重新加载模块
                        require(filePath);
                        console.log(`已成功重载文件: ${filePath}`);
                    }
                } catch (err) {
                    console.error('重载文件时出错:', err);
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
