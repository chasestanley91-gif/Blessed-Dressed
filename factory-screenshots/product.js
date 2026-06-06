
/** 量体产品对象 **/
var product = {
    //备注缓存
    notesList : [],
    zlrecdMap : {},
    // zlrecdMap : [],
    zlrecpMap : {},
    zlrecmMap : {},
    zlreda: {},
    orderNoteMap : {},
    zlmatnrMap : {},
    zlredaMap : {},

    ordtp2IscsuMap : {"C": "Y", "J": "X"}, //订单类型到面料来源映射
    CUSTOM_MODER_FIELD: "KPOQZ|REKLK|REQCL",
    customModerList : {
        KPOQZ : {//西裤前褶(Kpoqz)的value关联moder
            "USD70" : {"ALL":"USD67-1,USD67-2,USD67-3", "A": "USD67-1", "B": "USD67-1", "C": "USD67-2", "D": "USD67-3","E": "USD67-2", "F": "USD67-3", "J": "USD67-2", "I": "USD67-2", "K":"USD67-3", "L": "USD67-2", "M":"USD67-3"},
            "RSD69" : {"ALL":"RSD69-1,RSD69-2,RSD69-3","B": "RSD69-1","C": "RSD69-2", "D": "RSD69-3","E": "RSD69-2", "F": "RSD69-3"},
            "YHD900" : {"ALL":"YHD900-1,YHD900-2,YHD900-3","B": "YHD900-1","C": "YHD900-2", "D": "YHD900-3","E": "YHD900-2", "F": "YHD900-3"},
            "YHD80" : {"ALL":"YHD20,YHD21,YHD22","B": "YHD20","C": "YHD21", "D": "YHD22"},
            "YHD7310" : {"ALL":"YHD7308", "D": "YHD7308"},
        },
        REKLK : {//男马甲下口型(REKLK)的value关联moder
            "YHM99" : {"ALL":"YHM01,YHM02,YHM03,YHM04", "A": "YHM01", "B": "YHM02", "C": "YHM03","D": "YHM04","E": "YHM01"}
        },
        REQCL : {//衬衫领底REQCL)的value关联moder
            "YHC01" : {"ALL":"YHC01,YHC2401", "A114": "YHC2401", "default": "YHC01"}
        },
    },
    HIDEMODEM_REFER_FIELD : {
        USD70 : "KPOQZ",
        RSD69 : "KPOQZ",
        YHD7310 : "KPOQZ",
        YHD900 : "KPOQZ",
        YHD80 : "KPOQZ",
        YHM99 : "REKLK",
        YHC01 : "REQCL"
    },
    HIDENMODEM_REFER_FIELD_VAILD_MSG : {
        USD70 : "pleat_vaild",
        YHD900 : "pleat_vaild",
        YHD80 : "pleat_vaild",
        RSD69 : "pleat_vaild",
        YHD7310 : "pleat_vaild",
        YHC01 : "Collar_vaild",
        YHM99 : "bottom_shape_vaild"
    },
    HIDEN_MODEM: "USD70|YHM99|RSD69|YHC01|YHD900|YHD80",//需要隐藏的可变版型，国内也需要隐藏
    HIDE_PATTERN_CATEGORY : "BB|BD|BM|BC|CC|BCD|HC|GC", //需要隐藏版型的品类
    mtypbDefaultModemMap: {
        BB: {modem: "US66", name: "US66", value: "VARIABLE", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBUS66.jpg", moder: "US66"}
      , BCD: {modem: "YHD2600",name: "YHD2600",value: "VARIABLE", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BCD/BCDYHD2600.jpg",moder: "YHD2600"}
      , BD: {modem: "USD70",name: "USD70",value: "VARIABLE", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDUSD70.jpg",moder: ""}
      , BM: {modem: "YHM99",name: "YHM99",value: "可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BM/BMYHM99.jpg",moder: ""}
      , BC: {modem: "YHC01",name: "YHC01",value: "修身版可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BC/BCYHC01.jpg",moder: "YHC01"}
      , CC: {modem: "YHC01",name: "YHC01",value: "修身版可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/CC/CCYHC01.jpg",moder: "YHC01"}
      , GC: {modem: "YHC21",name: "YHC21",value: "修身版可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/GC/GCYHC01.jpg",moder: "YHC01"}
      , HC: {modem: "YHC21",name: "YHC21",value: "修身版可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/HC/HCYHC01.jpg",moder: "YHC01"}
    },
    mtypbCustStoreModemMap :{
        BB:{
            "RY004Z001": {modem: "US69", name: "US69", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBHA59.jpg", moder: "HA59"},
            "RY018Z001": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY019Z001": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY020Z001": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY021Z001": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY024Z001": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY025Z001": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY026Z001": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY027Z001": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY008Z001": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY008Z002": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY008Z003": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY008Z004": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY008Z005": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY008Z006": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY011Z001": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY015Z001": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY029Z001": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "RY003Z014": {modem: "US69", name: "US69", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBHA59.jpg", moder: "HA59"},
            "RY022Z001": {modem: "YHA08", name: "YHA08", value: "基础可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBYHA08.jpg", moder: "YHA08"},
            "RY023Z001": {modem: "YHA08", name: "YHA08", value: "基础可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBYHA08.jpg", moder: "YHA08"},
            "RY028Z001": {modem: "YHA08", name: "YHA08", value: "基础可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBYHA08.jpg", moder: "YHA08"},
            "RY030Z001": {modem: "YHA08", name: "YHA08", value: "基础可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBYHA08.jpg", moder: "YHA08"},
            "0000030023": {modem: "YHA11", name: "YHA11", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBYHA11.jpg", moder: "YHA11"},
            "0000030055": {modem: "YHA11", name: "YHA11", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBYHA11.jpg", moder: "YHA11"},
            "0000030054": {modem: "YHA11", name: "YHA11", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBYHA11.jpg", moder: "YHA11"},
            "0000030045": {modem: "YHA11", name: "YHA11", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBYHA11.jpg", moder: "YHA11"},
            "0000030048": {modem: "YHA11", name: "YHA11", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBYHA11.jpg", moder: "YHA11"},
            "0000030047": {modem: "RS68", name: "RS68", value: "舒适版-可变款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRS68.jpg", moder: "RS68"},
            "0000011227": {modem: "RUSSIO-001", name: "RUSSIO-001", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BB/BBRUSSIO-001.jpg", moder: "RUSSIO-001"},
        },
        BD:{
            "0000030023": {modem: "YHD900", name: "YHD900", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDYHD900.jpg", moder: ""},
            "0000030055": {modem: "YHD900", name: "YHD900", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDYHD900.jpg", moder: ""},
            "0000030054": {modem: "YHD900", name: "YHD900", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDYHD900.jpg", moder: ""},
            "0000030045": {modem: "YHD900", name: "YHD900", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDYHD900.jpg", moder: ""},
            "0000030048": {modem: "YHD900", name: "YHD900", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDYHD900.jpg", moder: ""},
            "0000011227": {modem: "HD-RUS001", name: "HD-RUS001", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDHD-RUS001.jpg", moder: "HD-RUS001"},
            "0000030047": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY018Z001": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY019Z001": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY020Z001": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY021Z001": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY024Z001": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY025Z001": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY026Z001": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY027Z001": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            // "RY007Z001": {modem: "YHD7310", name: "YHD7310", value: "好莱坞裤", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDYHD7308.jpg", moder: ""},
            // "RY007Z002": {modem: "YHD7310", name: "YHD7310", value: "好莱坞裤", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDYHD7308.jpg", moder: ""},
            // "RY007Z003": {modem: "YHD7310", name: "YHD7310", value: "好莱坞裤", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDYHD7308.jpg", moder: ""},
            // "RY007Z004": {modem: "YHD7310", name: "YHD7310", value: "好莱坞裤", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDYHD7308.jpg", moder: ""},
            // "RY007Z005": {modem: "YHD7310", name: "YHD7310", value: "好莱坞裤", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDYHD7308.jpg", moder: ""},
            "RY008Z001": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY008Z002": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY008Z003": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY008Z004": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY008Z005": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY008Z006": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY015Z001": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY011Z001": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY029Z001": {modem: "RSD69", name: "RSD69", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDRSD69-3.jpg", moder: ""},
            "RY022Z001": {modem: "YHD80", name: "YHD80", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDYHD22.jpg", moder: ""},
            "RY028Z001": {modem: "YHD80", name: "YHD80", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDYHD22.jpg", moder: ""},
            "RY023Z001": {modem: "YHD80", name: "YHD80", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDYHD22.jpg", moder: ""},
            "RY030Z001": {modem: "YHD80", name: "YHD80", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BD/BDYHD22.jpg", moder: ""}
        },
        BC:{
            "RY008Z006": {modem: "YHC2402", name: "YHC2402", value: "主推款", src: "https://mtm.baoxiniao.co/mtmstorage/images/model/BC/BCYHC2402.jpg", moder: "YHC2402"}
        },
    },
    //状态对象
    statuList : { newOrder : {code : "A", name : "新建订单", i18nKey:"eis_order_status_1"} , orderConfirm : { code: "B", name : "下单确认", i18nKey:"eis_order_status_2"},
        orderReject : {code : "F", name : "单据驳回", i18nKey:"reject_order"}, orderPass : {code : "G", name : "审核通过", i18nKey:"audited"},
        orderTransfer : {code : "H", name : "已下单生产", i18nKey:"sap_transfer"}, fabricPass : {code : "K", name : "面料审核通过", i18nKey:"fabric_pass"},fabricReject : {code : "M", name : "面料审核驳回", i18nKey:"fabric_reject"}},
    //订单类型对象
    ordtpList : {groupOrder: {code: "G", name : "团购订单"}, normalOrder: {code: "A", name : "常规订单"},
        specialOrder: {code: "H", name : "特殊订单"}, domesticOrder : {code: "B", name : "国内加工"} , internationalOrder: {code: "C", name : "国际加工"}, internationalOEMOrder: {code: "J", name : "国外加工OEM"}},
    //业务类别对象
    biztpList : {personal : {code: "A", name : "个人业务"}, group : {code: "B", name : "团购业务"}},
    //品牌对象
    brandList : {bxn : {code: "10", name : "报喜鸟"}, sl :{code: "26", name : "所罗"}, dsc: {code: "80", name: "国内加工"}, int: {code: "83", name: "国际加工"},
        fal : {code: "22", name : "法兰诗顿"},tb : {code: "25", name : "TOMBOLINI通博利尼"},bxn : {code: "19", name : "集团出品(量体)"}},

    //定制业务对象
    lcstyList :{drawi : {code: "Q", name: "来款" }},

    sextyList : { group : {code: "3", name : "团购"}, male : {code: "1", name : "男"}, female : {code: "2", name : "女"}},

    addrtList : { store : {code: "C", name : "门店地址"}, other : {code: "P", name : "其他地址"}},

    notelList : { create : {code: "A", name:"下单备注"}, modemImage : { code: "J", name: "版型图片"}, custMarkImage : { code: "C", name: "客订商标图"}, fabricReject : {code:"M", name : "面料审核驳回"}},

    dataStatuList : {used: "used", all : "all", del: "delete"},

    measuList : { modelSize: {code:"A", name: "套号量体"}, netSize: {code: "B", name: "净尺量体"}, garmentSize: {code: "C", name: "成衣量体"}, halfSetSize: {code: "D", name: "半套号量体"}},
    testpList : {substituteMaterialTryOn : {code:"D", name:"代用料成品试穿"}},
    iscsuStatus : {yunyi: {code: "Y"}, kegong: {
        code: "X"}},
    EMPTY_LINE : "00000",
    RATE_INCH2CM: 2.54,
    MEASU_CUSTOM_CODE : 'Z999',
    MATCHING_CODE : '90',
    DISPLAY_OPTION_LENGTH : 9,
    MULTI_PART_CODE : 'M999',
    MULTI_PART_RESULT_ITEM_TEXT_LENGTH:9,
    MULTI_PART_RESULT_TEXT_LENGTH: 15,
    PART_IMAGE_SEARCH_FIELDS : "REQMA|REQXU|REQBU|REQBV|GCOZS|GTELV|REWCT|RELBU|RESPL|RESBU|REQLZ|REQLJ", //辅料部件名定义
    SUBSTITUT_MATERIAL_FATNR : "EMH64123",
    EMBROIDERY : "REQEM|REQEM2|REQEM3", //刺绣内容
    EMBROIDERY_IMG : "REQEMIMG|REQEMIMG2|REQEMIMG3", //刺绣图片
    DRAWI_IMAGE_FIELD: "DRAIMG|DRAIMG2|DRAIMG3", //来款图片
    DRAWI_TEXTAREA: "DRANP", //来款图片
    SHAPE_IMG: "SHPIMG1|SHPIMG2|SHPIMG3",//体型图片
    TEXT_PART: "REQKL", //皮带孔距
    NETSIZE_DRESH : "DRESH", //净尺穿衣习惯
    NETSIZE_DRESI : "DRESI", //净尺穿着层次
    NETSIZE_ZLRECP : "DRESH|DRESI", //净尺的特征值
    UNLIMIT_MODEL : "99/99", //无限制号型
    FIELDS_NETSIZE_NO_TRANS: "LREBL|LREWT|LREOL",
    FIELDS_GARMENT_NO_TRANS: "LENBL|LENWT|LENOL",
    FIELD_PROCE: "PROCE",
    meunitList: {
        CM:  {code: "CM", name: "厘米"},
        INCH: {code:  "INCH", name: "英寸"}
    },
    SUIT_CATEGORY : "BB_BD|BB_BD_BM|BW_BJ|BW_BJ_WBM", //两件套和三件套
    suitsCategory : {
        1: {
            secondaryCategorieData: {
                BB_BD : {detail: "两件套", value: "BB_BD", fgroup:"1_1", names:"男西服上衣_男裤"},
                BB_BD_BM : {detail: "三件套", value: "BB_BD_BM", fgroup:"1_1_1", names:"男西服上衣_男裤_男马甲"},
                BW_BJ : {detail: "两件套", value: "BW_BJ", fgroup:"2_2", names:"女西服上衣_女裤"},
                BW_BJ_WBM : {detail: "三件套", value: "BW_BJ_WBM", fgroup:"2_2_2", names:"女西服上衣_女裤_女马甲"}
            }
        },
        E: {
            secondaryCategorieData: {
                BB_BD : {detail: "suit 2 pcs", value: "BB_BD", fgroup:"1_1", names:"Men's suit jacket_Men's suit trousers"},
                BB_BD_BM : {detail: "suit 3 pcs", value: "BB_BD_BM", fgroup:"1_1_1", names:"Men's suit jacket_Men's suit trousers_Men's suit vest"},
                BW_BJ : {detail: "suit 2 pcs", value: "BW_BJ", fgroup:"2_2", names:"Jacket_Pant"},
                BW_BJ_WBM : {detail: "suit 3 pcs", value: "BW_BJ_WBM", fgroup:"2_2_2", names:"Jacket_Pant_Vest"}
            }
        },
        I: {
            secondaryCategorieData: {
                BB_BD : {detail: "suit 2 pcs", value: "BB_BD", fgroup:"1_1", names:"Men's suit jacket_Men's suit trousers"},
                BB_BD_BM : {detail: "suit 3 pcs", value: "BB_BD_BM", fgroup:"1_1_1", names:"Men's suit jacket_Men's suit trousers_Men's suit vest"},
                BW_BJ : {detail: "suit 2 pcs", value: "BW_BJ", fgroup:"2_2", names:"Jacket_Pant"},
                BW_BJ_WBM : {detail: "suit 3 pcs", value: "BW_BJ_WBM", fgroup:"2_2_2", names:"Jacket_Pant_Vest"}
            }
        },
        R: {
            secondaryCategorieData: {
                BB_BD : {detail: "suit 2 pcs", value: "BB_BD", fgroup:"1_1", names:"Men's suit jacket_Men's suit trousers"},
                BB_BD_BM : {detail: "suit 3 pcs", value: "BB_BD_BM", fgroup:"1_1_1", names:"Men's suit jacket_Men's suit trousers_Men's suit vest"},
                BW_BJ : {detail: "suit 2 pcs", value: "BW_BJ", fgroup:"2_2", names:"Jacket_Pant"},
                BW_BJ_WBM : {detail: "suit 3 pcs", value: "BW_BJ_WBM", fgroup:"2_2_2", names:"Jacket_Pant_Vest"}
            }
        }
    },
    suitsMenCategory : {
        1: {
            secondaryCategorieData: {
                BB_BD : {detail: "两件套", value: "BB_BD", fgroup:"1_1", names:"男西服上衣_男裤"},
                BB_BD_BM : {detail: "三件套", value: "BB_BD_BM", fgroup:"1_1_1", names:"男西服上衣_男裤_男马甲"}
            }
        },
        E: {
            secondaryCategorieData: {
                BB_BD : {detail: "suit 2 pcs", value: "BB_BD", fgroup:"1_1", names:"Men's suit jacket_Men's suit trousers"},
                BB_BD_BM : {detail: "suit 3 pcs", value: "BB_BD_BM", fgroup:"1_1_1", names:"Men's suit jacket_Men's suit trousers_Men's suit vest"}
            }
        },
        I: {
            secondaryCategorieData: {
                BB_BD : {detail: "suit 2 pcs", value: "BB_BD", fgroup:"1_1", names:"Men's suit jacket_Men's suit trousers"},
                BB_BD_BM : {detail: "suit 3 pcs", value: "BB_BD_BM", fgroup:"1_1_1", names:"Men's suit jacket_Men's suit trousers_Men's suit vest"}
            }
        },
        R: {
            secondaryCategorieData: {
                BB_BD : {detail: "suit 2 pcs", value: "BB_BD", fgroup:"1_1", names:"Men's suit jacket_Men's suit trousers"},
                BB_BD_BM : {detail: "suit 3 pcs", value: "BB_BD_BM", fgroup:"1_1_1", names:"Men's suit jacket_Men's suit trousers_Men's suit vest"}
            }
        }
    },
    suitsWomenCategory : {
        1: {
            secondaryCategorieData: {
                BW_BJ : {detail: "两件套", value: "BW_BJ", fgroup:"2_2", names:"女西服上衣_女裤"},
                BW_BJ_WBM : {detail: "三件套", value: "BW_BJ_WBM", fgroup:"2_2_2", names:"女西服上衣_女裤_女马甲"}
            }
        },
        E: {
            secondaryCategorieData: {
                BW_BJ : {detail: "suit 2 pcs", value: "BW_BJ", fgroup:"2_2", names:"Jacket_Pant"},
                BW_BJ_WBM : {detail: "suit 3 pcs", value: "BW_BJ_WBM", fgroup:"2_2_2", names:"Jacket_Pant_Vest"}
            }
        }
    },
    PART_TOOLTIP : {
        1: {
            BB: {PHNBU: "温馨提示：金属带脚纽扣只能普通订扣！", REQLO: "温馨提示：做钻石袋左/右挂面横向位置不能绣字！"},
            BU: {PHNBU: "温馨提示：金属带脚纽扣只能普通订扣！", REQLO: "温馨提示：做钻石袋左/右挂面横向位置不能绣字！"},
            SU: {PHNBU: "温馨提示：金属带脚纽扣只能普通订扣！", REQLO: "温馨提示：做钻石袋左/右挂面横向位置不能绣字！"}
        },
        E: {
            BB: {PHNBU: "Please note: matel button foot can be sewed only by regular method!", REQLO: "Please note: the monogram can not be sewed horizontally when the 'Diamond shap pocket'is selected."},
            BU: {PHNBU: "Please note: matel button foot can be sewed only by regular method!", REQLO: "Please note: the monogram can not be sewed horizontally when the 'Diamond shap pocket'is selected."},
            SU: {PHNBU: "Please note: matel button foot can be sewed only by regular method!", REQLO: "Please note: the monogram can not be sewed horizontally when the 'Diamond shap pocket'is selected."}
        }
    },
    LANG: {
        ZH: "1",
        EN: "E"
    },
    MULITY_PART: "GCOPA|GCIPA|RESPO|KTPZS",
    multipleSelectPart : {
        GCOPA : 'X',
        GCIPA : 'X',
        RESPO : 'X'
    },
    PMD_SHOW_ITEM_COUNT : 10, //个性设计显示部件数量
    PME_SHOW_ITEM_COUNT : 13, //深度设计显示部件数量
    EMBROIDERY : "REQEM|REQEM2|REQEM3", //刺绣内容
    EMBROIDERY_IMG_TYPE : {RMIMGA:"A",RMIMGB:"B",RMIMGC:"C",RMIMGD:"D"}, //刺绣图片类型
    EMBROIDERY_TYPE : "REQTP|REQTP2|REQTP3", //刺绣类型
    EMBROIDERY_FIELD : ["REQTP", "REQEM", "REQCO", "REQEW", "REQLO", "REQCG", "REQWD", "REQEMIMG", "REQNP"],
    EMBROIDERY_FIELD2 : ["REQTP2", "REQEM2", "REQCO2", "REQEW2", "REQLO2", "REQCG2", "REQWD2", "REQEMIMG2", "REQNP2"],
    EMBROIDERY_FIELD3 : ["REQTP3", "REQEM3", "REQCO3", "REQEW3", "REQLO3", "REQCG3", "REQWD3", "REQEMIMG3", "REQNP3"],
    EMBROIDERY_TYPE_FIELD : { REQTP: { A : ["REQEM", "REQCO", "REQEW", "REQLO", "REQCG"], B : ["REQEMIMG", "REQCO", "REQLO", "REQCG"], C : ["REQEMIMG", "REQLO", "REQCG", "REQWD", "REQNP"]},
        REQTP2: { A : ["REQEM2", "REQCO2", "REQEW2", "REQLO2", "REQCG2"], B : ["REQEMIMG2", "REQCO2", "REQLO2", "REQCG2"], C : ["REQEMIMG2", "REQLO2", "REQCG2", "REQWD2", "REQNP2"]},
        REQTP3: { A : ["REQEM3", "REQCO3", "REQEW3", "REQLO3", "REQCG3"], B : ["REQEMIMG3", "REQCO3", "REQLO3", "REQCG3"], C : ["REQEMIMG3", "REQLO3", "REQCG3", "REQWD3", "REQNP3"]}},
    EMBROIDERY_TYPE_FIELD_V2 : {
            REQTP: { A : [{NAME: "REQEM", REQUIRE: "X"}, {NAME: "REQCO", REQUIRE: "X"}, {NAME: "REQEW", REQUIRE: "X"}, {NAME: "REQLO", REQUIRE: "X"}, {NAME: "REQCG", REQUIRE: ""}],
                B : [{NAME: "REQEMIMG", REQUIRE: "X"}, {NAME: "REQCO", REQUIRE: "X"}, {NAME: "REQLO", REQUIRE: "X"}, {NAME: "REQCG", REQUIRE: ""}],
                C : [{NAME: "REQEMIMG", REQUIRE: "X"}, {NAME: "REQLO", REQUIRE: "X"}, {NAME: "REQCG", REQUIRE: ""}, {NAME: "REQWD", REQUIRE: ""}, {NAME: "REQNP", REQUIRE: ""}]
            },
            REQTP2: { A : [{NAME: "REQEM2", REQUIRE: "X"}, {NAME: "REQCO2", REQUIRE: "X"}, {NAME: "REQEW2", REQUIRE: "X"}, {NAME: "REQLO2", REQUIRE: "X"}, {NAME: "REQCG2", REQUIRE: ""}],
                B : [{NAME: "REQEMIMG2", REQUIRE: "X"}, {NAME: "REQCO2", REQUIRE: "X"}, {NAME: "REQLO2", REQUIRE: "X"}, {NAME: "REQCG2", REQUIRE: ""}],
                C : [{NAME: "REQEMIMG2", REQUIRE: "X"}, {NAME: "REQLO2", REQUIRE: "X"}, {NAME: "REQCG2", REQUIRE: ""}, {NAME: "REQWD2", REQUIRE: ""}, {NAME: "REQNP2", REQUIRE: ""}]
            },
            REQTP3: { A : [{NAME: "REQEM3", REQUIRE: "X"}, {NAME: "REQCO3", REQUIRE: "X"}, {NAME: "REQEW3", REQUIRE: "X"}, {NAME: "REQLO3", REQUIRE: "X"}, {NAME: "REQCG3", REQUIRE: ""}],
                B : [{NAME: "REQEMIMG3", REQUIRE: "X"}, {NAME: "REQCO3", REQUIRE: "X"}, {NAME: "REQLO3", REQUIRE: "X"}, {NAME: "REQCG3", REQUIRE: ""}],
                C : [{NAME: "REQEMIMG3", REQUIRE: "X"}, {NAME: "REQLO3", REQUIRE: "X"}, {NAME: "REQCG3", REQUIRE: ""}, {NAME: "REQWD3", REQUIRE: ""}, {NAME: "REQNP3", REQUIRE: ""}]
            }
        },
    EMBROIDERY_TEXTAREA : "REQEM|REQNP|REQEM2|REQNP2|REQEM3|REQNP3",
    REQEMIMG : ["REQEMIMG", "REQEMIMG2", "REQEMIMG3"], //刺绣图片
    REQNP : "REQNP|REQNP2|REQNP3",
    REQTP_VALS: {WORDS: "A", IMG_LIB : "B", CUSTOMER_IMG: "C"},
    BRAND_MARK : {FIELD: "REQBR", NONE: "A"},
    COLLAR_MARK : {FIELD: "REQLG", SILK: "A"},
    brclsList:{jacket : "A", trousers: "B", shirt: "C", collar: "D"},
    TRANSFERSIZE2MODEL_EXCLUDE_FIELD : "CPUTM|ERDAT|ERDAT|ERDAT|LRECE|LRECN|LRECP|MANDT|PARTE|USNAM",
    priceNames: {
        URGEN: "eis_ipo_detail_55",//"加急费", Rush cost
        TESTP: "eis_ipo_detail_56",//"试穿类型", Fitting cost
        MATNR: "eis_ipo_detail_57",//"定价",  FOB price
        PRICFNR: "eis_ipo_detail_58",//"面料费",  Fabric cost
        ORDTP: "eis_ipo_detail_59",//"加工费",   CMT cost
        ADJUST: "eis_ipo_detail_60",//"调整金额",  Adjustment
        LZKTZ: "eis_ipo_detail_61",//"折扣金额",   Discount
        FABRIC: "eis_ipo_detail_62",//"辅料收费",  Extra trims cost
        ZRP2: "eis_ipo_detail_63",//"优惠",    Discount
        REKBA: "eis_ipo_detail_64",//"打包费"  Packing cost
    },
    notOtherPrice : "FATNR|MODEM|PRICING|MTYPB|PROCE",
    isHasHalfSetSizeKunnr : "0000030023",
    getExtraPrice: function(datas){
        var _datas = [];
        for(var i = 0; i < datas.length; i++){
            var data = datas[i];
            if (data.prctp != "ZR02"){
                continue;
            }
            if(product.isExtraPrice(data.propt)){
                _datas.push(data);
            }
        }
        return _datas;
    },
    getExtraPriceName: function(item){
        var name = item.tprot;
        var _name = product.priceNames[item.propt];
        if(_name){
            name = I18nUtil.getProp(_name);
        }
        return name;
    },
    /**
     * 获取单据状态代码对应的描述
     * @param statu
     * @returns {*}
     */
    getStatuDesc : function(statu){

        if(!statu || statu == null){
            return "";
        }
        var _statuItem = null;
        for(var i in this.statuList){
            var statuItem = this.statuList[i];
            if(statuItem.code == statu){
                _statuItem = statuItem;
                break;
            }
        }
        if(_statuItem == null){
            return "";
        }else{
            return _statuItem.name;
        }
    },
    /**
     * 获取单据状态代码对应的描述
     * @param statu
     * @returns {*}
     */
    getStatuI18nKey : function(statu){

        if(!statu || statu == null){
            return "";
        }
        var _statuItem = null;
        for(var i in this.statuList){
            var statuItem = this.statuList[i];
            if(statuItem.code == statu){
                _statuItem = statuItem;
                break;
            }
        }
        if(_statuItem == null){
            return "";
        }else{
            return _statuItem.i18nKey;
        }
    },
    /**
     * 修改时，加载订单信息
     * @param lrecn
     */
    loadingDataAndInitUi : function(lrecn){

        // processBar.show();loading
        var spras = I18nUtil.getSprasLang();
        var request = {lrecn: lrecn, spras: spras};
        var _url = "/eis/measureData/getOrderInfo4Update";
        $.ajax({
            type: 'POST',
            url: _url,
            contentType: "application/json;charset=utf-8",
            async: false,
            cache: false,
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (result, status, xhr) {
                console.log("updateSuccess:"+new Date());
                if(result.flag == "SUCCESS"){

                    product.initUi4Data(result.data);
                }else{
                    App.showMsgList(result.msgList);
                }
                console.log("initUi4Data:"+new Date());
                // product.mtypbItemSavedInitUi();品类初始化
                // processBar.hide();
            },
            error: function (xhr, status, error) {
                if (xhr.status === 401) {
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("eis_login_4")});
                } else {
                    //请求异常回调
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_13")});
                }
            }
        });
    },
    isJacketCls: function(cls){
        return (product.brclsList.jacket == cls);

    },
    initUi4Data : function(data){
        App.isNewOrder = false;             //不在是新单
        App.receiverCompleted = true;       //接受者信息不需要校验
        var zlreck = data.zlreckList[0];    // 订单抬头数据
        product.setExtraOrderInfo(zlreck);
        var zlrecdList = data.zlrecdList;   // 订单项目行
        var zlrecmList = data.zlrecmList;   // 尺寸
        var zlrecpList = data.zlrecpList;   // 特征值
        var zlredaList = data.zlredaList;   // 体型数据
        var zlnotesList = data.zlnotesList; // 备注
        var zlmatnrList = data.matnrList;
        //product.transferRedaAndRecm2CmIfIsInch(zlrecmList,zlredaList,zlrecpList);
        product.notesList = zlnotesList;
        App.priceLoader.load(data.zlreckPrice, zlreck);//加载价格
        var ptCustomerList = data.ptCustomerList;
        var matnrList = data.matnrPriceList;
        var ptCustomer = null;
        if(ptCustomerList.length > 0){
            ptCustomer = ptCustomerList[0];
            App.storeBrandInfo = ptCustomer.storeBrand;
            App.brand = App.storeBrandInfo.spart;
            App.zlrres = ptCustomer.storeBrand.resMap;
        }
        if(zlredaList.length > 0){
            product.zlreda = zlredaList[0]
        }
        //初始化计划项目和行项目,让最小的行项目先显示
        product.initLrecp(zlrecdList);
        //将zlpmd 进行缓存
        var zlpmdMap = data.zlpmdMap;
        product.cacheZlpmdMap(zlpmdMap);
        //个性部件数据 进行缓存
        var customSetList = data.customSetList;
        product.cacheCustomSetList(customSetList);
        //将数据分组
        product.groupData(zlrecdList, zlrecpList, zlnotesList, zlrecmList, zlmatnrList, zlredaList);
        //加载抬头、公司数据
        product.loadLreck(zlreck);
        //加载明细：行项目 团购订单 个性数据
        product.loadOtherALL(zlrecdList, zlreck);
        product.setTotalPrice(App.orderData);//设置总价
    },

    //初始化加载数据后的UI
    initUi4DataBySampleAndTemp : function(data){

        var zlrecdList = data.zlrecdList;
        var zlrecmList = data.zlrecmList;
        var zlrecpList = data.zlrecpList;
        var zlredaList = data.zlredaList;
        var zlnotesList = data.zlnotesList;
        var zlmatnrList = [];

        App.ordtp = "C";
        var zlreck = { ordtp : App.ordtp};
        //初始化计划项目和行项目
        product.initLrecp(zlrecdList);
        //将zlpmd 进行缓存
        // var zlpmdMap = data.zlpmdMap;
        // product.cacheZlpmdMap(zlpmdMap);
        //将数据分组
        product.groupData(zlrecdList, zlrecpList, zlnotesList, zlrecmList, zlmatnrList, zlredaList);


        //加载明细：行项目 团购订单 个性数据
        product.loadOtherALLBySample(zlrecdList, zlreck);

    },

    groupData : function(zlrecdList, zlrecpList, zlnotesList, zlrecmList, zlmatnrList, zlredaList) {
        product.zlrecdMap = product.groupZlrecd(zlrecdList);
        product.zlrecpMap = product.groupZlrecp(zlrecpList);
        product.zlrecmMap = product.groupZlrecm(zlrecmList);
        // product.orderNoteMap = product.groupOrderNote(zlnotesList);
        product.zlmatnrMap = product.groupZlmatnr(zlmatnrList);
        product.zlredaMap = product.groupZlreda(zlredaList);
    },
    setExtraOrderInfo : function(zlreck){

        App.extraOrderInfo.mandt = zlreck.mandt;
    },
    /**
     * 初始化行项目和计划项目
     * @param lrecpList
     * @param lreceList
     */
    initLrecp : function(lrecdList){
        App.nextLrecpflag = 1;
        for(var i = 0; i < lrecdList.length; i++){
            var _lrecp = parseInt(lrecdList[i].lrecp);
            if(App.nextLrecpflag < _lrecp){
                App.nextLrecpflag= _lrecp;
            }
        }
        App.nextLrecpflag = App.nextLrecpflag +1;
    },
    /**
     * 缓存品类显示字段
     * @param zlpmdMap
     */
    cacheZlpmdMap : function (zlpmdMap){
        for(var mtypb in  zlpmdMap){
            measureCache.cachePmd(mtypb, zlpmdMap[mtypb]);
        }
    },
    /**
     * 缓存部件下拉值
     * @param customSetList
     */
    cacheCustomSetList : function (customSetList){
        for(var i = 0; i < customSetList.length; i++){
            var customSet = customSetList[i];
            var mtypb = customSet.mtypb;
            var modem = customSet.modem;
            measureCache.cacheModemParts(mtypb, modem, customSet);

            if(customSet.zlpmr && customSet.zlmodList){
                var moder = customSet.zlpmr.moder;
                measureCache.cacheModel(mtypb, moder, customSet.zlmodList);
            }
        }
    },
    /**
     * 加载订单抬头
     * @param zlreck
     */
    loadLreck : function (zlreck){
        for(var field in zlreck) {
            App[field] = zlreck[field];
        }
    },
    /**
     * 加载项目数据以及个性数据
     * @param zlrecdList
     * @param zlreceList
     * @param zlrecpList
     * @param zlrecmList
     */
    loadOtherALLBySample : function (zlrecdList, zlreck){
        var iscsu = '';
        var selectedFabricSource = 3;
        App.orderData=[];
        if (zlreck.ordtp == "C"){
            iscsu = '';
            selectedFabricSource = 1;
        }else {
            iscsu = 'X';
            selectedFabricSource = 2;
        }
        App.ordtpIndex = 0;
        var zlrecdIdx = 0;
        for(var i = 0; i < zlrecdList.length; i++){
            var zlrecd = zlrecdList[i];

            if(zlrecd.loekz == "X"){
                continue;
            }

            var lrecp = zlrecd.lrecp;
            var mtypb = zlrecd.mtypb;
            var modem = zlrecd.modem;
            if (!measureCache.getPmd(mtypb)) {
                product.getPartsIntoCacheAndDisplay(mtypb);
            }
            // 获取版型数据，并进行缓存
            product.getPartsOptionsIntoCacheAndDisplay(lrecp, mtypb, modem);


            if (product.zlredaMap[lrecp]==null){
                var zlreda = {};
            }else {
                var zlreda = product.zlredaMap[lrecp];
            }
            //创建新的orderData加入组
            App.orderData[zlrecdIdx]={
                Category:{
                    mtypb: zlrecd.mtypb,
                    categoryName: App.propers.get("MTYPA").find(zlrecd.mtypb).detail,
                    sexty: zlrecd.sexty,
                },//当前的品类
                menge:parseInt(zlrecd.menge), //默认数量
                DMBTR : "0", //此项目行总价
                unit_price : "0", //单价
                manual_price : "0",//手工价
                fabric_price : "0",//面料价
                cmt_price : "0",//基础加工费
                extra_price : "0",//额外价格
                testp:zlrecd.testp, //默认不需要试穿
                repst:zlrecd.repst,
                drocn:zlrecd.drocn,//穿衣场合、默认职场
                Fabric: {
                    fatnr: zlrecd.fatnr,
                    matnr: zlrecd.matnr,
                    name: '',
                    value: '',
                    src: 'https://mtm.baoxiniao.co/mtmstorage/images/fabric/'+zlrecd.fatnr+'.jpg',
                    iscsu: iscsu,
                },//当前品类选择的面料
                selectedFabricSource : selectedFabricSource,//当前品类选择的面料来源 1云翼 2来料
                stepIndex: 3,//当前品类进行的步骤
                nonYunyiMatnrs : [],//当前品类所有的非云翼面料
                yunyiMatnrs : [],//当前品类所有的云翼面料
                Pattern: {
                    modem: zlrecd.modem,
                    name: zlrecd.modem,
                    value: '',
                    src: 'https://mtm.baoxiniao.co/mtmstorage/images/model/'+zlrecd.mtypb+'/'+zlrecd.mtypb+zlrecd.modem+'.jpg',
                    moder: getModerByMtypbAndModem(zlrecd.mtypb,zlrecd.modem),
                },//当前品类选择的版型
                Patterns: [],//当前品类所有的版型
                Embroidery: [],//当前品类所选择的刺绣
                embroideryTabIndex: 0,//当前品类刺绣的Tab栏目
                // embroideryMaxNum: 3,//当前品类刺绣的最大数量
                remark: "",
                lrecp: lrecp,//当前品类号
                zlrecps:{
                    // "MEASU" : {propt:"MEASU", prope:"C"},
                    // "URGEN" : {propt:"URGEN", prope:"A"},
                },//部件选中值
                meunit:"CM", // 英寸
                designInit:true, // 是否已经初始化过
                patternInit:true, // 是否已经初始化过
                isSelected:false, // 产品是否被选中
                statu: zlrecd.statu, // 新增状态
                zlreda: zlreda, // 体型数据
                zlrecm: product.zlrecmMap[lrecp],//尺寸
                tryOnZlrecm: {}, // 套号体型数据
                halfTryOnZlrecm: {}, // 半套号体型数据
                netZlrecm: {}, // 净尺体型数据
                garmentZlrecm: {}, // 成衣体型数据
                pmdData:{},//所有个性化值,会在款式初始化拿到
                designController: {
                    isCompleted: true, // 是否完成
                    required: {},   // 款式设计必填项(未填的)
                },
                embroideryController: {
                    isCompleted: true, // 是否完成
                    required: {},   // 刺绣设计必填项(未填的)
                },
                measurementController: {
                    tryOn: {
                        isCompleted: true,
                        required: {},
                    },
                    halfTryOn: {
                        isCompleted: true,
                        required: {},
                    },
                    garment: {
                        isCompleted: true,
                        required: {},
                    },
                    net: {
                        isCompleted: true,
                        required:{},
                    },
                },
                bodyshapeController: {
                    pma: {
                        isCompleted: true,
                        required: {},
                    },
                    pmb: {
                        isCompleted: true,
                        required: {},
                    },
                    pmh: {
                        isCompleted: true,
                        required: {},
                    },
                    pmj: {
                        isCompleted: true,
                        required: {},
                    },
                },
            }; // 0 代表第一个tab
            App.setFabricZsfac(zlrecdIdx,zlrecd.fatnr);
            zlrecdIdx++;
        }

        //初始化版型数据
        product.getPatternsV2(App.orderData[0],null);

        loadZlrecdAndZlrecp();//加载所有的特征值

        loadOrderDataByZlrecp(); //把特征值特殊处理

        function getModerByMtypbAndModem(mtypb,modem){
            var mtypbSet = measureCache.getModemParts(mtypb, modem);
            if(mtypbSet.zlpmr){
                return mtypbSet.zlpmr.moder;
            }else {
                alert('moder data is missing');
                return '';
            }
        }

        function loadOrderDataByZlrecp() {
            // 加载zlrecp中lrecp=00000的数据
            var fieldNotep = "DIVER|TELPH|REGIO|COUNC|CPHNO";
            var fieldPrope = "MEUNIT";
            var zlrecps4Zlreck = product.zlrecpMap[product.EMPTY_LINE];
            if(zlrecps4Zlreck) {
                for(var i = 0; i < zlrecps4Zlreck.length; i++) {
                    var field = zlrecps4Zlreck[i].propt;
                    if(fieldNotep.indexOf(field) != -1) {
                        App[field.toLowerCase()] = zlrecps4Zlreck[i].notep;
                    } else if(fieldPrope.indexOf(field) != -1) {
                        App[field.toLowerCase()] = zlrecps4Zlreck[i].prope;
                    }
                }
            }

            for (var i in App.orderData) {
                var orderData = App.orderData[i];
                var mtypb = orderData.Category.mtypb;
                var modem = orderData.Pattern.modem;
                var zlrecps = App.orderData[i].zlrecps;
                if (zlrecps["DRANP"]){
                    App.orderData[i].remark = zlrecps["DRANP"].notep;
                }
                App.orderData[i].meunit = App.meunit;

                // tryOnZlrecm: {}, // 套号体型数据
                // netZlrecm: {}, // 净尺体型数据
                // garmentZlrecm: {}, // 成衣体型数据
                // var measuVal = zlrecps["MEASU"].prope;
                // 量体数据补充
                var measuVal = orderData.zlrecps['MEASU'].prope;
                if(product.isGarmentSizeMeasu(measuVal)){
                    App.orderData[i].garmentZlrecm=App.orderData[i].zlrecm;
                }else if(product.isNetSizeMeasu(measuVal)){
                    App.orderData[i].netZlrecm=App.orderData[i].zlrecm;
                    // App.orderData[i].zlreda=App.orderData[i].zlrecm;
                }else if (product.isModelSizeMeasu(measuVal)){
                    App.orderData[i].tryOnZlrecm=App.orderData[i].zlrecm;
                }else if (product.isHalfSetSizeMeasu(measuVal)){
                    App.orderData[i].halfTryOnZlrecm=App.orderData[i].zlrecm;
                    //半套号和套号实际共用model一个字段，但系统上需要区分，赋值时变更
                    App.orderData[i].model= "";
                    App.orderData[i].halfModel= App.orderData[i].zlrecm.model;
                }


                var partsSet = measureCache.getModemParts(mtypb, modem);
                if(!partsSet && partsSet.map){
                    return;
                }
                var partMap = partsSet.map;

                // 刺绣数据赋值; zlrecps里面有全部的数据
                for (var j in zlrecps){
                    var zlrecp = zlrecps[j];
                    var field = zlrecp.propt;
                    var value = zlrecp.prope;
                    var notep = zlrecp.notep;
                    var name = zlrecp.tprot;
                    if(product.isEmbroideryFields(field)) { //刺绣控件
                        var reqtp = product.getReqtpByEmbroideryField(field);
                        var index = 0;
                        if (reqtp == 'REQTP'){
                            var index = 0;
                        } else if (reqtp == 'REQTP2'){
                            var index = 1;
                        } else  if (reqtp == 'REQTP3'){
                            var index = 2;
                        }

                        if (App.orderData[i].Embroidery[index]==null){
                            App.orderData[i].Embroidery[index]={
                                data: {
                                    selectedEmbroideryImageType: "",
                                },
                                selectedEmbroideryType: "A",
                            }
                        }
                        if (field == reqtp){
                            App.orderData[i].Embroidery[index]["selectedEmbroideryType"] = value
                        }
                        if(product.isReqemImg(field)){
                            var splits = notep.split("/");
                            App.orderData[i].Embroidery[index]["data"][field] = {
                                prope:value,
                                propt:field,
                                notep:notep,
                            }
                            App.orderData[i].Embroidery[index]["data"]["selectedEmbroideryImageType"] = product.EMBROIDERY_IMG_TYPE[splits[splits.length -2]];
                        } else if(product.isEmbroideryTextArea(field)){
                            App.orderData[i].Embroidery[index]["data"][field] = {
                                notep:notep,
                                propt:field,
                            }
                        }else{
                            var _partSet  = partMap[field];
                            if(!_partSet){
                                continue;
                            }
                            var valList = _partSet.valueList;
                            if(!valList || valList.length == 0){
                                continue;
                            }
                            var item = getCommonPartValue(field, zlrecp, null, valList);
                            if(item == null){
                                continue;
                            }
                            App.orderData[i].Embroidery[index]["data"][field] = {
                                prope:value,
                                propt:field,
                                desc:item.name,
                            }
                        }
                    }

                }


            }
        }
        function getCommonPartValue(field, zlrecp, partItemDiv, valList){
            var _item = null;
            var prope = zlrecp.prope;
            for(var i = 0; i < valList.length; i++){
                var item = valList[i];
                if(item.prope == prope){
                    _item = item;
                    break;
                }
            }
            if(_item == null){
                return null;
            }
            return {val: _item.prope, name: _item.tprop};
        }
        function loadZlrecdAndZlrecp() {
            for (var i in App.orderData) {
                var orderData = App.orderData[i];
                var lrecp = orderData.lrecp;
                var zlrecd = product.zlrecdMap[lrecp];
                if (zlrecd) {
                    for (var field in zlrecd) {
                        orderData[field] = zlrecd[field];
                    }
                }
                product.setPrice(i, lrecp);
                var zlrecps = product.zlrecpMap[lrecp];
                if (zlrecps) {
                    for (var j=0; j < zlrecps.length; j++) {
                        var field = zlrecps[j].propt;
                        App.orderData[i].zlrecps[field.toUpperCase()] = zlrecps[j];
                    }
                }
            }
        }
    },
    /**
     * 加载项目数据以及个性数据
     * @param zlrecdList
     * @param zlreceList
     * @param zlrecpList
     * @param zlrecmList
     */
    loadOtherALL : function (zlrecdList, zlreck){
        var iscsu = '';
        var selectedFabricSource = 3;
        App.orderData=[];
        if (zlreck.ordtp == "C"){
            iscsu = '';
            selectedFabricSource = 1;
        }else {
            iscsu = 'X';
            selectedFabricSource = 2;
        }
        App.ordtpIndex = 0;
        var zlrecdIdx = 0;
        for(var i = 0; i < zlrecdList.length; i++){
            var zlrecd = zlrecdList[i];

            if(zlrecd.loekz == "X"){
                continue;
            }
            var lrecp = zlrecd.lrecp;

            if (product.zlredaMap[lrecp]==null){
                var zlreda = {};
            }else {
                var zlreda = product.zlredaMap[lrecp];
            }
            //创建新的orderData加入组
            App.orderData[zlrecdIdx]={
                Category:{
                    mtypb: zlrecd.mtypb,
                    categoryName: App.propers.get("MTYPA").find(zlrecd.mtypb).detail,
                    sexty: zlrecd.sexty,
                },//当前的品类
                menge:parseInt(zlrecd.menge), //默认数量
                DMBTR : "0", //此项目行总价
                unit_price : "0", //单价
                manual_price : "0",//手工价
                fabric_price : "0",//面料价
                cmt_price : "0",//基础加工费
                extra_price : "0",//额外价格
                testp:zlrecd.testp, //默认不需要试穿
                repst:zlrecd.repst,
                drocn:zlrecd.drocn,//穿衣场合、默认职场
                Fabric: {
                    fatnr: zlrecd.fatnr,
                    matnr: zlrecd.matnr,
                    name: '',
                    value: '',
                    src: 'https://mtm.baoxiniao.co/mtmstorage/images/fabric/'+zlrecd.fatnr+'.jpg',
                    iscsu: iscsu,
                },//当前品类选择的面料
                selectedFabricSource : selectedFabricSource,//当前品类选择的面料来源 1云翼 2来料
                stepIndex: 3,//当前品类进行的步骤
                nonYunyiMatnrs : [],//当前品类所有的非云翼面料
                yunyiMatnrs : [],//当前品类所有的云翼面料
                Pattern: {
                    modem: zlrecd.modem,
                    name: zlrecd.modem,
                    value: '',
                    src: 'https://mtm.baoxiniao.co/mtmstorage/images/model/'+zlrecd.mtypb+'/'+zlrecd.mtypb+zlrecd.modem+'.jpg',
                    moder: getModerByMtypbAndModem(zlrecd.mtypb,zlrecd.modem),
                },//当前品类选择的版型
                Patterns: [],//当前品类所有的版型
                Embroidery: [],//当前品类所选择的刺绣
                embroideryTabIndex: 0,//当前品类刺绣的Tab栏目
                // embroideryMaxNum: 3,//当前品类刺绣的最大数量
                remark: "",
                lrecp: lrecp,//当前品类号
                zlrecps:{
                    // "MEASU" : {propt:"MEASU", prope:"C"},
                    // "URGEN" : {propt:"URGEN", prope:"A"},
                },//部件选中值
                meunit:"CM", // 英寸
                designInit:true, // 是否已经初始化过
                patternInit:true, // 是否已经初始化过
                isSelected:false, // 产品是否被选中
                statu: zlrecd.statu, // 新增状态
                zlreda: zlreda, // 体型数据
                zlrecm: product.zlrecmMap[lrecp],//尺寸
                tryOnZlrecm: {}, // 套号体型数据
                halfTryOnZlrecm: {}, // 半套号体型数据
                netZlrecm: {}, // 净尺体型数据
                garmentZlrecm: {}, // 成衣体型数据
                pmdData:{},//所有个性化值,会在款式初始化拿到
                designController: {
                    isCompleted: true, // 是否完成
                    required: {},   // 款式设计必填项(未填的)
                },
                embroideryController: {
                    isCompleted: true, // 是否完成
                    required: {},   // 刺绣设计必填项(未填的)
                },
                measurementController: {
                    tryOn: {
                        isCompleted: true,
                        required: {},
                    },
                    halfTryOn: {
                        isCompleted: true,
                        required: {},
                    },
                    garment: {
                        isCompleted: true,
                        required: {},
                    },
                    net: {
                        isCompleted: true,
                        required:{},
                    },
                },
                bodyshapeController: {
                    pma: {
                        isCompleted: true,
                        required: {},
                    },
                    pmb: {
                        isCompleted: true,
                        required: {},
                    },
                    pmh: {
                        isCompleted: true,
                        required: {},
                    },
                    pmj: {
                        isCompleted: true,
                        required: {},
                    },
                },
            }; // 0 代表第一个tab
            App.setFabricZsfac(zlrecdIdx,zlrecd.fatnr);
            zlrecdIdx++;
        }

        //初始化版型数据
        product.getPatternsV2(App.orderData[0],null);

        loadZlrecdAndZlrecp();//加载所有的特征值

        loadOrderDataByZlrecp(); //把特征值特殊处理

        function getModerByMtypbAndModem(mtypb,modem){
            var mtypbSet = measureCache.getModemParts(mtypb, modem);
            if(mtypbSet.zlpmr){
                return mtypbSet.zlpmr.moder;
            }else {
                alert('moder data is missing');
                return '';
            }
        }

        function loadOrderDataByZlrecp() {
            // 加载zlrecp中lrecp=00000的数据
            var fieldNotep = "DIVER|TELPH|REGIO|COUNC|CPHNO";
            var fieldPrope = "MEUNIT";
            var zlrecps4Zlreck = product.zlrecpMap[product.EMPTY_LINE];
            if(zlrecps4Zlreck) {
                for(var i = 0; i < zlrecps4Zlreck.length; i++) {
                    var field = zlrecps4Zlreck[i].propt;
                    if(fieldNotep.indexOf(field) != -1) {
                        App[field.toLowerCase()] = zlrecps4Zlreck[i].notep;
                    } else if(fieldPrope.indexOf(field) != -1) {
                        App[field.toLowerCase()] = zlrecps4Zlreck[i].prope;
                    }
                }
            }

            for (var i in App.orderData) {
                var orderData = App.orderData[i];
                var mtypb = orderData.Category.mtypb;
                var modem = orderData.Pattern.modem;
                var zlrecps = App.orderData[i].zlrecps;
                if (zlrecps["DRANP"]){
                    App.orderData[i].remark = zlrecps["DRANP"].notep;
                }
                App.orderData[i].meunit = App.meunit;

                // tryOnZlrecm: {}, // 套号体型数据
                // netZlrecm: {}, // 净尺体型数据
                // garmentZlrecm: {}, // 成衣体型数据
                // var measuVal = zlrecps["MEASU"].prope;
                // 量体数据补充
                var measuVal = orderData.zlrecps['MEASU'].prope;
                if(product.isGarmentSizeMeasu(measuVal)){
                    App.orderData[i].garmentZlrecm=App.orderData[i].zlrecm;
                }else if(product.isNetSizeMeasu(measuVal)){
                    App.orderData[i].netZlrecm=App.orderData[i].zlrecm;
                    // App.orderData[i].zlreda=App.orderData[i].zlrecm;
                }else if (product.isModelSizeMeasu(measuVal)){
                    App.orderData[i].tryOnZlrecm=App.orderData[i].zlrecm;
                }else if (product.isHalfSetSizeMeasu(measuVal)){
                    App.orderData[i].halfTryOnZlrecm=App.orderData[i].zlrecm;
                    //半套号和套号实际共用model一个字段，但系统上需要区分，赋值时变更
                    App.orderData[i].model= "";
                    App.orderData[i].halfModel= App.orderData[i].zlrecm.model;
                }


                var partsSet = measureCache.getModemParts(mtypb, modem);
                if(!partsSet && partsSet.map){
                    return;
                }
                var partMap = partsSet.map;

                // 刺绣数据赋值; zlrecps里面有全部的数据
                for (var j in zlrecps){
                    var zlrecp = zlrecps[j];
                    var field = zlrecp.propt;
                    var value = zlrecp.prope;
                    var notep = zlrecp.notep;
                    var name = zlrecp.tprot;
                    if(product.isEmbroideryFields(field)) { //刺绣控件
                        var reqtp = product.getReqtpByEmbroideryField(field);
                        var index = 0;
                        if (reqtp == 'REQTP'){
                            var index = 0;
                        } else if (reqtp == 'REQTP2'){
                            var index = 1;
                        } else  if (reqtp == 'REQTP3'){
                            var index = 2;
                        }

                        if (App.orderData[i].Embroidery[index]==null){
                            App.orderData[i].Embroidery[index]={
                                data: {
                                    selectedEmbroideryImageType: "",
                                },
                                selectedEmbroideryType: "A",
                            }
                        }
                        if (field == reqtp){
                            App.orderData[i].Embroidery[index]["selectedEmbroideryType"] = value
                        }
                        if(product.isReqemImg(field)){
                            var splits = notep.split("/");
                            App.orderData[i].Embroidery[index]["data"][field] = {
                                prope:value,
                                propt:field,
                                notep:notep,
                            }
                            App.orderData[i].Embroidery[index]["data"]["selectedEmbroideryImageType"] = product.EMBROIDERY_IMG_TYPE[splits[splits.length -2]];
                        } else if(product.isEmbroideryTextArea(field)){
                            App.orderData[i].Embroidery[index]["data"][field] = {
                                notep:notep,
                                propt:field,
                            }
                        }else{
                            var _partSet  = partMap[field];
                            if(!_partSet){
                                continue;
                            }
                            var valList = _partSet.valueList;
                            if(!valList || valList.length == 0){
                                continue;
                            }
                            var item = getCommonPartValue(field, zlrecp, null, valList);
                            if(item == null){
                                continue;
                            }
                            App.orderData[i].Embroidery[index]["data"][field] = {
                                prope:value,
                                propt:field,
                                desc:item.name,
                            }
                        }
                    }

                }


            }
        }
        function getCommonPartValue(field, zlrecp, partItemDiv, valList){
            var _item = null;
            var prope = zlrecp.prope;
            for(var i = 0; i < valList.length; i++){
                var item = valList[i];
                if(item.prope == prope){
                    _item = item;
                    break;
                }
            }
            if(_item == null){
                return null;
            }
            return {val: _item.prope, name: _item.tprop};
        }
        function loadZlrecdAndZlrecp() {
            for (var i in App.orderData) {
                var orderData = App.orderData[i];
                var lrecp = orderData.lrecp;
                var zlrecd = product.zlrecdMap[lrecp];
                if (zlrecd) {
                    for (var field in zlrecd) {
                        orderData[field] = zlrecd[field];
                    }
                }
                product.setPrice(i, lrecp);
                var zlrecps = product.zlrecpMap[lrecp];
                if (zlrecps) {
                    for (var j=0; j < zlrecps.length; j++) {
                        var field = zlrecps[j].propt;
                        App.orderData[i].zlrecps[field.toUpperCase()] = zlrecps[j];
                    }
                }
            }
        }
    },
    /**
     * 获取订单编号
     * @returns {*|jQuery}
     */
    getLrecn : function(){
        var _lrecn = App.lrecn;
        if(_lrecn == "#"){
            _lrecn = "";
        }
        return _lrecn;
    },
    //获取选中的产品
    getSelectedProduct : function (){

        var _products = App.orderData;
        var selectedProducts = new Array();
        for(var i = 0; i < _products.length; i++){
            var _product = _products[i];
            if(_products[i].isSelected == true){
                selectedProducts.push(_product);
            }
        }
        return selectedProducts;
    },

    isOrderCanCancel: function (statu) {
        return (statu == product.statuList.orderConfirm.code
            || statu == product.statuList.fabricPass.code || statu == product.statuList.orderPass.code || statu == product.statuList.comingMaterialsConfigPass.code);
    },
    /**
     * 产品撤单
     * @param lrecn
     * @param lrecps
     */
    cancelProduct : function(lrecn, lrecps){

        var index = layer.load();
        var request = {};
        request.LRECN = lrecn;
        request.LRECPS = lrecps;
        request.USNAM = loginAccount;

        var _url = "/eis/measureData/cancelPersonalOrder";
        $.ajax({
            type: 'POST',
            url: _url,
            contentType: "application/json;charset=utf-8",
            async: true,
            cache: false,
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (result, status, xhr) {
                if(result.flag == "SUCCESS"){
                    layer.close(index);
                    alert(I18nUtil.getProp("common_js_alert_52"));
                    window.location.href = "/eis/measureOrder/international/personal/update_v3/" + lrecn;
                }else{
                    App.showMsgList(result.msgList);
                    layer.close(index);
                }
            },
            error: function (xhr, status, error) {
                if (xhr.status === 401) {
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("eis_login_4")});
                } else {
                    //请求异常回调
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_20")});
                }
                layer.close(index);
            }
        });
    },
    /**
     * 产品转单
     * @param lrecn
     * @param lrecps
     */
    transferProduct : function(lrecn, lrecps){

        var index = layer.load();
        var request = {};
        request.LRECN = lrecn;
        request.LRECPS = lrecps;
        request.SPRAS = I18nUtil.getSprasLang();
        request.USNAM = loginAccount;

        var _url = "/eis/measureData/startPersonalOrderProcess";
        $.ajax({
            type: 'POST',
            url: _url,
            contentType: "application/json;charset=utf-8",
            async: true,
            cache: false,
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (result, status, xhr) {
                if(result.flag == "SUCCESS"){
                    layer.close(index);
                    alert(I18nUtil.getProp("common_js_alert_52"));
                    //product.loadTransferOrderInfo(result.data, lrecps);
                    window.location.href = "/eis/measureOrder/international/personal/update_v3/" + lrecn;
                }else{
                    // messageConsole.show(result.msgList, null);
                    App.showMsgList(result.msgList);
                    layer.close(index);
                    //alert(result.msgList[0].message, null);
                    // processBar.hide();
                }
            },
            error: function (xhr, status, error) {
                if (xhr.status === 401) {
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("eis_login_4")});
                } else {
                    //请求异常回调
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_20")});
                }
                layer.close(index);
            }
        });
    },
    //保存加载订单信息,修改订单时加载数据
    reloadOrderInfo : function(orderInfo){

        setUpdateFlag(orderInfo.zlreckList);

        var zlrecks = orderInfo.zlreckList; // 订单抬头数据
        var zlrecds = orderInfo.zlrecdList; // 订单项目行
        var zlrecms = orderInfo.zlrecmList; // 尺寸
        var zlrecps = orderInfo.zlrecpList; // 特征值
        var zlredas = orderInfo.zlredaList; // 体型数据
        var zlnotes = orderInfo.zlnotesList;// 备注
        var zlreckPrice = orderInfo.zlreckPrice;

        product.zlrecdMap = product.groupZlrecd(zlrecds);
        product.zlrecpMap = product.groupZlrecp(zlrecps);
        product.zlrecmMap = product.groupZlrecm(zlrecms);
        product.zlredaMap = product.groupZlreda(zlredas);

        var zlreck = zlrecks[0]; // 订单抬头数据
        reLoadPrice(zlreckPrice,zlreck); //加载价格
        reloadZlreck(zlrecks);    //加载抬头信息
        reloadZlreda();
        reloadZlrecdAndZlrecp();  //加载项目信息
        reloadZlnotes(zlnotes);
        reloadUi();
        layer.close(layer.index);
        //processBar.hide();

        function reloadUi(){
            product.setTotalPrice(App.orderData);//设置总价
            App.renderOrderList();
            App.initPrice();
            App.reloadMeasurementUi();
            //设置lrecn
            $("#orderNo").show();
            $("#orderLrecn").html(App.lrecn);

            // var _products = $("div[name='product'][lrecp]");
            // product.setTotalPrice(_products);
            // $("#title-sum").find("span[name='lrecn']").html(lrecn);
            // $("#title-sum").find("span[name='product-count']").html(_products.length);
        }

        function setUpdateFlag(zlrecks){

            App.update = "true";
            App.lrecn = zlrecks[0].lrecn;
        }

        //加载抬头信息
        function reloadZlreck(zlrecks){

            var zlreck = zlrecks[0];
            App.extraOrderInfo.mandt = zlreck.mandt;
            for(var field in zlreck) {
                 App[field] = zlreck[field];
            }
        }
        function reloadZlreda(){
            for(var i in App.orderData) {
                var lrecp = App.orderData[i].lrecp;
                var zlreda = product.zlredaMap[lrecp];
                if(zlreda){
                    for(var field in zlreda) {
                        App.orderData[i].zlreda[field] = zlreda[field];
                    }
                }
            }
        }
        //加载项目信息
        function reloadZlrecdAndZlrecp() {
            for (var i in App.orderData) {
                var orderData = App.orderData[i];
                var lrecp = orderData.lrecp;
                var zlrecd = product.zlrecdMap[lrecp];
                var modelTemp = "";
                if (zlrecd) {
                    for (var field in zlrecd) {
                        if (field == "model"){
                            modelTemp = zlrecd[field];
                            continue;
                        }
                        orderData[field] = zlrecd[field];
                    }
                }
                product.setPrice(i, lrecp);
                var zlrecps = product.zlrecpMap[lrecp];
                if (zlrecps) {
                    for (var j=0; j < zlrecps.length; j++) {
                        var field = zlrecps[j].propt;
                        App.orderData[i].zlrecps[field.toUpperCase()] = zlrecps[j];
                    }
                }
                var measu = App.orderData[i].zlrecps['MEASU'].prope;
                if (product.isHalfSetSizeMeasu(measu)){
                    orderData.halfModel = modelTemp;
                } else if (product.isModelSizeMeasu(measu)){
                    orderData.model = modelTemp;
                }

            }
        }
        //加载备注
        function reloadZlnotes(zlnotes){
            product.notesList = zlnotes;
        }
        //加载价格
        function reLoadPrice(zlreckPrice,zlreck){

            App.priceLoader.load(zlreckPrice,zlreck);
        }
        /**
         * 从zlrecp中寻找特定的值
         * @param lrecp
         * @param zlrecpMap
         * @param fieldName
         * @returns {string}
         */
        function findValuesInLrecps(lrecp, zlrecpMap, fieldNames){

            var result = {};
            for(var i = 0; i < fieldNames.length; i++){
                result[fieldNames[i]] = "";
            }
            var items = zlrecpMap[lrecp];
            if(!items || items.length == 0){
                return result;
            }
            for(var i = 0; i < items.length; i++){
                var item = items[i];
                var name = item.propt;
                if(result[name] != ""){
                    continue;
                }
                result[name] = item.prope;
            }
            return result;
        }
    },
    /**
     * 设置订单总价
     * @param _products
     */
    setTotalPrice : function(orderDatas) {
        var totalPrice = 0;
        for (var i = 0; i< orderDatas.length; i++) {
            var _orderData = orderDatas[i];
            var unitTotalPrice = _orderData.DMBTR;
            totalPrice += Number(unitTotalPrice);
        }
        App.TotalPrice=parseFloat(totalPrice).toFixed(2);
    },
    //设置单价和手工价格
    setPrice : function(tabIndex, lrecp){
        App.currency = App.priceLoader.getCurrencyDesc();
        // currency是币种，Dollar
        if(!App.priceLoader.isInitial()){
            App.resetPriceByTabIndex(tabIndex);
            return;
        }else{
            var lrecdPrice = App.priceLoader.getZlrecdPrice(lrecp);
            if(lrecdPrice != null){
                var menge = App.orderData[tabIndex].menge;
                App.orderData[tabIndex].DMBTR = (parseFloat(lrecdPrice.zr02TtlPrice) * parseFloat(menge)).toFixed(2);
                App.orderData[tabIndex].unit_price = lrecdPrice.zr02Price;
                App.orderData[tabIndex].manual_price = lrecdPrice.zr02ManualPrice;
                App.orderData[tabIndex].fabric_price = lrecdPrice.zr02FabricPrice;
                App.orderData[tabIndex].cmt_price = lrecdPrice.zr02CMTPrice;
                App.orderData[tabIndex].extra_price = lrecdPrice.zr02ExtraPrice;
                App.orderData[tabIndex].zlprcdList = lrecdPrice.zlprcdList;
            }else{
                App.resetPriceByTabIndex(tabIndex);
            }
        }
    },
    generateFabricSeq : function(kunnr, count) {

        var storeCode = kunnr.length > 5 ? kunnr.substr(0, kunnr.length - 4) : kunnr;
        var request = {kunnr: storeCode, num: count};
        var _url = "/eis/measureData/getStoreSeq4Fabric";
        var fabricSeqAry;
        $.ajax({
            type : 'POST',
            url : _url,
            contentType: "application/json;charset=utf-8",
            async: false,
            cache: false,
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (result, status, xhr) {
                if(result.flag == "SUCCESS"){
                    fabricSeqAry = result.data;
                }else{
                    // App.showMsgList(result.msgList);
                    alert(result.msgList[0].message, null);
                    // messageConsole.show(result.msgList);
                }
            },
            error: function (xhr, status, error) {
                if (xhr.status === 401) {
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("eis_login_4")});
                } else {
                    //请求异常回调
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_20")});
                }
            }
        });
        return fabricSeqAry;
    },
    getMatnrV2 : function(mtypb, brand, fatnr, iscsu, _callback, _async) {
        var matnrs = [];
        var request = getSearchCondition(brand, mtypb, fatnr, iscsu);
        var _url = "/eis/measureData/getZlmatnr";
        $.ajax({
            type: 'POST',
            url: _url,
            contentType: "application/json;charset=utf-8",
            async: _async,
            cache: false,
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (result, status, xhr) {
                if (result.flag == "SUCCESS") {
                    var datas = result.data;
                    if(_async){
                        // _callback(result.data, result.data, userData);
                        return;
                    }else{
                        if (!datas || datas.length == 0) {
                            matnrs = [];
                        } else {
                            matnrs = result.data;
                        }
                    }
                } else {
                    // messageConsole.show(result.msgList);
                    // App.showMsgList(result.msgList);
                    alert(result.msgList[0].message, null);
                    matnrs = [];
                }
            },
            error: function (xhr, status, error) {
                if (xhr.status === 401) {
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("eis_login_4")});
                } else {
                    //请求异常回调
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_20")});
                }
                matnrs = [];
            }

        });
        return matnrs;

        function getSearchCondition(brand, mtypb, fatnr, iscsu) {
            var request = {};
            if(iscsu == product.iscsuStatus.kegong.code){
                request.iscsu = [rangeUtil.createEqStdRange(iscsu)];
            }else{
                request.iscsu = [rangeUtil.createNeStdRange(product.iscsuStatus.kegong.code)]
            }
            request.mtypb = [rangeUtil.createEqStdRange(mtypb)];
            request.brand = [rangeUtil.createEqStdRange(brand)];
            if (fatnr) {
                request.fatnr = [rangeUtil.createEqStdRange(fatnr)];
            }
            request.biztp = [rangeUtil.createNeStdRange(product.biztpList.group.code)];
            request.loekz = [rangeUtil.createNeStdRange("X")];
            var kunnrCond = product.getMainStoreCondition();
            request.kunnr = [rangeUtil.createEqStdRange(""), kunnrCond];
            return request;
        }
    },

    getKunnrBrandAndSet : function(kunnr){

        var request = {};
        request.kunnr = [rangeUtil.createEqStdRange(kunnr)];

        var _url = "/eis/measureData/getZlrbrand";
        $.ajax({
            type: 'POST',
            url: _url,
            contentType: "application/json;charset=utf-8",
            async: true,
            cache: false,
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (result, status, xhr) {
                var data = result.data;
                zlrres = data[0].resMap;
                var brand = product.brandList.bxn.code;
                if (result.flag == "SUCCESS") {
                    if(data && data.length > 0){
                        brand = data[0].spart;
                        _storeBrandInfo = data[0];
                    }
                }
                initAddrtComp(kunnr);
                setBrandInfo(brand, kunnr);
                product.setCubrds(_storeBrandInfo);
            },
            error: function (xhr, status, error) {
                initAddrtComp(kunnr);
                var brand = product.brandList.bxn.code;
                setBrandInfo(brand, kunnr);
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
    getMainStoreCondition: function(){
        var kunnrCond = null;
        var kunnr = App.kunnr;
        if(isNaN(kunnr)){
            kunnr = kunnr.substring(0, kunnr.length -4) + "%";
            kunnrCond = rangeUtil.createCpStdRange(kunnr)
        }else{
            kunnrCond = rangeUtil.createEqStdRange(kunnr);
        }
        return kunnrCond;
    },
    getFabricStock4FabricSelect: function(datas, lrecp, func,isnext,next){
        var fabrics = [];
        for(var i = 0; i < datas.length; i++){
            fabrics.push({FIELD: 'MATNR', SIGN: 'I', OPTION: 'EQ', LOW: datas[i].fatnr, HEIGHT: ''});
        }
        // var brand = product.findProductByLrecp(lrecp).find("div[data-save-code='BRAND'] input:checked").val();
        var brand = App.brand;
        var request = {CONDITIONS: fabrics, BRAND: brand};
        var _url = "/eis/measureData/getFabricStock";
        var stocks = [];
        $.ajax({
            type: 'POST',
            url: _url,
            contentType: "application/json;charset=utf-8",
            async: true,
            cache: false,
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (result, status, xhr) {
                if(result.flag == "SUCCESS"){
                    stocks = result.data;
                }
                App.setContentRenderFabricStocks(stocks);
                func(isnext,next);
            },
            error: function (xhr, status, error) {
                func(isnext,next);
            }
        });

    },
    getPatternsV1 : function(datas,func){
        var patterns = null;
        var request = getConditions(datas);
        var _url = "/eis/measureData/getZlpmrByResource";
        $.ajax({
            type : 'POST',
            url : _url,
            contentType: "application/json;charset=utf-8",
            async: true,
            cache: false,
            dataType: 'json',
            data : JSON.stringify(request),
            success: function (result, status, xhr) {
                if(result.flag == "SUCCESS"){
                    // modemCallback(result.data, lrecp, mtypb, enable);
                    var datas = result.data;
                    if (!datas || datas.length ==0 ){
                        patterns = null;
                    } else {
                        App.orderData[App.tabIndex].Patterns = result.data;
                        if(func) {
                            func();
                        }
                    }
                }else{
                    // App.showMsgList(result.msgList);
                    alert(result.msgList[0].message, null);
                    App.orderData[App.tabIndex].Patterns = [];
                    if(func) {
                        func();
                    }
                }
            },
            error: function (xhr, status, error) {
                if (xhr.status === 401) {
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("eis_login_4")});
                } else {
                    //请求异常回调
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_22")});
                }
            }
        });

        function getConditions(datas) {
            var lrecp = datas.lrecp;
            // var pmmArea = $('#PMM_' + lrecp);
            // var fieldComps = pmmArea.find('div[name="modemFeature"]').find('select[data-save-code]');
            var mtypb = datas.Category.mtypb
            var brand = App.brand;
            var sex = datas.Category.sexty;
            var ordtp = App.ordtp;
            var desin = false;
            var aresy = false;
            var cond1 = new Array();
            var cond2 = {};
            // for (var i = 0; i < fieldComps.length; i++) {
            //     var fieldComp = $(fieldComps[i]);
            //     if (fieldComp.val()) {
            //         cond1.push({ordtp:ordtp, mtypb:mtypb, propt:fieldComp.attr('data-save-code'), prope:fieldComp.val()});
            //     }
            // }
            cond1.push({ordtp:ordtp, mtypb:mtypb, propt: 'BRAND', prope:brand});
            if (desin) {
                cond1.push({ordtp:ordtp, mtypb:mtypb, propt: 'DESIN', prope:desin});
            }
            if (aresy) {
                cond1.push({ordtp:ordtp, mtypb:mtypb, propt: 'ARESY', prope:aresy});
            }
            cond2.mtypb = [rangeUtil.createEqStdRange(mtypb)];
            if (sex) {
                cond2.sexty = [rangeUtil.createEqStdRange(sex)];
            }
            var kunnrCond = product.getMainStoreCondition();
            cond2.kunnr = [rangeUtil.createEqStdRange(""), kunnrCond];
            var request = {cond1 : cond1, cond2 : cond2};
            return request;
        }
    },
    getPatternsV2 : function(datas,func){
        var request = getConditions(datas);
        var _url = "/eis/measureData/getZlpmrByStoreConfigAndResource";
        $.ajax({
            type : 'POST',
            url : _url,
            contentType: "application/json;charset=utf-8",
            async: true,
            cache: false,
            dataType: 'json',
            data : JSON.stringify(request),
            success: function (result, status, xhr) {
                if(result.flag == "SUCCESS"){
                    var datas = result.data;
                    if (!datas || datas.length ==0 ){
                        App.orderData[App.tabIndex].Patterns = [];
                    } else {
                        App.orderData[App.tabIndex].Patterns = result.data;
                        if (App.orderData[App.tabIndex].Patterns.length == 1){
                            App.orderData[App.tabIndex].isHiddenPattern = true;
                        }
                        if(func) {
                            func();
                        }
                    }
                }else{
                    alert(result.msgList[0].message, null);
                    App.orderData[App.tabIndex].Patterns = [];
                    if(func) {
                        func();
                    }
                }
            },
            error: function (xhr, status, error) {
                if (xhr.status === 401) {
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("eis_login_4")});
                } else {
                    //请求异常回调
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_22")});
                }
            }
        });
        function getConditions(datas) {
            var lrecp = datas.lrecp;
            // var pmmArea = $('#PMM_' + lrecp);
            // var fieldComps = pmmArea.find('div[name="modemFeature"]').find('select[data-save-code]');
            var mtypb = datas.Category.mtypb
            var brand = App.brand;
            var sex = datas.Category.sexty;
            var ordtp = App.ordtp;
            var desin = false;
            var aresy = false;
            var cond1 = new Array();
            var cond2 = {};
            var cond3 = {};
            // for (var i = 0; i < fieldComps.length; i++) {
            //     var fieldComp = $(fieldComps[i]);
            //     if (fieldComp.val()) {
            //         cond1.push({ordtp:ordtp, mtypb:mtypb, propt:fieldComp.attr('data-save-code'), prope:fieldComp.val()});
            //     }
            // }
            cond1.push({ordtp:ordtp, mtypb:mtypb, propt: 'BRAND', prope:brand});
            if (desin) {
                cond1.push({ordtp:ordtp, mtypb:mtypb, propt: 'DESIN', prope:desin});
            }
            if (aresy) {
                cond1.push({ordtp:ordtp, mtypb:mtypb, propt: 'ARESY', prope:aresy});
            }
            cond2.mtypb = [rangeUtil.createEqStdRange(mtypb)];
            if (sex) {
                cond2.sexty = [rangeUtil.createEqStdRange(sex)];
            }
            cond3.mtypb = mtypb;
            cond3.kunnr = App.kunnr;

            var kunnrCond = product.getMainStoreCondition();
            cond2.kunnr = [rangeUtil.createEqStdRange(""), kunnrCond];
            var request = {cond1 : cond1, cond2 : cond2, cond3 : cond3};
            return request;
        }
    },
    getPatternsInTempOrder : function(datas,func){
        var patterns = null;
        var request = getConditions(datas);
        var _url = "/eis/measureData/getZlpmrByResource";
        $.ajax({
            type : 'POST',
            url : _url,
            contentType: "application/json;charset=utf-8",
            async: true,
            cache: false,
            dataType: 'json',
            data : JSON.stringify(request),
            success: function (result, status, xhr) {
                if(result.flag == "SUCCESS"){
                    // modemCallback(result.data, lrecp, mtypb, enable);
                    var datas = result.data;
                    if (!datas || datas.length ==0 ){
                        patterns = null;
                    } else {
                        App.orderData[App.tabIndex].Patterns = result.data;
                        if(func) {
                            func();
                        }
                    }
                }else{
                    // App.showMsgList(result.msgList);
                    alert(result.msgList[0].message, null);
                    App.orderData[App.tabIndex].Patterns = [];
                    if(func) {
                        func();
                    }
                }
            },
            error: function (xhr, status, error) {
                if (xhr.status === 401) {
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("eis_login_4")});
                } else {
                    //请求异常回调
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_22")});
                }
            }
        });

        function getConditions(datas) {
            var lrecp = datas.lrecp;
            var mtypb = datas.Category.mtypb
            var brand = App.brand;
            var sex = datas.Category.sexty;
            var ordtp = App.ordtp;
            var desin = false;
            var aresy = false;
            var cond1 = new Array();
            var cond2 = {};

            cond1.push({ordtp:ordtp, mtypb:mtypb, propt: 'BRAND', prope:brand});
            if (desin) {
                cond1.push({ordtp:ordtp, mtypb:mtypb, propt: 'DESIN', prope:desin});
            }
            if (aresy) {
                cond1.push({ordtp:ordtp, mtypb:mtypb, propt: 'ARESY', prope:aresy});
            }
            cond2.mtypb = [rangeUtil.createEqStdRange(mtypb)];
            if (sex) {
                cond2.sexty = [rangeUtil.createEqStdRange(sex)];
            }
            if (App.kunnr){
                var kunnrCond = getMainStoreConditionInTempOrder();
                cond2.kunnr = [rangeUtil.createEqStdRange(""), kunnrCond];
            }
            var request = {cond1 : cond1, cond2 : cond2};
            return request;
        }
        function getMainStoreConditionInTempOrder(){
            var kunnrCond = null;
            var kunnr = App.kunnr;
            if(isNaN(kunnr)){
                kunnr = kunnr.substring(0, kunnr.length -4) + "*";
                kunnrCond = rangeUtil.createCpStdRange(kunnr)
            }else{
                kunnrCond = rangeUtil.createEqStdRange(kunnr);
            }
            return kunnrCond;
        }
    },
    //根据品类获取界面显示的个性部件数据,并配置进行显示
    getPartsIntoCacheAndDisplay : function(mtypb){

        var request= {};
        request.ordtp = [rangeUtil.createEqStdRange(App.ordtp)];
        request.biztp = [rangeUtil.createEqStdRange(product.biztpList.personal.code)];
        request.mtypb = [rangeUtil.createEqStdRange(mtypb)];
        request.colln = [rangeUtil.createEqStdRange("")];
        request.loekz = [rangeUtil.createNeStdRange("X")];
        request.spras = [rangeUtil.createEqStdRange(I18nUtil.getSprasLang())];
        var _url = "/eis/measureData/getZlpmd?";
        $.ajax({
            type: 'POST',
            url: _url,
            contentType: "application/json;charset=utf-8",
            async: false,
            cache: false,
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (result, status, xhr) {
                if(result.flag == "SUCCESS"){
                    measureCache.cachePmd(mtypb, result.data);
                    //product.configAndDisplayParts(lrecp);
                    //product.getPmmZlcustom(mtypb, lrecp);
                    //product.loadNetSizeFromBodySizeModal(lrecp);
                }
            },
            error: function (xhr, status, error) {}
        });
    },
    /**
     * 获取版型数据，并进行缓存
     */
    getPartsOptionsIntoCacheAndDisplay : function(lrecp, mtypb, modem){
        var request = {};
        request.mtypb = mtypb;
        request.ordtp = App.ordtp;
        request.modem = modem;
        request.spras = I18nUtil.getSprasLang();
        request.loekz = product.dataStatuList.used;
        var _url = "/eis/measureData/getMergeZlcustomData";
        if(product.isHidenModem(modem)) {
            _url = "/eis/measureData/getZlmodListByModer";
            request.moder = product.customModerList[product.HIDEMODEM_REFER_FIELD[modem]][modem].ALL;
        }
        $.ajax({
            type: 'POST',
            url: _url,
            contentType: "application/json;charset=utf-8",
            async: false,
            cache: false,
            dataType: 'json',
            data: JSON.stringify(request),
            success: function (result, status, xhr) {
                if(result.flag == "SUCCESS"){
                    var data = result.data;
                    var zlpmr = data.zlpmr;
                    var modem = data.modem;
                    var moder = zlpmr.moder;
                    var zlmodList = data.zlmodList;
                    measureCache.cacheModemParts(mtypb, modem, data);
                    if(zlpmr){
                        if (product.isHidenModem(modem)  && data.zlmodListMap){
                            var zlmodListMap = data.zlmodListMap;
                            request.moder.split(",").forEach(item =>{
                                measureCache.cacheModel(mtypb, item, zlmodListMap[item]);
                            });
                        } else {
                            if(zlmodList) {
                                measureCache.cacheModel(mtypb, moder, zlmodList);
                            }
                        }
                    }
                    //var _product = product.findProductByLrecp(lrecp);
                    //product.resetAllPartInfo(_product);
                    //product.setPmmValue(_product, lrecp, zlpmr, mtypb);
                    //product.configPartsOptionsAndDisplay(lrecp, modem);
                    //product.setNetSizeDresh(modem, mtypb, lrecp, _product);
                    //product.clearModelInfo(_product);
                }else{
                    //messageConsole.show(result.msgList);
                    App.showMsgList(result.msgList);
                }
            }
            ,error: function (xhr, status, error) {
                if (xhr.status === 401) {
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("eis_login_4")});
                } else {
                    //请求异常回调
                    layui.layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("common_js_alert_22")});
                }
            }
        });
    },
    /**
     * 配置部件下拉值并显示
     * @param lrecp
     */
    configPartsOptionsAndDisplay : function(lrecp, modem, isLoading){
        console.log("configPartsOptionsAndDisplay:"+new Date());
        //var _product = $("div[name='product'][lrecp='" + lrecp + "']");
        //_product.find("select[data-save-code='MTYPB']").attr("disabled", true);
        //_product.find("div[data-save-code='SEXTY'] input:checked").attr("disabled", true);
        //var mtypb = _product.find("select[data-save-code='MTYPB']").val();
        //product.bindPartItemClickEvent(_product);
        //product.setNetSizeDresh(modem, mtypb, lrecp, _product);
        product.setForceDefaultValueByModem(lrecp, modem, isLoading);
        product.setCubrdDefaultValueWhenInit(isLoading);
        //product.bindModelSelIconEvent(lrecp);
        console.log("configPartsOptionsAndDisplay:"+new Date());
    },
    //版型默认值逻辑
    setForceDefaultValueByModem : function(lrecp, modem, isLoading) {
        var designDiv = $("div[name='design']");
        var mtypb = App.orderData[App.tabIndex].Category.mtypb;
        var data = measureCache.getModemParts(mtypb, modem);
        var defaultForeValues = data.defaultForeValues;
        for(var i in defaultForeValues){
            var valItem = defaultForeValues[i];
            var field = valItem.propt;
            var partItemDiv = designDiv.find("div[data-part-item='X'][name='"+field+"']");
            var partItemOptDiv = designDiv.find("div[data-part-item-opt='X'][name='"+field+"']");
            if(partItemDiv.length == 0){
                continue;
            }
            if(isLoading && valItem.defat == "X" && valItem.force != "X"){
                continue;
            }
            if(field == "PROCE"){
                //var proces = _product.find("input[data-save-code='FATNR']").attr("data-proce");
                var proces = App.orderData[App.tabIndex].proce;
                if(proces){
                    var _proces = proces.split(",");
                    if($.inArray(valItem.prope, _proces) == -1){
                        continue;
                    }
                }
            }
            var parentPart = data.map[field];
            var parentChildRelation = data.parentChildRelation;
            var relations = parentChildRelation[field];
            if(relations){//有父子关系时，父设置值时，检查子部件值是否在范围内
                // 设置子部件选项范围
                product.showHideRelation(data, relations, field, valItem.prope, designDiv, parentPart);
            }

            // 设置默认值
            if(!App.orderData[App.tabIndex].designInit) {
                    App.orderData[App.tabIndex].zlrecps[field] = valItem;
                    App.delDesignRequired(field);
            }
            //特殊部件更改规格moder逻辑处理
            if( product.isCustomModerField(field)){
                //只有当moder配置存在时才触发
                if (product.customModerList[field][modem]){
                    if (product.customModerList[field][modem][valItem.prope]){
                        //field = KPOQZ|REKLK,西裤前褶和男马甲下口型
                        App.orderData[App.tabIndex].Pattern.moder = product.customModerList[field][modem][valItem.prope];
                    }
                }
            }

            //赋值默认值
            partItemDiv.find("input[data-save-code='"+field+"']").val(valItem.prope);
            partItemDiv.find("span[name='part-desc']").html(valItem.tprop);
            var optDiv = partItemOptDiv.find("[data-value='"+valItem.prope+"']");
            if(optDiv.length > 0) {
                if (!$(optDiv).hasClass("hActive")) {
                    $(optDiv).addClass("hActive");
                }
                $(optDiv).append('<i class="layui-icon layui-icon-ok hSelectIcon hBlue"></i>');
            }
            if(valItem.force == "X"){
                partItemDiv.removeClass("cursor-point").addClass("cursor-disabled").addClass("div-part-disabled");
                partItemDiv.attr("data-disabled-flag", "X");
                partItemDiv.attr("data-force-flag", "X");
                partItemDiv.attr("data-force-value", valItem.prope);
                var optDivs = partItemOptDiv.find(".hDeList");
                if(optDivs.length != 0) {
                    for(var i = 0; i < optDivs.length; i++){
                        var _optDiv = $(optDivs[i]);
                        if(_optDiv) {
                            if(!(_optDiv.find("div").first().attr("data-value") == valItem.prope)) {
                                _optDiv.remove();
                            }
                        }
                    }
                }
            }
            // 关联部件状态、值设置
            partsLimitController.setRealtionByField(field, valItem.prope, partItemDiv, null, designDiv, null, mtypb);
            // 号型数据显示隐藏
            App.modelController.doModelControl(field, valItem.prope, lrecp, mtypb, true);
        }
        // 是否显示净尺量体
        var netSizeModem = ['US66', 'RS68', 'RSD69', 'RSD69-1', 'RSD69-2', 'RSD69-3', 'USD70', 'USD67-1', 'USD67-2', 'USD67-3', 'YHE01', 'YHC01' , 'YHM01', 'YHM02', 'YHM03', 'YHM04' , 'YHM99', 'RS68'];
        if($.inArray(modem, netSizeModem) == -1){
           $("#bodyMeasurement").hide();
        }else{
           $("#bodyMeasurement").show();
        }
        App.modelController.doModelControl('MODEM', modem, lrecp, mtypb, true);

    },

    setCubrdDefaultValueWhenInit : function(isLoading) {
        //不是初始化将直接退出
        if(isLoading){
            return;
        }
        //对有默认的品牌选择
        $(".data-default-cubrd").click();
    },
    showHideRelation : function(data, relations, field, value, designDiv, parentPart) {
        for(var i = 0; i < relations.length; i++){
            var childField = relations[i];
            if(!value) {
                designDiv.find("div[data-part-item-opt='X'][name='"+childField+"']").find(".hDeList").removeClass("no-search");
                designDiv.find("div[data-part-item-opt='X'][name='"+childField+"']").find(".hDeList").show();
                continue;
            }
            var valueMap = {};
            var part = data.map[childField];
            if(part){
                valueMap[childField] = new Array().concat(part.valueList);
            }else{
                valueMap[childField] = [];
            }
            valueMap[field] = [];
            var _childPartItemDiv = designDiv.find("div[data-part-item='X'][name='"+childField+"']");
            if(!_childPartItemDiv.length == 0){
                var _val = value;
                if(parentPart){
                    var childParts = parentPart.custompMap[childField];
                    if(childParts){
                        for(var j = 0; j < childParts.length; j++){
                            var childPart = childParts[j];
                            if ('X' == childPart.loekz) {
                                continue;
                            }
                            var kunnr = childPart.kunnr;
                            if(kunnr){
                                if(!App.isOrderKunnr(kunnr)) {
                                    continue;
                                }
                            }
                            if(childPart.lgrop == _val){
                                valueMap[field].push(childPart);
                            }
                        }
                    }
                }
            }
            var index = 0;
            var values = [];
            for(var key in valueMap){
                if(index == 0){
                    values = valueMap[key];
                }else{
                    var _values = valueMap[key];
                    for(var n = values.length - 1; n >= 0 ; n--){
                        var prope = values[n].prope;
                        var isDel = true;
                        for(var j = _values.length - 1; j >= 0 ; j--){
                            if(prope == _values[j].prope){
                                isDel = false;
                            }
                        }
                        if(isDel){
                            values.splice(n, 1);
                        }
                    }
                }
                index ++;
            }
            designDiv.find("div[data-part-item-opt='X'][name='"+childField+"']").find(".hDeList").addClass("no-search");
            designDiv.find("div[data-part-item-opt='X'][name='"+childField+"']").find(".hDeList").hide();
            var strDataValue = "";
            for(var j = 0; j < values.length ; j++) {
                var _val = values[j];
                if(j != 0) {
                    strDataValue = strDataValue + ",[data-value='"+_val.prope+"']";
                } else {
                    strDataValue = "[data-value='"+_val.prope+"']";
                }
            }
            designDiv.find("div[data-part-item-opt='X'][name='"+childField+"']").find(strDataValue).parent().show();
            designDiv.find("div[data-part-item-opt='X'][name='"+childField+"']").find(strDataValue).parent().removeClass("no-search");
        }
    },

    validatCommonPartCondition : function(field, _target, zlrecpDiv, _product){
        //if(_target.attr("data-force-flag") == "X"){
        //    var desc = _target.find("span").eq(0).html();
        //    alert("该版型对应的部件"+desc+"不允许修改！");
        //    return false;
        //}
        return true;

    },
    //验证部件间关系
    validatePartItemRelation : function(field,noMsg){
        var designDiv = $("div[name='design']");
        var mtypb = App.orderData[App.tabIndex].Category.mtypb;
        var modem = App.orderData[App.tabIndex].Pattern.modem;
        var data = measureCache.getModemParts(mtypb, modem);
        var parentFields = data.childParentRelation[field];
        if(parentFields && parentFields.length > 0){

            for(var i in parentFields){
                var parentField = parentFields[i];
                var partItemDiv = designDiv.find("div[data-part-item='X'][name='"+parentField+"']");
                if(partItemDiv.length == 0){
                    return true;
                }
                var valInput = partItemDiv.find("input[data-save-code='"+parentField+"']");
                var _val = valInput.val().trim();
                if(_val == ""){
                    var parentPartDesc = partItemDiv.find("span").eq(0).html();
                    if (!noMsg){
                        alert(I18nUtil.getProp('common_js_alert_44', [parentPartDesc]));
                    }
                    return false;
                }
            }
        }
        return true;
    },

    bindPartItemClickEvent: function(_product){

        var zlrecpDiv = _product.find("div[name='zlrecp']");
        //绑定工艺列表点击事件
        zlrecpDiv.on("click", "div[data-part-item='X']", {zlrecpDiv: zlrecpDiv, _product: _product}, function(event){

            //获取组件引用
            var _target = $(this);
            var parentId = $(this).attr("data-parent-id");
            var zlrecpDiv = event.data.zlrecpDiv;
            var _product = event.data._product;
            var field = $(_target).attr("name");

            // //校验
            // if(!product.validatCommonPartCondition(field, _target, zlrecpDiv, _product)){
            //     return;
            // }
            if(!product.validatePartItemRelation(field, _target, zlrecpDiv, _product)){
                return;
            }
            if(!partsLimitController.validateReverseCondition(field, _target, zlrecpDiv, _product)){
                return;
            }
            //设置选中项目样式
            zlrecpDiv.find("div[id='"+parentId+"']").find("div[data-part-item='X']").removeClass("data-item-part-active");
            _target.addClass("data-item-part-active");

            //委托处理器
            if(product.isEmbroidery(field)){
                product.handleEmbroideryPart(field, _target, zlrecpDiv, _product);
            }else if(product.isTextPart(field)){
                product.handleTextPart(field, _target, zlrecpDiv, _product);
            }else if(product.isMulityPart(field)){
                product.handleMulityPart(field, _target, zlrecpDiv, _product);
            }else{
                product.handleCommonPart(field, _target, zlrecpDiv, _product);
            }
            var parentDiv = zlrecpDiv.find("div[id='"+parentId+"']");
            var partShowDiv = parentDiv.find("div.part-show-c");
            I18nUtil.translate(partShowDiv, ['span', 'input']);
        });

        //绑定体型列表点击事件
        // zlrecpDiv.on("click", "div[data-shape-item='X']", {zlrecpDiv: zlrecpDiv, _product: _product}, function(event){

        //     //获取组件引用
        //     var _target = $(this);
        //     var parentId = $(this).attr("data-parent-id");
        //     var zlrecpDiv = event.data.zlrecpDiv;
        //     var _product = event.data._product;
        //     var field = $(_target).attr("name");
        //     //设置选中项目样式
        //     zlrecpDiv.find("div[id='"+parentId+"']").find("div[data-shape-item='X']").removeClass("data-item-part-active");
        //     _target.addClass("data-item-part-active");

        //     product.handleShapePart(field, _target, zlrecpDiv, _product);
        // });
        // var lrecp = _product.attr("lrecp");
        // //净尺量体穿衣习惯事件绑定
        // var dreshDiv = zlrecpDiv.find("div[id='MOD_"+lrecp+"'] div[name='netSizeDataDiv'] div[name='dreshDiv']");
        // if(dreshDiv.length > 0){
        //     dreshDiv.find("button.btn-dresh-go").on("click", {dreshDiv: dreshDiv, zlrecpDiv: zlrecpDiv, _product: _product}, function(event){
        //         var _product = event.data._product;
        //         var dreshDiv = event.data.dreshDiv;
        //         var lrecp = _product.attr("lrecp");
        //         var mtypb = _product.find("select[data-save-code='MTYPB']").val();
        //         var modem = _product.find("div[id='PMM_"+lrecp+"'] input[data-save-code='MODEM']").val();
        //         var _target = $(this);
        //         var imgsDiv = _target.parent().find("div[name='dresh-imgs-div']");
        //         var _index = parseInt(imgsDiv.attr("data-index"));
        //         var pageSize = parseInt(imgsDiv.attr("data-page-size"));
        //         var name = _target.attr("name");
        //         var data = measureCache.getModemParts(mtypb, modem);
        //         var parts = data.map;
        //         var dreshComp = parts["DRESH"];
        //         if(!dreshComp){
        //             return;
        //         }
        //         var valList = dreshComp.valueList;
        //         if(name == "btn-go-left"){  //后退
        //             if(_index <= 0){
        //                 return;
        //             }
        //             _index--;
        //             var dreshVals = [];
        //             for(var i = (_index*pageSize); i < (_index +1)*pageSize; i++){
        //                 dreshVals.push(valList[i]);
        //             }
        //             var _html = htmlTemplate.getNetDreshHtml(dreshVals, mtypb);
        //             imgsDiv.attr("data-index", (_index + ""));
        //             imgsDiv.html(_html);

        //             //添加图片点击监听
        //             imgsDiv.find("div[name='dresh-img-out-div']").on("click", {imgsDiv: imgsDiv}, function(event){
        //                 var _target = $(this);
        //                 var _val = _target.attr("data-val");
        //                 var _desc = _target.find("h5").html();
        //                 var imgsDiv = event.data.imgsDiv;
        //                 imgsDiv.find("div[name='dresh-img-out-div'] div.part-check-p").removeClass("part-check-active").addClass("part-check-unactive");
        //                 _target.find("div.part-check-p").removeClass("part-check-unactive").addClass("part-check-active");
        //                 var dreshDiv = imgsDiv.parents("div[name='dreshDiv']");
        //                 dreshDiv.find("span[name='dresh-desc']").html(_desc);
        //                 dreshDiv.find("input[data-save-code='DRESH']").val(_val);
        //             });
        //         }else{ //前进
        //             var curCount = (_index +1) * pageSize;
        //             if(curCount >= valList.length){
        //                 return;
        //             }
        //             _index++;
        //             var dreshVals = [];
        //             for(var i = (_index*pageSize); i < (_index +1)*pageSize; i++){
        //                 if(i >= valList.length){
        //                     break;
        //                 }
        //                 dreshVals.push(valList[i]);
        //             }
        //             var _html = htmlTemplate.getNetDreshHtml(dreshVals, mtypb);
        //             imgsDiv.attr("data-index", (_index + ""));
        //             imgsDiv.html(_html);

        //             imgsDiv.find("div[name='dresh-img-out-div']").on("click", {imgsDiv: imgsDiv}, function(event){
        //                 var _target = $(this);
        //                 var _val = _target.attr("data-val");
        //                 var _desc = _target.find("h5").html();
        //                 var imgsDiv = event.data.imgsDiv;
        //                 imgsDiv.find("div[name='dresh-img-out-div'] div.part-check-p").removeClass("part-check-active").addClass("part-check-unactive");
        //                 _target.find("div.part-check-p").removeClass("part-check-unactive").addClass("part-check-active");
        //                 var dreshDiv = imgsDiv.parents("div[name='dreshDiv']");
        //                 dreshDiv.find("span[name='dresh-desc']").html(_desc);
        //                 dreshDiv.find("input[data-save-code='DRESH']").val(_val);
        //             });
        //         }

        //     });

        // }

    },
    /**
     * 加载个性数据和尺寸
     * @param lrecp
     * @param zlrecpMap
     * @param zlrecmMap
     */
    loadLrecpAndLrecmInTempOrder : function (lrecp, zlrecps, zlreda, zlrecd){
        product.configPartsOptionsAndDisplay(lrecp, App.orderData[App.tabIndex].Pattern.modem, true);
        if(zlrecps) {
            product.loadLrecp(zlrecps, lrecp, App.orderData[App.tabIndex].Pattern.modem);
        }

    },
    /**
     * 加载个性数据和尺寸
     * @param lrecp
     * @param zlrecpMap
     * @param zlrecmMap
     */
    loadLrecpAndLrecm : function (lrecp, zlrecps, zlreda, zlrecd){
        //var _product = product.findProductByLrecp(lrecp);
        //product.configAndDisplayParts(lrecp);
        //configPmmOptions(_product,lrecp, zlrecd);
        product.configPartsOptionsAndDisplay(lrecp, App.orderData[App.tabIndex].Pattern.modem, true);
        if(zlrecps) {
            product.loadLrecp(zlrecps, lrecp, App.orderData[App.tabIndex].Pattern.modem);
        }
        product.loadLrecmAndNetSize(); //add 4 净尺量体
        

        // function configPmmOptions(_product,lrecp, zlrecd) {
        //     var mtypbSet = measureCache.getModemParts(zlrecd.mtypb, zlrecd.modem);
        //     var mtypb = _product.find("select[data-save-code='MTYPB']").val();
        //     var pmmDiv = _product.find('#PMM_'+lrecp);
        //     if (mtypbSet.pmmCustomMap) {
        //         var pmmSelectComps = pmmDiv.find("select[data-save-code]");
        //         for (var i = 0; i < pmmSelectComps.length; i++) {
        //             var selectComp = $(pmmSelectComps[i]);
        //             var propt = selectComp.attr('data-save-code');
        //             var options = mtypbSet.pmmCustomMap[propt];
        //             selectComp.html(product.getOptionHtml(options));
        //         }
        //     }
        //     if(mtypbSet.zlpmr){
        //          var modemInput =  pmmDiv.find("input[data-save-code='MODEM']");
        //          if(product.zlmatnrMap[mtypb + zlrecd.matnr] && product.zlmatnrMap[mtypb + zlrecd.matnr].makte == zlrecd.modem){
        //              modemInput.attr("readonly","true");
        //              modemInput.removeClass('measure_input_enable').addClass('measure_input_disable').attr('data-disable-flag', 'X');
        //          }
        //          modemInput.val(zlrecd.modem);
        //          pmmDiv.find("input[name='MODTP']").val(mtypbSet.zlpmr.modtp);
        //          pmmDiv.find("input[name='modem_note']").val(mtypbSet.zlpmr.notes);
        //     }
        //     product.bindModemConditionCompsEvent(lrecp);

        // }
    },

        /**
     * 加载个性数据
     * @param partDiv
     * @param zlrecps
     * @param lrecp
     * @param lrece
     */
    loadLrecp : function (zlrecps, lrecp, modem){
        var designDiv = $("#content");
        var mtypb = App.orderData[App.tabIndex].Category.mtypb;
        var partsSet = measureCache.getModemParts(mtypb, modem);
        if(!partsSet && partsSet.map){
            return;
        }
        var partMap = partsSet.map;
        for(var field in zlrecps) {
            var zlrecp = zlrecps[field];
            if(product.isMulityPart(field)){ //多选部件
                    var _partSet  = partMap[field];
                if(!_partSet){
                    continue;
                }
                var valList = _partSet.valueList;
                if(!valList || valList.length == 0){
                    continue;
                }
                var partItemDiv = designDiv.find("div[data-part-item='X'][name='"+field+"']");
                var partItemOptDiv = designDiv.find("div[data-part-item-opt='X'][name='"+field+"']");
                if(partItemDiv.length  == 0){
                    continue;
                }

                var item = getMulityPartValue(field, zlrecp, partItemDiv, valList);
                if(item == null){
                    continue;
                }
                partItemDiv.find("input[data-save-code='"+field+"']").val(item.val);
                partItemDiv.find("span[name='part-desc']").html(item.name);
                var vals = item.val.split("|");
                for(var i in vals) {
                    var optDiv = partItemOptDiv.find("[data-value='"+vals[i]+"']");
                    if(optDiv.length > 0) {
                        if (!$(optDiv).hasClass("hActive")) {
                            $(optDiv).addClass("hActive");
                        }
                        $(optDiv).append('<i class="layui-icon layui-icon-ok hSelectIcon hBlue"></i>');
                    }
                }
            }else if(product.isTextPart(field)) {//文本控件
                var partItemDiv = designDiv.find("div[data-part-item='X'][name='"+field+"']");
                if(partItemDiv.length  == 0){
                    continue;
                }
                partItemDiv.find("input[data-save-code='"+field+"']").val(zlrecp.notep);
                partItemDiv.find("span[name='part-desc']").html(zlrecp.notep);
            }else if(product.isEmbroideryFields(field)){ //刺绣控件
                //刺绣控件独立赋值了，再loadui4里面
            }else if(product.isDresh(field)){ //净尺穿衣习惯
                var _partSet  = partMap[field];
                if(!_partSet){
                    continue;
                }
                var valList = _partSet.valueList;
                if(!valList || valList.length == 0){
                    continue;
                }
                var measurementDiv = $("div[name='measurement']");
                var partItemDiv = measurementDiv.find("div[data-part-item='X'][name='"+field+"']");
                var partItemOptDiv = measurementDiv.find("div[data-part-item-opt='X'][name='"+field+"']");
                if(partItemDiv.length  == 0){
                    continue;
                }
                var item = product.getCommonPartValue(field, zlrecp, valList);
                if(item == null){
                    continue;
                }
                partItemDiv.find("input[data-save-code='"+field+"']").val(item.val);
                partItemDiv.find("span[name='part-desc']").html(item.name);
                var optDiv = partItemOptDiv.find("[data-value='"+item.val+"']");
                if(optDiv.length > 0) {
                    if (!$(optDiv).hasClass("hActive")) {
                        $(optDiv).addClass("hActive");
                    }
                    $(optDiv).append('<i class="layui-icon layui-icon-ok hSelectIcon hBlue"></i>');
                }
            }else if(product.isDresi(field)){ //净尺穿衣习惯
                var _partSet  = partMap[field];
                if(!_partSet){
                    continue;
                }
                var valList = _partSet.valueList;
                if(!valList || valList.length == 0){
                    continue;
                }
                var measurementDiv = $("div[name='measurement']");
                var partItemDiv = measurementDiv.find("div[data-part-item='X'][name='"+field+"']");
                var partItemOptDiv = measurementDiv.find("div[data-part-item-opt='X'][name='"+field+"']");
                if(partItemDiv.length  == 0){
                    continue;
                }
                var item = product.getCommonPartValue(field, zlrecp, valList);
                if(item == null){
                    continue;
                }
                partItemDiv.find("input[data-save-code='"+field+"']").val(item.val);
                partItemDiv.find("span[name='part-desc']").html(item.name);
                var optDiv = partItemOptDiv.find("[data-value='"+item.val+"']");
                if(optDiv.length > 0) {
                    if (!$(optDiv).hasClass("hActive")) {
                        $(optDiv).addClass("hActive");
                    }
                    $(optDiv).append('<i class="layui-icon layui-icon-ok hSelectIcon hBlue"></i>');
                }
            }else if(field == 'CUBRD' || field == 'RGBRD'){ // 品牌标

                var partItemDiv = designDiv.find("div[data-part-item='X'][name='"+field+"'], div[data-shape-item='X'][name='"+field+"']");
                var partItemOptDiv = designDiv.find("div[data-part-item-opt='X'][name='"+field+"'], div[data-shape-item='X'][name='"+field+"']");
                partItemDiv.find("input[data-save-code='"+field+"']").val(zlrecp.prope);
                partItemDiv.find("span[name='part-desc']").html(zlrecp.notep);
                var optDiv = partItemOptDiv.find("[data-value='"+zlrecp.prope+"']");
                if(optDiv.length > 0) {
                    if (!$(optDiv).hasClass("hActive")) {
                        $(optDiv).addClass("hActive");
                    }
                    $(optDiv).append('<i class="layui-icon layui-icon-ok hSelectIcon hBlue"></i>');
                }

            }else{ //其他工艺部件
                var _partSet  = partMap[field];
                if(!_partSet){
                    continue;
                }
                var valList = _partSet.valueList;
                if(!valList || valList.length == 0){
                    continue;
                }
                var partItemDiv = designDiv.find("div[data-part-item='X'][name='"+field+"'], div[data-shape-item='X'][name='"+field+"']");
                var partItemOptDiv = designDiv.find("div[data-part-item-opt='X'][name='"+field+"'], div[data-shape-item='X'][name='"+field+"']");
                if(partItemDiv.length  == 0){
                    continue;
                }
                var item = product.getCommonPartValue(field, zlrecp, valList);
                if(item == null){
                    continue;
                }
                partItemDiv.find("input[data-save-code='"+field+"']").val(item.val);
                partItemDiv.find("span[name='part-desc']").html(item.name);
                var optDiv = partItemOptDiv.find("[data-value='"+item.val+"']");
                if(optDiv.length > 0) {
                    if (!$(optDiv).hasClass("hActive")) {
                        $(optDiv).addClass("hActive");
                    }
                    $(optDiv).append('<i class="layui-icon layui-icon-ok hSelectIcon hBlue"></i>');
                }

                var parentChildRelation = partsSet.parentChildRelation;
                var relations = parentChildRelation[field];
                if(relations){//有父子关系时，父设置值时，检查子部件值是否在范围内
                    // 设置子部件选项范围
                    product.showHideRelation(partsSet, relations, field, item.val, designDiv, _partSet);
                }

                App.modelController.doModelControl(field, item.val, lrecp, mtypb, false);
            }
        }
        function getMulityPartValue(field, zlrecp, partItemDiv, valList){

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
        }
    },

    getCommonPartValue : function (field, zlrecp, valList){
        if(!valList || valList.length == 0){
            return null;
        }
        var _item = null;
        var prope = zlrecp.prope;
        for(var i = 0; i < valList.length; i++){
            var item = valList[i];
            if(item.prope == prope){
                _item = item;
                break;
            }
        }
        if(_item == null){
            return null;
        }
        return {val: _item.prope, name: _item.tprop};
    },

    loadLrecmAndNetSize : function() {
        var measuVal = App.orderData[App.tabIndex].zlrecps['MEASU'].prope;
        // 加载单位
        $("[name='MEUNIT']").find(".hActive").removeClass("hActive");
        $("[name='MEUNIT']").find("[data-value='"+App.orderData[App.tabIndex].meunit+"']").addClass("hActive");

        //if(product.isModelSizeMeasu(measuVal)){
            product.loadLrecm(App.orderData[App.tabIndex].tryOnZlrecm);
        // if(product.isHalfSetSizeMeasu(measuVal)){
            product.loadHalfLrecm(App.orderData[App.tabIndex].halfTryOnZlrecm);
        //}else if(product.isNetSizeMeasu(measuVal)){
            product.loadNetSize(App.orderData[App.tabIndex].zlreda, App.orderData[App.tabIndex].netZlrecm);
        //}else if(product.isGarmentSizeMeasu(measuVal)){
            product.loadGarmentSize(App.orderData[App.tabIndex].garmentZlrecm);
        //}
        //setMeasuDisplay(partDiv, measuVal);
    },

    /**
     * 加载尺寸数据
     * @param partDiv
     * @param zlrecm
     * @param lrecp
     * @param lrece
     */
    loadLrecm : function(zlrecm){

        var modelDiv = $("#TryOn");
        var moder = App.orderData[App.tabIndex].Pattern.moder;
        var model = App.orderData[App.tabIndex].model;
        if(!model || model == ""){
            //modelDiv.find("input[type='hidden'][data-save-code='LENCK']").val(zlrecm.lenck);
            return;
        }
        modelDiv.find("input[name='Standard']").val(model);
        var mtypb = App.orderData[App.tabIndex].Category.mtypb;
        var modelItem = measureCache.getModel(mtypb, moder, model);
        if (!modelItem) {
            alert(I18nUtil.getProp('common_js_alert_48'));
        }
        var comps = modelDiv.find("input[data-save-code][type!=radio]");
        for(var i = 0; i < comps.length; i++){
            var comp = $(comps[i]);
            var code = comp.attr("data-save-code").toLowerCase();
            var val = zlrecm[code];
            if(val){
                val = parseFloat(val);
            }
            comp.val(val);
            if(comp.attr("type") == "hidden"){
                continue;
            }
            if(modelItem && modelItem[code]) {
                var refVal = modelItem[code];
                //comp.parent().prev().html(refVal);
                if(!product.isUnlimitModel(model)){
                    product.setModelScopeValue(comp, refVal);
                }
            }

        }
    },
    /**
     * 加载半套号尺寸数据
     * @param partDiv
     * @param zlrecm
     * @param lrecp
     * @param lrece
     */
    loadHalfLrecm : function(zlrecm){

        var modelDiv = $("#HalfTryOn");
        var moder = App.orderData[App.tabIndex].Pattern.moder;
        var model = App.orderData[App.tabIndex].halfModel;
        if(!model || model == ""){
            //modelDiv.find("input[type='hidden'][data-save-code='LENCK']").val(zlrecm.lenck);
            return;
        }
        modelDiv.find("input[name='Standard']").val(model);
        var mtypb = App.orderData[App.tabIndex].Category.mtypb;
        var modelItem = measureCache.getModel(mtypb, moder, model);
        if (!modelItem) {
            alert(I18nUtil.getProp('common_js_alert_48'));
        }
        var comps = modelDiv.find("input[data-save-code][type!=radio]");
        for(var i = 0; i < comps.length; i++){
            var comp = $(comps[i]);
            var code = comp.attr("data-save-code").toLowerCase();
            var val = zlrecm[code];
            if(val){
                val = parseFloat(val);
            }
            comp.val(val);
            if(comp.attr("type") == "hidden"){
                continue;
            }
            if(modelItem && modelItem[code]) {
                var refVal = modelItem[code];
                //comp.parent().prev().html(refVal);
                if(!product.isUnlimitModel(model)){
                    product.setModelScopeValue(comp, refVal);
                }
            }

        }
    },

    /**
     * 加载成衣尺寸数据
     * @param partDiv
     * @param zlrecm
     * @param lrecp
     * @param zlrecps
     * @param zlreda
     * @param measuLrecp
     */
    loadGarmentSize : function(zlrecm){
        var garmentSizeDiv = $("#Finished");
        if(garmentSizeDiv.length == 0){
            return;
        }
        //找到净尺输入组件
        var garmentSizeComps = garmentSizeDiv.find("input[data-save-code]");
        var isInch = App.orderData[App.tabIndex].meunit == "INCH" ? true : false;
        for(var i = 0; i < garmentSizeComps.length; i++){
            var comp = $(garmentSizeComps[i]);
            var uname = comp.attr("name");
            var lname = uname.toLowerCase();
            var val = "";
            if(zlrecm[lname]) {
                val = zlrecm[lname].trim();
            }
            var finalVal = val;
            if(isInch && product.needTransGarment(uname) && val){
                finalVal = product.transCm2Inch(val);
            }
            if(finalVal){
                finalVal = parseFloat(finalVal);
                comp.val(finalVal);
            }
        }
    },

    /**
     * 加载净尺寸数据
     * @param partDiv
     * @param zlrecm
     * @param lrecp
     * @param zlrecps
     * @param zlreda
     * @param measuLrecp
     */
    loadNetSize : function(zlreda, zlrecm){
        var netSizeDiv = $("#Body");
        if(netSizeDiv.length == 0){
            return;
        }
        var isInch = App.orderData[App.tabIndex].meunit == "INCH" ? true : false;
        //找到净尺输入组件
        var netSizeComps = netSizeDiv.find("input[data-save-code]");
        for(var i = 0; i < netSizeComps.length; i++){
            var comp = $(netSizeComps[i]);
            var uname = comp.attr("name");
            if(uname && uname != 'undefined') {
                var lname = uname.toLowerCase();
                var val = zlreda[lname];
                var finalVal = val;
                if(isInch && product.needTransNetsize(uname) && val){
                    finalVal = product.transCm2Inch(val);
                }
                if(finalVal){
                    finalVal = parseFloat(finalVal);
                    comp.val(finalVal);
                }
            }
        }
        for(var i = 0; i < netSizeComps.length; i++){
            var comp = $(netSizeComps[i]);
            var uname = comp.attr("name");
            if(uname && uname != 'undefined') {
                var lname = uname.toLowerCase();
                var val = zlrecm[lname];
                if(!val) {
                    val = zlrecm[uname];
                }
                if(!val) {
                    continue;
                }
                var finalVal = val;
                if(isInch && product.needTransNetsize(uname) && val){
                    finalVal = product.transCm2Inch(val);
                }
                if(finalVal){
                    finalVal = parseFloat(finalVal);
                    comp.val(finalVal);
                }  
            }
        }
    },
    closeThisPart : function(partItemDiv){
        var designDiv = partItemDiv.parent().parent().parent();
        //自动关闭
        var partItemDivbutton = partItemDiv.parent();
        partItemDivbutton.click();
        if (partItemDivbutton.hasClass("hShow")){
            partItemDivbutton.click();
        }


        var cnt = 0;
        var idxCnt = 0;
        var partDivs = designDiv.children();
        for(var i = 0; i < partDivs.length; i++) {
            if($(partDivs[i]).css('display') !== 'none') {
                cnt++
            }
            if($(partDivs[i]).find("[data-part-item='X']").attr("name") == partItemDiv.attr("name")) {
                idxCnt = cnt;
            }
        }
        // App.timer = setTimeout(function() {
        console.log(57 * (idxCnt-1));
        designDiv.scrollTop(57 * (idxCnt - 1));

        // }, 500);

        return;
    },
    findNextPartItemAndGoto : function(partItemDiv){
            var designDiv = partItemDiv.parent().parent().parent();
            var _nextPartParentDiv = partItemDiv.parent().parent().next();
            if(!_nextPartParentDiv || _nextPartParentDiv.length == 0){
                //自动关闭
                var partItemDivbutton = partItemDiv.parent();
                partItemDivbutton.click();
                if (partItemDivbutton.hasClass("hShow")){
                    partItemDivbutton.click();
                }
                return;
            }
            if(_nextPartParentDiv.hasClass("div-hide")){
                product.findNextPartItemAndGoto(_nextPartParentDiv.find("div[data-part-item='X']"));
                return;
            }
            if(_nextPartParentDiv.find("[data-save-code]").val()) {
                product.findNextPartItemAndGoto(_nextPartParentDiv.find("div[data-part-item='X']"));
                return;
            }
            // var parentId = partItemDiv.attr("data-parent-id");
            // if(!parentId || (parentId.indexOf("PMD") != 0 && parentId.indexOf("PME") != 0)){
            //     return;
            // }
            var _nextPartItemDiv = _nextPartParentDiv.find("div[data-part-item='X']");
            if(!_nextPartItemDiv || _nextPartItemDiv.length == 0){
                return;
            }
            var cnt = 0;
            var idxCnt = 0;
            var partDivs = designDiv.children();
            for(var i = 0; i < partDivs.length; i++) {
                if($(partDivs[i]).css('display') !== 'none') {
                    cnt++
                }
                if($(partDivs[i]).find("[data-part-item='X']").attr("name") == _nextPartItemDiv.attr("name")) {
                    idxCnt = cnt;
                }
            }
            App.timer = setTimeout(function() {
                console.log(57 * (idxCnt-1));
                if (designDiv.attr('id') == 'hEmbroideryBody'){
                    designDiv.scrollTop(57 * (idxCnt-1) + 37);
                } else {
                    designDiv.scrollTop(57 * (idxCnt - 1));
                }
                _nextPartItemDiv.parent().click();
            }, 500);
            // var nextField = _nextPartItemDiv.attr("name");
            // if(product.isEmbroidery(nextField)){
            //     _nextPartItemDiv.click();
            // }else{
            //     var _val = _nextPartItemDiv.find("input[data-save-code]").val().trim();
            //     if(!_val){
            //         _nextPartItemDiv.click();
            //         var _parentDiv = _nextPartItemDiv.parent();
            //         _parentDiv[0].scrollTop = _nextPartItemDiv[0].offsetTop;
            //     }else{
            //         product.findNextPartItemAndGoto(_nextPartItemDiv);
            //     }
            // }
        
    },
    //获取辅料库存并显示
    getAccessoriesStockAndSet : function(partItemDiv, field, val, _target, noMsg){

        if(val == product.MEASU_CUSTOM_CODE ||val == product.MATCHING_CODE || ( field == "REQXU" && val == "A" )){ //自定义辅料或者 顺色或者 袖里布通大身里布无需查库存
            // product.findNextPartItemAndGoto(partItemDiv);
            product.closeThisPart(partItemDiv);
        } else {
            var conditions = new Array();
            var range = {FIELD: 'MATNR', SIGN: 'I', OPTION: 'EQ', LOW: val, HEIGHT: ''};
            conditions.push(range);
            var params = {CONDITIONS: conditions, BRAND: product.brandList.int.code};
            var _url = '/eis/measureData/getFabricStock';
            $.ajax({
                type: 'POST',
                url: _url,
                contentType: "application/json;charset=utf-8",
                async: true,
                cache: false,
                dataType: 'json',
                data: JSON.stringify(params),
                success: function (result, status, xhr) {
                    if(result.flag == "SUCCESS"){
                        var data = result.data;
                        if(!data || data.length == 0 || parseFloat(data[0].menge) <= 0){
                            //_target.next().append("<span>"+I18nUtil.getProp("eis_ipo_create_56")+"</span>");
                            _target.next().find("span[name='accessoriesStock']").html(I18nUtil.getProp("eis_ipo_create_56"));

                            if (!noMsg){
                                layer.open({title: false,closeBtn:0,time:2000,btn:[],content:I18nUtil.getProp("eis_ipo_create_56")});
                            }
                        }else{
                            var _html = I18nUtil.getProp("common_99") + " " + parseFloat(data[0].menge);
                            //_target.next().append("<span>"+_html+"</span>");
                            _target.next().find("span[name='accessoriesStock']").html(_html);
                            // product.findNextPartItemAndGoto(partItemDiv);
                            product.closeThisPart(partItemDiv);
                        }
                    }
                },
                error: function (xhr, status, error) {}
            });
        }
    },
    setModelInfo : function(mtypb, moder, modem, model) {
        var modelInfo = measureCache.getModel(mtypb, moder, model);
        var mod = $("#TryOn");
        var fields = mod.find("input[data-save-code]");
        mod.find("input[name='Standard']").val(model);
        for(var i = 0; i < fields.length; i++){
            var field = $(fields[i]);
            var code = field.attr("data-save-code").toLowerCase();
            if(code == 'model'){
                continue;
            }
            if(!modelInfo ||modelInfo[code] == undefined){
                continue;
            }
            var val = modelInfo[code];
            field.val(val);
            field.attr("data-value-original", val);
            App.orderData[App.tabIndex].tryOnZlrecm[code] = val;
            appfunctions.delMeasurementRequired('A', code);
            if(!product.isUnlimitModel(model)){
                product.setModelScopeValue(field, val);
            }
        }
        //mod.find("input[name='MODEL']").val(model);
    },
    setHalfModelInfo : function(mtypb, moder, modem, model) {
        var modelInfo = measureCache.getModel(mtypb, moder, model);
        var mod = $("#HalfTryOn");
        var fields = mod.find("input[data-save-code]");
        mod.find("input[name='Standard']").val(model);
        for(var i = 0; i < fields.length; i++){
            var field = $(fields[i]);
            var code = field.attr("data-save-code").toLowerCase();
            if(code == 'model'){
                continue;
            }
            if(!modelInfo ||modelInfo[code] == undefined){
                continue;
            }
            var val = modelInfo[code];
            field.val(val);
            field.attr("data-value-original", val);
            App.orderData[App.tabIndex].halfTryOnZlrecm[code] = val;
            appfunctions.delMeasurementRequired(product.measuList.halfSetSize.code, code);
            if(!product.isUnlimitModel(model)){
                product.setModelScopeValue(field, val);
            }
        }
        //mod.find("input[name='MODEL']").val(model);
    },
    //设置尺寸范围描述
    setModelScopeValue: function(modInput, val){
        var hasLimit = modInput.attr("data-limit");
        if(hasLimit == "X"){
            var scopeTd = modInput.parent().next().find("[name='size-scope']");
            var low = parseFloat(val) - parseFloat(modInput.attr("data-low-incre"));
            var high = parseFloat(val) + parseFloat(modInput.attr("data-high-incre"));
            modInput.attr("data-low", low);
            modInput.attr("data-high", high);
            var scopeMsg = low + " - " + high;
            scopeTd.html(scopeMsg);
        }else{
            var scopeTd = modInput.parent().next().find("[name='size-scope']");
            scopeTd.html("");
        }
    },
    getReqtpByEmbroideryField: function(field){
        var reqtps = product.EMBROIDERY_TYPE.split("|");
        var reqtp;
        if(product.isEmbroideryField(field)){
            reqtp = reqtps[0];
        }else if(product.isEmbroideryField2(field)){
            reqtp =  reqtps[1];
        }else{
            reqtp = reqtps[2];
        }
        return reqtp;
    },
    groupZlrecd: function(zlrecdList){
        var zlrecdMap = {};
        for(var i = 0; i < zlrecdList.length; i++){
            var zlrecd = zlrecdList[i];
            if(zlrecd.loekz == "X"){
                continue;
            }
            zlrecdMap[zlrecd.lrecp] = zlrecd;
        }
        return zlrecdMap;
    },
    /**
     * 个性部件分组
     * @param zlrecpList
     * @returns {{}}
     */
    groupZlrecp : function (zlrecpList){

        var result = {};
        for(var i = 0; i < zlrecpList.length; i++){
            var zlrecp = zlrecpList[i];
            if(zlrecp.loekz == "X"){
                continue;
            }
            var key = zlrecp.lrecp;
            if(key == ""){
                continue;
            }
            if(!result[key]){
                result[key] = new Array();
            }
            var zlrecps =  result[key];
            zlrecps.push(zlrecp);
        }
        return result;
    },

    /**
     * 尺寸数��分组
     * @param zlrecmList
     * @returns {{}}
     */
    groupZlrecm : function (zlrecmList){

        var result = {};
        for(var i = 0; i < zlrecmList.length; i++){
            var zlrecm = zlrecmList[i];
            if(zlrecm.loekz == "X"){
                continue;
            }
            var key = zlrecm.lrecp;
            result[key] = zlrecm;
        }
        return result;
    },
    /**
     * 货号数据分组
     * @param matnrList
     * @returns {{}}
     */
    groupZlmatnr : function (zlmatnrList){

        var result = {};
        for(var i = 0; i < zlmatnrList.length; i++){
            var zlmatnr = zlmatnrList[i];
            var key = zlmatnr.mtypb + zlmatnr.matnr;
            result[key] = zlmatnr;
        }
        return result;
    },
    groupZlreda : function(zlredaList){
        var result = {};
        for(var i = 0; i < zlredaList.length; i++){
            var zlreda = zlredaList[i];
            result[zlreda.lrecp] = zlreda;
        }
        return result;
    },
    /**
     * 获取下单备注
     * @param zlnotesList
     * @returns {{}}
     */
    groupOrderNote : function (zlnotesList){

        var result = {};
        for(var i = 0; i < zlnotesList.length; i++){
            var zlnotes = zlnotesList[i];
            var notel = zlnotes.notel;
            var lrecp = zlnotes.lrecp;
            if(notel == product.notelList.create.code
                || notel == product.notelList.modemImage.code
                || notel == product.notelList.custMarkImage.code
                || notel == product.notelList.fabricReject.code){
                result[product.genGroupKey(lrecp, notel)] = zlnotes;
            }
        }
        return result;
    },
    /**
     * 判断页面是否可以编辑
     */
    isEditable : function(statu) {
        if(statu == product.statuList.orderConfirm.code || statu == product.statuList.orderPass.code || statu == product.statuList.orderTransfer.code){
            return false;
        } else if(statu == product.statuList.newOrder.code || statu == product.statuList.orderReject.code || statu == product.statuList.fabricReject.code) {
            return true;
        }
        return false;
    },
    /**
     * 是否为净尺量体
     * @param val
     * @returns {boolean}
     */
    isNetSizeMeasu : function(val){
        if(!val || val == null){
            return false;
        }
        return (val == product.measuList.netSize.code);
    },
    /**
     * 是否为半套号量体
     * @param val
     * @returns {boolean}
     */
    isHalfSetSizeMeasu : function(val){
        if(!val || val == null){
            return false;
        }
        return (val == product.measuList.halfSetSize.code);
    },
    /**
     * 是否为成衣量体
     * @param val
     * @returns {boolean}
     */
    isGarmentSizeMeasu : function(val){
        if(!val || val == null){
            return false;
        }
        return (val == product.measuList.garmentSize.code);
    },
    /**
     * 是否为套号量体
     * @param val
     * @returns {boolean}
     */
    isModelSizeMeasu : function(val){
        if(!val || val == null){
            return false;
        }
        return (val == product.measuList.modelSize.code);
    },
    isSuitCategory: function(field){
        return (product.SUIT_CATEGORY.split("|").indexOf(field) != -1);
    },
    isHidePatternCategory: function(datas){
        var flag = false;
        var request = getConditions(datas);
        var _url = "/eis/measureData/getZlpmrByStoreConfigAndResource";
        $.ajax({
            type : 'POST',
            url : _url,
            contentType: "application/json;charset=utf-8",
            async: false,
            cache: false,
            dataType: 'json',
            data : JSON.stringify(request),
            success: function (result, status, xhr) {
                if(result.flag == "SUCCESS"){
                    var datas = result.data;
                    if (!datas || datas.length == 0 ){
                        flag = false
                    } else {
                        if (result.data.length == 1){
                            App.hidenPattern = result.data[0];
                            flag = true
                        } else {
                            flag = false
                        }
                    }
                }else{
                    flag = false
                }
            },
            error: function (xhr, status, error) {
                flag = false;
            }
        });
        return flag;
        function getConditions(datas) {
            var lrecp = datas.lrecp;
            // var pmmArea = $('#PMM_' + lrecp);
            // var fieldComps = pmmArea.find('div[name="modemFeature"]').find('select[data-save-code]');
            var mtypb = datas.Category.mtypb
            var brand = App.brand;
            var sex = datas.Category.sexty;
            var ordtp = App.ordtp;
            if (!ordtp){
                //看情况修复
                ordtp = "C";
            }
            var desin = false;
            var aresy = false;
            var cond1 = new Array();
            var cond2 = {};
            var cond3 = {};
            // for (var i = 0; i < fieldComps.length; i++) {
            //     var fieldComp = $(fieldComps[i]);
            //     if (fieldComp.val()) {
            //         cond1.push({ordtp:ordtp, mtypb:mtypb, propt:fieldComp.attr('data-save-code'), prope:fieldComp.val()});
            //     }
            // }
            cond1.push({ordtp:ordtp, mtypb:mtypb, propt: 'BRAND', prope:brand});
            if (desin) {
                cond1.push({ordtp:ordtp, mtypb:mtypb, propt: 'DESIN', prope:desin});
            }
            if (aresy) {
                cond1.push({ordtp:ordtp, mtypb:mtypb, propt: 'ARESY', prope:aresy});
            }
            cond2.mtypb = [rangeUtil.createEqStdRange(mtypb)];
            if (sex) {
                cond2.sexty = [rangeUtil.createEqStdRange(sex)];
            }
            cond3.mtypb = mtypb;
            cond3.kunnr = App.kunnr;

            var kunnrCond = product.getMainStoreCondition();
            cond2.kunnr = [rangeUtil.createEqStdRange(""), kunnrCond];
            var request = {cond1 : cond1, cond2 : cond2, cond3 : cond3};
            return request;
        }
    },
    getEmbroideryImgFieldByReqtp: function(reqtp) {
        var reqtps = product.EMBROIDERY_TYPE.split("|");
        return product.REQEMIMG[reqtps.indexOf(reqtp)];
    },
    isEmbroideryOrImg: function(field){
        return product.isEmbroidery(field) || product.isEmbroideryImg(field);
    },
    isEmbroidery : function(field){
        return (product.EMBROIDERY.indexOf(field) != -1);
    },
    isEmbroideryImg: function(field){
        return (product.EMBROIDERY_IMG.split("|").indexOf(field) != -1);
    },
    isEmbroideryType: function(field){
        return (product.EMBROIDERY_TYPE.indexOf(field) != -1);
    },
    isEmbroideryField: function(field){
        return (product.EMBROIDERY_FIELD.indexOf(field) != -1);
    },
    isEmbroideryField2: function(field){
        return (product.EMBROIDERY_FIELD2.indexOf(field) != -1);
    },
    isEmbroideryField3: function(field){
        return (product.EMBROIDERY_FIELD3.indexOf(field) != -1);
    },
    isEmbroideryFields: function(field){
        return product.isEmbroideryField(field) || product.isEmbroideryField2(field) || product.isEmbroideryField3(field);
    },
    isMulityPart: function(field){
        return (product.MULITY_PART.indexOf(field) != -1);
    },
    isTextPart : function(field){
        return (product.TEXT_PART.indexOf(field) != -1);
    },
    isDresh: function(field){
        return (product.NETSIZE_DRESH.indexOf(field) != -1);
    },
    isDresi: function(field){
        return (product.NETSIZE_DRESI.indexOf(field) != -1);
    },
    isHidenModem: function(field){
        return (product.HIDEN_MODEM.split("|").indexOf(field) != -1);
    },
    isCustomModerField: function(field){
        return (product.CUSTOM_MODER_FIELD.split("|").indexOf(field) != -1);
    },
    isExtraPrice: function(field){
        return (product.notOtherPrice.split("|").indexOf(field) == -1);
    },
    needTransNetsize: function(field) {
        return (product.FIELDS_NETSIZE_NO_TRANS.indexOf(field) == -1);
    },
    needTransGarment: function(field) {
        return (product.FIELDS_GARMENT_NO_TRANS.indexOf(field) == -1);
    },
    isEmbroideryWords: function(reqtpVal){
        return product.REQTP_VALS.WORDS == reqtpVal;
    },
    isEmbroideryImageLib: function(reqtpVal){
        return product.REQTP_VALS.IMG_LIB == reqtpVal;
    },
    isEmbroideryCustomImg: function(reqtpVal){
        return product.REQTP_VALS.CUSTOMER_IMG == reqtpVal;
    },
    isEmbroideryTextArea : function (field) {
        return (product.EMBROIDERY_TEXTAREA.indexOf(field) != -1);
    },
    getEmbroideryInfoByReqtpAndVal: function(reqtp, val){
        return product.EMBROIDERY_TYPE_FIELD_V2[reqtp][val];
    },
    isEmbroideryTypeField : function (reqtp, val, field) {
        var embroideryInfo = product.getEmbroideryInfoByReqtpAndVal(reqtp, val);
        return (embroideryInfo.indexOf(field) != -1);
    },
    getReqemImgIndex : function (field) {
        return product.REQEMIMG.indexOf(field);
    },
    isReqemImg : function (field) {
        return (product.REQEMIMG.indexOf(field) != -1);
    },
    isReqnp : function (field) {
        return (product.REQNP.indexOf(field) != -1);
    },
    isNetSizeZLrecp : function(field) {
        return (product.NETSIZE_ZLRECP.indexOf(field) != -1);
    },
    transCm2Inch : function(val){
        var inchVal = (parseFloat(val)/product.RATE_INCH2CM).toFixed(2);
        return inchVal + "";
    },
    transInch2Cm : function(val){
        var cmVal = (parseFloat(val) * product.RATE_INCH2CM).toFixed(2);
        return cmVal;
    },
    //是否为无限制号型
    isUnlimitModel : function(model) {
        return (product.UNLIMIT_MODEL == model);
    },
    //是否为无限制号型
    isMainSuitMtypb : function(mtypb) {
        if (mtypb == "BB" || mtypb == "BW"){
            return true;
        }
        return false;
    },
    //是否为无限制号型
    isHasHalfSetSize : function(custom, kunnr) {
        if (custom){
            return (product.isHasHalfSetSizeKunnr.split("|").indexOf(kunnr) != -1)
        }
        return false;
    },
    //净尺转换排除字段
    isTransfersize2modelExcludeField :function(field) {
        return (product.TRANSFERSIZE2MODEL_EXCLUDE_FIELD.indexOf(field) != -1)
    },
    initI18n : function(){
        I18nUtil.translate($(".layui-tab-content"),['span','div','label','input']);
        I18nUtil.translate($(".hOrderContent"),['span','div','label','input']);
        I18nUtil.translate($(".layui-layer"),['span','div','label','input']);
        I18nUtil.translate($(".layui-form"),['span','div','label','input']);
        I18nUtil.initLang();
    }
}


