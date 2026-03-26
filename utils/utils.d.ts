export const Utils: {
    getLastStr: (str: unknown, symbol: string) => string;
    getFirstStr: (str: unknown, symbol: string) => string;
    serialize: (key: string, value: unknown) => unknown;
    deserialize: (key: string, value: unknown) => unknown;
    parseMudLabelForDisplay: (
        raw: string | null | undefined,
        options?: { stripLeadingDot?: boolean }
    ) => string;
};
