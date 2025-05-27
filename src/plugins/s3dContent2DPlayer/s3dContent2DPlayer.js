import {
    cmnPcr,
    msgBox,
    s3dAnimationEditType,
    s3dElement3DType,
    s3dOperateType,
    s3dUiStatus
} from "../../commonjs/common/common.js"
import "./S3dContent2DPlayer.css"
import * as THREE from "three";

//S3dWeb 二维页面内容显示
let S3dContent2DPlayer = function (){
    //当前对象
    const thatContent2DPlayer= this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;

    //事件
    this.eventFunctions = {};
    this.addEventFunction = function(eventName, func){
        let allFuncs = thatContent2DPlayer.eventFunctions[eventName];
        if(allFuncs == null){
            allFuncs = [];
            thatContent2DPlayer.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    }
    this.doEventFunction = function(eventName, p){
        let allFuncs = thatContent2DPlayer.eventFunctions[eventName];
        if(allFuncs != null){
            for(let i = 0; i < allFuncs.length; i++){
                let func = allFuncs[i];
                func(p);
            }
        }
    }

    //初始化
    this.init = function(p){
        thatContent2DPlayer.containerId = p.containerId;
        thatContent2DPlayer.manager = p.manager;
        thatContent2DPlayer.showAnimationList(p.config.title);
    }

    //获取动画列表
    this.getAnimationList = function (){
        return thatContent2DPlayer.animationList;
    }

    //显示
    this.showAnimationList = function(){
        //构造html
        let html = thatContent2DPlayer.getHtml();
        let container = $("#" + thatContent2DPlayer.containerId);
        let animationListContainer = $(container).find(".s3dLayoutBlock[name='animationPlayer']");
        $(animationListContainer).html(html);

        thatContent2DPlayer.refreshNoneAnimationItem();
        thatContent2DPlayer.bindEvents();
    }

    this.refreshNoneAnimationItem = function (){
        let container = $("#" + thatContent2DPlayer.containerId);
        let items = $(container).find(".s3dAnimationPlayerItem");
        $(container).find(".s3dAnimationPlayerNoneItem").css({display: (items.length > 0 ? "none" : "block")});
    }
    
    this.bindEvents = function () {
        let container = $("#" + thatContent2DPlayer.containerId);

        //编辑详情
        $(container).find(".s3dAnimationPlayerItem").click(function () {
            let animationCode = $(this).attr("animationCode");
            thatContent2DPlayer.focusAnimation(animationCode);
        });

        $(container).find(".s3dAnimationPlayerItemBtnPlay").click(function () {
            let animationItem = $(this).parent();
            let animationCode = $(animationItem).attr("animationCode");
            thatContent2DPlayer.stopAnimation();
            setTimeout(function (){
                thatContent2DPlayer.playAnimation(animationCode);
            }, 200);
        });

        $(container).find(".s3dAnimationPlayerItemBtnStop").click(function () {
            thatContent2DPlayer.stopAnimation();
        });
    }

    this.playAnimation = function (animationCode, loop){
        let animationInfo = thatContent2DPlayer.manager.userAnimations.getAnimationInfo(animationCode);
        let runJson = thatContent2DPlayer.manager.userAnimations.animationInfoToRunJson(animationInfo, animationInfo.originalValueMap);
        let animationClipMap = thatContent2DPlayer.manager.userAnimations.generateAnimationClipMap(runJson);

        let mixerActions = [];
        for(let objectId in animationClipMap) {
            let object3d = thatContent2DPlayer.manager.viewer.getObject3DById(objectId);
            let animation = animationClipMap[objectId];
            let mixer = new THREE.AnimationMixer(object3d);
            let animationAction = mixer.clipAction(animation);
            animationAction.timeScale = 1;
            animationAction.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
            animationAction.clampWhenFinished = true;

            mixerActions.push({
                mixer: mixer,
                action: animationAction
            });
        }
        thatContent2DPlayer.manager.viewer.playAnimations(mixerActions, animationInfo);

        let playContainer = $("#" + thatContent2DPlayer.containerId).find(".s3dAnimationPlayerContainer");
        let animationItem = $(playContainer).find(".s3dAnimationPlayerItem[animationCode='" + animationCode + "']");
        $(animationItem).addClass("s3dAnimationPlayerItemRunning");
        thatContent2DPlayer.refreshAnimationStatus();
    }

    this.stopAnimation = function (){
        thatContent2DPlayer.manager.viewer.stopAnimations();
        thatContent2DPlayer.afterStopAnimation();
    }

    this.refreshAnimationStatus = function () {
        setTimeout(function () {
            let clock = thatContent2DPlayer.manager.viewer.runAnimationInfo.clock;
            if(!clock || thatContent2DPlayer.manager.viewer.runAnimationInfo.finished){
                thatContent2DPlayer.afterStopAnimation();
            }
            else{
                thatContent2DPlayer.refreshAnimationStatus();
            }
        }, 100);
    }

    this.afterStopAnimation = function (){
        let playContainer = $("#" + thatContent2DPlayer.containerId).find(".s3dAnimationPlayerContainer");
        let playerItem = $(playContainer).find(".s3dAnimationPlayerItemRunning");
        $(playerItem).removeClass("s3dAnimationPlayerItemRunning");
        thatContent2DPlayer.manager.viewer.restoreAllObjectOriginalState();
        thatContent2DPlayer.manager.viewer.removeAllTempObjects();
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
        html += thatContent2DPlayer.getAnimationListHtml(thatContent2DPlayer.manager.userAnimations.animationList);
        html += thatContent2DPlayer.getNoneAnimationItemHtml();
        html += ("</div>");
        html += "</div>";
        return html;
    }

    this.getAnimationListHtml = function (animationList){
        let html = "";
        if(animationList != null && animationList.length !== 0){
            let sortedList = thatContent2DPlayer.getSortedList(animationList);
            for (let i = 0; i < sortedList.length; i++) {
                let animationInfo = sortedList[i];
                html += thatContent2DPlayer.getAnimationItemHtml(i, animationInfo);
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
        let container = $("#" + thatContent2DPlayer.containerId);
        let activeAnimationItem = $(container).find(".s3dAnimationPlayerItemActive");
        let activeAnimationCode = (activeAnimationItem).attr("animationCode");
        if(activeAnimationCode !== animationCode){
            thatContent2DPlayer.manager.viewer.restoreAllObjectOriginalState();
            thatContent2DPlayer.manager.viewer.removeAllTempObjects();
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
        let animationInfo = thatContent2DPlayer.manager.userAnimations.getAnimationInfo(animationCode);
        for(let i = 0; i < animationInfo.groups.length; i++) {
            let group = animationInfo.groups[i];
            let objectId = group.objectId;
            let groupName = group.name;
            let groupType = group.type;
            let groupFrameValue = animationInfo.originalValueMap[objectId].propertyMap[groupName];
            thatContent2DPlayer.manager.userAnimations.refreshViewerObject(objectId, groupName, groupType, groupFrameValue);
        }
    }
}

export default S3dAnimationPlayer