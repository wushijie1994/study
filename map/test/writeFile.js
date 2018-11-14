const fs = require("fs");

const message={
    name:'wushijie',
    version:'1.0.0'
}
const fileUrl='./json/writeFile.json';

console.log("准备写入文件");
fs.writeFile(fileUrl, JSON.stringify(message),  function(err) {
    if (err) {
        return console.error(err);
    }
    console.log("数据写入成功！");
    console.log("--------我是分割线-------------")
    console.log("读取写入的数据！");
    fs.readFile(fileUrl, function (err, data) {
        if (err) {
            return console.error(err);
        }
        console.log("异步读取文件数据: " + data.toString());
    });
});