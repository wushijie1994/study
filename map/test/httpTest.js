const httpServer = require('../util/httpServer');

const url='http://xzqh.mca.gov.cn/data/quanguo_Line.geojson';
httpServer(url).then(data=>{
    const list=data.features;
    list.forEach(value=>{
        console.log(JSON.stringify(value.properties));
    })
    // console.log(JSON.stringify(data));
    // console.log(data.name);
})