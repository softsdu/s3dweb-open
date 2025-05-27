import {
    cmnPcr,
    msgBox,
    s3dAnimationEditType,
    s3dElement3DType,
    s3dOperateType,
    s3dUiStatus
} from "../../commonjs/common/common.js"
import "./S3dAnimationPlayer.css"
import * as THREE from "three";

//S3dWeb动画播放
let S3dAnimationPlayer = function (){
    //当前对象
    const thatAnimationPlayer= this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;

    //事件
    this.eventFunctions = {};
    this.addEventFunction = function(eventName, func){
        let allFuncs = thatAnimationPlayer.eventFunctions[eventName];
        if(allFuncs == null){
            allFuncs = [];
            thatAnimationPlayer.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    }
    this.doEventFunction = function(eventName, p){
        let allFuncs = thatAnimationPlayer.eventFunctions[eventName];
        if(allFuncs != null){
            for(let i = 0; i < allFuncs.length; i++){
                let func = allFuncs[i];
                func(p);
            }
        }
    }

    //初始化
    this.init = function(p){
        thatAnimationPlayer.containerId = p.containerId;
        thatAnimationPlayer.manager = p.manager;
        thatAnimationPlayer.showAnimationList(p.config.title);
    }

    //获取动画列表
    this.getAnimationList = function (){
        return thatAnimationPlayer.animationList;
    }

    //显示
    this.showAnimationList = function(){
        //构造html
        let html = thatAnimationPlayer.getHtml();
        let container = $("#" + thatAnimationPlayer.containerId);
        let animationListContainer = $(container).find(".s3dLayoutBlock[name='animationPlayer']");
        $(animationListContainer).html(html);

        thatAnimationPlayer.refreshNoneAnimationItem();
        thatAnimationPlayer.bindEvents();
    }

    this.refreshNoneAnimationItem = function (){
        let container = $("#" + thatAnimationPlayer.containerId);
        let items = $(container).find(".s3dAnimationPlayerItem");
        $(container).find(".s3dAnimationPlayerNoneItem").css({display: (items.length > 0 ? "none" : "block")});
    }
    
    this.bindEvents = function () {
        let container = $("#" + thatAnimationPlayer.containerId);

        //编辑详情
        $(container).find(".s3dAnimationPlayerItem").click(function () {
            let animationCode = $(this).attr("animationCode");
            thatAnimationPlayer.focusAnimation(animationCode);
        });

        $(container).find(".s3dAnimationPlayerItemBtnPlay").click(function () {
            let animationItem = $(this).parent();
            let animationCode = $(animationItem).attr("animationCode");
            thatAnimationPlayer.stopAnimation();
            setTimeout(function (){
                thatAnimationPlayer.playAnimation(animationCode);
            }, 200);
        });

        $(container).find(".s3dAnimationPlayerItemBtnStop").click(function () {
            thatAnimationPlayer.stopAnimation();
        });
    }

    this.playAnimation = function (animationCode, loop){

        let animations = [
            {
                code: animationCode,
                loop: loop
            }
        ];
        thatAnimationPlayer.manager.userAnimations.playAnimations(animations);

        let playContainer = $("#" + thatAnimationPlayer.containerId).find(".s3dAnimationPlayerContainer");
        let animationItem = $(playContainer).find(".s3dAnimationPlayerItem[animationCode='" + animationCode + "']");
        $(animationItem).addClass("s3dAnimationPlayerItemRunning");
        thatAnimationPlayer.refreshAnimationStatus();
    }

    this.stopAnimation = function (){
        thatAnimationPlayer.manager.viewer.stopAnimations();
        thatAnimationPlayer.afterStopAnimation();
    }

    this.refreshAnimationStatus = function () {
        setTimeout(function () {
            let clock = thatAnimationPlayer.manager.viewer.runAnimationInfo.clock;
            if(!clock || thatAnimationPlayer.manager.viewer.runAnimationInfo.finished){
                thatAnimationPlayer.afterStopAnimation();
            }
            else{
                thatAnimationPlayer.refreshAnimationStatus();
            }
        }, 100);
    }

    this.afterStopAnimation = function (){
        let playContainer = $("#" + thatAnimationPlayer.containerId).find(".s3dAnimationPlayerContainer");
        let playerItem = $(playContainer).find(".s3dAnimationPlayerItemRunning");
        $(playerItem).removeClass("s3dAnimationPlayerItemRunning");
        thatAnimationPlayer.manager.viewer.restoreAllObjectOriginalState();
        thatAnimationPlayer.manager.viewer.removeAllTempObjects();
    }

    //获取list html
    this.getHtml = function(){
        let html = "";
        html += ("<div class='s3dAnimationPlayerContainer'>");
        html += ("<div class='s3dAnimationPlayerHeaderContainer'>");
        html += ("<div class='s3dAnimationPlayerHeader'>");
        html += ("<div class='s3dAnimationPlayerListTitle'>动画列表</div>");
        html += ("</div>");
        html += ("</div>");
        html += ("<div class='s3dAnimationPlayerListContainer'></div>");
        html += thatAnimationPlayer.getAnimationListHtml(thatAnimationPlayer.manager.userAnimations.animationList);
        html += thatAnimationPlayer.getNoneAnimationItemHtml();
        html += ("</div>");
        html += "</div>";
        return html;
    }

    this.getAnimationListHtml = function (animationList){
        let html = "";
        if(animationList != null && animationList.length !== 0){
            let sortedList = thatAnimationPlayer.getSortedList(animationList);
            for (let i = 0; i < sortedList.length; i++) {
                let animationInfo = sortedList[i];
                html += thatAnimationPlayer.getAnimationItemHtml(i, animationInfo);
            }
        }
        return html;
    }

    this.getAnimationItemHtml = function (index, animationInfo){
        let indexStr = cmnPcr.arabicToChinese(index + 1);
        let html = "";
        html += ("<div class='s3dAnimationPlayerItem' animationCode='" + animationInfo.code + "'>");
        html += ("<div class='s3dAnimationPlayerItemName'>");
        html += ("<span class='s3dAnimationPlayerItemIndex'>" + indexStr + ".</span>");
        html += ("<span class='s3dAnimationPlayerItemTitle'>" + cmnPcr.htmlEncode(animationInfo.name) + "</span>");
        html += ("</div>");
        html += ("<div class='s3dAnimationPlayerItemBtn s3dAnimationPlayerItemBtnPlay'>&#x25B6;</div>");
        html += ("<div class='s3dAnimationPlayerItemBtn s3dAnimationPlayerItemBtnStop'>&#x25FC;</div>");
        html += ("</div>");
        return html;
    }

    this.getNoneAnimationItemHtml = function (){
        let html = "";
        html += ("<div class='s3dAnimationPlayerNoneItem'>尚未定义动画</div>");
        return html;
    }

    this.focusAnimation = function (animationCode){
        let container = $("#" + thatAnimationPlayer.containerId);
        let activeAnimationItem = $(container).find(".s3dAnimationPlayerItemActive");
        let activeAnimationCode = (activeAnimationItem).attr("animationCode");
        if(activeAnimationCode !== animationCode){
            thatAnimationPlayer.manager.viewer.restoreAllObjectOriginalState();
            thatAnimationPlayer.manager.viewer.removeAllTempObjects();
            $(container).find(".s3dAnimationPlayerItem").removeClass("s3dAnimationPlayerItemActive");
            $(container).find(".s3dAnimationPlayerItem[animationCode='" + animationCode + "']").addClass("s3dAnimationPlayerItemActive");
        }
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

    this.restoreAllObjectOriginalStatus = function (animationCode){
        let animationInfo = thatAnimationPlayer.manager.userAnimations.getAnimationInfo(animationCode);
        for(let i = 0; i < animationInfo.groups.length; i++) {
            let group = animationInfo.groups[i];
            let objectId = group.objectId;
            let groupName = group.name;
            let groupType = group.type;
            let groupFrameValue = animationInfo.originalValueMap[objectId].propertyMap[groupName];
            thatAnimationPlayer.manager.userAnimations.refreshViewerObject(objectId, groupName, groupType, groupFrameValue);
        }
    }
}

export default S3dAnimationPlayer