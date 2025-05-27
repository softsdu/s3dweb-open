import {
    cmnPcr,
    msgBox,
    s3dContent2DEditType, s3dContent2DShiftName, s3dContent2DShiftType, s3dElement3DType,
    s3dOperateType
} from "../../commonjs/common/common.js"
import "./S3dContent2DList.css"

//S3dWeb 2D页面
let s3dContent2DList = function (){
    //当前对象
    const thatContent2DList= this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;

    //事件
    this.eventFunctions = {};
    this.addEventFunction = function(eventName, func){
        let allFuncs = thatContent2DList.eventFunctions[eventName];
        if(allFuncs == null){
            allFuncs = [];
            thatContent2DList.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    }
    this.doEventFunction = function(eventName, p){
        let allFuncs = thatContent2DList.eventFunctions[eventName];
        if(allFuncs != null){
            for(let i = 0; i < allFuncs.length; i++){
                let func = allFuncs[i];
                func(p);
            }
        }
    }

    //初始化
    this.init = function(p){
        thatContent2DList.containerId = p.containerId;
        thatContent2DList.manager = p.manager;
        thatContent2DList.showPageList(p.config.title);
    }

    //显示
    this.showPageList = function(){
        //构造html
        let html = thatContent2DList.getHtml();
        let container = $("#" + thatContent2DList.containerId);
        let pageListContainer = $(container).find(".s3dLayoutBlock[name='content2DList']");
        $(pageListContainer).html(html);

        //toolbar
        let toolbarContainer = $(container).find(".s3dLayoutBlockToolbar[name='content2DList']");
        let toolbarHtml = thatContent2DList.getToolbarHtml();
        $(toolbarContainer).html(toolbarHtml);

        thatContent2DList.refreshCameraList();
        thatContent2DList.refreshNonePageItem();
        thatContent2DList.bindEvents();
    }

    //获取树toolbar html
    this.getToolbarHtml = function() {
        let html = ("<div class='s3dContent2DListToolbar'>"
            + "<div class='s3dContent2DListPageBtn s3dContent2DListAddPageBtn' title='添加页面'>&#x2795;</div>"
            + "</div>"
            + "</div>");
        return html;
    }

    this.bindEvents = function () {
        let container = $("#" + thatContent2DList.containerId);

        //菜单
        $(container).find(".s3dContent2DListItemBtn").click(function (ev) {
            ev.preventDefault();
            let pageCode = $(this).parent().attr("pageCode");
            thatContent2DList.showMenu(pageCode, ev);
            return false;
        });

        //编辑详情
        $(container).find(".s3dContent2DListItem").click(function () {
            let pageCode = $(this).attr("pageCode");
            thatContent2DList.focusPage(pageCode);
            thatContent2DList.editPage(pageCode);
        });

        //菜单下拉按钮
        $(container).find(".s3dContent2DListItemBtn").contextmenu(function (ev) {
            if (ev.button === 2) {
                ev.preventDefault();
                let pageCode = $(this).parent().attr("pageCode");
                thatContent2DList.showMenu(pageCode, ev);
            }
        });
        $(container).find(".s3dContent2DListItem").contextmenu(function (ev) {
            if (ev.button === 2) {
                ev.preventDefault();
                let pageCode = $(this).attr("pageCode");
                thatContent2DList.showMenu(pageCode, ev);
            }
        });

        $(container).find(".s3dContent2DListAddPageBtn").click(function () {
            thatContent2DList.addNewPage();
            thatContent2DList.remarkAllPageIndex();
        });

        $(container).find(".s3dContent2DListNewPageBtn").click(function () {
            thatContent2DList.addNewPage();
            thatContent2DList.remarkAllPageIndex();
        });

        $(container).find(".s3dContent2DListNavigatorItem[name='navigator'] .s3dContent2DListItemSelect").change(function (){
            let navigatorCode = $(this).val();
            thatContent2DList.manager.userContent2D.navigatorCode = navigatorCode;
        });

        $(container).find(".s3dContent2DListNavigatorItem[name='shiftType'] .s3dContent2DListItemSelect").change(function (){
            let shiftType = $(this).val();
            thatContent2DList.manager.userContent2D.shiftType = shiftType;
        });

        $(container).find(".s3dContent2DListNavigatorItem[name='camera'] .s3dContent2DListItemSelect").change(function (){
            let cameraId = $(this).val();
            thatContent2DList.manager.userContent2D.cameraId = cameraId;
        });

        $(container).find(".s3dContent2DListNavigatorItem[name='camera'] .s3dContent2DListItemSelect").click(function (){
            thatContent2DList.refreshCameraList();
        });

    }

    //获取list html
    this.getHtml = function(){
        let html = "";
        html += ("<div class='s3dContent2DListContainer'>")
        html += ("<div class='s3dContent2DListNavigatorContainer'>")
        html += ("<div class='s3dContent2DListHeader'>");
        html += ("<div class='s3dContent2DListTitle'>全局设置</div>");
        html += "</div>";

        //导航栏
        html += ("<div class='s3dContent2DListNavigatorItem' name='navigator'>");
        html += ("<div class='s3dContent2DListItemTitle'>导航栏</div>");
        html += ("<div class='s3dContent2DListItemValue'>");
        html += ("<select class='s3dContent2DListItemSelect'>");
        let navigatorCode = thatContent2DList.manager.userContent2D.navigatorCode;
        let navigators = thatContent2DList.manager.localContent2D.navigators;
        for(let i = 0; i < navigators.length; i++){
            let navigator = navigators[i];
            html += ("<option value='" + navigator.code + "' "+ (navigator.code === navigatorCode ? "selected" : "") + ">" + cmnPcr.htmlEncode(navigator.name) + "</option>");
        }
        html += ("<option value='' "+ (navigatorCode == null || navigatorCode.length === 0 ? "selected" : "") + ">无</option>");
        html += ("</select>");
        html += "</div>";
        html += "</div>";

        //切换方式
        html += ("<div class='s3dContent2DListNavigatorItem' name='shiftType'>");
        html += ("<div class='s3dContent2DListItemTitle'>切换方式</div>");
        html += ("<div class='s3dContent2DListItemValue'>");
        html += ("<select class='s3dContent2DListItemSelect'>");
        let shiftType = thatContent2DList.manager.userContent2D.shiftType;
        for(let shiftTypeCode in s3dContent2DShiftType){
            let shiftTypeName = s3dContent2DShiftName[shiftTypeCode];
            html += ("<option value='" + shiftTypeCode + "' "+ (shiftType === shiftTypeCode ? "selected" : "") + ">" + cmnPcr.htmlEncode(shiftTypeName) + "</option>");
        }
        html += ("<option value='' "+ (shiftType == null || shiftType.length === 0 ? "selected" : "") + ">无</option>");
        html += ("</select>");
        html += "</div>";
        html += "</div>";

        //
        html += ("<div class='s3dContent2DListNavigatorItem' name='camera'>");
        html += ("<div class='s3dContent2DListItemTitle'>默认相机</div>");
        html += ("<div class='s3dContent2DListItemValue'>");
        html += ("<select class='s3dContent2DListItemSelect'>");
        html += ("</select>");
        html += "</div>";
        html += "</div>";

        html += "</div>";
        html += ("<div class='s3dContent2DListPageContainer'>");
        html += ("<div class='s3dContent2DListHeader'>");
        html += ("<div class='s3dContent2DListTitle'>页面列表</div>");
        html += "</div>";
        html += ("<div class='s3dContent2DListPageListContainer'>");
        html += thatContent2DList.getPageListHtml(thatContent2DList.manager.userContent2D.getSortedPageList());
        html += "</div>";
        html += ("<div class='s3dContent2DListNewItem'><div class='s3dContent2DListNewPageBtn'><span class='s3dContent2DListNewPageImage'>&#x2795;</span>新增页面</div></div>");
        html += "</div>";
        html += "</div>";
        return html;
    }

    this.refreshCameraList = function (){
        let container = $("#" + thatContent2DList.containerId);
        let selectElement = $(container).find(".s3dContent2DListNavigatorItem[name='camera'] .s3dContent2DListItemSelect");
        let html= "";
        let cameraId = thatContent2DList.manager.userContent2D.cameraId;
        for(let objectId in thatContent2DList.manager.viewer.allObject3DMap){
            let object3D = thatContent2DList.manager.viewer.allObject3DMap[objectId];
            let unitInfo = object3D.userData.info;
            if(unitInfo.type === s3dElement3DType.camera) {
                html += ("<option value='" + unitInfo.id + "' " + (unitInfo.id === cameraId ? "selected" : "") + ">" + cmnPcr.htmlEncode(unitInfo.name) + "</option>");
            }
        }
        html += ("<option value='' "+ (cameraId == null || cameraId.length === 0 ? "selected" : "") + ">无</option>");
        $(selectElement).html(html);
    }

    this.getPageListHtml = function (pageList){
        let html = "";
        if(pageList != null && pageList.length !== 0){
            for (let i = 0; i < pageList.length; i++) {
                let pageInfo = pageList[i];
                html += thatContent2DList.getPageItemHtml(pageInfo);
            }
        }
        return html;
    }

    this.refreshNonePageItem = function (){
        let container = $("#" + thatContent2DList.containerId);
        let items = $(container).find(".s3dContent2DListItem");
        $(container).find(".s3dContent2DListNoneItem").css({display: (items.length > 0 ? "none" : "block")});
    }

    this.getPageItemHtml = function (pageInfo){
        let html = "";
        html += ("<div class='s3dContent2DListItem' pageCode='" + pageInfo.code + "'>");
        html += ("<div class='s3dContent2DListItemName'><span class='s3dContent2DListItemTitle'>" + cmnPcr.htmlEncode(pageInfo.name) + "</span></div>");
        html += ("<div class='s3dContent2DListItemBtn'>&#9477;</div>");
        html += ("</div>");
        return html;
    }

    this.getNonePageItemHtml = function (){
        let html = "";
        html += ("<div class='s3dContent2DListNoneItem'>尚未定义页面</div>");
        return html;
    }

    this.focusPage = function (pageCode){
        let container = $("#" + thatContent2DList.containerId);
        $(container).find(".s3dContent2DListItem").removeClass("s3dContent2DListItemActive");
        $(container).find(".s3dContent2DListItem[pageCode='" + pageCode + "']").addClass("s3dContent2DListItemActive");
    }

    this.refreshPage = function (pageCode){
        let pageInfo = thatContent2DList.manager.userContent2D.getPageInfo(pageCode);
        let container = $("#" + thatContent2DList.containerId);
        let pageItem = $(container).find(".s3dContent2DListItem[pageCode='" + pageCode + "']");
        $(pageItem).find(".s3dContent2DListItemTitle").text(pageInfo.name);
        thatContent2DList.remarkAllPageIndex();
    }

    this.showMenu = function(pageCode, ev) {
        thatContent2DList.focusPage(pageCode);

        thatContent2DList.showPageMenu();

        //基本信息
        let container = $("#" + thatContent2DList.containerId);
        let menuContainer = $(container).find(".s3dContent2DListMenuContainer");
        $(menuContainer).attr("pageCode", pageCode);

        //初始化event
        $(container).find(".s3dContent2DListMenuOuterContainer").focus();
        $(container).find(".s3dContent2DListMenuBackground").mousedown(function (){
            thatContent2DList.closeMenu();
        });
        $(container).find(".s3dContent2DListMenuOuterContainer").keydown(function (ev){
            switch(ev.keyCode){
                case 27:{
                    thatContent2DList.closeMenu();
                    break;
                }
            }
        });
        $(container).find(".s3dContent2DListMenuBackground").click(function (){
            thatContent2DList.closeMenu();
        });


        //设置菜单显示位置
        let menuContainerHeight = $(menuContainer).height();
        let menuContainerWidth = $(menuContainer).width();
        let containerHeight = $(container).height();
        let containerWidth = $(container).width();

        if(ev.clientY + menuContainerHeight < containerHeight){
            $(menuContainer).css({
                "top": ev.clientY + "px",
                "bottom": "auto"
            });
        }
        else{
            $(menuContainer).css({
                "top": "auto",
                "bottom": (containerHeight - ev.clientY) + "px"
            });
        }
        if(ev.clientX + menuContainerWidth < containerWidth){
            $(menuContainer).css({
                "left": ev.clientX + "px",
                "right": "auto"
            });
        }
        else{
            $(menuContainer).css({
                "left": "auto",
                "right": (containerWidth - ev.clientX) + "px",
            });
        }
    }

    this.closeMenu = function (){
        let container = $("#" + thatContent2DList.containerId);
        $(container).find(".s3dContent2DListMenuOuterContainer").remove();
    }

    this.showPageMenu = function (){
        let html = "<div class='s3dContent2DListMenuOuterContainer'>";
        html += ("<div class='s3dContent2DListMenuBackground'></div>");
        html += ("<div class='s3dContent2DListMenuContainer'>");
        html += ("<div class='s3dContent2DListMenuItem' name='pageUp' title='上移'>上移</div>");
        html += ("<div class='s3dContent2DListMenuItem' name='pageDown' title='下移'>下移</div>");
        html += ("<div class='s3dContent2DListMenuItem' name='editPageBtn' title='编辑页面'>编辑</div>");
        html += ("<div class='s3dContent2DListMenuItem' name='copyPageBtn' title='复制页面'>复制</div>");
        html += ("<div class='s3dContent2DListMenuItem' name='deletePageBtn' title='删除页面'>删除</div>");
        html += ("</div>");
        html += ("</div>");
        let container = $("#" + thatContent2DList.containerId);
        $(container).append(html);

        //上移
        $(container).find(".s3dContent2DListMenuItem[name='pageUp']").click(function(){
            thatContent2DList.closeMenu();
            let pageCode = $(this).parent().attr("pageCode");
            thatContent2DList.pageUp(pageCode);
            thatContent2DList.remarkAllPageIndex();
        });

        //下移
        $(container).find(".s3dContent2DListMenuItem[name='pageDown']").click(function(){
            thatContent2DList.closeMenu();
            let pageCode = $(this).parent().attr("pageCode");
            thatContent2DList.pageDown(pageCode);
            thatContent2DList.remarkAllPageIndex();
        });

        //编辑详情
        $(container).find(".s3dContent2DListMenuItem[name='editPageBtn']").click(function(){
            thatContent2DList.closeMenu();
            let pageCode = $(this).parent().attr("pageCode");
            thatContent2DList.editPage(pageCode);
            thatContent2DList.remarkAllPageIndex();
        });

        //复制材质
        $(container).find(".s3dContent2DListMenuItem[name='copyPageBtn']").click(function(){
            thatContent2DList.closeMenu();
            let pageCode = $(this).parent().attr("pageCode");
            thatContent2DList.copyPage(pageCode);
            thatContent2DList.remarkAllPageIndex();
        });

        //删除材质
        $(container).find(".s3dContent2DListMenuItem[name='deletePageBtn']").click(function(){
            thatContent2DList.closeMenu();
            let pageCode = $(this).parent().attr("pageCode");
            thatContent2DList.deletePage(pageCode);
            thatContent2DList.remarkAllPageIndex();
        });
    }

    this.showPageInfo = function (pageCode){
        thatContent2DList.showPageEditor(pageCode);
    }

    this.pageDown = function (pageCode){
        let container = $("#" + thatContent2DList.containerId);
        let currentItem = $(container).find(".s3dContent2DListItem[pageCode='" + pageCode + "']");
        let nextItem = $(currentItem).next(".s3dContent2DListItem");
        if(nextItem.length > 0){
            $(currentItem).insertAfter(nextItem);
        }
    }

    this.pageUp = function (pageCode){
        let container = $("#" + thatContent2DList.containerId);
        let currentItem = $(container).find(".s3dContent2DListItem[pageCode='" + pageCode + "']");
        let prevItem = $(currentItem).prev(".s3dContent2DListItem");
        if(prevItem.length > 0){
            $(prevItem).insertAfter(currentItem);
        }
    }

    this.remarkAllPageIndex = function (){
        let container = $("#" + thatContent2DList.containerId);
        let pageItems = $(container).find(".s3dContent2DListItem");
        for(let i = 0; i < pageItems.length; i++){
            let pageItem = pageItems[i];
            let pageCode = $(pageItem).attr("pageCode");
            let pageInfo = thatContent2DList.manager.userContent2D.getPageInfo(pageCode);
            pageInfo.index = i;
        }
    }

    this.editPage = function (pageCode){
        thatContent2DList.showPageEditor(pageCode);
    }

    this.showPageEditor = function (pageCode) {
        thatContent2DList.manager.layout.showBlock("content2DEditor");
        if(pageCode !== thatContent2DList.manager.content2DEditor.editingPageCode) {
            thatContent2DList.manager.content2DEditor.showPage(pageCode);
        }
    }

    this.deletePage = function (pageCode){
        if(msgBox.confirm({info: "确定删除页面吗?"})){
            thatContent2DList.manager.layout.hideBlock("content2DEditor");
            thatContent2DList.manager.content2DEditor.clearPage();
            let pageInfo = thatContent2DList.manager.userContent2D.getPageInfo(pageCode);
            thatContent2DList.beginAddToUndoList(s3dContent2DEditType.delete, pageCode, pageInfo);
            thatContent2DList.manager.userContent2D.removePage(pageCode);
            thatContent2DList.endAddToUndoList(s3dContent2DEditType.delete, pageCode, null);
            thatContent2DList.removePageItem(pageCode);
            thatContent2DList.refreshNonePageItem();
        }
    }

    this.removePageItem = function (pageCode){
        let editContainer = $("#" + thatContent2DList.containerId).find(".s3dContent2DListPageListContainer");
        $(editContainer).find(".s3dContent2DListItem[pageCode='" + pageCode + "']").remove();
    }

    this.insertPageItem = function (newPageInfo){
        let pageListContainer = $("#" + thatContent2DList.containerId).find(".s3dContent2DListPageListContainer");
        let newPageItemHtml = thatContent2DList.getPageItemHtml(newPageInfo);
        $(pageListContainer).append(newPageItemHtml);

        thatContent2DList.refreshNonePageItem();

        let newPageItem = $(pageListContainer).find(".s3dContent2DListItem[pageCode='" + newPageInfo.code + "']");
        $(newPageItem).contextmenu(function(ev){
            if(ev.button === 2){
                ev.preventDefault();
                let pageCode = $(this).attr("pageCode");
                thatContent2DList.showMenu(pageCode, ev);
            }
        });

        //菜单
        $(newPageItem).find(".s3dContent2DListItemBtn").click(function(ev){
            ev.preventDefault();
            let pageCode = $(this).parent().attr("pageCode");
            thatContent2DList.showMenu(pageCode, ev);
            return false;
        });

        //菜单下拉按钮
        $(newPageItem).find(".s3dContent2DListItemBtn").contextmenu(function(ev){
            if(ev.button === 2){
                ev.preventDefault();
                let pageCode = $(this).parent().attr("pageCode");
                thatContent2DList.showMenu(pageCode, ev);
            }
        });

        $(newPageItem).click(function () {
            let pageCode = $(this).attr("pageCode");
            thatContent2DList.focusPage(pageCode);
            thatContent2DList.editPage(pageCode);
        });
    }

    this.addNewPage = function () {
        thatContent2DList.manager.localContent2DPicker.showPicker({
            paramInfo: {
                afterPickContent2D: thatContent2DList.afterPickContent2D
            }
        });
    }
    this.afterPickContent2D = function (p){
        if(p.moduleCode != null) {
            let newPageInfo = thatContent2DList.manager.userContent2D.getNewPageInfo("页面", p.themeCode, p.moduleCode);
            thatContent2DList.beginAddToUndoList(s3dContent2DEditType.add, newPageInfo.code, null);
            thatContent2DList.manager.userContent2D.addPage(newPageInfo);
            thatContent2DList.endAddToUndoList(s3dContent2DEditType.add, newPageInfo, newPageInfo);
            thatContent2DList.insertPageItem(newPageInfo);
            thatContent2DList.focusPage(newPageInfo.code);
            thatContent2DList.showPageInfo(newPageInfo.code);
        }
    }

    this.copyPage = function (sourcePageCode){
        let sourcePageInfo = thatContent2DList.manager.userContent2D.getPageInfo(sourcePageCode);
        let newPageInfo = thatContent2DList.manager.userContent2D.clonePageInfo(sourcePageInfo);
        thatContent2DList.beginAddToUndoList(s3dContent2DEditType.add, newPageInfo.code, null);
        thatContent2DList.manager.userContent2D.addPage(newPageInfo);
        thatContent2DList.endAddToUndoList(s3dContent2DEditType.add, newPageInfo, newPageInfo);
        thatContent2DList.insertPageItem(newPageInfo);
        thatContent2DList.showPageInfo(newPageInfo.code);
    }

    //开启添加到undo list
    this.beginAddToUndoList = function(editType, targetCode, pageInfo){
        let doOtherInfo = {
            editType: editType,
            targetCode: targetCode,
            pageInfo: pageInfo
        };
        thatContent2DList.manager.statusBar.beginAddToUndoList({
            operateType: s3dOperateType.content2D,
            otherInfo: doOtherInfo
        });
    }

    //结束添加到undo list
    this.endAddToUndoList = function(editType, targetCode, pageInfo) {
        let doOtherInfo = {
            editType: editType,
            targetCode: targetCode,
            pageInfo: pageInfo
        };
        thatContent2DList.manager.statusBar.endAddToUndoList({
            operateType: s3dOperateType.content2D,
            otherInfo: doOtherInfo
        });
    }
}

export default s3dContent2DList