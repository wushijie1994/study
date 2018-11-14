/*
* creatTime:2018-11-13
* author:wushijie-lhq
* description:创建http请求
* */

const http = require('http');

const httpServer = (url) => {
    console.log(`path:${url}`);
    return new Promise((resolve,reject) => {
        http.get(url, (res) => {
            const {statusCode} = res;

            let error;
            if (statusCode !== 200) {
                error = new Error(`请求失败。\n状态码: ${statusCode}`);
                reject(error);
            }

            if (error) {
                console.error(error.message);
                // 消耗响应数据以释放内存
                res.resume();
                return;
            }

            res.setEncoding('utf8');
            let rawData = '';
            res.on('data', (chunk) => {
                rawData += chunk;
            });
            res.on('end', () => {
                try {
                    const parsedData = JSON.parse(rawData);
                    // console.log(parsedData);
                    resolve(parsedData);
                    // 消耗响应数据以释放内存
                    res.resume();
                } catch (e) {
                    console.error(e.message);
                }
            });
        }).on('error', (e) => {
            console.error(`错误: ${e.message}`);
        });
    })
}

module.exports =httpServer
