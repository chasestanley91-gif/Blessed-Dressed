/**
 * 量体属性对象
 * @constructor
 */
function Propers(){}

/**
 * 初始化及数据加载
 */
Propers.prototype.init = function(){

    var properSetList = null;
    var customSetList = null;
    var custompSetList = null;
    var custommSetList = null;

    var spras = I18nUtil.getSprasLang();
    var condProper = {
    	spras : [{SIGN: "I", OPTION: "EQ", LOW: spras, HIGH: ""}]
    };
    var condCustom = {
          propt : [{ SIGN: "I", OPTION: "EQ", LOW: "ISCSU", HIGH: ""}, { SIGN: "I", OPTION: "EQ", LOW: "DRAWI", HIGH: ""}, {SIGN: "I", OPTION: "EQ", LOW: "MEASU", HIGH: ""},
              {SIGN: "I", OPTION: "EQ", LOW: "DRESH", HIGH: ""}, {SIGN: "I", OPTION: "EQ", LOW: "DRESI", HIGH: ""}, {SIGN: "I", OPTION: "EQ", LOW: "TESTP", HIGH: ""}],
          spras : [{ SIGN: "I", OPTION: "EQ", LOW: spras, HIGH: ""}],
          ordtp : [{ SIGN: "I", OPTION: "EQ", LOW: "C", HIGH: ""}, { SIGN: "I", OPTION: "EQ", LOW: "J", HIGH: ""}],
          loekz : [{ SIGN: "I", OPTION: "NE", LOW: "X", HIGH: ""}]};
    var condCustomp = {
    		propt : [{FIELD: "PROPT", SIGN: "I", OPTION: "EQ", LOW: "RMIMG", HIGH: ""}, {FIELD: "PROPT", SIGN: "I", OPTION: "EQ", LOW: "URGEN", HIGH: ""}],
    		spras : [{FIELD: "SPRAS", SIGN: "I", OPTION: "EQ", LOW: spras, HIGH: ""}],
    		ordtp : [{FIELD: "ORDTP", SIGN: "I", OPTION: "EQ", LOW: "C", HIGH: ""},{FIELD: "ORDTP", SIGN: "I", OPTION: "EQ", LOW: "J", HIGH: ""}],
    		loekz : [{FIELD: "LOEKZ", SIGN: "I", OPTION: "NE", LOW: "X", HIGH: ""}]};
    var request = {
    		"COND_PROPER": condProper,
            "COND_CUSTOM": condCustom,
            "COND_CUSTOMP": condCustomp
    };

    // var spras = I18nUtil.getSprasLang();
    // var condProper = {
    // 	spras : [{SIGN: "I", OPTION: "EQ", LOW: spras, HIGH: ""}],
    //     regio : [{SIGN: "I", OPTION: "CP", LOW: "*", HIGH: ""}],
    //     counc : [{SIGN: "I", OPTION: "CP", LOW: "*", HIGH: ""}],
    //     loekz : [{SIGN: "I", OPTION: "NE", LOW: "X", HIGH: ""}],
    //     fieldname : [{SIGN: "I", OPTION: "CP", LOW: "*", HIGH: ""}],
    // };
    // var condCustom = {
    //     propt : [{ SIGN: "I", OPTION: "EQ", LOW: "ISCSU", HIGH: ""}, { SIGN: "I", OPTION: "EQ", LOW: "DRAWI", HIGH: ""}, {SIGN: "I", OPTION: "EQ", LOW: "MEASU", HIGH: ""},
    //         { SIGN: "I", OPTION: "EQ", LOW: "DRESH", HIGH: ""},{ SIGN: "I", OPTION: "EQ", LOW: "DRESI", HIGH: ""}],
    //     spras : [{ SIGN: "I", OPTION: "EQ", LOW: spras, HIGH: ""}],
    //     mtypb : [{ SIGN: "I", OPTION: "CP", LOW: "*", HIGH: ""}],
    //     ordtp : [{ SIGN: "I", OPTION: "EQ", LOW: "C", HIGH: ""}, { SIGN: "I", OPTION: "EQ", LOW: "J", HIGH: ""}],
    //     loekz : [{ SIGN: "I", OPTION: "NE", LOW: "X", HIGH: ""}]};
    // var condCustomp = {
    //     propt : [{FIELD: "PROPT", SIGN: "I", OPTION: "EQ", LOW: "RMIMG", HIGH: ""}, {FIELD: "PROPT", SIGN: "I", OPTION: "EQ", LOW: "URGEN", HIGH: ""}],
    //     spras : [{FIELD: "SPRAS", SIGN: "I", OPTION: "EQ", LOW: spras, HIGH: ""}],
    //     ordtp : [{FIELD: "ORDTP", SIGN: "I", OPTION: "EQ", LOW: "C", HIGH: ""},{FIELD: "ORDTP", SIGN: "I", OPTION: "EQ", LOW: "J", HIGH: ""}],
    //     loekz : [{FIELD: "LOEKZ", SIGN: "I", OPTION: "NE", LOW: "X", HIGH: ""}]};
    // var condCustomm = {
    //     propt : [{ SIGN: "I", OPTION: "EQ", LOW: "DRAWI", HIGH: ""}],
    //     mtypb : [{ SIGN: "I", OPTION: "CP", LOW: "*", HIGH: ""}],
    //     prope : [{ SIGN: "I", OPTION: "CP", LOW: "B", HIGH: ""}]};
    // var request = {
    // 		"COND_PROPER": condProper,
    //         "COND_CUSTOM": condCustom,
    //         "COND_CUSTOMP": condCustomp,
    //         "COND_CUSTOMM": condCustomm
    // };

    // var spras = I18nUtil.getSprasLang();
    // var condProper = [
    //     {FIELD: "REGIO", SIGN: "I", OPTION: "CP", LOW: "*", HIGH: ""},
    //     {FIELD: "COUNC", SIGN: "I", OPTION: "CP", LOW: "*", HIGH: ""},
    //     {FIELD: "SPRAS", SIGN: "I", OPTION: "EQ", LOW: spras, HIGH: ""},
    //     {FIELD: "LOEKZ", SIGN: "I", OPTION: "NE", LOW: "X", HIGH: ""},
    //     {FIELD: "FIELDNAME", SIGN: "I", OPTION: "CP", LOW: "*", HIGH: ""}];
    // var condCustom = [
    //     {FIELD: "PROPT", SIGN: "I", OPTION: "EQ", LOW: "ISCSU", HIGH: ""},
    //     {FIELD: "PROPT", SIGN: "I", OPTION: "EQ", LOW: "DRAWI", HIGH: ""},
    //     {FIELD: "PROPT", SIGN: "I", OPTION: "EQ", LOW: "MEASU", HIGH: ""},
    //     {FIELD: "PROPT", SIGN: "I", OPTION: "EQ", LOW: "DRESH", HIGH: ""},
    //     {FIELD: "PROPT", SIGN: "I", OPTION: "EQ", LOW: "DRESI", HIGH: ""},
    //     {FIELD: "MTYPB", SIGN: "I", OPTION: "CP", LOW: "*", HIGH: ""},
    //     {FIELD: "SPRAS", SIGN: "I", OPTION: "EQ", LOW: spras, HIGH: ""},
    //     {FIELD: "ORDTP", SIGN: "I", OPTION: "EQ", LOW: "C", HIGH: ""},
    //     {FIELD: "ORDTP", SIGN: "I", OPTION: "EQ", LOW: "J", HIGH: ""},
    //     {FIELD: "LOEKZ", SIGN: "I", OPTION: "NE", LOW: "X", HIGH: ""}];
    // var condCustomp = [
    //     {FIELD: "PROPT", SIGN: "I", OPTION: "EQ", LOW: "URGEN", HIGH: ""},
    //     {FIELD: "PROPT", SIGN: "I", OPTION: "EQ", LOW: "RMIMG", HIGH: ""},
    //     {FIELD: "SPRAS", SIGN: "I", OPTION: "EQ", LOW: spras, HIGH: ""},
    //     {FIELD: "ORDTP", SIGN: "I", OPTION: "EQ", LOW: "C", HIGH: ""},
    //     {FIELD: "ORDTP", SIGN: "I", OPTION: "EQ", LOW: "J", HIGH: ""},
    //     {FIELD: "LOEKZ", SIGN: "I", OPTION: "NE", LOW: "X", HIGH: ""}];
    // var condCustomm = [
    //     {FIELD: "PROPT", SIGN: "I", OPTION: "EQ", LOW: "DRAWI", HIGH: ""},
    //     {FIELD: "MTYPB", SIGN: "I", OPTION: "CP", LOW: "*", HIGH: ""},
    //     {FIELD: "PROPE", SIGN: "I", OPTION: "CP", LOW: "B", HIGH: ""}];
    // var request = {
    //     "COND_PROPER": condProper,
    //     "COND_CUSTOM": condCustom,
    //     "COND_CUSTOMP": condCustomp,
    //     "COND_CUSTOMM": condCustomm
    // }
    $.ajax({
        type: 'POST',
        url: "/eis/measureData/getDictionary/" + spras,
        contentType: "application/json;charset=utf-8",
        async: false,
        cache: false,
        dataType: 'json',
        data: JSON.stringify(request),
        success: function (result, status, xhr) {
            if(result.flag == "SUCCESS"){

            	properSetList = result.data.PROPER;
                customSetList = result.data.CUSTOM;
                custompSetList = result.data.CUSTOMP;
                custommSetList = result.data.CUSTOMM;
            }else{
                var msg = result.msgList[0];
                alert(I18nUtil.getProp('common_js_alert_59') + msg );
            }
        },
        error: function (xhr, status, error) {
            alert(I18nUtil.getProp('common_js_alert_59'));
        }
    });
    this.properSetList = properSetList;
    this.customSetList = customSetList;
    this.custompSetList = custompSetList;
    this.custommSetList = custommSetList;
}

/**
 * 初始化品类数据加载
 */
Propers.prototype.CategoryInits = function(){

    var properSetList = null;

    var spras = I18nUtil.getSprasLang();
    var condProper = {
        spras : [{SIGN: "I", OPTION: "EQ", LOW: spras, HIGH: ""}]
    };
    var condCustom = {
        propt : [{ SIGN: "I", OPTION: "EQ", LOW: "ISCSU", HIGH: ""}, { SIGN: "I", OPTION: "EQ", LOW: "DRAWI", HIGH: ""}, {SIGN: "I", OPTION: "EQ", LOW: "MEASU", HIGH: ""},
            {SIGN: "I", OPTION: "EQ", LOW: "DRESH", HIGH: ""}, {SIGN: "I", OPTION: "EQ", LOW: "DRESI", HIGH: ""}],
        spras : [{ SIGN: "I", OPTION: "EQ", LOW: spras, HIGH: ""}],
        ordtp : [{ SIGN: "I", OPTION: "EQ", LOW: "C", HIGH: ""}, { SIGN: "I", OPTION: "EQ", LOW: "J", HIGH: ""}],
        loekz : [{ SIGN: "I", OPTION: "NE", LOW: "X", HIGH: ""}]};
    var condCustomp = {
        propt : [{FIELD: "PROPT", SIGN: "I", OPTION: "EQ", LOW: "RMIMG", HIGH: ""}, {FIELD: "PROPT", SIGN: "I", OPTION: "EQ", LOW: "URGEN", HIGH: ""}],
        spras : [{FIELD: "SPRAS", SIGN: "I", OPTION: "EQ", LOW: spras, HIGH: ""}],
        ordtp : [{FIELD: "ORDTP", SIGN: "I", OPTION: "EQ", LOW: "C", HIGH: ""},{FIELD: "ORDTP", SIGN: "I", OPTION: "EQ", LOW: "J", HIGH: ""}],
        loekz : [{FIELD: "LOEKZ", SIGN: "I", OPTION: "NE", LOW: "X", HIGH: ""}]};
    var request = {
        "COND_PROPER": condProper,
        "COND_CUSTOM": condCustom,
        "COND_CUSTOMP": condCustomp
    };

    $.ajax({
        type: 'POST',
        url: "/eis/measureData/getCategoryDictionary/" + spras,
        contentType: "application/json;charset=utf-8",
        async: false,
        cache: false,
        dataType: 'json',
        data: JSON.stringify(request),
        success: function (result, status, xhr) {
            if(result.flag == "SUCCESS"){

                properSetList = result.data.PROPER;
            }else{
                var msg = result.msgList[0];
                alert(I18nUtil.getProp('common_js_alert_59') + msg );
            }
        },
        error: function (xhr, status, error) {
            alert(I18nUtil.getProp('common_js_alert_59'));
        }
    });
    this.properSetList = properSetList;
}
/**
 * 根据分类获取数据集合
 * @param fieldName
 * @returns {ProperSet}
 */
Propers.prototype.get = function(fieldName){

    var properSet = this.properSetList[fieldName];
    return new ProperSet(properSet);
}
Propers.prototype.getByValue = function(fieldName, value){

    var properSet = this.properSetList[fieldName];
    var properList = properSet.properList;
    var _item = null;
    if(!properList || properList.length == 0){
        return _item;
    }
    for(var i = 0; i < properList.length; i++){
        var item = properList[i];
        if(item.value == value){
            _item = item;
            break;
        }
    }
    return _item;
}
/**
 * 根据分类及组代码获取数据
 * @param fieldName
 * @param group
 * @returns {ProperSet}
 */
Propers.prototype.getByGroup = function(fieldName, group){

    var properSet = this.properSetList[fieldName];
    var _properSet = {};
    if(!properSet){
        _properSet.properList = new Array();
    }else{
        var _properList = new Array();
        var properList = properSet.properList;
        for(var i = 0; i < properList.length; i++){
            var item = properList[i];
            if(item.fgroup == group){
                _properList.push(item);
            }
        }
        _properSet.properList = _properList;
    }
    return new ProperSet(_properSet);
}

Propers.prototype.getByValues = function(fieldName, values){

    var properSet = this.properSetList[fieldName];
    var _properSet = {};
    if(!properSet){
        _properSet.properList = new Array();
    }else{
        var _properList = new Array();
        var properList = properSet.properList;
        for(var i = 0; i < properList.length; i++){
            var item = properList[i];
            if(values[item.value]){
                _properList.push(item);
            }
        }
        _properSet.properList = _properList;
    }
    return new ProperSet(_properSet);
}

Propers.prototype.getCustoms = function(ordtp, mtypb, propt){

    var customs = [];
    var customSetList = this.customSetList;
    if(!customSetList){
        return customs;
    }
    var _customs = customSetList[propt];
    if(!_customs){
        return customs;
    }
    for(var i = 0; i < _customs.length; i++){
        var custom = _customs[i];
        if(custom.ordtp == ordtp && custom.mtypb == mtypb){
            customs.push(custom);
        }
    }
    return customs;
}


Propers.prototype.getCustom = function(ordtp, mtypb, propt, prope){

    var custom = null;
    var customSetList = this.customSetList;
    if(!customSetList){
        return null;
    }
    var _customs = customSetList[propt];
    if(!_customs){
        return custom;
    }
    for(var i = 0; i < _customs.length; i++){
        var _custom = _customs[i];
        if(_custom.ordtp == ordtp && _custom.mtypb == mtypb && _custom.prope == prope){
            custom = _custom;
            break;
        }
    }
    return custom;
}

Propers.prototype.getCustomps = function(ordtp, mtypb, propt, lgrog, lgrop){

    var customps = [];
    var custompSetList = this.custompSetList;
    if(!custompSetList){
        return customps;
    }
    var _customps = custompSetList[propt];
    if(!_customps){
        return customps;
    }
    for(var i = 0; i < _customps.length; i++){
        var _customp = _customps[i];
        if(_customp.ordtp == ordtp && _customp.mtypb == mtypb && _customp.lgrog == lgrog && _customp.lgrop == lgrop){
            customps.push(_customp);
        }
    }
    return customps;
}

Propers.prototype.getCustompsV2 = function(ordtp, mtypb, propt, lgrog){

    var customps = [];
    var custompSetList = this.custompSetList;
    if(!custompSetList){
        return customps;
    }
    var _customps = custompSetList[propt];
    if(!_customps){
        return customps;
    }
    for(var i = 0; i < _customps.length; i++){
        var _customp = _customps[i];
        if(_customp.ordtp == ordtp && _customp.mtypb == mtypb && _customp.lgrog == lgrog){
            customps.push(_customp);
        }
    }
    return customps;
}

/**
 * 单一属性集合
 * @param properSet
 * @constructor
 */
function ProperSet(properSet){
    this.properSet = properSet;
}

ProperSet.prototype.toHtml = function(){

    var _html = "";
    if(!this.properSet){
        return _html;
    }
    var list = this.properSet.properList;
    for(var i = 0; i < list.length; i++){
        var item = list[i];
        _html += "<option value='" + item.value + "' class='mtypb_sel_option' fgroup='"+item.fgroup+"'>" + item.detail + "</option>";
    }
    return _html;
}

/**
 * 单一属性集合
 * @param properSet
 * @constructor
 */
function ProperSet(properSet){
    this.properSet = properSet;
}

ProperSet.prototype.toHtml = function(){

    var _html = "";
    if(!this.properSet){
        return _html;
    }
    var list = this.properSet.properList;
    for(var i = 0; i < list.length; i++){
        var item = list[i];
        _html += "<option value='" + item.value + "' class='mtypb_sel_option' fgroup='"+item.fgroup+"'>" + item.detail + "</option>";
    }
    return _html;
}




/**
 * 属性集合转换成html代码
 */
ProperSet.prototype.toHtmlWithEmptyOption = function(){

    var _html = this.toHtml();
    _html = "<option value='' class='mtypb_sel_option'>&nbsp;</option>" + _html;
    return _html;
}
/**
 * 根据代码找到对应的配置项
 * @param code
 * @returns {*}
 */
ProperSet.prototype.find = function(code){

    var _item = null;
    var list = this.properSet.properList;
    for(var i = 0; i < list.length; i++){
        var item = list[i];
        if(item.value == code){
            _item = item;
            break;
        }
    }
    return _item;
}
