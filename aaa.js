var regex = /你(.*)大笑几声。/;
var string = "你123大笑几声。";
var result = string.match(regex);
console.log(result[1]);