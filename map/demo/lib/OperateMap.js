/**
 * @version:      20181012
 * @creatTime:        20181012
 * @updateTime:    20181012
 * @author:          wushijie-lhq
 * @name:          map
 * @description         绘制地图
 */

const dirMapPath='../json/'

/*
 * 地图图形的构造方法
 * */
function MapCharts(options) {
  this.init(options);
  return this;
}

//设置地图的属性方法
MapCharts.prototype = {
  /*
  * 设置地图对象的参数选项
  * */
  setOptions: function (options) {
    var _this = this;
    var _option = {
      domId: 'jsMap',
      mapId: '000000',
      level: 1, /**/
      dataUrl: dirMapPath + 'china.json',
      mapJsonBasePath: dirMapPath,
      data: {},
      dataKey: 'premiumMonth',
      textStyle: {
        'fill': '#1a6bbc',
        'stroke': 'none',
        'stroke-width': '0',
        'font-size': '11',
        'text-anchor': 'middle',
        'alignment-baseline': 'middle',
        'font-family': 'Microsoft YaHei',
        'display': 'none',
      },
      mapStyle: {
        'fill': 'rgba(4 ,97 , 190, 0)',
        'stroke': '#43cdfa',
        'stroke-width': 0.5,
      },
      /*热力图分为*/
      heatMap5: ['#ff3100', '#d90103', '#7e0103', '#500017','#370000'],
      heatMap3: [ '#d90103', '#7e0103', '#500017'],/*只有三挡就显示2,3,4*/
      heatMap2: [ '#d90103', '#500017'],/*只有两档就显示2,4*/
      heatMap1: [ '#d90103'],/*只有一档就显示2*/
      heatMap:['#ff3100', '#d90103', '#7e0103', '#500017','#370000'],/*默认进来是五档*/
      mapShadow: [0, 0, '#000', 0.3],
      mapBg: {
        'fill': 'rgba(4 ,97 , 190, 0)',
        'stroke': '#43cdfa',
        'stroke-width': 0.5,
      },
      circleStyle: {
        r: 4,
        'fill': '#200012',
        cursor: 'pointer',
        'stroke': '#43cdfa',
        'stroke-width': 0.5,
      },
      waterStyle: {
        // width: 25,
        r: 10,
        stroke: '#43cdfa',
        fill: 'rgba(6,237,251,0.1)',
      },
      clickCallback: function () {
        console.log('clickCallback');
      },
    };
    // 合并参数
    _this.opts = $.fn.extend(true, {}, _option, options || {});
  },
  /**/
  init: function (options) {
    this.setOptions(options);
    this.initParams();
    this.createCanvas();
    this.requestPosition();   //加载地图坐标
    this.requestPath();   //加载地图路径
    this.bindEvent();
    this.creatToolTip();
  },
  /*
   * 地图图形的初始化方法
   * */
  initParams: function () {
    var _this = this;
    /**/
    _this.dom = document.getElementById(_this.opts.domId);
    _this.point = {};

    //svg的namespace命名空间
    _this.SVG_NS = "http://www.w3.org/2000/svg";

    //地图宽度和高度比例
    //MAP_RATE: 1.22,
    _this.MAP_RATE = 1;
    // _this.MAP_RATE = 1.22;

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
    _this.level = _this.opts.level;

    //定义全国数据
    _this.chinaData = null;
    //定义省份数据
    _this.cityData = null;
    _this.provinceKey = _this.opts.mapId;
    //创建一个矩阵
    _this.matrix = new Snap.Matrix(1, 0, 0, 1, 0, 0);
    /*获取浏览器大小*/
    _this.winW = parseFloat($(window).width());
    _this.winH = parseFloat($(window).height());
  },
  /*创建svg*/
  createCanvas: function () {
    var _this = this;
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
    _this.bgCanvas = _this.createWaper();
    //添加上对应的id
    _this.bgCanvas.setAttribute('id', 'svgMapBj');
    _this.group.appendChild(_this.bgCanvas);

    //创建一个画布，用于存放区域path集合
    _this.canvas = _this.createWaper();
    _this.canvas.setAttribute('id', 'svgPathBox');
    _this.group.appendChild(_this.canvas);

    //创建一个点的画布，用于存点的集合
    _this.textCanvas = _this.createWaper();
    _this.textCanvas.setAttribute('id', 'svgTextBox');
    _this.group.appendChild(_this.textCanvas);
    //创建一个点的(对应的点的)画布，用于存放点的集合
    _this.pointCanvas = _this.createWaper();
    _this.pointCanvas.setAttribute('id', 'svgPointBox');
    _this.group.appendChild(_this.pointCanvas);

    //向dom中添加svg内容
    _this.dom.appendChild(_this.svg);
    /*创建shadow的filter*/
    _this.shadowFilter = Snap(_this.svg).paper.filter(Snap.filter.shadow(0, 0, 4, _this.opts.mapStyle.stroke, 0.9));
  },
  /*
   * 更新配置
   * 计算出：地图的最大长宽
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
    // console.log('updateConfig:',_this.config)
  },
  /*请求地图的坐标数据*/
  requestPosition: function () {
    var _this = this;
    //如果全国数据是空的，则需要去请求对应的全国数据,再去加载对应的区域地图
    //否则直接加载对应的区域地图
    if (!_this.chinaData) {
      $.getJSON(_this.opts.dataUrl, function (map) {
        _this.chinaData = map;
        /*合并数据*/
        _this.fixedChinaData();
        //加载对应的区域
        _this.initPosition();
      });
    } else {
      //加载对应的区域
      _this.initPosition();
    }
  },
  /*
  * 请求地图的路径数据
  * @params callback 加载完路径之后的回调函数
  * */
  requestPath: function () {
    var _this = this;
    $.getJSON(_this.opts.mapJsonBasePath + _this.provinceKey + '.json', function (areaPoints) {
      //清空对应的元素
      _this.clearPath();
      _this.covertObj = {};
      for (var areaKey in areaPoints) {
        var covertObj = _this.convertToXYList(areaPoints[areaKey]);
        /*绘制路径*/
        _this.drawPath(covertObj.latLng, areaKey);
        //往对应的区域数据中里面去copy转换后的对象
        delete covertObj.latLng;
        _this.covertObj[areaKey] = covertObj;
      }
      // console.log(_this.covertObj)
      _this.fixedChinaData();
    });
  },
  /*对省市级单位坐标数据进行修正*/
  fixedChinaData: function () {
    var _this = this;
    if (_this.chinaData && _this.covertObj) {
      var areaData = null, data = null;
      //全国
      if (_this.level === 1) {
        data = _this.chinaData;
      }else {  //省份
        data=_this.getCoordinateByMapId(_this.provinceKey).list;
      }
      for (var key in data) {
        $.extend(data[key], this.covertObj[key]);
      }
      delete _this.covertObj;
      /*根据数据渲染地图*/
      _this.renderMapData();
    }
  },
  /*
   * 加载区域
   * */
  initPosition: function (key) {
    var _this = this;
    var areaData = null, data = null;
    //全国
    if (_this.level === 1) {
      areaData = _this.chinaData;
      data = _this.chinaData;
    } else {  //省份
      areaData=_this.getCoordinateByMapId(_this.provinceKey);
      data = areaData.list;
    }

    /*
    * 如果是三级行政区域且没有范围的，需要手动获取他们的范围
    *
    * */
    //绘制对应的区域
    _this.matrixArea(_this.provinceKey, areaData, data, _this.provinceKey);
  },
  /*
   * 绘制对应的区域
   * */
  matrixArea: function (key, areaData, data) {
    var _this = this;
    //路径矩阵变换对象
    var pathMatrixObj = {
      s: 1,
      translate: [0, 0]
    };
    /*获取*/
    var areaCenter, ratio, translate;
    if (_this.level > 1) {
      areaCenter = areaData.center;
      ratio = _this.getRatio(areaData.range);
      translate = [_this.config.width / 2 - areaCenter[0] - (_this.config.width * ratio / 2 - _this.config.width / 2) / ratio,
        _this.config.height / 2 - areaCenter[1] - (_this.config.height * ratio / 2 - _this.config.height / 2) / ratio];
    } else {
      /*
      * 解决去掉全国地图的460300导致的地图过小问题
      * 1、去掉后地图的长宽比为1.2,通过bbox获取的
      * */
      let ratioNation = 1.2;
      /*获取当前地图的长宽*/
      let nation = {
        width: this.config.width,
        height: this.config.width / ratioNation,
      };
      let dom = {
        width: _this.dom.offsetWidth,
        height: _this.dom.offsetHeight,
      }
      /*获取当前地图填满区域的长宽比*/
      ratioNation = Math.min(dom.width / nation.width, dom.height / nation.height);
      areaCenter = [nation.width * ratioNation / 2, nation.height * ratioNation / 2];
      ratio = ratioNation;
      translate = [dom.width / 2 - areaCenter[0] - this.config.marginLeft, dom.height / 2 - areaCenter[1]];
    }
    pathMatrixObj.s = ratio;
    pathMatrixObj.translate = translate;
    // console.log('pathMatrixObj--------->:',pathMatrixObj)


    _this.matrix = new Snap.Matrix(1, 0, 0, 1, 0, 0);
    _this.matrix.translate(_this.config.marginLeft, _this.config.marginTop);

    _this.matrix.scale(pathMatrixObj.s, pathMatrixObj.s);
    _this.matrix.translate(pathMatrixObj.translate[0], pathMatrixObj.translate[1]);

    //如果到省级，则需要对地图进行缩放和平移
    //如果是省级，则赋值对应的省级的数据
    if (_this.level === 2) {
      _this.cityData = data;
    }
  },
  /*
   * 获取比值
   * */
  getRatio: function (range) {
    var n = range.right - range.left,
      a = range.bottom - range.top;
    // console.log('getRatio-------->:',n,a,this.config.width ,this.config.height,this.config.width / n ,this.config.height / a);
    // return n > a ? this.config.width / n : this.config.height / a;
    return Math.min(this.config.width / n, this.config.height / a);
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
  * 渲染地图数据
  * */
  renderMapData() {
    let mapData;
    /*当同事存在地图数据，和业务数据的时候才渲染*/
    if (this.chinaData && this.opts.data) {
      /*获取地图的边界数据*/
      if (this.level == 1) {
        mapData = this.chinaData;
      } else {
        mapData=this.getCoordinateByMapId(this.provinceKey).list;
      }
      /*清除点*/
      this.clearPoint();
      /*遍历数据集合如果存在区域那么更新区域如果不存在那么就用点表示*/
      let mapDataLength=Object.keys(this.opts.data).length;
      /*计算热力图的颜色分布*/
      if(mapDataLength<5){
        /*只用一个色阶*/
        this.opts.heatMap=this.opts.heatMap1;
      }else if(mapDataLength<10){
        this.opts.heatMap=this.opts.heatMap2;
      }else if(mapDataLength<15){
        this.opts.heatMap=this.opts.heatMap3;
      }else{
        this.opts.heatMap=this.opts.heatMap5;
      }
      Object.keys(this.opts.data).forEach(mapId => {

        if (mapId in mapData) {
          this.renderArea(this.opts.data[mapId]);
        } else {
          let coordinate=this.getCoordinateByMapId(mapId);
          if(coordinate){
            let point =coordinate.textCenter;
            this.drawCircle(point, mapId);
          }else{
            console.log(mapId);
          }
        }
      })
    }
  },
  /*
  * 渲染地图区域
  * @params value 地图的数据元
  * */
  renderArea(value) {
    /*获取元素*/
    let id = 'mapid-' + value.mapId + '-outline';
    let _node = document.getElementById(id);
    if(_node){
      /*设置元素的指针为手型*/
      _node.style.cursor = "pointer";
      /*设置区域的热力*/
      /*设置随机的热力填充方式*/
      let heatMap = this.opts.heatMap5;
      _node.setAttribute('fill', heatMap[value.level]);
    }else {
      console.log(id, _node)
    }

  },
  /*
   * 创建对应的文本
   * */
  drawText: function (name, textPoint, mapId) {
    var _this = this;
    var _textStyle = _this.opts.textStyle;
    var text = _this.createElement("text");
    text.textContent = name;
    text.setAttribute('id', 'text_' + mapId);
    text.setAttribute('key', mapId);
    text.setAttribute('x', textPoint[0]);
    text.setAttribute("y", textPoint[1]);
    text.setAttribute('ox', textPoint[0]);
    text.setAttribute('oy', textPoint[1]);
    for (var key in _textStyle) {
      text.setAttribute(key, _textStyle[key]);
    }
    _this.textCanvas.appendChild(text);
    return text
  },
  /*
  * 添加点
  * mapData:地图数据
  * */
  drawCircle: function (point, mapId) {
    let _this = this;
    /*计算变换后的坐标*/
    point = this.convertToXY(point[0], point[1]);
    point = this.matrixTransform(point[0], point[1]);
    let _circleStyle = _this.opts.circleStyle;
    let comPoint = this.createElement('circle');
    comPoint.setAttribute('key', mapId);
    comPoint.setAttribute('cx', point[0]);
    comPoint.setAttribute('cy', point[1]);
    for (let key in _circleStyle) {
      comPoint.setAttribute(key, _circleStyle[key]);
    }
    this.pointCanvas.appendChild(comPoint);
  },
  /*
   * 绘制区域
   * */
  drawPath: function (latLng, mapId) {
    var _this = this;
    var _mapStyle = _this.opts.mapStyle;
    var path = this.drawCanvas(latLng);
    //设置对应的属性
    path.setAttribute('key', mapId);
    path.setAttribute('id', 'mapid-' + mapId + '-outline');
    for (var key in _mapStyle) {
      path.setAttribute(key, _mapStyle[key]);
    }
    _this.canvas.appendChild(path);
  },
  /*绑定地图事件*/
  bindEvent(){
    /*绑定鼠标事件*/
    this.bindMouseEvent();
    /*绑定window事件*/
    this.bindWindowEvent();
  },

  /*
  * 绑定页面事件
  * */
  bindMouseEvent: function () {
    var _this = this;
    /*用于存放当前处于过渡阶段的元素*/
    _this.animateKey = null;
    /*鼠标滑动事件*/
    $(this.svg).mousemove(function (event) {
      event = event || window.event;
      var $target = $(event.target),
        key = $target.attr("key"),
        data = _this.opts.data[key];
      if (key && data) {
        _this.updateToolTipPosition(event);
        /*如果不一致*/
        if (key != _this.animateKey) {
          _this.updateToolTipData(data);
          this.animateKey && _this.renderMouseOut(this.animateKey);
          _this.renderMouseIn(key);
          this.animateKey = key;
        }
      } else if (this.animateKey) {
        /*移出*/
        _this.renderMouseOut(this.animateKey);
        _this.toolTip.hide();
        this.animateKey = null;
      }
    }).mouseleave(function () {
      /*移出*/
      _this.renderMouseOut(this.animateKey);
      _this.toolTip.hide();
      this.animateKey = null;
    }).mousedown(function (event) {
      event = event || window.event;
      var $target = $(event.target),
        key = $target.attr("key");
        _this.opts.clickCallback(key);
    })
  },

  /*
  * 绑定window事件
  * */
  bindWindowEvent(){
    window.addEventListener('resize',event=> {
      /*重新初始化一下参数*/
      this.windowResizeHandler();
    })
  },

  /*
  * 浏览器缩放事件处理
  * */
  windowResizeHandler(){
    /*重新计算依赖*/
    this.resetStatus();
    /*清除标记的点*/
    this.clearPoint();
    /*重新加载路径*/
    this.requestPath();
    /*重新计算坐标*/
    this.initPosition();
  },
  /*
  * 重新计算区域的边界，以便于缩放
  * */
  resetStatus(){
    let oldWidth= this.config.width;
    let oldHeight= this.config.height;
    /*重新配置宽高*/
    this.config.width= this.dom.offsetWidth;
    this.config.height= this.dom.offsetHeight;
    /*获取浏览器大小*/
    this.winW = parseFloat($(window).width());
    this.winH = parseFloat($(window).height());
    this.updateConfig();
    /*如果是非全国的机构缩放，那么需要重新计算边界*/
    if(this.provinceKey!='000000'){
      /*找到当前区域的边界*/
      let range=this.getCoordinateByMapId(this.provinceKey).range;
      let center=this.getCoordinateByMapId(this.provinceKey).center;
      range={
        left:range.left*this.config.width/oldWidth,
        right:range.right*this.config.width/oldWidth,
        top:range.top*this.config.height/oldHeight,
        bottom:range.bottom*this.config.height/oldHeight,
      }
      center = this.calcCenter(range);
      this.getCoordinateByMapId(this.provinceKey).range=range;
      this.getCoordinateByMapId(this.provinceKey).center=center;
    }
  },

  renderMouseIn: function (key) {
    var _this = this;
    var _node = document.getElementById('mapid-' + key + '-outline');
    var _filter = 'url(#' + _this.shadowFilter.node.id + ')';
    if (_node) {
      _node.setAttribute('filter', _filter);
      _this.canvas.append(_node);
    }
  },
  renderMouseOut: function (key) {
    var _node = document.getElementById('mapid-' + key + '-outline');
    if (_node) {
      _node.removeAttribute('filter')
    }

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
    for (var i = 0; i < points.length; i++) {
      for (var j = 0; j < points[i].length; j++) {

        points[i][j] = _this.convertToXY(points[i][j][0], points[i][j][1]);
        _this.calcRange(convertObj.range, points[i][j]);
        points[i][j] = _this.matrixTransform(points[i][j][0], points[i][j][1]);
      }
    }
    //计算中心坐标
    convertObj.center = _this.calcCenter(convertObj.range);
    //convertObj.center = _this.matrixTransform(convertObj.center[0], convertObj.center[1]);
    convertObj.latLng = points;
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
  // 创建提示框
  creatToolTip: function () {
    var _this = this;
    if (!_this.toolTip) {
      // 提示框
      _this.toolTip = $('<div  class="map-tip" id="mapTip">' +
        '<h3 class="title"></h3>' +
        '<p class="info"><span class="lable">：</span><span class="value"></span>元</p>' +
        '<p class="info"><span class="lable">预收件数：</span><span class="value"></span>件</p>' +
        '<p class="info"><span class="lable">预收活动人力：</span><span class="value"></span>人</p>' +
        '</div>');
      _this.toolTip.appendTo('body');
    }
  },
  /*更新提示框位置*/
  updateToolTipPosition: function (event) {
    var _this = this;
    /*定位提示框位置*/
    var _event = event || window.event;
    var delt = 5;
    var left = parseFloat(_event.pageX) + 20;
    var top = parseFloat(_event.pageY);
    var tipW = parseFloat(_this.toolTip.width());
    var tipH = parseFloat(_this.toolTip.height());
    if ((left + tipW + delt) > _this.winW) {
      left = _this.winW - tipW - delt;
    }
    if ((top + tipH + delt) > _this.winH) {
      top = _this.winH - tipH - delt;
    }
    _this.toolTip.css({
      display: 'block',
      left: left,
      top: top
    });
  },
  /*更新提示框数据*/
  updateToolTipData: function (data) {
    var _this = this;
    if (data) {
      // 修改委托的数量
      _this.toolTip.find('.title').text(data.orgName);
      _this.toolTip.find('.value').eq(0).text(_this.formatter(data.totalFee));
      _this.toolTip.find('.value').eq(1).text(_this.formatter(data.totalPolicy));
      _this.toolTip.find('.value').eq(2).text(_this.formatter(data.totalKpi));
    }
  },
  /*
   * 绘制画布
   * */
  drawCanvas: function (points) {
    var _this = this;
    // var dArr = [];  //路径数组
    var _result = '';
    var path = _this.createElement("path"); //创建对应的路径
    for (var i = 0; i < points.length; i++) {
      for (var j = 0; j < points[i].length; j++) {
        _result += (0 === j ? "M" : "L") + points[i][j][0] + " " + points[i][j][1] + ' ';
      }
      _result += "L" + points[i][0][0] + " " + points[i][0][1] + " Z" + ' ';
    }
    path.setAttribute("d", _result);
    return path;
  },
  /*
   * 创建一个画布
   * */
  createWaper: function () {
    var _this = this;
    //创建一个空的画布
    var canvas = _this.createElement('g');
    return canvas;
  },
  /*
  * 刷新地图
  * */
  updateMap: function (mapId, level, option) {
    // 合并参数
    if (option) {
      this.opts = $.fn.extend(true, {}, this.opts, option || {});
    }
    this.provinceKey = mapId;
    /*清空地图数据*/
    this.opts.data={};
    this.level = level;
    this.toolTip.hide();
    /*清除标记的点*/
    this.clearPoint();
    /*重新加载路径*/
    this.requestPath();
    /*重新计算坐标*/
    this.initPosition();
  },
  /*
  * 刷新地图的数据
  * */
  updateData: function (data) {
    this.opts.data = data;
    /*渲染地图数据*/
    this.renderMapData();
  },
  /*
   * 创建svg元素
   * @param {String} qualifiedName 要创建的元素的类型的字符串
   * */
  createElement: function (qualifiedName) {
    return document.createElementNS(this.SVG_NS, qualifiedName);
  },
  /*
   * 清空元素
   * */
  clear: function () {
    var _this = this;
    //清空path画布
    _this.clearPath()
    //清空text画布
    _this.clearText();
    //清空点的画布
    _this.clearPoint();
  },
  //清空path画布
  clearPath: function () {
    var _this = this;
    //清空text画布
    for (; _this.canvas.childNodes.length > 0;) {
      _this.canvas.removeChild(_this.canvas.childNodes[0]);
    }
  },
  //清空text画布
  clearText: function () {
    var _this = this;
    //清空text画布
    for (; _this.textCanvas.childNodes.length > 0;) {
      _this.textCanvas.removeChild(_this.textCanvas.childNodes[0]);
    }
  },
  //清空点的画布
  clearPoint: function () {
    var _this = this;
    //清空text画布
    for (; _this.pointCanvas.childNodes.length > 0;) {
      _this.pointCanvas.removeChild(_this.pointCanvas.childNodes[0]);
    }
  },
  /*
  * 获取mapId的坐标信息
  * @params mapId 地图的坐标
  * */
  getCoordinateByMapId(mapId) {
    /*获取最初的数据来源*/
    let source = this.chinaData;
    /*寻找一级机构*/
    let firstCode = mapId.substring(0, 2).padEnd(6, 0);
    /*寻找二级机构*/
    let secondCode = mapId.substring(0, 4).padEnd(6, 0);
    /*如果是一级机构，直接获取数据*/
    if (firstCode == mapId) {
      return source[firstCode];
    } else {
      source = source[firstCode].list;
    }
    /*如果是二级机构*/
    if (secondCode == mapId) {
      return source[secondCode];
    } else {
      /*三级机构*/
      return source[secondCode].list[mapId];
    }
  },
  // 数据格式化
  formatter: function (count) {
    if(count>10000){
      return (count / 10000).toFixed(2) + '万';
    }else{
      return count;
    }
  },
};
