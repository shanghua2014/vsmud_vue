export const Utils = {
    getLastStr: (str: unknown, symbol: string): string => {
        const arr = String(str).split(symbol);
        return arr[arr.length - 1];
    },

    getFirstStr: (str: unknown, symbol: string): string => {
        const arr = String(str).split(symbol);
        return arr[0];
    },

    serialize: (key: string, value: unknown): unknown => {
        if (value instanceof RegExp) {
            return value.toString();
        }
        if (typeof value === 'function') {
            return value.toString();
        }
        return value;
    },

    deserialize: (key: string, value: unknown): unknown => {
        if (typeof value === 'string') {
            if (/^\/.*\/[gimuy]*$/.test(value)) {
                const match = value.match(/^\/(.*)\/([gimuy]*)$/);
                if (match) {
                    return new RegExp(match[1], match[2]);
                }
            }
            if (
                value.startsWith('function') ||
                value.startsWith('(') ||
                value.startsWith('()') ||
                value.startsWith('=>')
            ) {
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

    parseMudLabelForDisplay(
        raw: string | null | undefined,
        options: { stripLeadingDot?: boolean } = {}
    ): string {
        const stripLeadingDot = options.stripLeadingDot !== false;
        let s = raw == null ? '' : String(raw);
        s = s.replace(/\x1b\[[0-9;:]*m/g, '');
        s = s.replace(/\[(?:\d+;)*\d+m/g, '');
        s = s.trim();
        if (stripLeadingDot && s.startsWith('.')) {
            s = s.slice(1).trim();
        }
        return s;
    }
};
