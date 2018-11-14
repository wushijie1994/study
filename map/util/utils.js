const topojson=require('topojson-client');


const mapIdRexp=/\d{6}/

/*
* 将mapId转换成相对应的级别
* @params mapId:传入的mapId
* @params effectiveLen:保留的有效位数
* */
const getMapIdByLevel=function(mapId,effectiveLen) {
    const ismapId=mapIdRexp.test(mapId);
    if(ismapId){
        mapId=mapId.substr(0,effectiveLen).padEnd(6,'0');
        return mapId;
    }else{
        return ''
    }
}

/*
* 比较两个mapId，判断他们是否是父子关系
* @params parentId:父id
* @params childId:子Id
* @params level:所属级别
* */
const isParentHandler=function(parentId,childId,level) {
    return parentId.substr(0,level*2)===childId.substr(0,level*2);
}
/*
* 将路径数据转换成我需要的格式
* @params jsonData:地图的数据
* @params deep:全国(1),省市（2），县（3）
* */
exports.getPathData=(jsonData,level,mapCode)=>{
    let result={};

    let key = mapCode;/*获取路径数据保存的位置*/

    let mapGraData = topojson.feature(jsonData, jsonData.objects[key]);
    let pathData=mapGraData.features;

    let mapId,path,isParent;
    /*遍历路径数据，取出适合的数据保存*/
    pathData.forEach(value=>{
        /*如果属性直接返回*/
        if (value.properties == null) return false;
        mapId = value.properties.QUHUADAIMA;
        mapId=getMapIdByLevel(mapId,6);
        // if(mapCode=='130000') debugger
        isParent=isParentHandler(mapCode,mapId,level);
        /*如果当前的mapId是存在的*/
        if(mapId&&isParent&&value.geometry){
            path=value.geometry.coordinates;
            if(mapId in result){
                /*如果当前的mapId已经存在路径，那么将当前的数据与之前的数据合并*/
                result[mapId].push(path.pop());
            }else{
                result[mapId]=path;
            }
            return true;
        }
    })
    console.log(`${mapCode}采集到的数据：${Object.keys(result).toString()}`);
    return result;
}
