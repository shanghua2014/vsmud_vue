export const Triggers = [
    {
        type: 'tri',
        reg: /你「.*」奸笑了几声。/,
        cmd: () => {
            console.log('1 cmd 2');
        }
    },
    {
        type: 'tri',
        reg: /3333/,
        cmd: 'hehe'
    }
];
