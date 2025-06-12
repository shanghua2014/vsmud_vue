export const Triggers = [
    {
        type: 'tri',
        reg: /你.*大笑几声。/,
        cmd: () => {
            console.log('1 cmd 2');
        }
    },
    {
        type: 'tri',
        reg: /1212/,
        cmd: 'hehe'
    }
];

// const Triggers2 = [
//     {
//         type: 'tri',
//         reg: /1212/,
//         cmd: () => {
//             console.log('1 cmd 2');
//         }
//     },
//     {
//         type: 'tri',
//         reg: /1212/,
//         cmd: 'hehe'
//     }
// ];

// const serialize = (key, value) => {
//     if (value instanceof RegExp) {
//         // 将正则表达式转换为包含源和标志的对象
//         return { $regex: value.source, $flags: value.flags };
//     }
//     if (typeof value === 'function') {
//         // 将函数转换为字符串
//         return value.toString();
//     }
//     return value;
// };
// const deserialize = (key, value) => {
//     if (typeof value === 'string') {
//         // 检查是否为正则表达式字符串
//         if (/^\/.*\/[gimuy]*$/.test(value)) {
//             const match = value.match(/^\/(.*)\/([gimuy]*)$/);
//             if (match) {
//                 return new RegExp(match[1], match[2]);
//             }
//         }
//         // 检查是否为函数字符串
//         if (value.startsWith('function') || value.startsWith('(') || value.startsWith('()') || value.startsWith('=>')) {
//             try {
//                 // eslint-disable-next-line no-eval
//                 return eval(`(${value})`);
//             } catch (e) {
//                 console.error('函数反序列化失败:', e);
//             }
//         }
//     }
//     return value;
// }

// const serializedData = JSON.stringify(Triggers2, serialize);
// // console.log(serializedData);
// const deserializedData = JSON.parse(serializedData, deserialize);
// // console.log(deserializedData);
