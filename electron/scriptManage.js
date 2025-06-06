import { ipcMain, dialog } from 'electron/main';
import { createRequire } from 'module';
import fs from 'fs/promises';
import path from 'path';

const require = createRequire(import.meta.url);
// 替换为更短的变量名
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
    }
};

export const scriptManage = {
    /**
     * 互操作
     * @param {*} mainWindow 主窗口
     */
    mutual: (mainWindow) => {
        // 系统命令事件
        ipcMain.on('sysCmdEvent', async (event, cmd) => {
            // 加载文件
            if (cmd === '#load') {
                try {
                    const result = await dialog.showOpenDialog({
                        properties: ['openFile'],
                        filters: [{ name: 'JavaScript Files', extensions: ['js'] }]
                    });

                    if (!result.canceled && result.filePaths.length > 0) {
                        const selectedFilePath = result.filePaths[0];
                        mainWindow.webContents.send('telnet-data', { type: 'client', content: selectedFilePath });
                        require(selectedFilePath);
                        loadedMods.add(selectedFilePath);
                        console.log(`已成功执行文件: ${selectedFilePath}`);
                    }
                } catch (err) {
                    console.error('加载文件时出错:', err);
                }
            }
            // 重载文件
            if (cmd === '#re') {
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
        });
        // 游戏命令事件
        ipcMain.on('gameCmdEvent', async (event, cmd) => {});
    }
};
