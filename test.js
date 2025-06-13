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
        reg: /121212/,
        cmd: 'hehe'
    }
];
