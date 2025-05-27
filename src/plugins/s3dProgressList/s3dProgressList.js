import {
    cmnPcr,
    msgBox,
    s3dProgressEditType,
    s3dElement3DType,
    s3dOperateType,
    s3dUiStatus
} from "../../commonjs/common/common.js"
import "./s3dProgressList.css"

//流程设计
let S3dProgressList = function (){
    //当前对象
    const thatProgressList= this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;

    //事件
    this.eventFunctions = {};
    this.addEventFunction = function(eventName, func){
        let allFuncs = thatProgressList.eventFunctions[eventName];
        if(allFuncs == null){
            allFuncs = [];
            thatProgressList.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    }
    this.doEventFunction = function(eventName, p){
        let allFuncs = thatProgressList.eventFunctions[eventName];
        if(allFuncs != null){
            for(let i = 0; i < allFuncs.length; i++){
                let func = allFuncs[i];
                func(p);
            }
        }
    }

    //初始化
    this.init = function(p){
        thatProgressList.containerId = p.containerId;
        thatProgressList.manager = p.manager;
        thatProgressList.showProgressList(p.config.title);
    }

    //获取流程列表
    this.getProgressList = function (){
        return thatProgressList.progressList;
    }

    //显示
    this.showProgressList = function(){
        //构造html
        let html = thatProgressList.getHtml();
        let container = $("#" + thatProgressList.containerId);
        let progressListContainer = $(container).find(".s3dLayoutBlock[name='progressList']");
        $(progressListContainer).html(html);

        //toolbar
        let toolbarContainer = $(container).find(".s3dLayoutBlockToolbar[name='progressList']");
        let toolbarHtml = thatProgressList.getToolbarHtml();
        $(toolbarContainer).html(toolbarHtml);


        thatProgressList.refreshNoneProgressItem();
        thatProgressList.bindEvents();
    }

    //获取树toolbar html
    this.getToolbarHtml = function() {
        let html = ("<div class='s3dProgressListToolbar'>"
            + "<div class='s3dProgressListProgressBtn s3dProgressListAddProgressBtn' title='添加流程'>&#x2795;</div>"
            + "</div>"
            + "</div>");
        return html;
    }

    this.bindEvents = function () {
        let container = $("#" + thatProgressList.containerId);

        //菜单
        $(container).find(".s3dProgressListItemBtn").click(function (ev) {
            ev.preventDefault();
            let progressCode = $(this).parent().attr("progressCode");
            thatProgressList.showMenu(progressCode, ev);
            return false;
        });

        //编辑详情
        $(container).find(".s3dProgressListItem").click(function () {
            let progressCode = $(this).attr("progressCode");
            thatProgressList.focusProgress(progressCode);
            thatProgressList.editProgress(progressCode);
        });

        //菜单下拉按钮
        $(container).find(".s3dProgressListItemBtn").contextmenu(function (ev) {
            if (ev.button === 2) {
                ev.preventDefault();
                let progressCode = $(this).parent().attr("progressCode");
                thatProgressList.showMenu(progressCode, ev);
            }
        });
        $(container).find(".s3dProgressListItem").contextmenu(function (ev) {
            if (ev.button === 2) {
                ev.preventDefault();
                let progressCode = $(this).attr("progressCode");
                thatProgressList.showMenu(progressCode, ev);
            }
        });

        $(container).find(".s3dProgressListAddProgressBtn").click(function () {
            thatProgressList.addNewProgress();
        });

        $(container).find(".s3dProgressListNewItemProgressBtn").click(function () {
            thatProgressList.addNewProgress();
        });
    }

    //获取list html
    this.getHtml = function(){
        let html = "";
        html += ("<div class='s3dProgressListContainer'>");
        html += thatProgressList.getProgressListHtml(thatProgressList.manager.userProgresses.progressList);
        html += thatProgressList.getNoneProgressItemHtml();
        html += "</div>";
        html += ("<div class='s3dProgressListNewItem'><div class='s3dProgressListNewItemProgressBtn'><span class='s3dProgressListNewItemProgressImage'>➕</span>新增流程</div></div>");
        return html;
    }

    this.getProgressListHtml = function (progressList){
        let html = "";
        if(progressList != null && progressList.length !== 0){
            let sortedList = thatProgressList.getSortedList(progressList);
            for (let i = 0; i < sortedList.length; i++) {
                let progressInfo = sortedList[i];
                html += thatProgressList.getProgressItemHtml(progressInfo);
            }
        }
        return html;
    }

    this.refreshNoneProgressItem = function (){
        let container = $("#" + thatProgressList.containerId);
        let items = $(container).find(".s3dProgressListItem");
        $(container).find(".s3dProgressListNoneItem").css({display: (items.length > 0 ? "none" : "block")});
    }

    this.getProgressItemHtml = function (progressInfo){
        let html = "";
        html += ("<div class='s3dProgressListItem' progressCode='" + progressInfo.code + "'>");
        html += ("<div class='s3dProgressListItemName'><span class='s3dProgressListItemTitle'>" + cmnPcr.htmlEncode(progressInfo.name) + "</span></div>");
        html += ("<div class='s3dProgressListItemBtn'>&#9477;</div>");
        html += ("</div>");
        return html;
    }

    this.getNoneProgressItemHtml = function (){
        let html = "";
        html += ("<div class='s3dProgressListNoneItem'>尚未定义流程</div>");
        return html;
    }

    this.focusProgress = function (progressCode){
        let container = $("#" + thatProgressList.containerId);
        $(container).find(".s3dProgressListItem").removeClass("s3dProgressListItemActive");
        $(container).find(".s3dProgressListItem[progressCode='" + progressCode + "']").addClass("s3dProgressListItemActive");
    }

    this.refreshProgress = function (progressCode){
        let progressInfo = thatProgressList.manager.userProgresses.getProgressInfo(progressCode);
        thatProgressList.updateProgressItem(progressInfo);
    }

    this.updateProgressItem = function (progressInfo){
        let editContainer = $("#" + thatProgressList.containerId).find(".s3dProgressListContainer");
        $(editContainer).find(".s3dProgressListItem[progressCode='" + progressInfo.code + "'] .s3dProgressListItemTitle").text(progressInfo.name);
    }

    this.showMenu = function(progressCode, ev) {
        thatProgressList.focusProgress(progressCode);

        thatProgressList.showProgressMenu();

        //基本信息
        let container = $("#" + thatProgressList.containerId);
        let menuContainer = $(container).find(".s3dProgressListMenuContainer");
        $(menuContainer).attr("progressCode", progressCode);

        //初始化event
        $(container).find(".s3dProgressListMenuOuterContainer").focus();
        $(container).find(".s3dProgressListMenuBackground").mousedown(function (){
            thatProgressList.closeMenu();
        });
        $(container).find(".s3dProgressListMenuOuterContainer").keydown(function (ev){
            switch(ev.keyCode){
                case 27:{
                    thatProgressList.closeMenu();
                    break;
                }
            }
        });
        $(container).find(".s3dProgressListMenuBackground").click(function (){
            thatProgressList.closeMenu();
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
        let container = $("#" + thatProgressList.containerId);
        $(container).find(".s3dProgressListMenuOuterContainer").remove();
    }

    this.showProgressMenu = function (){
        let html = "<div class='s3dProgressListMenuOuterContainer'>";
        html += ("<div class='s3dProgressListMenuBackground'></div>");
        html += ("<div class='s3dProgressListMenuContainer'>");
        html += ("<div class='s3dProgressListMenuItem' name='editProgressBtn' title='编辑流程'>编辑</div>");
        html += ("<div class='s3dProgressListMenuItem' name='copyProgressBtn' title='复制流程'>复制</div>");
        html += ("<div class='s3dProgressListMenuItem' name='deleteProgressBtn' title='删除流程'>删除</div>");
        html += ("</div>");
        html += ("</div>");
        let container = $("#" + thatProgressList.containerId);
        $(container).append(html);

        //编辑详情
        $(container).find(".s3dProgressListMenuItem[name='editProgressBtn']").click(function(){
            thatProgressList.closeMenu();
            let progressCode = $(this).parent().attr("progressCode");
            thatProgressList.editProgress(progressCode);
        });

        //复制材质
        $(container).find(".s3dProgressListMenuItem[name='copyProgressBtn']").click(function(){
            thatProgressList.closeMenu();
            let progressCode = $(this).parent().attr("progressCode");
            thatProgressList.copyProgress(progressCode);
        });

        //删除材质
        $(container).find(".s3dProgressListMenuItem[name='deleteProgressBtn']").click(function(){
            thatProgressList.closeMenu();
            let progressCode = $(this).parent().attr("progressCode");
            thatProgressList.deleteProgress(progressCode);
        });
    }

    this.showProgressInfo = function (progressCode){
        thatProgressList.showProgressEditor(progressCode);
    }

    this.editProgress = function (progressCode){
        thatProgressList.showProgressEditor(progressCode);
    }

    this.showProgressEditor = function (progressCode) {
        thatProgressList.manager.layout.showBlock("progressEditor");
        if(progressCode !== thatProgressList.manager.progressEditor.editingProgressCode) {
            thatProgressList.manager.progressEditor.showProgress(progressCode);
        }
    }

    this.deleteProgress = function (progressCode){
        if(msgBox.confirm({info: "确定删除流程吗?"})){
            thatProgressList.manager.layout.hideBlock("progressEditor");
            thatProgressList.manager.progressEditor.clearProgress();
            let progressInfo = thatProgressList.manager.userProgresses.getProgressInfo(progressCode);
            thatProgressList.beginAddToUndoList(s3dProgressEditType.delete, progressCode, progressInfo);
            thatProgressList.manager.userProgresses.removeProgress(progressCode);
            thatProgressList.endAddToUndoList(s3dProgressEditType.delete, progressCode, null);
            thatProgressList.removeProgressItem(progressCode);
            thatProgressList.refreshNoneProgressItem();
        }
    }

    this.removeProgressItem = function (progressCode){
        let editContainer = $("#" + thatProgressList.containerId).find(".s3dProgressListContainer");
        $(editContainer).find(".s3dProgressListItem[progressCode='" + progressCode + "']").remove();
    }

    this.insertProgressItem = function (newProgressInfo){
        let progressListContainer = $("#" + thatProgressList.containerId).find(".s3dProgressListContainer");
        let progressItems = $(progressListContainer).find(".s3dProgressListItem");
        let newProgressItemHtml = thatProgressList.getProgressItemHtml(newProgressInfo);
        let added = false;
        for(let i = 0; i < progressItems.length; i++){
            let progressItem = progressItems[i];
            let matCode = $(progressItem).attr("progressCode");
            let matInfo = thatProgressList.manager.userProgresses.getProgressInfo(matCode);
            if(!added && matInfo.name.localeCompare(newProgressInfo.name) > 0){
                $(progressItem).before(newProgressItemHtml);
                added = true;
            }
        }
        if(!added){
            $(progressListContainer).find(".s3dProgressListNoneItem").before(newProgressItemHtml);
        }

        thatProgressList.refreshNoneProgressItem();

        let newProgressItem = $(progressListContainer).find(".s3dProgressListItem[progressCode='" + newProgressInfo.code + "']");
        $(newProgressItem).contextmenu(function(ev){
            if(ev.button === 2){
                ev.preventDefault();
                let progressCode = $(this).attr("progressCode");
                thatProgressList.showMenu(progressCode, ev);
            }
        });

        //菜单
        $(newProgressItem).find(".s3dProgressListItemBtn").click(function(ev){
            ev.preventDefault();
            let progressCode = $(this).parent().attr("progressCode");
            thatProgressList.showMenu(progressCode, ev);
            return false;
        });

        //菜单下拉按钮
        $(newProgressItem).find(".s3dProgressListItemBtn").contextmenu(function(ev){
            if(ev.button === 2){
                ev.preventDefault();
                let progressCode = $(this).parent().attr("progressCode");
                thatProgressList.showMenu(progressCode, ev);
            }
        });

        $(newProgressItem).click(function () {
            let progressCode = $(this).attr("progressCode");
            thatProgressList.focusProgress(progressCode);
            thatProgressList.editProgress(progressCode);
        });
    }

    this.addNewProgress = function (){
        let newProgressInfo = thatProgressList.manager.userProgresses.getNewProgressInfo("流程");
        thatProgressList.beginAddToUndoList(s3dProgressEditType.add, newProgressInfo.code, null);
        thatProgressList.manager.userProgresses.addProgress(newProgressInfo);
        thatProgressList.endAddToUndoList(s3dProgressEditType.add, newProgressInfo, newProgressInfo);
        thatProgressList.insertProgressItem(newProgressInfo);
        thatProgressList.focusProgress(newProgressInfo.code);
        thatProgressList.showProgressInfo(newProgressInfo.code);
    }

    this.copyProgress = function (sourceProgressCode){
        let sourceProgressInfo = thatProgressList.manager.userProgresses.getProgressInfo(sourceProgressCode);
        let newProgressInfo = thatProgressList.manager.userProgresses.cloneProgressInfo(sourceProgressInfo);
        thatProgressList.beginAddToUndoList(s3dProgressEditType.add, newProgressInfo.code, null);
        thatProgressList.manager.userProgresses.addProgress(newProgressInfo);
        thatProgressList.endAddToUndoList(s3dProgressEditType.add, newProgressInfo, newProgressInfo);
        thatProgressList.insertProgressItem(newProgressInfo);
        thatProgressList.showProgressInfo(newProgressInfo.code);
    }

    //开启添加到undo list
    this.beginAddToUndoList = function(editType, targetCode, progressInfo){
        let doOtherInfo = {
            editType: editType,
            targetCode: targetCode,
            progressInfo: progressInfo
        };
        thatProgressList.manager.statusBar.beginAddToUndoList({
            operateType: s3dOperateType.progress,
            otherInfo: doOtherInfo
        });
    }

    //结束添加到undo list
    this.endAddToUndoList = function(editType, targetCode, progressInfo) {
        let doOtherInfo = {
            editType: editType,
            targetCode: targetCode,
            progressInfo: progressInfo
        };
        thatProgressList.manager.statusBar.endAddToUndoList({
            operateType: s3dOperateType.progress,
            otherInfo: doOtherInfo
        });
    }

    this.getSortedList = function (sourceList){
        let newList = [];
        for(let i = 0; i < sourceList.length; i++){
            let sourceItem = sourceList[i];
            let added = false;
            let tempList = [];
            for(let j = 0; j < newList.length; j++){
                let newItem = newList[j];
                if(!added && newItem.name.localeCompare(sourceItem.name) > 0){
                    tempList.push(sourceItem);
                    added = true;
                }
                tempList.push(newItem);
            }
            if(!added) {
                tempList.push(sourceItem);
            }
            newList = tempList;
        }
        return newList;
    }
}

export default S3dProgressList