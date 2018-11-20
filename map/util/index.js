const httpServer = require('./httpServer');
const utils = require('./utils');
const writeFileHandler = require('./writeFileHandler');

/*数据来源网址：中华人名共和国民政部*/
const baseUrl='http://xzqh.mca.gov.cn/data/';
/*全国数据*/
const baseFile='quanguo';

/*数据遍历的深度*/
const maxlevel=3;
/*let requireQueue=[{
    pathName:'quanguo',
    level:0,
}];*/
let requireQueue=[{
    pathName:'430000',
    level:1,
}];
/*设置请求的时间间隔*/
const delay=0;
/*设置是否抓取所有数据*/
const getAll=false;
/*记录失败的数据*/
let disableQueue=[];
/*记录成功的数据*/
let successQueue=[];



function getPathData() {
    let next,pathName,level;
    /*如果队列存在数据，那么继续请求*/
    if(requireQueue.length){
        next=requireQueue.shift();
        pathName=next.pathName;
        level=next.level;
        console.log(`开始采集：${pathName}`);
    }else{
        console.log(`没有找到的数据源：${disableQueue.toString()}`)
        return false;
    }

    /*如果数据已经请求过了，那么直接跳过*/
    if(successQueue.includes(pathName)){
        getPathData();
        return false;
    }

    /*之请求层级范围内的数据*/
    if(level<maxlevel){
        const url=baseUrl+pathName+'.json';
        httpServer(url).then(data=>{
            const pathData=utils.getPathData(data,level,pathName);
            /*循环遍历*/
            level+=1;
            if(level<maxlevel&&getAll){
                Object.keys(pathData).forEach(key=>{
                    requireQueue.push({
                        pathName:key,
                        level:level,
                    })
                })
            }
            writeFileHandler(pathName,pathData).then(data=>{
                // debugger
                successQueue.push(pathName);
                getAll&&getPathDataDealy();
            });
        }).catch(e=>{
            console.error(`not found 404:${pathName}\n${e.message}`);
            // debugger
            disableQueue.push(pathName);
            getAll&&getPathData();
        })
    }
}

/*
* 以一定的延迟爬数据
* 因为网站存在限制，所以需要设置延时
* */
function getPathDataDealy() {
    setTimeout(function () {
        getPathData();
    },delay);
}

getPathData();



