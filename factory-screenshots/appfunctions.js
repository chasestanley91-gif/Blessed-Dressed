var appfunctions = {
    showTemplateSelectionPanel : function() {
        App.selectedCategory = $(".hActive2").attr("value");
        App.selectedCategoryName = $(".hActive2").attr("name");
        App.selectedSexty = $(".hActive2").attr("sexty");
        App.selectedTempDtlData = {};
        if (App.selectedCategory != null) {
            layer.open({
                type: 1
                , title: I18nUtil.getProp('template_selection')
                , id: 'RemarkLayer' //防止重复弹出
                , area: '800px'
                , skin: "hLayer"
                , content: $("#TemplateSelectionTpl").html()
                , btn: [I18nUtil.getProp('common_27')]
                , btnAlign: 'r' //按钮居中
                , shade: 0.3 //不显示遮罩
                , success: function () {
                    //初始化列表数据
                    appfunctions.initTempSelection();
                    layui.form.render();
                    appfunctions.bindSearchEvent();
                    product.initI18n();
                    // App.bindHiddenOptEvent();
                }
                , yes: function () {
                    layer.closeAll();
                    //获取被选择的DtlList数据
                    var selectedDtlList = appfunctions.getSelectedDtlList();
                    if (selectedDtlList.length == 0){
                        alert(I18nUtil.getProp('common_js_alert_167'));
                        return;
                    }
                    // if (App.isSuitCategory()){
                    //     if (!App.validateSelectedDtlList(selectedDtlList)){
                    //         alert(I18nUtil.getProp('common_js_alert_168'));
                    //         return;
                    //     }
                    // }
                    //传递数据到后端
                    //这边是直接创建品类了,还需要考虑
                    appfunctions.addCategoryWithTemp(selectedDtlList);
                }
            });
        } else {
            alert(I18nUtil.getProp('common_prompt_16'));
        }
    },
    addCategoryWithTemp : function(selectedDtlList){
        App.tempDtlCondition = selectedDtlList;
        var request = selectedDtlList;
        //获取模板数据
        var _url = "/eis/customTemp/getTempDtlListByTempIdAndDtlIdList";
        $.ajax({
            type: 'POST',
            url: _url,
            contentType: "application/json;charset=utf-8",
            async: false,
            cache: false,
            dataType: 'json',
            data : JSON.stringify(request),
            success: function (result, status, xhr) {
                if(result.flag == "SUCCESS"){
                    App.tempDtlDatas = result.data;

                    appfunctions.addTempCategory(App.tempDtlDatas);
                }else{
                    // alert(I18nUtil.getProp(''));
                    window.history.go(-1);
                }
            }
            ,error: function (xhr, status, error) {
                if (xhr.status === 401) {
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("eis_login_4")});
                } else {
                    //请求异常回调
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_38")});
                }
            }
        });
    },
    addTempCategory : function(tempDtlDatas) {
        if (appfunctions.isSuitCategoryBySelected()){
            var suitGroupId = App.getNextSuitGroupId();
            $.each(tempDtlDatas, function(idx, item) {
                App.addTempCategoryInOrderData(item, suitGroupId);
                App.renderOrderTab();
                $("#productNumber").html(App.orderData.length);
                $("#orderTab_"+(App.orderData.length-tempDtlDatas.length)).click();
            });
        } else {
            $.each(tempDtlDatas, function(idx, item) {
                App.addTempCategoryInOrderData(item);
                App.renderOrderTab();
                $("#productNumber").html(App.orderData.length);
                $("#orderTab_"+(App.orderData.length-1)).click();
            });
        }

    },
    isSuitCategoryBySelected : function() {
        var category = App.selectedCategory;
        if (product.isSuitCategory(category) ){
            return true;
        } else {
            return false;
        }
    },
    getSelectedDtlList : function() {
        var selectedDtlList = new Array();
        selectedDtlList = appfunctions.getSelectedTempDtlList();
        return selectedDtlList;
    },
    //获取选中的dtl
    getSelectedTempDtlList : function() {
        var selectedTempDtlData = App.selectedTempDtlData;
        var selectedTempDtlList = new Array();
        for(var field in selectedTempDtlData) {
            var custTempDtl = selectedTempDtlData[field];
            selectedTempDtlList.push(custTempDtl);
        }

        return selectedTempDtlList;
    },
    bindSearchEvent : function() {
        appfunctions.bindTempSearchInput();
        layui.form.on('submit(searchTemp-input-filter)', function(data){
            appfunctions.initTempSelection();
        });
    },
    bindTempSearchInput : function() {
        $(document).on("keydown", "#tempName", function (event) {
            if (event.keyCode == "13") {
                //回车执行查询
                $('#queryBtn').click();
            }
        })
    },
    initTempSelection : function() {
        var params = appfunctions.getSearchCondition();
        //获取模板数据
        appfunctions.getCustomTemp(params);
    },
    getSearchCondition : function (){
        var tempName = $('#tempName').val();
        //门店获取更换
        var kunnr = App.kunnr;
        var conditions = {
            tempName: tempName,
            username: loginAccount,
            kunnr: appfunctions.removeLeadingZeros(kunnr)
        };
        return conditions;
    },
    removeLeadingZeros : function (str){
        return str.replace(/^0+/, '');
    },
    getCustomTemp : function(params) {
        var _url = "/eis/customTemp/getUserCustomTempListFull";
        var request = {
            temp_name: params.tempName,
            username: params.username,
            kunnr: params.kunnr
        };
        $.ajax({
            type: 'POST',
            url: _url,
            contentType: "application/json;charset=utf-8",
            async: true,
            cache: false,
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (result) {
                if ('SUCCESS' == result.flag) {
                    console.log(result);
                    var data = result.data;
                    if (data.length == 0) {
                        $('#tempSearchListDisplay').html("<div style='text-align: center'>No Data</div>");
                        return;
                    } else {
                        // var mtypbs = "";
                        // $.each(data, function(index, item) {
                        //     $.each(item.customTempDtlList, function(index2, dtl) {
                        //         mtypbs = mtypbs + dtl.mtypb + ",";
                        //     })
                        // })
                        // if(mtypbs) {
                        //     mtypbs = mtypbs.slice(0, -1);
                        // }
                        // App.getZlCustomMapGroupByOrdtps(mtypbs);
                        layui.laytpl($("#custTempContainerTpl").html()).render(data, html => {
                            $("#tempSearchListDisplay").html(html);
                        });
                        layui.form.render();
                        appfunctions.bindSelectTempEvent();
                        // App.hideCustTempWithoutDtl();
                        if ($("table").find("tr[data-show='X']").length == 0){
                            $('#tempSearchListDisplay').html("<div style='text-align: center'>No Data</div>");
                        }
                    }
                } else {
                    console.error("Error: " + result.message);
                    alert(I18nUtil.getProp('common_js_alert_20'));
                }
            }
        });
    },
    bindSelectTempEvent : function() {
        layui.form.on('radio(selectTemp-radio-filter)', function(data){
            var elem = data.elem; // 获得 checkbox 原始 DOM 对象
            // var checked = elem.checked; // 获得 checkbox 选中状态
            var value = elem.value; // 获得 checkbox 值
            var temp_id = value;
            var mtypb = $(elem).attr("data-mtypb");
            var dtl_id = $(elem).attr("data-dtlid");
            App.selectedTempDtlData = {};
            if (product.isSuitCategory(mtypb)){
                var dtl_ids = dtl_id.split('|');
                for (var i=0 ;i < dtl_ids.length;i++){
                    var dtl_id = dtl_ids[i];
                    var index = temp_id + "_" + dtl_id;
                    App.selectedTempDtlData[index] = {temp_id : temp_id, dtl_id : dtl_id , mtypb : mtypb};
                }
            }else {
                var index = temp_id + "_" + dtl_id;
                App.selectedTempDtlData[index] = {temp_id : temp_id, dtl_id : dtl_id , mtypb : mtypb};
            }

        });
    },
    ishiddenCustTemp : function (mtypb) {
        var flag = true;
        var selectedMtypb = App.selectedCategory;
        if (selectedMtypb == mtypb) {
            flag = false;
        }
        return flag;
    },
    /**
     * 重新设置净尺量体信息
     * @returns {*}
     */
    validateNetSizeAndResetTransferResult : function() {
        var index = layer.load();
        setTimeout(() => {
            var orderData = App.orderData[App.tabIndex];
            var lrecp = orderData.lrecp;
            var lrecn = orderData.lrecn;
            var valid = validate(orderData);
            if(!valid){
                layer.close(layer.index);
                return valid;
            }

            var sizeDatas = measureSaver.getNetSizeAndGarmentSizeDatas();
            var netSizeDatas = sizeDatas.NET_SIZE;
            if(!netSizeDatas){
                layer.close(layer.index);
                return true;
            }
            var transferResult = measureSaver.getSizeTransferResult(sizeDatas);
            if(transferResult == null){
                layer.close(layer.index);
                alert(I18nUtil.getProp('common_js_alert_72', [lrecp]));
                return false;
            }

            valid = measureSaver.setSizeTransferResult(netSizeDatas, transferResult);
            if(!valid){
                layer.close(layer.index);
                return valid;
            }

            var zlrecm = new Zlrecm();
            zlrecm.MANDT = App.extraOrderInfo.mandt;
            zlrecm.LRECN = lrecn;
            zlrecm.LRECP = lrecp;
            zlrecm.PARTE = App.parte;
            //合并填充netZlrecm并且加载新尺寸
            measureSaver.fillNetSizeData2AndOverrideLrecm(lrecp,zlrecm,orderData);
            layer.close(layer.index);


            return valid;
        },10);


        function validate(orderData){
            if(!orderData.measurementController.net.isCompleted) {
                var requiredDesc = Object.values(orderData.measurementController.net.required);
                alert(I18nUtil.getProp('measurement_required', [orderData.Category.categoryName, orderData.lrecp, requiredDesc[0]]));
                return false;
            }
            return true;
        }
    },
    bindNetFieldClickEvent : function(e) {
        $("#Body").find("#netSizeVideo").hide();
        var field = $(e).attr("name");
        var mtypb = App.orderData[App.tabIndex].Category.mtypb;
        for(var i=0; i < App.netSizes.length; i++) {
            if(App.netSizes[i].mtypb && mtypb == App.netSizes[i].mtypb) {
                for(var j=0; j < App.netSizes[i].bookList.length; j++) {
                    var bookData = App.netSizes[i].bookList[j];
                    if(bookData.field && bookData.field == field) {
                        layui.laytpl($("#netSizeVideoTpl").html()).render(bookData, function(html) {
                            $("#Body").find("#netSizeVideo").html(html).show();
                            // setTimeout(function() {
                            //     $('#video')[0].play();
                            // }, 1000);
                        });
                        break;
                    }
                }
            }
        }
        var top = $(e).position().top - 500;
        // if(top > 260){
        //     top = 260;
        // }
        App.scrollMeasurementItem();
        // _product.find("div[name='div_netSize_table_ref'] div[name='lookCal']").on("click", function(){
        //     if($(this).attr("msg")){
        //         layer.confirm($(this).attr("msg"));
        //     }
        // });
    },
    // 图片预览
    getGarmentBigImg : function(e) {
        event.stopPropagation();
        var u = $(e).attr('imgUrl');
        var title = $(e).attr('title');
        layui.layer.open({
            skin: 'hLayerAuto'
            ,title: title
            ,btn:["Close"]
            ,content: '<div style="width:600px;height:600px;display:flex;align-items:center;justify-content:center;font-size:0;"><img style="width:600px;max-height:600px;" src="'+u+'"></div>'
        });
    },
    getKunnrBrandAndSet : function(kunnr)  {
        App.kunnr = kunnr;
        var request = {};
        request.kunnr = [rangeUtil.createEqStdRange(kunnr)];

        var _url = "/eis/measureData/getZlrbrand";
        $.ajax({
            type: 'POST',
            url: _url,
            contentType: "application/json;charset=utf-8",
            async: false,
            cache: false,
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (result, status, xhr) {
                var data = result.data;
                if (data.length > 0){
                    App.zlrres = data[0].resMap;
                }
                var brand = product.brandList.bxn.code;
                var _storeBrandInfo = null;
                if (result.flag == "SUCCESS") {
                    if(data && data.length > 0){
                        brand = data[0].spart;
                        App.brand = data[0].spart;
                        _storeBrandInfo = data[0];
                    }
                }
                // initAddrtComp(kunnr);
                // setBrandInfo(brand, kunnr);
                // product.setCubrds(_storeBrandInfo);
            },
            error: function (xhr, status, error) {
                // initAddrtComp(kunnr);
                var brand = product.brandList.bxn.code;
                App.brand = product.brandList.bxn.code;
                // setBrandInfo(brand, kunnr);
            }
        });

        function setBrandInfo(brand, kunnr){

            var isSpecialStore = brandController.isSpecialStore(kunnr);
            var brankComp = $("#storeModal").find("div[data-save-code='BRANK']");
            var brandPropSet = propers.get("BRAND").properSet.properList;
            var brankUserData = {isSpecialStore: isSpecialStore};
            new MTMTileOptionsComponent(product.getBrandComponentConfig(brand, "BRANK", "00000", brandPropSet, brankUserData, brankComp, product.brankChangeCallback));

//            var brankComp = $("#storeModal").find("select[data-save-code='BRANK']");
//            brankComp.val(brand);
//            var _products = $("div[name='product'][lrecp]");
//            for(var i = 0; i < _products.length; i++){
//                var _product = $(_products[i]);
//                var statu = _product.find("input[data-save-code='STATU']").val();
//                if(statu != product.statuList.newOrder.code
//                    && statu != product.statuList.orderReject.code){
//                    continue;
//                }
//                var brandComp = _product.find("select[data-save-code='BRAND']");
//                brandComp.val(brand);
//            }
        }
    },
    getMulityPartValue : function (field, zlrecp, valList){
        var _item = null;
        var _val = zlrecp.notep;
        if(!_val){
            return _item;
        }
        var desc = "";
        var _vals = _val.split("|");
        var _valMap = {};
        for(var i = 0; i < _vals.length; i++){
            _valMap[_vals[i]] = "X";
        }
        for(var i = 0; i < valList.length; i++){
            var valItem = valList[i];
            if(!_valMap[valItem.prope]){
                continue;
            }
            if(desc.length > 0){
                desc += "+";
            }
            desc += valItem.tprop;
        }
        return {val: _val, name: desc};
    },
    getCredit : function(kunnr)  {
        if(storeList.length == 0){
            return;
        }
        var params = {};
        params.KUNNRS = [{SIGN : "I", OPTION : "EQ", LOW : storeList[0], HIGH : ""}];

        params.KKBERS = [];
        $.ajax({
            type : "POST",
            contentType: "application/json;charset=utf-8",
            url : "/eis/measureData/getCredit",
            dataType : "json",
            cache: false,
            data : JSON.stringify(params),
            success : function(result) {
                if(result.flag == "SUCCESS"){
                    if(result.data.length > 0){
                        var cbal = result.data[0].cbal;
                        $('#balance').text(I18nUtil.getProp('balance')+" : " + cbal);
                    }else{
                        $('#balance').text(I18nUtil.getProp('balance')+" : 0");
                    }
                } else {

                }
            }
        });

    },


    // 视频预览
    getNetVideo : function(e) {
        event.stopPropagation();
        var u = $(e).attr('src');
        layui.layer.open({
            skin: 'hLayerAuto'
            ,title: 'Video Preview'
            ,btn:["Close"]
            ,content: '<div style="width:600px;height:600px;display:flex;align-items:center;justify-content:center;font-size:0;"><div class="hVideo"><video id="video" style="width: 100%;" controls poster="'+u+'"><source src="'+u+'" type="video/mp4"/></video></div></div>'
            ,success: function () {
                $('#video')[0].play();
            }
        });

    },
    assignTempZlrecp : function(zlrecps) {

        //第一步先排序

        var designDiv = $("div[name='design']");
        var mtypb = App.orderData[App.tabIndex].Category.mtypb;
        var modem = App.orderData[App.tabIndex].Pattern.modem;
        var data = measureCache.getModemParts(mtypb, modem);
        var reverseTable = partsLimitController.reverseTable;
        var mtypbReverseTable = partsLimitController.mtypbReverseTable;

        var sort_zlrecps = appfunctions.sortTempZlrecps(zlrecps, mtypb, data, reverseTable, mtypbReverseTable);
        var noMsg = true;
        for (var i in sort_zlrecps) {
            var valItem = sort_zlrecps[i];
            var field = valItem.propt;
            var value = valItem.prope;
            var notep = valItem.notep;
            var partItemDiv = designDiv.find("div[data-part-item='X'][name='" + field + "']");
            var partItemOptDiv = designDiv.find("div[data-part-item-opt='X'][name='" + field + "']");
            if (partItemDiv.length == 0) {
                continue;
            }
            if (partItemDiv.attr("data-force-flag") && partItemDiv.find("input").val()) {
                continue;
            }
            if (partItemDiv.find("input[data-save-code='" + field + "']").attr("data-disable-flag") && partItemDiv.find("input").val()) {
                continue;
            }

            if (product.isMulityPart(field)) {
                var vals = notep.split("|");
                for (var i in vals) {
                    if (!($(partItemOptDiv[0]).find("div[data-value='" + vals[i] + "']").hasClass("hActive"))) {
                        if ($(partItemOptDiv[0]).find("div[data-value='" + vals[i] + "']").length == 0){
                            continue;
                        }
                        App.selectDesign($(partItemOptDiv[0]).find("div[data-value='" + vals[i] + "']"),noMsg);
                    }
                }
            } else {
                if (!($(partItemOptDiv[0]).find("div[data-value='" + value + "']").hasClass("hActive"))) {
                    if ($(partItemOptDiv[0]).find("div[data-value='" + value + "']").length == 0){
                        continue;
                    }
                    App.selectDesign($(partItemOptDiv[0]).find("div[data-value='" + value + "']"),noMsg);
                }
            }
        }
    },


    sortTempZlrecp : function(zlrecps, field, mtypb, data, reverseTable, mtypbReverseTable)  {
        var parentFields = [];
        var sapParentFields = data.childParentRelation[field];
        var jsonParentField = "";
        if (mtypbReverseTable[mtypb] && mtypbReverseTable[mtypb][field]) {
            jsonParentField = mtypbReverseTable[mtypb][field].NAME;
        } else if (reverseTable[field]) {

            jsonParentField = reverseTable[field].NAME;
        }
        parentFields.concat(sapParentFields);
        if (jsonParentField){
            parentFields.push(jsonParentField);
        }


        //找到父部件，让父部件排序
        if (parentFields && parentFields.length > 0) {
            for (var i in parentFields) {
                var parentField = parentFields[i];
                //如果需要赋值的父亲存在且还未排序，就开启家族递归排序
                if ((App.orderData[App.tabIndex].temp_zlrecps[parentField])) {
                    if (!(App.orderData[App.tabIndex].temp_zlrecps[parentField].finshSort == "X")) {
                        //给自己的父亲赋值
                        appfunctions.sortTempZlrecp(zlrecps, parentField, mtypb, data, reverseTable, mtypbReverseTable);
                    }
                }
            }
        }
        App.orderData[App.tabIndex].temp_sort_zlrecps.push(zlrecps[field]);
        App.orderData[App.tabIndex].temp_zlrecps[field].finshSort = "X";
    },


    sortTempZlrecps : function(zlrecps, mtypb, data, reverseTable, mtypbReverseTable) {
        App.orderData[App.tabIndex].temp_sort_zlrecps = [];
        for (var i in zlrecps) {
            var valItem = zlrecps[i];
            var field = valItem.propt;
            if (App.orderData[App.tabIndex].temp_zlrecps[field].finshSort == "X"){
                continue;
            }
            appfunctions.sortTempZlrecp(zlrecps, field, mtypb, data, reverseTable, mtypbReverseTable);
        }
        return App.orderData[App.tabIndex].temp_sort_zlrecps;
    },
    getStorePatternConfig : function () {
    },

    getNetSizeBook : function() {
        var params = {spras:I18nUtil.getSprasLang()};
        $.ajax({
            type: 'POST',
            url: "/eis/tempData/getNetSizeBookList",
            contentType: "application/json;charset=utf-8",
            async: false,
            cache: false,
            dataType: 'json',
            data: JSON.stringify(params),
            success: function (result, status, xhr) {
                if(result.flag == "SUCCESS"){

                    netSizeBook = result.data;
                    var netSizes = [];
                    var netAdjs = [];
                    $.each(netSizeBook, function(idx, item) {
                        if(item.type == 'A') {
                            App.netAdjs.push(item);
                        } else if(item.type == 'N') {
                            App.netSizes.push(item);
                        } else if (item.type == 'G'){
                            App.garmentSizes.push(item);
                        }
                    });
                    $.each(App.netAdjs, function(idx, item) {
                        $.each(item.bookList, function(idx, item2) {
                            $.each(item2.dtls, function(idx, item3) {
                                var id = item.mtypb + item2.field + item3.val;
                                var options = {
                                    name : item3.desc,
                                    text : item3.text,
                                    imgUrl : item3.imgUrl,
                                    videoUrl : item3.videoUrl
                                }
                                App.net_pmh_data[id] = options;
                            });
                        });
                    });
                    $.each(App.garmentSizes, function(idx, item) {
                        $.each(item.bookList, function(idx, item2) {
                            var id = item.mtypb + item2.field;
                            var options = {
                                name : item2.desc,
                                text : item2.text,
                                imgUrl : item2.imgUrl,
                                videoUrl : item2.videoUrl
                            }
                            App.garment_size_data[id] = options;
                        });
                    });

                }
            }
        });
    },
    delCategory : (tabIndex) => {
        layui.layer.open({
            content: I18nUtil.getProp('common_js_alert_107'),
            title: false,
            closeBtn:0,
            time: 20000, //20s后自动关闭
            btn: [I18nUtil.getProp('yes'), I18nUtil.getProp('no')],
            yes: function () {
                console.log("del");
                if (App.orderData.length > 1) {
                    //假如删除第一个品类，将会更迭来料信息
                    if (tabIndex == 0){
                        for (var i = 1 ;i<App.orderData.length; i++){
                            if (App.orderData[i].Fabric.iscsu == null){
                                App.ordtp = null;
                            } else {
                                App.ordtpIndex = i-1;
                                App.ordtp = App.getOrdtpByIscsu(App.orderData[i].Fabric.iscsu);
                                break;
                            }
                        }
                    }
                    //删除tab
                    App.orderData = App.orderData.filter((v, i) => i != tabIndex)
                    if (tabIndex == App.tabIndex) {
                        if (tabIndex > 0) {
                            App.tabIndex = tabIndex - 1
                        }
                    } else if (tabIndex < App.tabIndex){
                        App.tabIndex = App.tabIndex-1;
                    }
                    if (App.orderData.length == 1) {
                        App.tabIndex = 0;
                    }
                    App.renderOrderTab();
                    $("#productNumber").html(App.orderData.length);
                    $("#orderTab_"+App.tabIndex).click();
                } else {
                    //回退到上个页面选品类
                    window.history.go(-1);
                }
                layui.layer.closeAll('dialog');
            }
        })
        event.stopPropagation();
    },
    // 选择单位
    selectUnit : (e) => {
        if ($(e).hasClass("layui-disabled")) {
            return;
        }
        layui.layer.open({
            content:'The measurement will be cleared.Are you sure to convert?',
            title: false,
            closeBtn:0,
            time: 20000, //20s后自动关闭
            btn: [I18nUtil.getProp('yes'), I18nUtil.getProp('no')],
            yes: function (index, layero) {
                $(e).parent().find(".hActive").removeClass("hActive");
                $(e).addClass("hActive");
                App.orderData[App.tabIndex].meunit = $(e).attr("data-value");
                var isInch = $(e).attr("data-value") == 'INCH' ? true : false;
                var measu = App.orderData[App.tabIndex].zlrecps['MEASU'].prope;
                var mtypb = App.orderData[App.tabIndex].Category.mtypb;
                // 重新渲染成衣量体参考范围
                //if(measu == 'B') {
                var bodyDiv = $("#Body");
                var ipts = bodyDiv.find("input[data-save-code][data-type='nsz']");
                for(var i = 0; i < ipts.length; i++){
                    var item = $(ipts[i]);
                    item.val("");
                    var sizeConf = App.getNetSizeConf(item.attr("data-save-code"), isInch);
                    item.attr("data-limit", sizeConf.hasLimit);
                    item.attr("data-high", sizeConf.high);
                    item.attr("data-low", sizeConf.low);
                    if(sizeConf.hasLimit == 'X') {
                        var scopeMsg = sizeConf.low + " - " + sizeConf.high;
                        item.parent().next().find("[name='size-scope']").html(scopeMsg);
                    } else {
                        item.parent().next().find("[name='size-scope']").html("");
                    }
                }
                //} else if(measu == 'C') {
                var finishedDiv = $("#Finished");
                var ipts = finishedDiv.find("input[data-save-code]");
                for(var i = 0; i < ipts.length; i++){
                    var item = $(ipts[i]);
                    item.val("");
                    var sizeConf = App.getGarmentSizeConf(item.attr("data-save-code"), isInch);
                    item.attr("data-limit", sizeConf.hasLimit);
                    item.attr("data-high", sizeConf.high);
                    item.attr("data-low", sizeConf.low);
                    if(sizeConf.hasLimit == 'X') {
                        var scopeMsg = sizeConf.low + " - " + sizeConf.high;
                        item.parent().next().find("[name='size-scope']").html(scopeMsg);
                    } else {
                        item.parent().next().find("[name='size-scope']").html("");
                    }
                }
                //}
                layer.close(index);
            }
        })
    },
    changeSize : (e) => {
        var field = $(e).attr("data-save-code");
        var val = $(e).val();
        var limit = $(e).attr("data-limit");
        var high = $(e).attr("data-high");
        var low = $(e).attr("data-low");
        var required = $(e).attr("data-require");
        if(limit == 'X' && e.value != "") {
            if(e.value < parseFloat(low)) {
                e.value = parseFloat(low);
                layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_100", [low, high])});
            }
            if(e.value > parseFloat(high)) {
                e.value = parseFloat(high);
                layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_100", [low, high])});
            }
        }
        if(App.orderData[App.tabIndex].zlrecps['MEASU'].prope == 'A') {
            App.orderData[App.tabIndex].tryOnZlrecm[field.toLowerCase()] = e.value;
            if(e.value) {
                appfunctions.delMeasurementRequired('A', field);
            } else {
                if (required == 'X'){
                    appfunctions.addMeasurementRequired('A', field, $(e).parent().prev().children().html());
                }
            }
        } else if(App.orderData[App.tabIndex].zlrecps['MEASU'].prope == product.measuList.halfSetSize.code){
            App.orderData[App.tabIndex].halfTryOnZlrecm[field.toLowerCase()] = e.value;
            if(e.value) {
                appfunctions.delMeasurementRequired(product.measuList.halfSetSize.code, field);
            } else {
                if (required == 'X'){
                    appfunctions.addMeasurementRequired(product.measuList.halfSetSize.code, field, $(e).parent().prev().children().html());
                }
            }
        } else if(App.orderData[App.tabIndex].zlrecps['MEASU'].prope == 'B') {
            var isInch = App.orderData[App.tabIndex].meunit == "INCH" ? true : false;
            var dataType = $(e).attr("data-type");
            var finalVal = e.value;
            if (dataType == 'nsz') {
                if(isInch && product.needTransNetsize(field) && finalVal){
                    finalVal = product.transInch2Cm(finalVal);
                }
                App.orderData[App.tabIndex].zlreda[field.toLowerCase()] = finalVal;
                if(finalVal) {
                    appfunctions.delMeasurementRequired('B', field);
                } else {
                    if (required == 'X'){
                        appfunctions.addMeasurementRequired('B', field, $(e).parent().prev().children().html());
                    }
                }
            } else {
                if(isInch && product.needTransGarment(field) && finalVal){
                    finalVal = product.transInch2Cm(finalVal);
                }
                App.orderData[App.tabIndex].netZlrecm[field.toLowerCase()] = finalVal;
            }
        } else if(App.orderData[App.tabIndex].zlrecps['MEASU'].prope == 'C') {
            var isInch = App.orderData[App.tabIndex].meunit == "INCH" ? true : false;
            var finalVal = e.value;
            if(isInch && product.needTransGarment(field) && finalVal){
                finalVal = product.transInch2Cm(finalVal);
            }
            App.orderData[App.tabIndex].garmentZlrecm[field.toLowerCase()] = finalVal;
            if(finalVal) {
                appfunctions.delMeasurementRequired('C', field);
            } else {
                if (required == 'X'){
                    appfunctions.addMeasurementRequired('C', field, $(e).parent().prev().children().html());
                }
            }
        }

    },
    // 选择量体方式
    selectMeasurement : (e) => {
        if ($(e).hasClass("layui-disabled")) {
            return;
        }
        $(e).parent().find(".hActive").removeClass("hActive");
        $(e).addClass("hActive");
        var measu = $(e).attr("data-value");
        App.orderData[App.tabIndex].zlrecps['MEASU'] = {prope: measu, propt:"MEASU"};
        if (measu == 'A') {
            $("#Body").hide();
            $("#Finished").hide();
            $("#TryOn").show();
            $("#HalfTryOn").hide();
            $("[name='MEUNIT']").hide();
            $("#bodyshape_pma_tab").show();
            $("#bodyshape_pmb_tab").hide();
            $("#bodyshape_pmh_tab").hide();
            $("#bodyshape_pmj_tab").hide();
        } else if (measu == product.measuList.halfSetSize.code) {
            $("#Body").hide();
            $("#Finished").hide();
            $("#TryOn").hide();
            $("#HalfTryOn").show();
            $("[name='MEUNIT']").hide();
            $("#bodyshape_pma_tab").hide();
            $("#bodyshape_pmb_tab").hide();
            $("#bodyshape_pmh_tab").hide();
            $("#bodyshape_pmj_tab").show();
        } else if (measu == 'B') {
            $("#TryOn").hide();
            $("#Finished").hide();
            $("#Body").show();
            $("#HalfTryOn").hide();
            $("[name='MEUNIT']").show();
            $("#bodyshape_pma_tab").hide();
            $("#bodyshape_pmb_tab").hide();
            $("#bodyshape_pmh_tab").show();
            $("#bodyshape_pmj_tab").hide();
            App.openFirstMeasurementOpt();
        } else if (measu == 'C') {
            $("#Body").hide();
            $("#TryOn").hide();
            $("#Finished").show();
            $("#HalfTryOn").hide();
            $("[name='MEUNIT']").show();
            $("#bodyshape_pma_tab").hide();
            $("#bodyshape_pmb_tab").show();
            $("#bodyshape_pmh_tab").hide();
            $("#bodyshape_pmj_tab").hide();
        }
    },
    openFirstBodyshapePmbOpt : function() {
        var cnt = 0;
        var partDivs = $("[name='bodyshape_pmb']").children();
        for(var i = 0; i < partDivs.length; i++) {
            if($(partDivs[i]).css('display') !== 'none') {
                cnt++;
                if(!$(partDivs[i]).find("input[data-save-code]").val()) {
                    console.log(57 * (cnt-1));
                    $("[name='bodyshape_pmb']").scrollTop(57 * (cnt-1));
                    var partItemDiv = $(partDivs[i]).find("div[data-part-item='X']");
                    if (!$(partItemDiv[0]).parent().hasClass("hShow")){
                        $(partItemDiv[0]).parent().click();
                    }
                    break;
                }
            }
        }
    },
    openFabraicAttr : function(e) {

        layer.open({
            type: 1
            , title: I18nUtil.getProp("eis_cad_1")
            , id: 'fabraicAttrLayer' //防止重复弹出
            , area: '800px'
            , offset: '250px'
            , skin: "hAddRemark hLayer"
            , content: $("#fabricAttrTpl").html()
            , btn: [I18nUtil.getProp('common_27')]
            , btnAlign: 'r' //按钮居中
            , shade: 0.3 //不显示遮罩
            , success: function () {
                layui.laytpl($("#fabricAttrContentTpl").html()).render(App.orderData[App.tabIndex], function (html) {
                    $("#fabricAttrContent").html(html);

                    //不可编辑逻辑
                    // if($(this).attr("data-disable-flag") == "X"){
                    //     $("#fatnrAttrModal").find("input,select").each(function() {
                    //         $(this).attr("disabled", true);
                    //     });
                    //     $("#fatnrAttrModal").find("button[name='confirm']").attr("disabled", true);
                    // } else {
                    //     $("#fatnrAttrModal").find("input,select").each(function() {
                    //         $(this).attr("disabled", false);
                    //     });
                    //     $("#fatnrAttrModal").find("button[name='confirm']").attr("disabled", false);
                    // }
                    var lrecp = App.orderData[App.tabIndex].lrecp;
                    $("#fabricAttrContent").find("#ZCHFK").val($(e).find("input[data-save-code='ZCHFK']").val());
                    $("#fabricAttrContent").find("#ZCHHX").val($(e).find("input[data-save-code='ZCHHX']").val());
                    $("#fabricAttrContent").find("#ZCHDS").val($(e).find("input[data-save-code='ZCHDS']").val());
                    $("#fabricAttrContent").find("#ZCHGC").val($(e).find("input[data-save-code='ZCHGC']").val());
                    $("#fabricAttrContent").find("#ZCHGK").val($(e).find("input[data-save-code='ZCHGK']").val());
                    $("#fabricAttrContent").find("#ZCHTK").val($(e).find("input[data-save-code='ZCHTK']").val());
                    var val = $("#ZCHHX").val();
                    if(val == 'C'){
                        $("#ZCHTK").val("");
                        $("div[name='ZCHGC']").show();
                        $("div[name='ZCHGK']").show();
                    }else if(val == 'B'){
                        $("#ZCHGC").val("");
                        $("#ZCHGK").val("");
                        $("div[name='ZCHTK']").show();
                    }else{
                        $("#ZCHGC").val("");
                        $("#ZCHGK").val("");
                        $("#ZCHTK").val("");
                        $("div[name='ZCHGC']").hide();
                        $("div[name='ZCHGK']").hide();
                        $("div[name='ZCHTK']").hide();
                    }

                    $("#ZCHHX").on("change", function () {
                        var val = $(this).val();
                        $("div[name='ZCHGC']").hide();
                        $("div[name='ZCHGK']").hide();
                        $("div[name='ZCHTK']").hide();
                        if(val == 'C'){
                            $("#ZCHTK").val("");
                            $("div[name='ZCHGC']").show();
                            $("div[name='ZCHGK']").show();
                        }else if(val == 'B'){
                            $("#ZCHGC").val("");
                            $("#ZCHGK").val("");
                            $("div[name='ZCHTK']").show();
                        }else{
                            $("#ZCHGC").val("");
                            $("#ZCHGK").val("");
                            $("#ZCHTK").val("");
                        }
                    });


                    layui.form.render();
                    product.initI18n();
                })
                // $("textarea[name='addRemark']").val(App.orderData[App.tabIndex].remark);


            }
            , yes: function () {

                var ZCHFK = $("#fabricAttrContent").find("#ZCHFK").val();
                var ZCHHX = $("#fabricAttrContent").find("#ZCHHX").val();
                var ZCHDS = $("#fabricAttrContent").find("#ZCHDS").val();
                var ZCHGC = $("#fabricAttrContent").find("#ZCHGC").val();
                var ZCHGK = $("#fabricAttrContent").find("#ZCHGK").val();
                var ZCHTK = $("#fabricAttrContent").find("#ZCHTK").val();
                $(e).find("input[data-save-code='ZCHFK']").val(ZCHFK);
                $(e).find("input[data-save-code='ZCHHX']").val(ZCHHX);
                $(e).find("input[data-save-code='ZCHDS']").val(ZCHDS);
                $(e).find("input[data-save-code='ZCHGC']").val(ZCHGC);
                $(e).find("input[data-save-code='ZCHGK']").val(ZCHGK);
                $(e).find("input[data-save-code='ZCHTK']").val(ZCHTK);
                // var testp = App._testp;
                // var urgen = App._urgen;
                // App.orderData[App.tabIndex].testp = testp;
                if(!App.orderData[App.tabIndex].zlrecps['FABMC']){
                    App.orderData[App.tabIndex].zlrecps['FABMC'] = {propt:"FABMC", notep:"" , prope:""};
                }
                App.orderData[App.tabIndex].zlrecps['ZCHFK'] = {propt:"ZCHFK", notep:ZCHFK , prope:""};
                App.orderData[App.tabIndex].zlrecps['ZCHHX'] = {propt:"ZCHHX", notep:ZCHHX , prope:""};
                App.orderData[App.tabIndex].zlrecps['ZCHDS'] = {propt:"ZCHDS", notep:ZCHDS , prope:""};
                App.orderData[App.tabIndex].zlrecps['ZCHGC'] = {propt:"ZCHGC", notep:ZCHGC , prope:""};
                App.orderData[App.tabIndex].zlrecps['ZCHGK'] = {propt:"ZCHGK", notep:ZCHGK , prope:""};
                App.orderData[App.tabIndex].zlrecps['ZCHTK'] = {propt:"ZCHTK", notep:ZCHTK , prope:""};
                layer.closeAll();
                alert(I18nUtil.getProp("eis_cad_19"));
            }
        });
    },

    showExtraPriceDetail : (e) => {
        if ($(".extraPriceDetail").css("display") == "none"){
            $(".extraPriceDetail").show();
        } else {
            $(".extraPriceDetail").hide();
        }

    },
    isMainSuit : (orderData) => {
        if (orderData.suitGroupId){
            if (product.isMainSuitMtypb(orderData.Category.mtypb)){
                return true;
            }
            return false;
        }
        return false;
    },
    // 添加量体必填项
    addMeasurementRequired : function(measuVal, field, obj) {

        if(product.isGarmentSizeMeasu(measuVal)) {
            //不存在或者为0
            if(!App.orderData[App.tabIndex].garmentZlrecm[field.toLowerCase()] ||  App.orderData[App.tabIndex].garmentZlrecm[field.toLowerCase()] == 0) {
                App.orderData[App.tabIndex].measurementController.garment.isCompleted = false;
                App.orderData[App.tabIndex].measurementController.garment.required[field.toLowerCase()] = obj;
            }
        } else if(product.isNetSizeMeasu(measuVal)) {
            if((!App.orderData[App.tabIndex].zlreda[field.toLowerCase()] || App.orderData[App.tabIndex].zlreda[field.toLowerCase()] == 0 )&& !App.orderData[App.tabIndex].zlrecps[field.toUpperCase()]) {
                App.orderData[App.tabIndex].measurementController.net.isCompleted = false;
                App.orderData[App.tabIndex].measurementController.net.required[field.toLowerCase()] = obj;
            }
        } else if(product.isHalfSetSizeMeasu(measuVal)) {
            if(!App.orderData[App.tabIndex].halfTryOnZlrecm[field.toLowerCase()]) {
                App.orderData[App.tabIndex].measurementController.halfTryOn.isCompleted = false;
                App.orderData[App.tabIndex].measurementController.halfTryOn.required[field.toLowerCase()] = obj;
            }
        } else {
            if(!App.orderData[App.tabIndex].tryOnZlrecm[field.toLowerCase()]) {
                App.orderData[App.tabIndex].measurementController.tryOn.isCompleted = false;
                App.orderData[App.tabIndex].measurementController.tryOn.required[field.toLowerCase()] = obj;
            }
        }
    },
    // 删除量体必填项
    delMeasurementRequired : function(measuVal, field) {
        if(product.isGarmentSizeMeasu(measuVal)) {
            delete App.orderData[App.tabIndex].measurementController.garment.required[field.toLowerCase()];
            if(Object.keys(App.orderData[App.tabIndex].measurementController.garment.required).length == 0) {
                App.orderData[App.tabIndex].measurementController.garment.isCompleted = true;
            }
        } else if(product.isNetSizeMeasu(measuVal)) {
            delete App.orderData[App.tabIndex].measurementController.net.required[field.toLowerCase()];
            if(Object.keys(App.orderData[App.tabIndex].measurementController.net.required).length == 0) {
                App.orderData[App.tabIndex].measurementController.net.isCompleted = true;
            }
        } else if(product.isHalfSetSizeMeasu(measuVal)){
            delete App.orderData[App.tabIndex].measurementController.halfTryOn.required[field.toLowerCase()];
            if(Object.keys(App.orderData[App.tabIndex].measurementController.halfTryOn.required).length == 0) {
                App.orderData[App.tabIndex].measurementController.halfTryOn.isCompleted = true;
            }
        } else {
            delete App.orderData[App.tabIndex].measurementController.tryOn.required[field.toLowerCase()];
            if(Object.keys(App.orderData[App.tabIndex].measurementController.tryOn.required).length == 0) {
                App.orderData[App.tabIndex].measurementController.tryOn.isCompleted = true;
            }
        }
    },
    // 删除体型调整必填项
    delBodyshapeRequired : function(pmVal, field) {
        if(pmVal == 'PMA') {
            delete App.orderData[App.tabIndex].bodyshapeController.pma.required[field.toLowerCase()];
            if(Object.keys(App.orderData[App.tabIndex].bodyshapeController.pma.required).length == 0) {
                App.orderData[App.tabIndex].bodyshapeController.pma.isCompleted = true;
            }
        } else if(pmVal == 'PMB') {
            delete App.orderData[App.tabIndex].bodyshapeController.pmb.required[field.toLowerCase()];
            if(Object.keys(App.orderData[App.tabIndex].bodyshapeController.pmb.required).length == 0) {
                App.orderData[App.tabIndex].bodyshapeController.pmb.isCompleted = true;
            }
        } else if(pmVal == 'PMH') {
            delete App.orderData[App.tabIndex].bodyshapeController.pmh.required[field.toLowerCase()];
            if(Object.keys(App.orderData[App.tabIndex].bodyshapeController.pmh.required).length == 0) {
                App.orderData[App.tabIndex].bodyshapeController.pmh.isCompleted = true;
            }
        } else if(pmVal == 'PMJ') {
            delete App.orderData[App.tabIndex].bodyshapeController.pmj.required[field.toLowerCase()];
            if(Object.keys(App.orderData[App.tabIndex].bodyshapeController.pmj.required).length == 0) {
                App.orderData[App.tabIndex].bodyshapeController.pmj.isCompleted = true;
            }
        }
    },
    // 添加体型调整必填项
    addBodyshapeRequired : function(pmVal, field, obj) {
        if(pmVal == 'PMA') {
            if(!App.orderData[App.tabIndex].zlrecps[field]) {
                App.orderData[App.tabIndex].bodyshapeController.pma.isCompleted = false;
                App.orderData[App.tabIndex].bodyshapeController.pma.required[field.toLowerCase()] = obj;
            }
        } else if(pmVal == 'PMB') {
            if(!App.orderData[App.tabIndex].zlrecps[field]) {
                App.orderData[App.tabIndex].bodyshapeController.pmb.isCompleted = false;
                App.orderData[App.tabIndex].bodyshapeController.pmb.required[field.toLowerCase()] = obj;
            }
        } else if(pmVal == 'PMH') {
            if(!App.orderData[App.tabIndex].zlrecps[field]) {
                App.orderData[App.tabIndex].bodyshapeController.pmh.isCompleted = false;
                App.orderData[App.tabIndex].bodyshapeController.pmh.required[field.toLowerCase()] = obj;
            }
        } else if(pmVal == 'PMJ') {
            if(!App.orderData[App.tabIndex].zlrecps[field]) {
                App.orderData[App.tabIndex].bodyshapeController.pmj.isCompleted = false;
                App.orderData[App.tabIndex].bodyshapeController.pmj.required[field.toLowerCase()] = obj;
            }
        }
    },
    //获取套号尺寸配置
    getModConf : function(mtypb, field) {

        var hasLimit = "";
        var high = "";
        var low = "";
        var modConf = App.modelController.getModConfByField(mtypb, field);
        if(modConf != null){
            hasLimit = "X";
            high = modConf.HIGH;
            low = modConf.LOW;
        }
        return {hasLimit: hasLimit, high: high, low: low};
    },
    //获取半套号尺寸配置
    getHsmConf : function(mtypb, field) {

        var hasLimit = "";
        var high = "";
        var low = "";
        var modConf = App.modelController.getHalfModConfByField(mtypb, field);
        if(modConf != null){
            hasLimit = "X";
            high = modConf.HIGH;
            low = modConf.LOW;
        }
        return {hasLimit: hasLimit, high: high, low: low};
    },

    cancelOrderTransfer : function() {
        var selectedProducts = product.getSelectedProduct();
        if(!validate(selectedProducts)){
            return;
        }
        var lrecps = getLrecps(selectedProducts);
        product.cancelProduct(product.getLrecn(), lrecps);

        /*---------------------- 内部函数 -------------------------------*/
        //验证产品
        function validate(selectedProducts){

            if(product.getLrecn() == ""){
                layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content: I18nUtil.getProp("common_js_alert_185")});
                return false;
            }
            if(selectedProducts.length == 0){
                layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content: I18nUtil.getProp("common_js_alert_157")});
                return false;
            }
            // var storeModal = $("#storeModal");
            // var lcsty = storeModal.find("select[data-save-code='LCSTY']").val();
            var valid = true;
            for(var i = 0; i < selectedProducts.length; i++){
                var selectedProduct = selectedProducts[i];

                var lrecp =  selectedProduct.lrecp;
                var statu = selectedProduct.statu;

                if(product.isOrderCanCancel(statu)){
                    valid = true;
                }else if(statu == product.statuList.orderReject.code){
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_186", [lrecp])});
                    valid = false;
                    break;
                }
                else if(statu == product.statuList.orderTransfer.code){
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_187", [lrecp])});
                    valid = false;
                    break;
                }
                else{
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_188", [lrecp])});
                    valid = false;
                    break;
                }

            }
            return valid;
        }
        //获取计划项目字符串
        function getLrecps(selectedProducts){

            var lrecps = new Array();
            for(var i = 0; i < selectedProducts.length; i++){
                var selectedProduct = selectedProducts[i];
                lrecps.push(selectedProduct.lrecp);
            }
            return lrecps;
        }
    },

    initSampleData : function(cartIds) {
        var index = layer.load();
        $.ajax({
            type: 'POST',
            url: "/eis/sampleOrder/front/cart/CartListV2",
            contentType: "application/json;charset=utf-8",
            async: false,
            cache: false,
            dataType: 'json',
            data: JSON.stringify({ids: cartIds}),
            success: function (result, status, xhr) {
                if(result.success){
                    var data = result.data;
                    var datas = data[3];
                    App.cartsData = appfunctions.getCartsData(datas);

                    App.sampleOrderDatas = measureSaver.getOrderDataByCartsData();
                    //处理数据

                }else{
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_20")});
                }
            },
            error: function (xhr, status, error) {
                if (xhr.status === 401) {
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("eis_login_4")});
                } else {
                    //请求异常回调
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_20")});
                }
            },
            complete: function () {
                layer.close(index);
            }
        });
    },
    getCartsData : function(datas) {
        var cartsData = [];
        var suitIndex = 1;
        $.each(datas, function (index, item) {
            var carts = item.carts;

            if (carts.length > 1){
                var _suitIndex = suitIndex + '';
                while (_suitIndex.length < 5){
                    _suitIndex = '0' + _suitIndex;
                }
                suitIndex = suitIndex + carts.length;
                $.each(carts, function (index2, item2) {
                    item2.suitId = _suitIndex;
                    cartsData.push(item2);
                });
            } else if(carts.length == 1){
                cartsData.push(carts[0]);
                suitIndex = suitIndex + 1;
            }
        });
        $.each(cartsData, function (index, item) {
            if(item.product){
                var productProce = item.product.productProce;
                var zlmodList = item.product.zlmodList;
                var mtypbProper = App.propers.getByValue("MTYPA", productProce.category);
                if(mtypbProper){
                    productProce.sexty = mtypbProper.fgroup;
                }
                $.each(zlmodList, function (index2, item2) {
                    if(item2.model == item.model){
                        productProce.zlmod = item2;
                    }
                });
            }
        });
        return cartsData;
    },

    getQueryVariable : function(variable) {
        var query = window.location.search.substring(1);
        var vars = query.split("&");
        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if(pair[0] == variable){return pair[1];}
        }
        return(false);
    },
    showAdressTablePanelEvent : function (e){
        if ($(e).hasClass("layui-disabled")) {
            return;
        }
        var index = layer.load();
        var params = {owner: loginAccount};
        var addressList = [];
        $.ajax({
            type: 'POST',
            url: "/eis/sampleOrder/front/address/getAddressList",
            contentType: "application/json;charset=utf-8",
            async: false,
            cache: false,
            dataType: 'json',
            data: JSON.stringify(params),
            success: function (result, status, xhr) {
                if(result.success){
                    var datas = result.data;
                    $.each(datas, function(index, item){
                        if(item.addrt == "P"){
                            item.addrtt = '其他地址';
                            item.regiott = item.regiot + item.counc;
                            addressList.push(item);
                        }
                    });
                    appfunctions.showAdressTablePanel(addressList);

                }else{

                }
            },
            error: function (xhr, status, error) {
                if (xhr.status === 401) {
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("eis_login_4")});
                } else {
                    //请求异常回调
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_20")});
                }
            },
            complete: function () {
                layer.close(index);
            }
        });
    },
    showAdressTablePanel : function (data){
        layui.layer.open({
            type: 1
            , title: I18nUtil.getProp('eis_sample_order_32')
            , id: 'RemarkLayer' //防止重复弹出
            , area: '800px'
            , skin: "hLayer"
            , content: $("#addressSelectionTpl").html()
            , btn: [I18nUtil.getProp('common_28')]
            , btnAlign: 'r' //按钮居中
            , shade: 0.3 //不显示遮罩
            , success: function () {
                //初始化列表数据
                if (data.length == 0) {
                    $('#addressSearchListDisplay').html("<div style='text-align: center'>"+I18nUtil.getProp('common_177')+"</div>");
                    return;
                } else {
                    layui.laytpl($("#addressContainerTpl").html()).render(data, html => {
                        $("#addressSearchListDisplay").html(html);
                        appfunctions.bindSelectAddressEvent();
                    });
                    layui.form.render();
                }
                layui.form.render();
                product.initI18n();
            }
            , yes: function () {
                layer.closeAll();
            }
        });
    },

    bindSelectAddressEvent : function (index){
        layui.form.on('radio(address-radio-filter)', function(data){
            var elem = data.elem; // 获得 checkbox 原始 DOM 对象
            var diver = $(elem).attr("data-diver");
            var addrd = $(elem).attr("data-addrd");
            var telph = $(elem).attr("data-telph");
            $("#hGoodsInfoDrawerBox").find("input[data-save-code='ADDRD']").val(addrd);
            $("#hGoodsInfoDrawerBox").find("input[data-save-code='DIVER']").val(diver);
            $("#hGoodsInfoDrawerBox").find("input[data-save-code='TELPH']").val(telph);
            layer.closeAll();
        });
    },
    bindTestpAndUrgentEvent : function () {
        layui.form.on('radio(testp-radio-filter)', function(data){
            // console.log(data.elem); //得到radio原始DOM对象
            App._testp = data.value;
            //变更将影响紧急指数的取值范围
            var urgenMapData = App.propers.getCustomps(App.ordtp, App.orderData[App.tabIndex].Category.mtypb, "URGEN", "TESTP", App._testp);
            layui.laytpl($("#urgenRadioTpl").html()).render(urgenMapData, function (html) {
                $("#urgen_radio").html(html);
                layui.form.on('radio(urgen-radio-filter)', function(data){
                    // console.log(data.elem); //得到radio原始DOM对象
                    App._urgen = data.value;
                    console.log(data.value); //被点击的radio的value值
                });
                layui.form.render();
                product.initI18n();
            });
            console.log(data.value); //被点击的radio的value值
        });
        layui.form.on('radio(urgen-radio-filter)', function(data){
            // console.log(data.elem); //得到radio原始DOM对象
            App._urgen = data.value;
            console.log(data.value); //被点击的radio的value值
        });

    },
    //打开试样和紧急程度弹窗
    showTestpAndUrgentPanel : function (e)  {
        if ($(e).hasClass("layui-disabled")) {
            return;
        }
        if(!App.ordtp){
            layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_133")});
            return;
        }
        layer.open({
            type: 1
            , title: I18nUtil.getProp('eis_ipo_create_66')
            , id: 'testpAndUrgentLayer' //防止重复弹出
            , area: '500px'
            , offset: '250px'
            , skin: "hAddRemark hLayer"
            , content: $("#testpAndUrgentTpl").html()
            , btn: [I18nUtil.getProp('common_27')]
            , btnAlign: 'r' //按钮居中
            , shade: 0.3 //不显示遮罩
            , success: function () {
                layui.laytpl($("#testpAndUrgentContentTpl").html()).render(App.orderData[App.tabIndex], function (html) {
                    $("#testpAndUrgentContent").html(html);
                    //同时渲染紧急指数
                    appfunctions.bindTestpAndUrgentEvent();
                    layui.form.render();
                    product.initI18n();
                })
                // $("textarea[name='addRemark']").val(App.orderData[App.tabIndex].remark);


            }
            , yes: function () {
                var testp = App._testp;
                var urgen = App._urgen;
                App.orderData[App.tabIndex].testp = testp;
                // App.orderData[App.tabIndex].urgen = urgen;
                App.orderData[App.tabIndex].zlrecps['URGEN'] = {propt:"URGEN", prope:urgen};
                // if ($("textarea[name='addRemark']").val()) {
                //     $("#addRemark").html('<img style="width:12px;margin-right:8px;" src="/eis/ui/images/new/done.png" alt="" /><span>Remark Done</span><div class="hHoverRemark">'+$("textarea[name='addRemark']").val()+'</div>')
                // } else {
                //     $("#addRemark").html('<img style="width:18px;margin-right:8px;" src="/eis/ui/images/new/text.png" alt="" /><span>Remark</span>')
                // }
                // $("#addRemark").attr("title", $("textarea[name='addRemark']").val())
                // App.orderData[App.tabIndex].remark = $("textarea[name='addRemark']").val();
                // // 设置为改款
                // App.orderData[App.tabIndex].zlrecps['DRAWI'] = {propt: 'DRAWI', prope: "A"};
                // App.orderData[App.tabIndex].zlrecps['DRANP'] = {propt: 'DRANP', prope: "", notep: $("textarea[name='addRemark']").val()};
                layer.closeAll();
            }
        });
    },

    temporarySave : function() {
        if(!measureSaver.validateBeforeSave(false)){
            return;
        }
        if(!App.setLrecn()){
            return;
        }
        var data = measureSaver.getOrderData();
        console.log(JSON.stringify(data));
        if(App.isNewOrder){
            measureSaver.temporarySaveNewOrder(data);
        }else{
            measureSaver.temporaryUpdateOrder(data);
        }
    }
}