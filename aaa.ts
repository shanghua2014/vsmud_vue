const regex = /你(.*)大笑几声。/;
const string = '你123大笑几声。';
const result = string.match(regex);
console.log(result?.[1]);
