

// 替换空格为 &nbsp; 的函数
function replaceSpacesWithNbsp(str) {
    return str.replace(/\s/g, '&nbsp;')
}

// 示例用法
const exampleString = '[2;37;0m           [1;37m游戏地址	[2;37;0m[36m[4mmud.pkuxkx.net 8080'
const replacedString = replaceSpacesWithNbsp(exampleString)

console.log(replacedString) // 输出替换后的字符串
