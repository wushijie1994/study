/*
* creatTime:2018-11-13
* author:wushijie-lhq
* description:创建写的文件
* */

const fs = require("fs");

const baseUrl='../json/';
const filePostfix='.json';

const writeFileHandler=(fileName,jsonData)=>{
    return new Promise(resolve => {
        const filePath=baseUrl+fileName+filePostfix;
        fs.writeFile(filePath, JSON.stringify(jsonData),  function(err) {
            if (err) {
                return console.error(err);
            }else{
                resolve();
                console.log(`数据写入成功:${fileName}`);
                console.log(`-----------------------------------\n\n`)
            }
        });
    })
}

module.exports=writeFileHandler
