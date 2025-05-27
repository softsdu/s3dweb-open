import {defaultLayoutConfig} from "./defaultLayoutConfig.js";
import {s3dBlockMap} from "./s3dBlockMap.js";
import {cmnPcr} from "../../commonjs/common/common.js";
import "./s3dLayout.css"

let S3dLayout = function (){
    const thatLayout = this;

    //containerId
    this.containerId = null;

    //系统图片目录
    this.imagesFolder = null;

    //字体目录
    this.fontsFolder = null;

    //用户资源目录
    this.resourcesUserFolder = null;

    //公有资源目录
    this.resourcesPublicFolder = null;

    //s3d manager
    this.manager = null;

    //布局配置
    this.layoutConfig = null;

    //记录正在移动的信息
    this.draggingInfo = {
        lastPosition: {
            x: 0,
            y: 0
        },
        object: null
    };

    //事件
    this.eventFunctions = {};
    this.addEventFunction = function(eventName, func){
        let allFuncs = thatLayout.eventFunctions[eventName];
        if(allFuncs == null){
            allFuncs = [];
            thatLayout.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    }
    this.removeEventFunction = function(eventName, func){
        let allFuncs = thatLayout.eventFunctions[eventName];
        if(allFuncs != null){
            let newAllFuncs = [];
            for(let i = 0; i < allFuncs.length; i++){
                let f = allFuncs[i];
                if(f !== func){
                    newAllFuncs.push(f);
                }
            }
            thatLayout.eventFunctions[eventName] = newAllFuncs;
        }
    }
    this.doEventFunction = function(eventName, p){
        let allFuncs = thatLayout.eventFunctions[eventName];
        if(allFuncs != null){
            for(let i = 0; i < allFuncs.length; i++){
                let func = allFuncs[i];
                func(p);
            }
        }
    }

    //初始化
    this.init = function(p){
        thatLayout.containerId = p.containerId;
        thatLayout.manager = p.manager;
        thatLayout.imagesFolder = p.config.imagesFolder;
        thatLayout.fontsFolder = p.config.fontsFolder;
        thatLayout.resourcesUserFolder = p.config.resourcesUserFolder;
        thatLayout.resourcesPublicFolder = p.config.resourcesPublicFolder;
        thatLayout.layoutConfig = p.config.layoutConfig == null ? defaultLayoutConfig : p.config.layoutConfig;
        thatLayout.initLayout();
    }

    this.beforeHideBlock = function (p){
        thatLayout.doEventFunction("beforeHideBlock", p);
    }

    this.getMainHtml = function (layoutConfig) {
        let html = "";
        if (layoutConfig.header != null) {
            html += "<div class='s3dLayoutHeader'><div class='s3dLayoutSideContainer s3dLayoutSideFullContainer'></div></div>";
        }
        html += "<div class='s3dLayoutMainContainer" + (layoutConfig.header == null ? " s3dLayoutMainContainerNoHeader" : "") + "'>";
        if (layoutConfig.left != null) {
            html += "<div class='s3dLayoutLeftContainer'><div class='s3dLayoutSectionResizeVBar vBarRight'></div><div class='s3dLayoutSideContainer'></div></div>";
        }
        if (layoutConfig.center != null) {
            html += "<div class='s3dLayoutCenterContainer'><div class='s3dLayoutSideContainer'></div></div>";
        }
        if (layoutConfig.right != null) {
            html += "<div class='s3dLayoutRightContainer'><div class='s3dLayoutSectionResizeVBar vBarLeft'></div><div class='s3dLayoutSideContainer'></div></div>";
        }
        html += "</div>";
        return html;
    }

    this.initLayout = function (){
        let layoutConfig = thatLayout.layoutConfig;

        //设置容器样式
        let container = $("#" + thatLayout.containerId);
        $(container).addClass("s3dLayoutContainer");

        //基本html
        let mainHtml = thatLayout.getMainHtml(layoutConfig);
        $(container).append(mainHtml);

        //标题栏
        let headerContainer = $(container).find(".s3dLayoutHeader");
        let mainContainer = $(container).find(".s3dLayoutMainContainer");
        if(layoutConfig.header != null){
            $(headerContainer).height(layoutConfig.header.height);
            $(mainContainer).css({
                top: layoutConfig.header.height
            });
            thatLayout.initSideSections(headerContainer, layoutConfig.header.sections);
        }
        else{
            $(mainContainer).css({
                top: 0
            });
        }

        //左侧边栏
        let leftContainer = $(container).find(".s3dLayoutLeftContainer");
        if(layoutConfig.left != null){
            $(leftContainer).width(layoutConfig.left.width);
            thatLayout.initSideSections(leftContainer, layoutConfig.left.sections);
        }

        //中间栏
        let centerContainer = $(container).find(".s3dLayoutCenterContainer");
        if(layoutConfig.center != null){
            thatLayout.initSideSections(centerContainer, layoutConfig.center.sections);
        }

        //右侧边栏
        let rightContainer = $(container).find(".s3dLayoutRightContainer");
        if(layoutConfig.right != null){
            $(rightContainer).width(layoutConfig.right.width);
            thatLayout.initSideSections(rightContainer, layoutConfig.right.sections);
        }

        //初始化事件
        thatLayout.initEvents();
    }

    this.initEvents = function (){
        let container = $("#" + thatLayout.containerId);
        //侧边栏左右移动
        $(container).find(".s3dLayoutSectionResizeVBar").mousedown(function (ev){
            if(thatLayout.draggingInfo.object == null && ev.button === 0){
                thatLayout.beginDrag(this, ev);
            }
        });

        //Section上下移动
        $(container).find(".s3dLayoutSectionResizeHBar").mousedown(function (ev){
            if(thatLayout.draggingInfo.object == null){
                thatLayout.beginDrag(this, ev);
            }
        });

        $(container).mouseup(function (ev){
            thatLayout.endDrag(ev);
        });

        $(container).mousemove(function (ev) {
            if (thatLayout.draggingInfo.object != null && ev.button === 0) {
                ev.preventDefault();
                thatLayout.drag(ev);
                return false;
            }
        });

        //屏蔽掉右键菜单
        $(container).contextmenu(function(ev){
            ev.preventDefault();
        });
    }

    this.beginDrag = function (object, ev){
        thatLayout.draggingInfo.object = object;
        thatLayout.draggingInfo.lastPosition.x = ev.clientX;
        thatLayout.draggingInfo.lastPosition.y = ev.clientY;
    }

    this.drag = function (ev){
        ev.preventDefault();
        let shiftX = ev.clientX - thatLayout.draggingInfo.lastPosition.x;
        let shiftY = ev.clientY - thatLayout.draggingInfo.lastPosition.y;
        let object = thatLayout.draggingInfo.object;
        if($(object).hasClass("vBarRight")){
            //左侧边栏
            if(shiftX !== 0) {
                let leftContainer = $(object).parent();
                $(leftContainer).width($(leftContainer).width() + shiftX);
            }
        }
        else if($(object).hasClass("vBarLeft")){
            //右侧边栏
            if(shiftX !== 0) {
                let rightContainer = $(object).parent();
                $(rightContainer).width($(rightContainer).width() - shiftX);
            }
        }
        else if($(object).hasClass("s3dLayoutSectionResizeHBar")){
            //Section顶部
            if(shiftY !== 0) {
                let sectionContainer = $(object).parent();
                let preSectionContainer = $(sectionContainer).prev();
                if(preSectionContainer.length > 0 && $(preSectionContainer).css("flex-grow") !== "1"){
                    $(preSectionContainer).height($(preSectionContainer).height() + shiftY);
                }
                if($(sectionContainer).css("flex-grow") !== "1"){
                    $(sectionContainer).height($(sectionContainer).height() - shiftY);
                }
            }
        }
        thatLayout.draggingInfo.lastPosition.x = ev.clientX;
        thatLayout.draggingInfo.lastPosition.y = ev.clientY;
    }

    this.endDrag = function (ev){
        if (thatLayout.draggingInfo.object != null) {
            ev.preventDefault();
            thatLayout.draggingInfo.object = null;
        }
    }

    this.getSectionsHtml = function (sectionConfigs){
        let html = "";
        for(let i = 0; i < sectionConfigs.length; i++) {
            let sectionConfig = sectionConfigs[i];
            let blockInfos = sectionConfig.blocks;

            //样式-高度
            let sectionStyle = "";
            if(sectionConfig.height == null){
                sectionStyle += "flex-grow:1;";
            }
            else{
                sectionStyle += ("height:" + sectionConfig.height + "px;");
            }

            //是否显示
            if(sectionConfig.visible){
                sectionStyle += "display:block;";
            }
            else{
                sectionStyle += "display:none;";
            }

            //html
            html += ("<div class='s3dLayoutSectionContainer" + (sectionConfig.hasHeader ? "" : " s3dLayoutSectionContainerMax") + "'"
                + " style='" + sectionStyle + "'>"
                + (i === 0 ? "" : "<div class='s3dLayoutSectionResizeHBar'></div>"));

            if(sectionConfig.hasHeader) {
                //header
                html += ("<div class='s3dLayoutSectionHeader'>");
                let hasDefaultActive = false;
                for (let j = 0; j < blockInfos.length; j++) {
                    let blockInfo = blockInfos[j];
                    let blockConfig = s3dBlockMap[blockInfo.name];
                    let tabClass = "s3dLayoutBlockTab";
                    if (!hasDefaultActive && blockInfo.visible) {
                        tabClass += " s3dLayoutBlockTabActive";
                        hasDefaultActive = true;
                    }
                    else if(!blockInfo.visible){
                        tabClass += " s3dLayoutBlockTabHidden";
                    }
                    let title = blockInfo.title == null ? blockConfig.title : blockInfo.title;
                    html += ("<div class='" + tabClass + "' name='" + blockInfo.name + "'>"
                        + "<div class='s3dLayoutBlockTabTitle'>" + cmnPcr.htmlEncode(title)
                        + (blockConfig.closeable ? "<span class='s3dLayoutBlockTabCloseBtn'>&#x2716;</span>" : "")
                        + "</div>"
                        + "</div>");
                }

                //toolbar
                html += ("<div class='s3dLayoutBlockToolbarContainer'>");
                hasDefaultActive = false;
                for (let j = 0; j < blockInfos.length; j++) {
                    let blockInfo = blockInfos[j];
                    let blockConfig = s3dBlockMap[blockInfo.name];
                    let blockClass = "s3dLayoutBlockToolbar";
                    if (!hasDefaultActive && blockInfo.visible) {
                        blockClass += " s3dLayoutBlockToolbarActive";
                        hasDefaultActive = true;
                    }
                    else if(!blockInfo.visible){
                        blockClass += " s3dLayoutBlockToolbarHidden";
                    }
                    html += ("<div class='" + blockClass + "' name='" + blockInfo.name + "'></div>");
                }
                html += "</div></div>";
            }


            //detail
            html += ("<div class='" + (sectionConfig.hasHeader ? "s3dLayoutBlocksContainer" : "s3dLayoutBlocksContainerMax") + "'>");
            let hasDefaultActive = false;
            for (let j = 0; j < blockInfos.length; j++) {
                let blockInfo = blockInfos[j];
                let blockConfig = s3dBlockMap[blockInfo.name];
                let blockClass= "s3dLayoutBlock";
                if (!hasDefaultActive && blockInfo.visible) {
                    blockClass += " s3dLayoutBlockActive";
                    hasDefaultActive = true;
                }
                else if(!blockInfo.visible){
                    blockClass += " s3dLayoutBlockHidden";
                }
                html += ("<div class='" + blockClass + "' name='" + blockInfo.name + "'></div>");
            }

            html += ("</div>"
                + "</div>");
        }
        return html;
    }

    this.initSideSections = function (outerContainer, sectionConfigs){
        let sideContainer = $(outerContainer).find(".s3dLayoutSideContainer");
        let html = thatLayout.getSectionsHtml(sectionConfigs);
        $(sideContainer).html(html);

        //绑定事件
        $(sideContainer).find(".s3dLayoutBlockTab").click(function (){
            let blockName = $(this).attr("name");
            thatLayout.showBlock(blockName);
        });

        $(sideContainer).find(".s3dLayoutBlockTabCloseBtn").click(function (){
            let blockName = $(this).parent().parent().attr("name");
            thatLayout.hideBlock(blockName);
            return false;
        });
    }

    this.showBlock = function (blockName){
        let container = $("#" + thatLayout.containerId);
        let sectionContainer = $(container).find(".s3dLayoutBlock[name='" + blockName + "']").parent().parent();
        $(sectionContainer).css({display: "block"});
        $(sectionContainer).find(".s3dLayoutBlockTab").removeClass("s3dLayoutBlockTabActive");
        $(sectionContainer).find(".s3dLayoutBlock").removeClass("s3dLayoutBlockActive");
        $(sectionContainer).find(".s3dLayoutBlockToolbar").removeClass("s3dLayoutBlockToolbarActive");

        $(sectionContainer).find(".s3dLayoutBlockTab[name='" + blockName + "']").addClass("s3dLayoutBlockTabActive");
        $(sectionContainer).find(".s3dLayoutBlock[name='" + blockName + "']").addClass("s3dLayoutBlockActive");
        $(sectionContainer).find(".s3dLayoutBlockToolbar[name='" + blockName + "']").addClass("s3dLayoutBlockToolbarActive");

        $(sectionContainer).find(".s3dLayoutBlockTab[name='" + blockName + "']").removeClass("s3dLayoutBlockTabHidden");
        $(sectionContainer).find(".s3dLayoutBlock[name='" + blockName + "']").removeClass("s3dLayoutBlockHidden");
        $(sectionContainer).find(".s3dLayoutBlockToolbar[name='" + blockName + "']").removeClass("s3dLayoutBlockToolbarHidden");
    }

    this.hideBlock = function (blockName){

        thatLayout.beforeHideBlock({
            blockName: blockName
        })

        let container = $("#" + thatLayout.containerId);
        let sectionContainer = $(container).find(".s3dLayoutBlock[name='" + blockName + "']").parent().parent();

        //隐藏掉被关闭的block
        $(sectionContainer).find(".s3dLayoutBlockTab[name='" + blockName + "']").removeClass("s3dLayoutBlockTabActive");
        $(sectionContainer).find(".s3dLayoutBlock[name='" + blockName + "']").removeClass("s3dLayoutBlockActive");
        $(sectionContainer).find(".s3dLayoutBlockToolbar[name='" + blockName + "']").removeClass("s3dLayoutBlockToolbarActive");
        $(sectionContainer).find(".s3dLayoutBlockTab[name='" + blockName + "']").addClass("s3dLayoutBlockTabHidden");
        $(sectionContainer).find(".s3dLayoutBlock[name='" + blockName + "']").addClass("s3dLayoutBlockHidden");
        $(sectionContainer).find(".s3dLayoutBlockToolbar[name='" + blockName + "']").addClass("s3dLayoutBlockToolbarHidden");

        let allIsHidden = $(sectionContainer).find(".s3dLayoutBlockTabHidden").length === $(sectionContainer).find(".s3dLayoutBlockTab").length;
        if(allIsHidden) {
            //如果都隐藏了，那就把section也隐藏了
            $(sectionContainer).css({display: "none"});
        }
        else{
            //如果没有都隐藏，那么选中第一个没有被隐藏的tab
            let visibleTab = $(sectionContainer).find(".s3dLayoutBlockTab:not(.s3dLayoutBlockTabHidden)")[0];
            let visibleBlockName = $(visibleTab).attr("name");
            $(sectionContainer).find(".s3dLayoutBlockTab[name='" + visibleBlockName + "']").addClass("s3dLayoutBlockTabActive");
            $(sectionContainer).find(".s3dLayoutBlock[name='" + visibleBlockName + "']").addClass("s3dLayoutBlockActive");
            $(sectionContainer).find(".s3dLayoutBlockToolbar[name='" + visibleBlockName + "']").addClass("s3dLayoutBlockToolbarActive");
        }
    }
}

export default S3dLayout