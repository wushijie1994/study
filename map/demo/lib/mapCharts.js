/**
 * @file mapCharts.js 地图图标文件
 * @author xieyq on 2017/7/24.
 * @description 用来创建地图svg的插件
 * @version 1.0.0
 */
//定义地图图形的方法
var mapCharts = {
    version: '1.0.1' //mapCharts版本
};
mapCharts.init = function (dom) {
    //如果dom元素不存在，则抛出初始化失败的错误
    if (!dom) {
        throw new Error('Initialize failed: invalid dom.');
    }
    var charts = new MapCharts(dom);
    return charts;
};

/*
 * 地图图形的构造方法
 * */
function MapCharts(dom) {
    this.dom = dom; //设置对应的dom元素
}

//设置地图的属性方法
MapCharts.prototype = {
    /*
     * 设置地图对象的参数选项
     * */
    setOption: function () {
        var _this = this;
        //调用初始化方法
        _this.init();
    },
    /*
     * 地图图形的初始化方法
     * */
    init: function () {
        var _this = this;

        //svg的namespace命名空间
        _this.SVG_NS = "http://www.w3.org/2000/svg";

        //地图宽度和高度比例
        //MAP_RATE: 1.22,
        _this.MAP_RATE = 1;

        //区域常量
        _this.AREA = {
            MAXLNG: 135.103684,
            MINLNG: 73.497551,
            MAXLAT: 53.568958,
            //MAXLAT: 65,
            MINLAT: 9.332761
            //MINLAT: 18.121885
        };

        //对象的设置
        _this.config = {
            marginLeft: 0,
            marginTop: 0,
            scale: 1,
            width: _this.dom.offsetWidth,
            height: _this.dom.offsetHeight
        };

        //更新config的值
        _this.updateConfig();

        //层级属性，1表示全国 2表示省份 3表示市级
        _this.level = 1;

        //创建svg对象
        _this.svg = _this.createElement('svg');
        _this.svg.setAttribute("width", "100%");
        _this.svg.setAttribute("height", "100%");

        //页面的内容集合
        _this.group = _this.createElement('g');
        _this.svg.appendChild(_this.group);

        //给组添加对应的id
        _this.group.setAttribute('id', 'perspective');
        _this.group.setAttribute('transform', 'scale(1,1) translate(' + 0 + ', ' + 0 + ')');

        //创建背景画布
        _this.bgCanvas = _this.createCanvas();
        //添加上对应的id
        _this.bgCanvas.setAttribute('id', 'svgMapBj');
        _this.group.appendChild(_this.bgCanvas);

        //创建一个画布，用于存放区域path集合
        _this.canvas = _this.createCanvas();
        _this.group.appendChild(_this.canvas);

        //创建一个点的(法院对应的点的)画布，用于存放法院点的集合
        _this.pointCanvas = _this.createCanvas();
        _this.group.appendChild(_this.pointCanvas);

        //向dom中添加svg内容
        _this.dom.appendChild(_this.svg);
        _this.maxPoint = {
            x: 0,
            y: 0
        };
        _this.minPoint = {
            x: 0,
            y: 0
        };

        //定义全国数据
        _this.chinaData = null;
        //定义省份数据
        _this.cityData = null;
        //定义法院数据
        _this.courtData = null;

        _this.provinceKey = '';

        //创建一个矩阵
        _this.matrix = new Snap.Matrix(1, 0, 0, 1, 0, 0);

        _this.load(_this.provinceKey);   //加载地图
        _this.loadCourt();  //同步加载法院数据
        //初始化事件
        _this.initEvent();

    },
    /*
     * 更新配置
     * */
    updateConfig: function () {
        var _this = this;
        if (_this.config.width / _this.MAP_RATE > _this.config.height) {
            _this.config.marginTop = 0;
            _this.config.marginLeft = (_this.config.width - _this.config.height * _this.MAP_RATE) / 2;
            _this.config.width = _this.config.height * _this.MAP_RATE;
        } else {
            _this.config.marginTop = (_this.config.height - _this.config.width / _this.MAP_RATE) / 2;
            _this.config.marginLeft = 0;
            _this.config.height = _this.config.width / _this.MAP_RATE;
        }
    },
    /*
     * 加载svg图形
     * */
    load: function (key) {
        var _this = this;

        //如果全国数据是空的，则需要去请求对应的全国数据,再去加载对应的区域地图
        //否则直接加载对应的区域地图
        if (!_this.chinaData) {
            //http://baike.baidu.com/cms/s/chinamap/china.json
            $.getJSON('json/china.json', function (map) {
                _this.chinaData = map;
                //加载对应的区域
                _this.loadArea(key);
            });
        } else {
            //加载对应的区域
            _this.loadArea(key);
        }
    },
    /*
     * 加载区域
     * */
    loadArea: function (key) {

        var _this = this;
        var areaData = null, data = null;
        //全国
        if (_this.level === 1) {
            areaData = _this.chinaData;
            data = _this.chinaData;
            //隐藏返回全国的按钮
            $('.js-back').hide();
            /*$('.js-download').hide();*/
        } else if (_this.level === 2) {  //省份
            areaData = _this.chinaData[key];
            data = _this.chinaData[key].list;
            _this.provinceKey = key;
            //展现返回全国的按钮
            $('.js-back').show();
            $('.js-download').show();
        } else if (_this.level === 3) {  //市级
            areaData = _this.cityData[key];
            data = _this.cityData[key].list;
            //展现返回全国的按钮
            $('.js-back').show();
            $('.js-download').show();
        }
        //绘制对应的区域
        _this.drawArea(key, areaData, data, _this.provinceKey);
    },
    /*
     * 加载法院数据
     * */
    loadCourt: function () {
        var _this = this;
        $.ajax({
            url: "json/court.json",
            dataType: "json",
            async: false,
            cache: true,
            success: function (responese) {
                //赋值法院数据
                _this.courtData = responese;
            }
        });
    },
    /*
     * 获取对象的属性数量
     * */
    getPropNums: function (obj) {
        if (!obj) return 0;
        var n = 0;
        for (var key in obj) n++;
        return n
    },
    /*
     * 清空元素
     * */
    clear: function () {
        var _this = this;
        //清空背景画布
        for (; _this.bgCanvas.childNodes.length > 0;) {
            _this.bgCanvas.removeChild(_this.bgCanvas.childNodes[0]);
        }

        //清空path画布
        for (; _this.canvas.childNodes.length > 0;) {
            _this.canvas.removeChild(_this.canvas.childNodes[0]);
        }
        //清空点的画布
        for (; _this.pointCanvas.childNodes.length > 0;) {
            _this.pointCanvas.removeChild(_this.pointCanvas.childNodes[0]);
        }
    },
    /*
     * 绘制对应的区域
     * */
    drawArea: function (key, areaData, data) {

        var _this = this;

        if (key === '') {


            key = '000000';
        }

        //路径矩阵变换对象
        var pathMatrixObj = {
            s: 1,
            translate: [0, 0]
        };
        if (_this.level > 1) {
            var areaCenter = areaData.center;
            var ratio = _this.getRatio(areaData.range),
                translate = [_this.config.width / 2 - areaCenter[0] - (_this.config.width * ratio / 2 - _this.config.width / 2) / ratio,
                    _this.config.height / 2 - areaCenter[1] - (_this.config.height * ratio / 2 - _this.config.height / 2) / ratio];
            pathMatrixObj.s = ratio;
            pathMatrixObj.translate = translate;
        }

        _this.matrix = new Snap.Matrix(1, 0, 0, 1, 0, 0);
        _this.matrix.translate(_this.config.marginLeft, _this.config.marginTop);

        _this.matrix.scale(pathMatrixObj.s, pathMatrixObj.s);
        _this.matrix.translate(pathMatrixObj.translate[0], pathMatrixObj.translate[1]);

        $.ajax({
            type: "get",
            url: 'json/' + key + '.json',
            async: true,
            success: function (data) {
                console.log(data);
            }
        });
        $.getJSON('json/' + key + '.json', function (areaPoints) {


            //清空对应的元素
            _this.clear();

            //用来赋值最大点和最小点的
            var n = 0;


            for (var areaKey in areaPoints) {
                if (areaKey == "450127") {
                    localStorage.setItem("test", 1);
                } else {
                    localStorage.setItem("test", 0);
                }
                if (n === 0) {
                    _this.maxPoint.x = areaPoints[areaKey][0][0][0];
                    _this.maxPoint.y = areaPoints[areaKey][0][0][1];
                    _this.minPoint.x = areaPoints[areaKey][0][0][0];
                    _this.minPoint.y = areaPoints[areaKey][0][0][1];
                }
                var covertObj = _this.convertToXYList(areaPoints[areaKey]);

                //往对应的区域数据中里面去copy转换后的对象
                $.extend(data[areaKey], covertObj);

                //绘制对应的路径和文本
                var path = _this.draw(data[areaKey]);
                //设置对应的属性
                path.setAttribute('key', areaKey);
                path.setAttribute('id', 'mapid-' + areaKey + '-outline');

                n++;
            }

            //绘制区域的背景图层
            _this.drawAreaBj(data);

            //如果到省级，则需要对地图进行缩放和平移
            /*if(_this.level > 1) {
             var areaCenter = areaData.center;
             var ratio = _this.getRatio(areaData.range),
             translate = [_this.config.width / 2 - areaCenter[0] - (_this.config.width * ratio / 2 - _this.config.width / 2) / ratio,
             _this.config.height / 2 - areaCenter[1] - (_this.config.height * ratio / 2 - _this.config.height / 2) / ratio];
             _this.zoom(ratio, translate);
             for (var a = _this.canvas.getElementsByTagName("text"), n = 0; n < a.length; n++) {
             var i = parseFloat(a[n].getAttribute("ox")),
             r = parseFloat(a[n].getAttribute("oy"));
             a[n].setAttribute("x", i * ratio);
             a[n].setAttribute("y", r * ratio);
             a[n].setAttribute("transform", "scale(" + 1 / ratio + "," + 1 / ratio + ")");
             }
             } else {
             //缩放和平移还原
             _this.zoom(1, [0, 0]);
             }*/
            console.log('最大的横坐标：' + _this.maxPoint.x);
            console.log('最大的纵坐标：' + _this.maxPoint.y);
            console.log('最小的横坐标：' + _this.minPoint.x);
            console.log('最小的纵坐标：' + _this.minPoint.y);

            //如果是省级，则赋值对应的省级的数据
            if (_this.level === 2) {
                _this.cityData = data;
            }

            //如果是全国，加载高院点
            if (_this.level === 1) {
                _this.handleLoadProvince(data, key);
            } else if (_this.level === 2) {  //如果是省份，则加载中院的点
                _this.handleLoadCity(_this.COURT_MAP[_this.provinceKey], areaData.name, data, key);
            } else if (_this.level === 3) {  //下钻到市，则加载基层院的点
                _this.handleLoadCountry(_this.COURT_MAP[_this.provinceKey], areaData.name, data, key);
            }

            var svgInfo = _this.svg.getBoundingClientRect();
            var svgNode = _this.svg.cloneNode(true);
            svgNode.setAttributeNS(null, "version", "1.1");
            svgNode.setAttributeNS(null, 'id', 'svgMap');
            svgNode.setAttributeNS(null, "width", svgInfo.width);
            svgNode.setAttributeNS(null, "height", svgInfo.height);
            svgNode.setAttributeNS(null, "viewBox", '0 0 ' + svgInfo.width + ' ' + svgInfo.height);
            svgNode.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns", "http://www.w3.org/2000/svg");
            svgNode.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
            var dataurl = "data:image/svg+xml;charset=utf-8;base64," + window.btoa(encodeURIComponent(svgNode.outerHTML).replace(/%([0-9A-F]{2})/g, function (t, n) {
                return String.fromCharCode("0x" + n);
            }));

            $('.js-download').attr('download', key + '_svg.svg');
            $('.js-download').attr('href', dataurl);
        });
    },
    /*
     * 获取法院key
     * */
    getCourtKey: function (courtInfo, data, key, name) {
        for (var areaKey in data) {
            //如果是全国地图，则需要获取对应的高院的id，展现最高法院、高级法院
            if (this.level === 1) {
                if (courtInfo.level === 1 && courtInfo.cityData.indexOf(data[areaKey].name) > -1) {
                    return this.HIGHEST_COURT_KEY;
                } else if (courtInfo.level == 2 && courtInfo.courtName.indexOf(data[areaKey].name) > -1) {
                    return areaKey;
                }
            } else if (this.level === 2) {   //省份地图，展现最高法院、高级法院、中级法院
                if (courtInfo.level === 1 && courtInfo.cityData.indexOf(name ? name : '北京') > -1) {
                    return this.HIGHEST_COURT_KEY;
                } else if (courtInfo.level == 2 && (courtInfo.courtName.indexOf(name ? name : '北京') > -1 || courtInfo.cityName === data[areaKey].name || courtInfo.countyName === data[areaKey].name)) {
                    //高级法院 并且高级法院所在的城市或者地区等于当前的法院名称
                    return this.provinceKey;
                } else if (courtInfo.level == 3 && (courtInfo.cityName === data[areaKey].name || courtInfo.countyName === data[areaKey].name)) {
                    //中级法院，及对应的法院所在的城市或者地区等于当前的法院名称
                    return areaKey;
                }
            } else if (this.level === 3 && courtInfo.countyName === data[areaKey].name) {   //市级地图，展现最高法院、高级法院、中级法院、基层法院
                if (courtInfo.level === 1) {
                    //最高法院
                    return this.HIGHEST_COURT_KEY;
                } else if (courtInfo.level == 2) {
                    //高级法院 并且高级法院所在的地区等于当前的法院名称
                    return this.provinceKey;
                } else if (courtInfo.level == 3) {
                    //中级法院，及对应的法院所在的地区等于当前的法院名称
                    return key;
                } else if (courtInfo.level === 4) {
                    return areaKey;
                }
            }
        }
    },
    /*
     * 处理加载全国的高院
     * */
    handleLoadProvince: function (data, key) {
        var _this = this;
        //获取北京的法院列表，用于绘制最高法院和北京高院
        var bjCourt = _this.courtData[_this.PROVINCE_NAME[0]].list;
        //创建最高人民法院
        _this.markerCourt(bjCourt[0], '000000');
        //创建北京高级人民法院
        _this.markerCourt(bjCourt[1], _this.getCourtKey(bjCourt[1], data));
        //从1开始遍历其他省的高级法院
        for (var i = 1; i < _this.PROVINCE_NAME.length; i++) {
            var provinceData = _this.courtData[_this.PROVINCE_NAME[i]].list;
            //每个列表的第一个点都是高级法院
            if (provinceData[0]) {
                var highCourt = provinceData[0];
                //如果经度纬度都存在，则创建对应的高级法院
                highCourt.longitude && highCourt.latitude && _this.markerCourt(highCourt, _this.getCourtKey(highCourt, data, key));
            }
        }
    },
    /*
     * 加载单省的法院
     * @param {String} key 对应的法院key
     * */
    handleLoadCity: function (key, name, data) {
        //获取对应省份的法院列表
        var courtList = this.courtData[key].list;
        //如果是重庆、北京、上海、天津，四个直辖市，则直接遍历创建法院
        if ("chongqing" == key || "beijing" == key || "shanghai" == key || "tianjin" == key) {
            for (var n = 0; n < courtList.length; n++) {
                this.markerCourt(courtList[n], this.getCourtKey(courtList[n], data, key, name));
            }
        } else {    //否则，创建数据中法院等级为1 2 3的法院
            for (var n = 0; n < courtList.length; n++) {
                (1 == courtList[n].level || 2 == courtList[n].level || 3 == courtList[n].level) && this.markerCourt(courtList[n], this.getCourtKey(courtList[n], data, key, name))
            }
        }
    },
    /*
     * 处理加载市时候，加载基层院的点
     * */
    handleLoadCountry: function (courtKey, name, data, key) {
        var courtList = this.courtData[courtKey].list;
        for (var i = 0; i < courtList.length; i++) {
            //如果所在市的名称与参数名称相同，则标记对应的法院
            courtList[i].cityName == name && this.markerCourt(courtList[i], this.getCourtKey(courtList[i], data, key));
        }
    },
    /*
     * 标记法院
     * */
    markerCourt: function (courtData, key) {
        var courtPoint = this.addPoint({
            id: 'mapid-' + key + '-circle',
            r: 4,
            lat: courtData.longitude,
            lng: courtData.latitude
        });
        $(courtPoint).attr("data-courtname", courtData.courtName);
        //鼠标滑过样式
        $(courtPoint).hover(
            //鼠标划入事件
            function (event) {
                event = event || window.event;
                var left = event.pageX,
                    top = event.pageY;

                $('.js-court-tip').text($(this).attr('data-courtname')).css({
                    left: left + 10,
                    top: top + 10
                }).show();
            },
            function () {
                $('.js-court-tip').hide();
            }
        ).mousemove(
            function (event) {
                event = event || window.event;
                var left = event.pageX,
                    top = event.pageY;

                $('.js-court-tip').css({
                    left: left + 10,
                    top: top + 10
                });
            }
        );
    },
    /*
     * 添加点
     * */
    addPoint: function (courtInfo) {
        //获取转换后的经纬度坐标
        var point = this.convertToXY(courtInfo.lat, courtInfo.lng);
        point = this.matrixTransform(point[0], point[1]);
        courtInfo.left = point[0];
        courtInfo.top = point[1];
        var courtPoint = this.createElement('circle');
        courtPoint.setAttribute('id', courtInfo.id);
        courtPoint.setAttribute('r', courtInfo.r);
        courtPoint.setAttribute('cx', courtInfo.left);
        courtPoint.setAttribute('cy', courtInfo.top);
        courtPoint.setAttribute('fill', '#ffcd7a');
        this.pointCanvas.appendChild(courtPoint);
        return courtPoint;
    },
    /*
     * 获取比值
     * */
    getRatio: function (range) {
        var n = range.right - range.left,
            a = range.bottom - range.top;
        return n > a ? this.config.width / n : this.config.height / a;
    },
    /*
     * 缩放地图
     * @param {Number} ratio 缩放比例
     * @param {Array} [x, y] translate 平移距离
     * */
    zoom: function (ratio, translate) {
        //背景画布缩放平移
        this.bgCanvas.setAttribute("transform", "scale(" + ratio + "," + ratio + ") translate(" + translate[0] + "," + translate[1] + ")");
        this.bgCanvas.setAttribute("stroke-width", 1 / ratio);

        //背景画布缩放平移
        this.canvas.setAttribute("transform", "scale(" + ratio + "," + ratio + ") translate(" + translate[0] + "," + translate[1] + ")");
        this.canvas.setAttribute("stroke-width", 1 / ratio);

        //背景画布缩放平移
        this.pointCanvas.setAttribute("transform", "scale(" + ratio + "," + ratio + ") translate(" + translate[0] + "," + translate[1] + ")");
        this.pointCanvas.setAttribute("stroke-width", 1 / ratio);

        this.config.scale = ratio;  //设置缩放
    },
    /*
     * 返回到全国
     * */
    backToChina: function () {
        this.level = 1;
        this.provinceKey = '';
        //加载全国
        this.load(this.provinceKey);
    },
    /*
     * 返回到省份
     * */
    backToProvince: function () {
        this.level = 2;
        this.load(this.provinceKey);
    },
    /*
     * 初始化事件
     * */
    initEvent: function () {
        var _this = this;
        //包含区域的点击事件
        $(_this.canvas).off('click.area').on('click', function (event) {
            event = event || window.event;
            var $target = $(event.target),
                key = $target.attr("key");
            //如果key不存在
            if (!key) {
                return;
            }
            var data = null;
            if (_this.level === 1) {
                data = _this.chinaData[key].list;
            } else if (_this.level === 2) {  //省份
                data = _this.cityData[key].list;
            } else {  //市级
                return;
            }
            if (_this.getPropNums(data) <= 0) {
                return;
            }
            //层级添加一层
            _this.level++;
            //加载对应的区域
            _this.load(key);
        });


        $(".js-back").on("click", function () {
            2 == _this.level ? _this.backToChina() : 3 == _this.level && _this.backToProvince();
        });
    },
    /*
     * 创建对应的文本
     * */
    drawText: function (name, textPoint, code) {
        var _this = this;
        var text = _this.createElement("text");
        text.setAttribute('x', textPoint[0]);
        text.setAttribute("y", textPoint[1]);
        text.setAttribute('ox', textPoint[0]);
        text.setAttribute('oy', textPoint[1]);
        text.setAttribute('fill', '#1a6bbc');
        text.setAttribute('stroke', 'none');
        text.setAttribute('stroke-width', '0');
        text.setAttribute('text-anchor', 'middle');
        text.setAttribute('alignment-baseline', 'middle');
        text.setAttribute('font-family', 'Microsoft YaHei');
        text.textContent = name;
        text.setAttribute('key', code);
        return text
    },
    /*
     * 绘制区域
     * */
    draw: function (mapItem, matrix) {
        var _this = this;
        var areaGroup = _this.createElement("g"),
            path = this.drawCanvas(mapItem.latLng);
        if (mapItem.textCenter && !mapItem.loaded) {
            mapItem.textCenter = _this.convertToXY(mapItem.textCenter[0], mapItem.textCenter[1]);
            mapItem.textCenter = _this.matrixTransform(mapItem.textCenter[0], mapItem.textCenter[1]);
            mapItem.loaded = !0
        }
        //mapItem.textCenter && !mapItem.loaded && (mapItem.textCenter = _this.convertToXY(mapItem.textCenter[0], mapItem.textCenter[1]), mapItem.loaded = !0);
        var textName = _this.drawText(decodeURIComponent(mapItem.name), mapItem.textCenter ? mapItem.textCenter : _this.matrixTransform(mapItem.center[0], mapItem.center[1]), mapItem.code);
        areaGroup.appendChild(path);
        areaGroup.appendChild(textName);
        _this.canvas.appendChild(areaGroup);
        return path;
    },
    /*
     * 创建区域的背景
     * */
    drawAreaBj: function (data) {
        var _this = this;
        var pathPoint = [];
        for (var areaKey in data) {
            var areaPoint = data[areaKey].latLng;
            if (!areaPoint) {
                continue;
            }
            for (var i = 0; i < areaPoint.length; i++) {
                pathPoint.push(areaPoint[i]);
            }
        }
        var pathSvg = _this.drawCanvas(pathPoint);
        _this.bgCanvas.appendChild(pathSvg);
    },
    /*
     * 判断是否存在
     * @param {Array} [[x,y]] pointArr 对应的点的数组的集合
     * @param {Array} [x, y] point 对应的点的数组
     * */
    isExist: function (pointArr, point) {
        for (var i = 0; i < pointArr.length; i++) {
            if (point[0] === pointArr[i][0] && point[1] === pointArr[i][1]) {
                return true;
            }
        }
        return false;
    },
    /*
     * 转换对应的x y坐标值
     * @param {Float} x x轴坐标值
     * @param {Float} y y轴坐标值
     * @return {Array} [x, y] 返回对应的坐标
     * */
    convertToXY: function (x, y, matrix) {
        var _this = this;
        var _xRatio = 3600 * (_this.AREA.MAXLNG - _this.AREA.MINLNG) / _this.config.width,
            _yRatio = 3600 * (_this.AREA.MAXLAT - _this.AREA.MINLAT) / _this.config.height;
        /* if(localStorage.getItem("test")==1){
             console.log(x ,_this.AREA.MINLNG,(x - _this.AREA.MINLNG),_xRatio,(x - _this.AREA.MINLNG) / _xRatio,);
             console.log(y ,_this.AREA.MAXLAT,(_this.AREA.MAXLAT - y),_yRatio,(_this.AREA.MAXLAT - y) / _yRatio);
         }*/
        return [3600 * (x - _this.AREA.MINLNG) / _xRatio, 3600 * (_this.AREA.MAXLAT - y) / _yRatio];
    },
    /*
     * 转化为对应的x y坐标的列表
     * @param {Array} points 对应的坐标数组
     * @return {Object} 转换后的对象
     * */
    convertToXYList: function (points) {

        var _this = this;
        var convertObj = {
            range: {
                left: _this.config.width,
                top: _this.config.height,
                right: 0,
                bottom: 0
            }
        };
        console.log(this.matrix);
        for (var i = 0; i < points.length; i++) {
            for (var j = 0; j < points[i].length; j++) {
                /*if (points[i][j][0] > _this.maxPoint.x) {
                    _this.maxPoint.x = points[i][j][0];
                }
                if (points[i][j][1] > _this.maxPoint.y) {
                    _this.maxPoint.y = points[i][j][1];
                }
                if (points[i][j][0] < _this.minPoint.x) {
                    _this.minPoint.x = points[i][j][0];
                }
                if (points[i][j][1] < _this.minPoint.y) {
                    _this.minPoint.y = points[i][j][1];
                }
*/
                points[i][j] = _this.convertToXY(points[i][j][0], points[i][j][1]);
                _this.calcRange(convertObj.range, points[i][j]);
                if (localStorage.getItem("test") == 1) {
                    console.log(points[i][j]);
                }
                points[i][j] = _this.matrixTransform(points[i][j][0], points[i][j][1]);
                if (localStorage.getItem("test") == 1) {
                    console.log(points[i][j]);
                } else {

                }
            }
        }
        //计算中心坐标
        convertObj.center = _this.calcCenter(convertObj.range);
        //convertObj.center = _this.matrixTransform(convertObj.center[0], convertObj.center[1]);
        convertObj.latLng = points;
        if (localStorage.getItem("test") == 1) {
            console.log(points);
        }
        return convertObj;
    },
    /*
    * 经过矩阵转换之后的x y坐标
    * @param {Number}  x x轴坐标
    * @param {Number}  y y轴坐标
    * @return {Array} [x, y] 转换之后的x y坐标
    * */
    matrixTransform: function (x, y) {

        return [this.matrix.x(x, y), this.matrix.y(x, y)];
    },
    /*
     * 计算范围
     * @param {Object} range 范围对象
     * @param {Array} [x, y] point 坐标数组
     * */
    calcRange: function (range, point) {
        var x = point[0], y = point[1];
        range.right = x > range.right ? x : range.right;
        range.left = x < range.left ? x : range.left;
        range.top = y < range.top ? y : range.top;
        range.bottom = y > range.bottom ? y : range.bottom;
    },
    /*
     * 计算范围对象的中心位置
     * @param {Object} range 范围对象
     * @return {Array} [x, y] 中心位置坐标
     * */
    calcCenter: function (range) {
        return [(range.left + range.right) / 2, (range.top + range.bottom) / 2];
    },
    /*
     * 绘制画布
     * */
    drawCanvas: function (points) {
        var _this = this;
        var dArr = [];  //路径数组
        var path = _this.createElement("path"); //创建对应的路径
        for (var i = 0; i < points.length; i++) {
            for (var j = 0; j < points[i].length; j++) {
                dArr.push((0 === j ? "M" : "L") + points[i][j][0] + " " + points[i][j][1]);
            }
            //闭合路径
            dArr.push("L" + points[i][0][0] + " " + points[i][0][1] + " Z");
        }
        path.setAttribute("autoSize", !0);
        path.setAttribute("d", dArr.join(" "));
        return path;
    },
    /*
     * 创建一个画布
     * */
    createCanvas: function () {
        var _this = this;
        //创建一个空的画布
        var canvas = _this.createElement('g');
        canvas.setAttribute('class', 'layer');
        canvas.setAttribute('fill', '#52a3f5');
        canvas.setAttribute('stroke', '#b1d9fc');
        canvas.setAttribute('stroke-width', '1');
        canvas.setAttribute('font-size', '11');
        canvas.setAttribute('font-family', 'SimSun');
        return canvas;
    },
    /*
     * 创建svg元素
     * @param {String} qualifiedName 要创建的元素的类型的字符串
     * */
    createElement: function (qualifiedName) {
        return document.createElementNS(this.SVG_NS, qualifiedName);
    },
    //最高法院的key
    HIGHEST_COURT_KEY: '000000',
    //法院映射
    COURT_MAP: {
        110000: "beijing",
        120000: "tianjin",
        130000: "hebei",
        140000: "shanxi",
        150000: "neimenggu",
        210000: "liaoning",
        220000: "jilin",
        230000: "heilongjiang",
        310000: "shanghai",
        320000: "jiangsu",
        330000: "zhejiang",
        340000: "anhui",
        350000: "fujian",
        360000: "jiangxi",
        370000: "shandong",
        410000: "henan",
        420000: "hubei",
        430000: "hunan",
        440000: "guangdong",
        450000: "guangxi",
        460000: "hainan",
        500000: "chongqing",
        510000: "sichuan",
        520000: "guizhou",
        530000: "yunnan",
        540000: "xizang",
        610000: "shaanxi",
        620000: "gansu",
        630000: "qinghai",
        640000: "ningxia",
        650000: "xinjiang",
        710000: "taiwan",
        810000: "xianggang",
        820000: "aomen",
        460300: "hainansansha"
    },
    //省份名称
    PROVINCE_NAME: ["beijing", "heilongjiang", "shaanxi", "guangdong", "shanxi", "chongqing", "sichuan", "guizhou", "qinghai", "tianjin", "ningxia", "neimenggu", "shandong", "anhui", "hunan", "yunnan", "jilin", "guangxi", "hubei", "xizang", "xinjiang", "gansu", "jiangsu", "hainan", "liaoning", "henan", "shanghai", "zhejiang", "jiangxi", "fujian", "hebei", "hainansansha"]
};