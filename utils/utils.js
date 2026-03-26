export const Utils = {
    /**
     * 字符串切割，取最后一个元素
     * @param {*} str
     * @param {*} symbol
     * @returns String
     * @example const lastStr = Utils.getLastStr('Hello, World', ','); // 输出: ' World'
     */
    getLastStr: (str, symbol) => {
        const arr = str.split(symbol);
        return arr[arr.length - 1];
    },
    /**
     * 字符串切割，取最后一个元素
     * @param {*} str
     * @param {*} symbol
     * @returns String
     * @example const lastStr = Utils.getFirstStr('Hello, World', ','); // 输出: 'Hello'
     */
    getFirstStr: (str, symbol) => {
        const arr = str.split(symbol);
        return arr[0];
    },

    /**
     * 定义序列化函数
     * @param {*} value
     * @returns String
     * @example const serializedData = JSON.stringify(原数据, Utils.serialize);
     */
    serialize: (key, value) => {
        if (value instanceof RegExp) {
            // 将正则表达式转换为字符串
            return value.toString();
        }
        if (typeof value === 'function') {
            // 将函数转换为字符串
            return value.toString();
        }
        return value;
    },
    /**
     * 定义反序列化函数
     * @param {*} value
     * @returns Object
     * @example const deserializedData = JSON.parse(序列化后的数据, Utils.deserialize);
     */
    deserialize: (key, value) => {
        if (typeof value === 'string') {
            // 检查是否为正则表达式字符串
            if (/^\/.*\/[gimuy]*$/.test(value)) {
                const match = value.match(/^\/(.*)\/([gimuy]*)$/);
                if (match) {
                    return new RegExp(match[1], match[2]);
                }
            }
            // 检查是否为函数字符串
            if (value.startsWith('function') || value.startsWith('(') || value.startsWith('()') || value.startsWith('=>')) {
                try {
                    // eslint-disable-next-line no-eval
                    return eval(`(${value})`);
                } catch (e) {
                    console.error('函数反序列化失败:', e);
                }
            }
        }
        return value;
    },

    /**
     * 剥离 MUD 下行中的 ANSI/ASCII 控制序列，用于按钮、列表等纯文本展示。
     * 支持标准 CSI（ESC [ … m）以及常见“丢了 ESC”的 [2;37;0m 形式；可选去掉前缀 “.”。
     * @param {string} raw
     * @param {{ stripLeadingDot?: boolean }} [options] stripLeadingDot 默认 true，去掉开头的 “.”
     * @returns {string}
     * @example Utils.parseMudLabelForDisplay('\\x1b[2;37;0m.光明磊落') // '光明磊落'
     */
    parseMudLabelForDisplay(raw, options = {}) {
        const stripLeadingDot = options.stripLeadingDot !== false;
        let s = raw == null ? '' : String(raw);
        // SGR：参数仅为数字、分号；部分终端 truecolor 使用冒号子参数（如 38:2:r:g:b）
        s = s.replace(/\x1b\[[0-9;:]*m/g, '');
        s = s.replace(/\[(?:\d+;)*\d+m/g, '');
        s = s.trim();
        if (stripLeadingDot && s.startsWith('.')) {
            s = s.slice(1).trim();
        }
        return s;
    }
};
