import { ipcMain, dialog } from 'electron/main';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
// 替换为更短的变量名
const loadedMods = new Set();

export const scriptManage = {
    mutual: (mainWindow) => {
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
        ipcMain.on('VueToElectron', (event, cmd) => {});
    }
};
