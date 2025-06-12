export const Utils = {
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
    }
};
