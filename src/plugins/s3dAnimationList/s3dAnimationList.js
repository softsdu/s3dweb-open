import {
    cmnPcr,
    msgBox,
    s3dAnimationEditType,
    s3dElement3DType,
    s3dOperateType,
    s3dUiStatus
} from "../../commonjs/common/common.js"
import "./S3dAnimationList.css"

//S3dWeb动画设计
let S3dAnimationList = function (){
    //当前对象
    const thatAnimationList= this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;

    //事件
    this.eventFunctions = {};
    this.addEventFunction = function(eventName, func){
        let allFuncs = thatAnimationList.eventFunctions[eventName];
        if(allFuncs == null){
            allFuncs = [];
            thatAnimationList.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    }
    this.doEventFunction = function(eventName, p){
        let allFuncs = thatAnimationList.eventFunctions[eventName];
        if(allFuncs != null){
            for(let i = 0; i < allFuncs.length; i++){
                let func = allFuncs[i];
                func(p);
            }
        }
    }

    //初始化
    this.init = function(p){
        thatAnimationList.containerId = p.containerId;
        thatAnimationList.manager = p.manager;
        thatAnimationList.showAnimationList(p.config.title);
    }

    //获取动画列表
    this.getAnimationList = function (){
        return thatAnimationList.animationList;
    }

    //显示
    this.showAnimationList = function(){
        //构造html
        let html = thatAnimationList.getHtml();
        let container = $("#" + thatAnimationList.containerId);
        let animationListContainer = $(container).find(".s3dLayoutBlock[name='animationList']");
        $(animationListContainer).html(html);

        //toolbar
        let toolbarContainer = $(container).find(".s3dLayoutBlockToolbar[name='animationList']");
        let toolbarHtml = thatAnimationList.getToolbarHtml();
        $(toolbarContainer).html(toolbarHtml);


        thatAnimationList.refreshNoneAnimationItem();
        thatAnimationList.bindEvents();
    }

    //获取树toolbar html
    this.getToolbarHtml = function() {
        let html = ("<div class='s3dAnimationListToolbar'>"
            + "<div class='s3dAnimationListAnimationBtn s3dAnimationListAddAnimationBtn' title='添加动画'>&#x2795;</div>"
            + "</div>"
            + "</div>");
        return html;
    }

    this.bindEvents = function () {
        let container = $("#" + thatAnimationList.containerId);

        //菜单
        $(container).find(".s3dAnimationListItemBtn").click(function (ev) {
            ev.preventDefault();
            let animationCode = $(this).parent().attr("animationCode");
            thatAnimationList.showMenu(animationCode, ev);
            return false;
        });

        //编辑详情
        $(container).find(".s3dAnimationListItem").click(function () {
            let animationCode = $(this).attr("animationCode");
            thatAnimationList.focusAnimation(animationCode);
            thatAnimationList.editAnimation(animationCode);
        });

        //菜单下拉按钮
        $(container).find(".s3dAnimationListItemBtn").contextmenu(function (ev) {
            if (ev.button === 2) {
                ev.preventDefault();
                let animationCode = $(this).parent().attr("animationCode");
                thatAnimationList.showMenu(animationCode, ev);
            }
        });
        $(container).find(".s3dAnimationListItem").contextmenu(function (ev) {
            if (ev.button === 2) {
                ev.preventDefault();
                let animationCode = $(this).attr("animationCode");
                thatAnimationList.showMenu(animationCode, ev);
            }
        });

        $(container).find(".s3dAnimationListAddAnimationBtn").click(function () {
            thatAnimationList.addNewAnimation();
        });

        $(container).find(".s3dAnimationListNewItemAnimationBtn").click(function () {
            thatAnimationList.addNewAnimation();
        });
    }

    //获取list html
    this.getHtml = function(){
        let html = "";
        html += ("<div class='s3dAnimationListContainer'>");
        html += thatAnimationList.getAnimationListHtml(thatAnimationList.manager.userAnimations.animationList);
        html += thatAnimationList.getNoneAnimationItemHtml();
        html += "</div>";
        html += ("<div class='s3dAnimationListNewItem'><div class='s3dAnimationListNewItemAnimationBtn'><span class='s3dAnimationListNewItemAnimationImage'>➕</span>新增动画</div></div>");

        return html;
    }

    this.getAnimationListHtml = function (animationList){
        let html = "";
        if(animationList != null && animationList.length !== 0){
            let sortedList = thatAnimationList.getSortedList(animationList);
            for (let i = 0; i < sortedList.length; i++) {
                let animationInfo = sortedList[i];
                html += thatAnimationList.getAnimationItemHtml(animationInfo);
            }
        }
        return html;
    }

    this.refreshNoneAnimationItem = function (){
        let container = $("#" + thatAnimationList.containerId);
        let items = $(container).find(".s3dAnimationListItem");
        $(container).find(".s3dAnimationListNoneItem").css({display: (items.length > 0 ? "none" : "block")});
    }

    this.getAnimationItemHtml = function (animationInfo){
        let html = "";
        html += ("<div class='s3dAnimationListItem' animationCode='" + animationInfo.code + "'>");
        html += ("<div class='s3dAnimationListItemName'><span class='s3dAnimationListItemTitle'>" + cmnPcr.htmlEncode(animationInfo.name) + "</span></div>");
        html += ("<div class='s3dAnimationListItemBtn'>&#9477;</div>");
        html += ("</div>");
        return html;
    }

    this.getNoneAnimationItemHtml = function (){
        let html = "";
        html += ("<div class='s3dAnimationListNoneItem'>尚未定义动画</div>");
        return html;
    }

    this.focusAnimation = function (animationCode){
        let container = $("#" + thatAnimationList.containerId);
        $(container).find(".s3dAnimationListItem").removeClass("s3dAnimationListItemActive");
        $(container).find(".s3dAnimationListItem[animationCode='" + animationCode + "']").addClass("s3dAnimationListItemActive");
    }

    this.refreshAnimation = function (animationCode){
        let animationInfo = thatAnimationList.manager.userAnimations.getAnimationInfo(animationCode);
        thatAnimationList.updateAnimationItem(animationInfo);
    }

    this.showMenu = function(animationCode, ev) {
        thatAnimationList.focusAnimation(animationCode);

        thatAnimationList.showAnimationMenu();

        //基本信息
        let container = $("#" + thatAnimationList.containerId);
        let menuContainer = $(container).find(".s3dAnimationListMenuContainer");
        $(menuContainer).attr("animationCode", animationCode);

        //初始化event
        $(container).find(".s3dAnimationListMenuOuterContainer").focus();
        $(container).find(".s3dAnimationListMenuBackground").mousedown(function (){
            thatAnimationList.closeMenu();
        });
        $(container).find(".s3dAnimationListMenuOuterContainer").keydown(function (ev){
            switch(ev.keyCode){
                case 27:{
                    thatAnimationList.closeMenu();
                    break;
                }
            }
        });
        $(container).find(".s3dAnimationListMenuBackground").click(function (){
            thatAnimationList.closeMenu();
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
        let container = $("#" + thatAnimationList.containerId);
        $(container).find(".s3dAnimationListMenuOuterContainer").remove();
    }

    this.showAnimationMenu = function (){
        let html = "<div class='s3dAnimationListMenuOuterContainer'>";
        html += ("<div class='s3dAnimationListMenuBackground'></div>");
        html += ("<div class='s3dAnimationListMenuContainer'>");
        html += ("<div class='s3dAnimationListMenuItem' name='editAnimationBtn' title='编辑动画'>编辑</div>");
        html += ("<div class='s3dAnimationListMenuItem' name='copyAnimationBtn' title='复制动画'>复制</div>");
        html += ("<div class='s3dAnimationListMenuItem' name='deleteAnimationBtn' title='删除动画'>删除</div>");
        html += ("</div>");
        html += ("</div>");
        let container = $("#" + thatAnimationList.containerId);
        $(container).append(html);

        //编辑详情
        $(container).find(".s3dAnimationListMenuItem[name='editAnimationBtn']").click(function(){
            thatAnimationList.closeMenu();
            let animationCode = $(this).parent().attr("animationCode");
            thatAnimationList.editAnimation(animationCode);
        });

        //复制材质
        $(container).find(".s3dAnimationListMenuItem[name='copyAnimationBtn']").click(function(){
            thatAnimationList.closeMenu();
            let animationCode = $(this).parent().attr("animationCode");
            thatAnimationList.copyAnimation(animationCode);
        });

        //删除材质
        $(container).find(".s3dAnimationListMenuItem[name='deleteAnimationBtn']").click(function(){
            thatAnimationList.closeMenu();
            let animationCode = $(this).parent().attr("animationCode");
            thatAnimationList.deleteAnimation(animationCode);
        });
    }

    this.showAnimationInfo = function (animationCode){
        thatAnimationList.showAnimationEditor(animationCode);
    }

    this.editAnimation = function (animationCode){
        thatAnimationList.showAnimationEditor(animationCode);
    }

    this.showAnimationEditor = function (animationCode) {
        thatAnimationList.manager.layout.showBlock("animationEditor");
        if(animationCode !==  thatAnimationList.manager.animationEditor.editingAnimationCode) {
            thatAnimationList.manager.animationEditor.showAnimation(animationCode);
        }
    }

    this.deleteAnimation = function (animationCode){
        if(msgBox.confirm({info: "确定删除动画吗?"})){
            thatAnimationList.manager.layout.hideBlock("animationEditor");
            thatAnimationList.manager.animationEditor.clearAnimation();
            let animationInfo = thatAnimationList.manager.userAnimations.getAnimationInfo(animationCode);
            thatAnimationList.beginAddToUndoList(s3dAnimationEditType.delete, animationCode, animationInfo);
            thatAnimationList.manager.userAnimations.removeAnimation(animationCode);
            thatAnimationList.endAddToUndoList(s3dAnimationEditType.delete, animationCode, null);
            thatAnimationList.removeAnimationItem(animationCode);
            thatAnimationList.refreshNoneAnimationItem();
        }
    }

    this.removeAnimationItem = function (animationCode){
        let editContainer = $("#" + thatAnimationList.containerId).find(".s3dAnimationListContainer");
        $(editContainer).find(".s3dAnimationListItem[animationCode='" + animationCode + "']").remove();
    }

    this.updateAnimationItem = function (animationInfo){
        let editContainer = $("#" + thatAnimationList.containerId).find(".s3dAnimationListContainer");
        $(editContainer).find(".s3dAnimationListItem[animationCode='" + animationInfo.code + "'] .s3dAnimationListItemTitle").text(animationInfo.name);
    }

    this.insertAnimationItem = function (newAnimationInfo){
        let animationListContainer = $("#" + thatAnimationList.containerId).find(".s3dAnimationListContainer");
        let animationItems = $(animationListContainer).find(".s3dAnimationListItem");
        let newAnimationItemHtml = thatAnimationList.getAnimationItemHtml(newAnimationInfo);
        let added = false;
        for(let i = 0; i < animationItems.length; i++){
            let animationItem = animationItems[i];
            let matCode = $(animationItem).attr("animationCode");
            let matInfo = thatAnimationList.manager.userAnimations.getAnimationInfo(matCode);
            if(!added && matInfo.name.localeCompare(newAnimationInfo.name) > 0){
                $(animationItem).before(newAnimationItemHtml);
                added = true;
            }
        }
        if(!added){
            $(animationListContainer).find(".s3dAnimationListNoneItem").before(newAnimationItemHtml);
        }

        thatAnimationList.refreshNoneAnimationItem();

        let newAnimationItem = $(animationListContainer).find(".s3dAnimationListItem[animationCode='" + newAnimationInfo.code + "']");
        $(newAnimationItem).contextmenu(function(ev){
            if(ev.button === 2){
                ev.preventDefault();
                let animationCode = $(this).attr("animationCode");
                thatAnimationList.showMenu(animationCode, ev);
            }
        });

        //菜单
        $(newAnimationItem).find(".s3dAnimationListItemBtn").click(function(ev){
            ev.preventDefault();
            let animationCode = $(this).parent().attr("animationCode");
            thatAnimationList.showMenu(animationCode, ev);
            return false;
        });

        //菜单下拉按钮
        $(newAnimationItem).find(".s3dAnimationListItemBtn").contextmenu(function(ev){
            if(ev.button === 2){
                ev.preventDefault();
                let animationCode = $(this).parent().attr("animationCode");
                thatAnimationList.showMenu(animationCode, ev);
            }
        });

        $(newAnimationItem).click(function () {
            let animationCode = $(this).attr("animationCode");
            thatAnimationList.focusAnimation(animationCode);
            thatAnimationList.editAnimation(animationCode);
        });
    }

    this.addNewAnimation = function (){
        let newAnimationInfo = thatAnimationList.manager.userAnimations.getNewAnimationInfo("动画");
        thatAnimationList.beginAddToUndoList(s3dAnimationEditType.add, newAnimationInfo.code, null);
        thatAnimationList.manager.userAnimations.addAnimation(newAnimationInfo);
        thatAnimationList.endAddToUndoList(s3dAnimationEditType.add, newAnimationInfo, newAnimationInfo);
        thatAnimationList.insertAnimationItem(newAnimationInfo);
        thatAnimationList.focusAnimation(newAnimationInfo.code);
        thatAnimationList.showAnimationInfo(newAnimationInfo.code);
    }

    this.copyAnimation = function (sourceAnimationCode){
        let sourceAnimationInfo = thatAnimationList.manager.userAnimations.getAnimationInfo(sourceAnimationCode);
        let newAnimationInfo = thatAnimationList.manager.userAnimations.cloneAnimationInfo(sourceAnimationInfo);
        thatAnimationList.beginAddToUndoList(s3dAnimationEditType.add, newAnimationInfo.code, null);
        thatAnimationList.manager.userAnimations.addAnimation(newAnimationInfo);
        thatAnimationList.endAddToUndoList(s3dAnimationEditType.add, newAnimationInfo, newAnimationInfo);
        thatAnimationList.insertAnimationItem(newAnimationInfo);
        thatAnimationList.showAnimationInfo(newAnimationInfo.code);
    }

    //开启添加到undo list
    this.beginAddToUndoList = function(editType, targetCode, animationInfo){
        let doOtherInfo = {
            editType: editType,
            targetCode: targetCode,
            animationInfo: animationInfo
        };
        thatAnimationList.manager.statusBar.beginAddToUndoList({
            operateType: s3dOperateType.animation,
            otherInfo: doOtherInfo
        });
    }

    //结束添加到undo list
    this.endAddToUndoList = function(editType, targetCode, animationInfo) {
        let doOtherInfo = {
            editType: editType,
            targetCode: targetCode,
            animationInfo: animationInfo
        };
        thatAnimationList.manager.statusBar.endAddToUndoList({
            operateType: s3dOperateType.animation,
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

export default S3dAnimationList