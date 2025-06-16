export const Triggers = [
    {
        type: 'tri',
        reg: /你(.*)大笑几声。/,
        cmd: (text) => {
            console.log('匹配内容：', text);
            return 'xixi';
        }
    },
    {
        type: 'tri',
        reg: /121212/,
        cmd: 'hehe'
    }
];
