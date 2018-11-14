
let mapId='quanguo';
let mapIdList=['quanguo'];
let maxLevel=3;
let map;

function getMapLevel() {
    return mapIdList.length;
}

function bindEvent() {
    let $return=document.getElementById('jsReturn');
    $return.addEventListener('click',event=>{
        if(map&&mapIdList.length>1){
            mapIdList.pop();
            let curMapId=mapIdList[mapIdList.length-1];
            map.updateMap(curMapId, getMapLevel());
        }
    })
}

function renderMap() {
    map=new MapCharts({
        mapId: mapId, //  地图id
        level: getMapLevel(),
        data:[],
        clickCallback: function (mapId) {
            /*只能下转到二级机构*/
            if (mapIdList.length < maxLevel) {
                mapIdList.push(mapId);
                /*重新绘制地图路径*/
                map.updateMap(mapId, getMapLevel());
            }
        }
    });
}

function init() {
    bindEvent();
    renderMap();
}

init();



