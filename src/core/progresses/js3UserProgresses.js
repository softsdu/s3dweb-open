import {cmnPcr, s3dProgressGroupType} from "../../commonjs/common/common.js"
import * as THREE from "three"

let JS3UserProgresses = function(){
    const thatUserProgresses = this;

    this.manager = null;

    this.progressMap = {};

    this.progressList = null;

    this.defaultFPS = 60;

    //支持的最大流程时长(帧数)
    this.enableMaxFrameCount = 7200;

    this.init = function(p){
        thatUserProgresses.manager = p.manager;
    }

    this.load = function (progressInfo){
        thatUserProgresses.progressMap[progressInfo.code] = progressInfo;
    }

    this.initProgressInfos = function (progressList) {
        if (progressList == null) {
            progressList = [];
        }
        thatUserProgresses.progressList = progressList;
        for (let i = 0; i < progressList.length; i++) {
            let progressInfo = progressList[i];
            thatUserProgresses.load(progressInfo);
        }
    }

    this.removeProgress = function (code){
        let newProgressList = [];
        for(let i = 0; i < thatUserProgresses.progressList.length; i++){
            let progressInfo = thatUserProgresses.progressList[i];
            if(progressInfo.code !== code){
                newProgressList.push(progressInfo);
            }
        }
        thatUserProgresses.progressList = newProgressList;
        delete thatUserProgresses.progressMap[code];
    }

    this.addProgress = function (progressInfo){
        thatUserProgresses.progressList.push(progressInfo);
        thatUserProgresses.load(progressInfo);
    }

    this.getProgressList = function (){
        return thatUserProgresses.progressList;
    }

    this.getProgressInfo = function (code){
        return thatUserProgresses.progressMap[code];
    }

    this.checkHasProgress = function (code){
        return thatUserProgresses.progressMap[code] == null;
    }

    this.checkSameNameProgress = function (code, name){
        for(let c in thatUserProgresses.progressMap){
            let progressInfo = thatUserProgresses.progressMap[c];
            if(progressInfo.name === name && (code === null || progressInfo.code !== code)){
                return true;
            }
        }
        return false;
    }

    this.getNewProgressName = function (name){
        let index = 1;
        let newName = name;
        while(thatUserProgresses.checkSameNameProgress(null, newName)){
            newName = name + "_" + index;
            index++;
        }
        return newName;
    }

    this.updateProgress = function (progressInfo) {
        let newProgressList = [];
        for(let i = 0; i < thatUserProgresses.progressList.length; i++){
            let aInfo = thatUserProgresses.progressList[i];
            if(aInfo.code !== progressInfo.code){
                newProgressList.push(aInfo);
            }
            else{
                newProgressList.push(progressInfo);
            }
        }
        thatUserProgresses.progressList = newProgressList;
        thatUserProgresses.load(progressInfo);
    }

    this.getNewProgressInfo = function (name){
        let newName = thatUserProgresses.getNewProgressName(name);
        let newProgressInfo = {
            code: cmnPcr.createGuid(),
            name: newName,
            frameCount: 60 * 60 * 2,
            children: [],
            nodeMap: {},
            states:[]
        };
        return newProgressInfo;
    }

    this.cloneProgressInfo = function (progressInfo){
        let newName = thatUserProgresses.getNewProgressName(progressInfo.name);
        let newProgressInfo = {
            code: cmnPcr.createGuid(),
            name: newName,
            frameCount: progressInfo.frameCount,
            children: [],
            states:[],
            nodeMap: {}
        };
        for(let i = 0; i < progressInfo.states.length; i++){
            let stateInfo = progressInfo.states[i];
            let newStateInfo = {
                objectId: stateInfo.objectId,
                visible: stateInfo.visible
            };
            newProgressInfo.states.push(newStateInfo);
        }

        for(let i = 0; i < progressInfo.children.length; i++){
            let childNodeId = progressInfo.children[i];
            newProgressInfo.children.push(childNodeId);
        }

        for(let id in progressInfo.nodeMap){
            let nodeInfo = progressInfo.nodeMap[id];
            let newNodeInfo = {
                id: nodeInfo.id,
                isGroup: nodeInfo.isGroup,
                code: nodeInfo.code,
                name: nodeInfo.name,
                caption: nodeInfo.caption,
                description: nodeInfo.description,
                parentId: nodeInfo.parentId
            }
            if(nodeInfo.isGroup){
                newNodeInfo.children = [];
                for(let i = 0; i < nodeInfo.children.length; i++){
                    let childNodeId = nodeInfo.children[i];
                    newNodeInfo.children.push(childNodeId);
                }
            }
            else {
                newNodeInfo.objectId = nodeInfo.objectId;
                newNodeInfo.durationFrame = nodeInfo.durationFrame;
                newNodeInfo.delayFrame = nodeInfo.delayFrame;
                newNodeInfo.fadeIn = nodeInfo.fadeIn;
                newNodeInfo.fadeOut = nodeInfo.fadeOut;
                newNodeInfo.propertyMap = {};
                newNodeInfo.previousNodeIds = [];
                for (let propertyName in nodeInfo.propertyMap) {
                    let propertyInfo = nodeInfo.propertyMap[propertyName];
                    let newPropertyInfo = {
                        name: propertyInfo.name,
                        fromValues: [],
                        toValues: [],
                        fromLineType: propertyInfo.fromLineType,
                        toLineType: propertyInfo.toLineType
                    };
                    newNodeInfo.propertyMap[propertyName] = newPropertyInfo;
                }
                for(let i = 0; i < nodeInfo.previousNodeIds.length; i++){
                    let childNodeId = nodeInfo.previousNodeIds[i];
                    newNodeInfo.previousNodeIds.push(childNodeId);
                }
            }

            newProgressInfo.nodeMap[id] = newNodeInfo;
        }
        return newProgressInfo;
    }

    this.copyProgressToAnimation = function (progressInfo, animationInfo, errors){
        let maxFadeFrame = 10;

        //基本信息
        animationInfo.name = progressInfo.name;
        animationInfo.frameCount = progressInfo.frameCount;
        animationInfo.groups = [];
        animationInfo.eventMap = {};

        //states
        for(let i = 0; i < progressInfo.states.length; i++){
            let progressState = progressInfo.states[i];
            animationInfo.states.push({
                objectId: progressState.objectId,
                visible: progressState.visible
            });
        }

        let valueNameInfos = [
            {
                name: "x",
                index: 0
            },
            {
                name: "y",
                index: 1
            },
            {
                name: "z",
                index: 2
            }
        ];

        //nodeMap
        for(let nodeId in progressInfo.nodeMap){
            let progressNodeInfo = progressInfo.nodeMap[nodeId];
            if(!progressNodeInfo.isGroup){
                let objectId = progressNodeInfo.objectId;
                let object3D = thatUserProgresses.manager.viewer.getObject3DById(objectId);
                if(object3D == null){
                    errors.push("不存在的对象, ObjectId=" + objectId);
                }
                else {
                    let fullStartFrame = progressNodeInfo.startFrame;
                    let transformStartFrame = progressNodeInfo.startFrame;
                    let transformEndFrame = progressNodeInfo.startFrame + progressNodeInfo.durationFrame;
                    let fullEndFrame = progressNodeInfo.startFrame + progressNodeInfo.durationFrame;
                    let durationFrame = progressNodeInfo.durationFrame;

                    //淡入淡出
                    let fadeFrame = maxFadeFrame;
                    if(progressNodeInfo.fadeIn || progressNodeInfo.fadeOut){
                        if(fadeFrame > durationFrame / 10){
                            fadeFrame = Math.ceil(durationFrame / 10);
                        }
                        let visibleTrackInfo = {
                            code: cmnPcr.createGuid(),
                            name: "value",
                            keyFrames: []
                        };
                        let fadeGroupInfo = {
                            type: "property",
                            code: cmnPcr.createGuid(),
                            objectId: objectId,
                            name: "visibility",
                            tracks: [visibleTrackInfo]
                        };

                        if(progressNodeInfo.fadeIn){
                            transformStartFrame = transformStartFrame + fadeFrame;
                            visibleTrackInfo.keyFrames.push({
                                frameIndex: 1,
                                value: 0
                            });
                            visibleTrackInfo.keyFrames.push({
                                frameIndex: fullStartFrame,
                                value: 0
                            });
                            visibleTrackInfo.keyFrames.push({
                                frameIndex: transformStartFrame,
                                value: 1
                            });
                        }
                        if(progressNodeInfo.fadeOut){
                            transformEndFrame = transformEndFrame - fadeFrame;
                            visibleTrackInfo.keyFrames.push({
                                frameIndex: transformEndFrame,
                                value: 1
                            });
                            visibleTrackInfo.keyFrames.push({
                                frameIndex: fullEndFrame,
                                value: 0
                            });
                        }
                        animationInfo.groups.push(fadeGroupInfo);
                    }

                    //位置、旋转、缩放等属性
                    let objectName = object3D.userData.info.name;
                    for (let propertyName in progressNodeInfo.propertyMap) {
                        let progressPropertyInfo = progressNodeInfo.propertyMap[propertyName];
                        let animationGroupInfo = {
                            type: "property",
                            code: cmnPcr.createGuid(),
                            objectId: objectId,
                            name: propertyName,
                            tracks: []
                        };
                        for (let j = 0; j < valueNameInfos.length; j++) {
                            let valueNameInfo = valueNameInfos[j];
                            animationGroupInfo.tracks.push({
                                code: cmnPcr.createGuid(),
                                name: valueNameInfo.name,
                                keyFrames: [
                                    {
                                        frameIndex: transformStartFrame,
                                        value: progressPropertyInfo.fromValues[valueNameInfo.index],
                                        leftLineType: progressNodeInfo.fromLineType,
                                        rightLineType: progressNodeInfo.toLineType
                                    },
                                    {
                                        frameIndex: transformEndFrame,
                                        value: progressPropertyInfo.toValues[valueNameInfo.index],
                                        leftLineType: progressNodeInfo.fromLineType,
                                        rightLineType: progressNodeInfo.toLineType
                                    }
                                ]
                            });
                        }
                        animationInfo.groups.push(animationGroupInfo);
                    }
                }
            }
        }

        //在Start事件里设置字幕
        let captionList = [];
        for(let i = 0; i < progressInfo.children.length; i++){
            let firstLevelNodeId = progressInfo.children[i];
            let nodeInfo = progressInfo.nodeMap[firstLevelNodeId];
            let frameRange = thatUserProgresses.getNodeFrameRange(firstLevelNodeId, progressInfo.nodeMap);
            captionList.push({
                startFrame: frameRange.startFrame,
                endFrame: frameRange.endFrame,
                text: nodeInfo.caption
            });
        }

        let captionJsCode = "manager.screen2D.setCaptionList("
            + cmnPcr.jsonToStr(captionList)
            + ");";
        animationInfo.eventMap["onStart"] = {
            name: "onStart",
            jsCode: captionJsCode
        };
    }

    this.getAllChildNodeMap = function (nodeId, nodeMap, allChildNodeFrameRangeMap){
        if(allChildNodeFrameRangeMap[nodeId] == null) {
            let nodeInfo = nodeMap[nodeId];
            if(nodeInfo.isGroup){
                for(let i = 0; i < nodeInfo.children.length; i++) {
                    let childNodeId = nodeInfo.children[i];
                    thatUserProgresses.getAllChildNodeMap(childNodeId, nodeMap, allChildNodeFrameRangeMap);
                }
            }
            else{
                let startFrame = nodeInfo.startFrame;
                let endFrame = nodeInfo.startFrame + nodeInfo.durationFrame;
                allChildNodeFrameRangeMap[nodeId] = {
                    startFrame: startFrame,
                    endFrame: endFrame
                };
            }
        }
    }

    this.getNodeFrameRange = function (nodeId, nodeMap){
        let allChildNodeFrameRangeMap = {};
        thatUserProgresses.getAllChildNodeMap(nodeId, nodeMap, allChildNodeFrameRangeMap);
        let minStartFrame = Number.MAX_VALUE;
        let maxEndFrame = -Number.MAX_VALUE;
        for(let nodeId in allChildNodeFrameRangeMap){
            let frameRange = allChildNodeFrameRangeMap[nodeId];
            if(frameRange.startFrame < minStartFrame){
                minStartFrame = frameRange.startFrame;
            }
            if(frameRange.endFrame > maxEndFrame){
                maxEndFrame = frameRange.endFrame
            }
        }
        return {
            startFrame: minStartFrame,
            endFrame: maxEndFrame
        };
    }

    this.getPropertyText = function (propertyName) {
        let text = "";
        switch (propertyName) {
            case "position":{
                text = "位置";
                break;
            }
            case "rotation":{
                text = "旋转";
                break;
            }
            case "scale":{
                text = "缩放";
                break;
            }
        }
        return text;
    }
}
export default JS3UserProgresses