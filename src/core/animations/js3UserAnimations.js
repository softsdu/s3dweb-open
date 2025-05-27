import {cmnPcr, s3dAnimationGroupType} from "../../commonjs/common/common.js"
import * as THREE from "three"
import {AnimationMixer} from "three";

let JS3UserAnimations = function(){
    const thatUserAnimations = this;

    this.manager = null;

    this.animationMap = {};

    this.animationList = null;

    this.defaultFPS = 60;


    this.positionPrecision = 4;
    this.rotationPrecision = 4;
    this.scalePrecision = 4;
    this.seniorInfoPrecision = 4;

    //支持的最大动画时长(帧数)
    this.enableMaxFrameCount = 7200;

    this.init = function(p){
        thatUserAnimations.manager = p.manager;
    }

    this.load = function (animationInfo){
        thatUserAnimations.animationMap[animationInfo.code] = animationInfo;
    }

    this.initAnimationInfos = function (animationList) {
        if (animationList == null) {
            animationList = [];
        }
        thatUserAnimations.animationList = animationList;
        for (let i = 0; i < animationList.length; i++) {
            let animationInfo = animationList[i];
            thatUserAnimations.load(animationInfo);
        }
    }

    this.removeAnimation = function (code){
        let newAnimationList = [];
        for(let i = 0; i < thatUserAnimations.animationList.length; i++){
            let animationInfo = thatUserAnimations.animationList[i];
            if(animationInfo.code !== code){
                newAnimationList.push(animationInfo);
            }
        }
        thatUserAnimations.animationList = newAnimationList;
        delete thatUserAnimations.animationMap[code];
    }

    this.addAnimation = function (animationInfo){
        thatUserAnimations.animationList.push(animationInfo);
        thatUserAnimations.load(animationInfo);
    }

    this.getAnimationList = function (){
        return thatUserAnimations.animationList;
    }

    this.getAnimationInfo = function (code){
        return thatUserAnimations.animationMap[code];
    }

    this.getAnimationInfoByName = function (name){
        for(let code in thatUserAnimations.animationMap) {
            let animationInfo = thatUserAnimations.animationMap[code];
            if(animationInfo.name === name){
                return animationInfo;
            }
        }
        return null;
    }

    this.checkHasAnimation = function (code){
        return thatUserAnimations.animationMap[code] == null;
    }

    this.checkSameNameAnimation = function (code, name){
        for(let c in thatUserAnimations.animationMap){
            let animationInfo = thatUserAnimations.animationMap[c];
            if(animationInfo.name === name && (code === null || animationInfo.code !== code)){
                return true;
            }
        }
        return false;
    }

    this.getNewAnimationName = function (name){
        let index = 1;
        let newName = name;
        while(thatUserAnimations.checkSameNameAnimation(null, newName)){
            newName = name + "_" + index;
            index++;
        }
        return newName;
    }

    this.updateAnimation = function (animationInfo) {
        let newAnimationList = [];
        for(let i = 0; i < thatUserAnimations.animationList.length; i++){
            let aInfo = thatUserAnimations.animationList[i];
            if(aInfo.code !== animationInfo.code){
                newAnimationList.push(aInfo);
            }
        }
        newAnimationList.push(animationInfo);
        thatUserAnimations.animationList = newAnimationList;
        thatUserAnimations.load(animationInfo);
    }

    this.getNewAnimationInfo = function (name){
        let newName = thatUserAnimations.getNewAnimationName(name);
        let newAnimationInfo = {
            code: cmnPcr.createGuid(),
            name: newName,
            frameCount: 60 * 60 * 2,
            groups: [],
            states: [],
            events: {}
        };
        return newAnimationInfo;
    }

    this.cloneAnimationInfo = function (animationInfo){
        let newName = thatUserAnimations.getNewAnimationName(animationInfo.name);
        let newAnimationInfo = {
            code: cmnPcr.createGuid(),
            name: newName,
            frameCount: animationInfo.frameCount,
            groups: [],
            states:[]
        };
        for(let i = 0; i < animationInfo.states.length; i++){
            let stateInfo = animationInfo.states[i];
            let newStateInfo = {
                objectId: stateInfo.objectId,
                visible: stateInfo.visible
            };
            newAnimationInfo.states.push(newStateInfo);
        }
        for(let i = 0; i < animationInfo.groups.length; i++){
            let groupInfo = animationInfo.groups[i];
            let newGroupInfo = {
                code: groupInfo.code,
                objectId: groupInfo.objectId,
                name: groupInfo.name,
                tracks: []
            };
            for(let j = 0; j < groupInfo.tracks.length; j++) {
                let trackInfo = groupInfo.tracks[j];
                let newTrackInfo = {
                    code: trackInfo.code,
                    name: trackInfo.name,
                    keyFrames: []
                };
                for (let k = 0; k < trackInfo.keyFrames.length; k++) {
                    let keyFrame = trackInfo.keyFrames[k];
                    let newKeyFrame = {
                        secondIndex: keyFrame.secondIndex,
                        frameIndex: keyFrame.frameIndex,
                        value: keyFrame.value
                    };
                    newTrackInfo.keyFrames.push(newKeyFrame);
                }
                newGroupInfo.tracks.push(newTrackInfo);
            }
            newAnimationInfo.groups.push(newGroupInfo);
        }
        return newAnimationInfo;
    }

    this.generateAnimationClipMap = function (runJson){
        let objectId2AnimationClip = {};
        for(let objectId in runJson.clips) {
            let clipJson = runJson.clips[objectId];
            let animationClip = THREE.AnimationClip.parse(clipJson);
            objectId2AnimationClip[objectId] = animationClip;
        }
        return objectId2AnimationClip;
    }

    this.animationToRunJson = function (animationCode, modelJson){
        let animationInfo = thatUserAnimations.getAnimationInfo(animationCode);
        return thatUserAnimations.animationInfoToRunJson(animationInfo, modelJson);
    }

    this.animationInfoToRunJson = function (animationInfo, objectOriginalValueMap){
        if(animationInfo != null){
            let runJson = {
                uuid: animationInfo.code,
                name: animationInfo.name,
                blendMode: THREE.NormalAnimationBlendMode,
                duration: animationInfo.frameCount / thatUserAnimations.defaultFPS,
                clips: {}
            };
            let objectIdToGroupInfos = {};
            for(let i = 0; i < animationInfo.groups.length; i++){
                let groupInfo = animationInfo.groups[i];
                let objectId = groupInfo.objectId;
                if(objectIdToGroupInfos[objectId] == null){
                    objectIdToGroupInfos[objectId] = [];
                }
                objectIdToGroupInfos[objectId].push(groupInfo);
            }
            for(let objectId in objectIdToGroupInfos){
                let objectOriginalValue = objectOriginalValueMap[objectId];
                let groupInfos = objectIdToGroupInfos[objectId];
                let clip = {
                    uuid: objectId,
                    name: objectOriginalValue.name,
                    blendMode: THREE.NormalAnimationBlendMode,
                    duration: animationInfo.frameCount / thatUserAnimations.defaultFPS,
                    tracks: []
                };

                for(let i = 0; i < groupInfos.length; i++){
                    let groupInfo = groupInfos[i];
                    let track = thatUserAnimations.trackToJson(groupInfo, animationInfo.frameCount, objectOriginalValue);
                    if(track != null) {
                        clip.tracks.push(track);
                    }
                }
                runJson.clips[objectId] = clip;
            }
            return runJson;
        }
        else{
            return null;
        }
    }

    this.trackToJson = function (groupInfo, frameCount, objectOriginalValue){
        switch(groupInfo.type){
            case s3dAnimationGroupType.property:{
                return thatUserAnimations.trackToPropertyJson(groupInfo, frameCount, objectOriginalValue);
            }
            case s3dAnimationGroupType.material:{
                return thatUserAnimations.trackToMaterialJson(groupInfo, frameCount, objectOriginalValue);
            }
            default:{
                throw "不支持的分组类型. GroupType=" + groupInfo.type;
            }
        }
    }

    this.trackToMaterialJson = function (groupInfo, frameCount, objectOriginalValue){
        let materialPropertyName = thatUserAnimations.getMaterialPropertyPostfix(groupInfo.name);
        switch (materialPropertyName){
            case "opacity":{
                return thatUserAnimations.trackOpacityToJson(groupInfo, frameCount, objectOriginalValue.propertyMap[groupInfo.name]);
            }
            case "color":{
                return thatUserAnimations.trackColorToJson(groupInfo, frameCount, objectOriginalValue.propertyMap[groupInfo.name]);
            }
            default:{
                return null;
            }
        }
    }

    this.getMaterialPropertyPostfix = function (propertyPath){
        let parts = propertyPath.split(".");
        let propertyName = parts[parts.length - 1];
        return propertyName;
    }


    this.trackToPropertyJson = function (groupInfo, frameCount, objectOriginalValue){
        switch (groupInfo.name){
            case "position":{
                return thatUserAnimations.trackPositionToJson(groupInfo, frameCount, objectOriginalValue.propertyMap["position"]);
            }
            case "rotation":{
                return thatUserAnimations.trackRotationToJson(groupInfo, frameCount, objectOriginalValue.propertyMap["rotation"]);
            }
            case "scale":{
                return thatUserAnimations.trackScaleToJson(groupInfo, frameCount, objectOriginalValue.propertyMap["scale"]);
            }
            case "visibility":{
                return thatUserAnimations.trackVisibilityToJson(groupInfo, frameCount, objectOriginalValue.propertyMap["visibility"]);
            }
            default:{
                return null;
            }
        }
    }

    this.trackOpacityToJson = function (groupInfo, frameCount, objectOriginalValue){
        let values = null;

        for(let i = 0; i < groupInfo.tracks.length; i++) {
            let trackInfo = groupInfo.tracks[i];
            let sortedKeyFrameValues = thatUserAnimations.sortKeyFrameValues(trackInfo.keyFrames);
            switch(trackInfo.name){
                case "value":{
                    let originalValue = objectOriginalValue.value;
                    values = thatUserAnimations.calcFullCurvePoints(sortedKeyFrameValues, frameCount, originalValue);
                    break;
                }
            }
        }
        let track = {
            name: groupInfo.name,
            type: "number",
            times: [],
            values: []
        };
        for (let i = 0; i <= frameCount; i++) {
            let time = i / thatUserAnimations.defaultFPS;
            track.times.push(time);
            track.values.push(values[i].value);
        }

        return track;
    }

    this.trackColorToJson = function (groupInfo, frameCount, objectOriginalValue){
        let rValues = null;
        let gValues = null;
        let bValues = null;

        for(let i = 0; i < groupInfo.tracks.length; i++) {
            let trackInfo = groupInfo.tracks[i];
            let sortedKeyFrameValues = thatUserAnimations.sortKeyFrameValues(trackInfo.keyFrames);
            switch(trackInfo.name){
                case "r":{
                    let xOriginalValue = objectOriginalValue.r;
                    rValues = thatUserAnimations.calcFullCurvePoints(sortedKeyFrameValues, frameCount, xOriginalValue);
                    break;
                }
                case "g":{
                    let yOriginalValue = objectOriginalValue.g;
                    gValues = thatUserAnimations.calcFullCurvePoints(sortedKeyFrameValues, frameCount, yOriginalValue);
                    break;
                }
                case "b":{
                    let zOriginalValue = objectOriginalValue.b;
                    bValues = thatUserAnimations.calcFullCurvePoints(sortedKeyFrameValues, frameCount, zOriginalValue);
                    break;
                }
            }
        }
        let track = {
            name: groupInfo.name,
            type: "color",
            times: [],
            values: []
        };
        for (let i = 0; i <= frameCount; i++) {
            let time = i / thatUserAnimations.defaultFPS;
            track.times.push(time);
            track.values.push(rValues[i].value);
            track.values.push(gValues[i].value);
            track.values.push(bValues[i].value);
        }

        return track;
    }

    this.trackPositionToJson = function (groupInfo, frameCount, objectOriginalValue){
        let xValues = null;
        let yValues = null;
        let zValues = null;

        for(let i = 0; i < groupInfo.tracks.length; i++) {
            let trackInfo = groupInfo.tracks[i];
            let sortedKeyFrameValues = thatUserAnimations.sortKeyFrameValues(trackInfo.keyFrames);
            switch(trackInfo.name){
                case "x":{
                    let xOriginalValue = objectOriginalValue.x;
                    xValues = thatUserAnimations.calcFullCurvePoints(sortedKeyFrameValues, frameCount, xOriginalValue);
                    break;
                }
                case "y":{
                    let yOriginalValue = objectOriginalValue.y;
                    yValues = thatUserAnimations.calcFullCurvePoints(sortedKeyFrameValues, frameCount, yOriginalValue);
                    break;
                }
                case "z":{
                    let zOriginalValue = objectOriginalValue.z;
                    zValues = thatUserAnimations.calcFullCurvePoints(sortedKeyFrameValues, frameCount, zOriginalValue);
                    break;
                }
            }
        }
        let track = {
            name: ".position",
            type: "vector",
            times: [],
            values: []
        };
        for (let i = 0; i <= frameCount; i++) {
            let time = i / thatUserAnimations.defaultFPS;
            track.times.push(time);
            track.values.push(xValues[i].value);
            track.values.push(yValues[i].value);
            track.values.push(zValues[i].value);
        }

        return track;
    }

    this.trackRotationToJson = function (groupInfo, frameCount, objectOriginalValue){
        let xValues = null;
        let yValues = null;
        let zValues = null;

        for(let i = 0; i < groupInfo.tracks.length; i++) {
            let trackInfo = groupInfo.tracks[i];
            let sortedKeyFrameValues = thatUserAnimations.sortKeyFrameValues(trackInfo.keyFrames);
            switch(trackInfo.name){
                case "x":{
                    let xOriginalValue = objectOriginalValue.x;
                    xValues = thatUserAnimations.calcFullCurvePoints(sortedKeyFrameValues, frameCount, xOriginalValue);
                    break;
                }
                case "y":{
                    let yOriginalValue = objectOriginalValue.y;
                    yValues = thatUserAnimations.calcFullCurvePoints(sortedKeyFrameValues, frameCount, yOriginalValue);
                    break;
                }
                case "z":{
                    let zOriginalValue = objectOriginalValue.z;
                    zValues = thatUserAnimations.calcFullCurvePoints(sortedKeyFrameValues, frameCount, zOriginalValue);
                    break;
                }
            }
        }
        let track = {
            name: ".quaternion",
            type: "quaternion",
            times: [],
            values: []
        };
        for (let i = 0; i <= frameCount; i++) {
            let time = i / thatUserAnimations.defaultFPS;
            track.times.push(time);
            let euler = new THREE.Euler(xValues[i].value, yValues[i].value, zValues[i].value);
            let quaternion = new THREE.Quaternion();
            quaternion.setFromEuler(euler);
            track.values.push(quaternion.x);
            track.values.push(quaternion.y);
            track.values.push(quaternion.z);
            track.values.push(quaternion.w);
        }

        return track;
    }

    this.trackScaleToJson = function (groupInfo, frameCount, objectOriginalValue){
        let xValues = null;
        let yValues = null;
        let zValues = null;

        for(let i = 0; i < groupInfo.tracks.length; i++) {
            let trackInfo = groupInfo.tracks[i];
            let sortedKeyFrameValues = thatUserAnimations.sortKeyFrameValues(trackInfo.keyFrames);
            switch(trackInfo.name){
                case "x":{
                    let xOriginalValue = objectOriginalValue.x;
                    xValues = thatUserAnimations.calcFullCurvePoints(sortedKeyFrameValues, frameCount, xOriginalValue);
                    break;
                }
                case "y":{
                    let yOriginalValue = objectOriginalValue.y;
                    yValues = thatUserAnimations.calcFullCurvePoints(sortedKeyFrameValues, frameCount, yOriginalValue);
                    break;
                }
                case "z":{
                    let zOriginalValue = objectOriginalValue.z;
                    zValues = thatUserAnimations.calcFullCurvePoints(sortedKeyFrameValues, frameCount, zOriginalValue);
                    break;
                }
            }
        }
        let track = {
            name: ".scale",
            type: "vector",
            times: [],
            values: []
        };
        for (let i = 0; i <= frameCount; i++) {
            let time = i / thatUserAnimations.defaultFPS;
            track.times.push(time);
            track.values.push(xValues[i].value);
            track.values.push(yValues[i].value);
            track.values.push(zValues[i].value);
        }
        return track;
    }

    this.trackVisibilityToJson = function (groupInfo, frameCount, objectOriginalValue){
        let trackInfo = groupInfo.tracks[0];
        let sortedKeyFrameValues = thatUserAnimations.sortKeyFrameValues(trackInfo.keyFrames);
        let track = {
            name: ".visible",
            type: "bool",
            times: [],
            values: []
        };
        for (let i = 0; i < sortedKeyFrameValues.length; i++) {
            let frameValue = sortedKeyFrameValues[i];
            let time = frameValue.frameIndex / thatUserAnimations.defaultFPS;
            track.times.push(time);
            track.values.push(frameValue.value === 1);
        }

        return track;
    }

    //给关键帧排序
    this.sortKeyFrameValues = function (keyFrameValues){
        let sortedKeyFrameValues = [];
        for (let i = 0; i < keyFrameValues.length; i++) {
            let keyFrameValue = keyFrameValues[i];
            let added = false;
            let tempList = [];
            for (let j = 0; j < sortedKeyFrameValues.length; j++) {
                let newItem = sortedKeyFrameValues[j];
                if (!added && newItem.frameIndex > keyFrameValue.frameIndex) {
                    tempList.push(keyFrameValue);
                    added = true;
                }
                tempList.push(newItem);
            }
            if (!added) {
                tempList.push(keyFrameValue);
            }
            sortedKeyFrameValues = tempList;
        }
        return sortedKeyFrameValues;
    }

    this.calcFullCurvePoints = function (sortedKeyFrameValues, frameCount, originalValue){
        let fullCurvePoints = [];
        if (sortedKeyFrameValues.length === 0) {
            for(let i = 0; i <= frameCount; i++){
                fullCurvePoints[i] = {
                    frameIndex: i,
                    value: originalValue
                };
            }
        } else if (sortedKeyFrameValues.length === 1) {
            for(let i = 0; i <= frameCount; i++){
                fullCurvePoints[i] = {
                    frameIndex: i,
                    value: originalValue
                };
            }
        } else {
            let firstFrameValue = sortedKeyFrameValues[0];
            for(let i = 0; i < firstFrameValue.frameIndex; i++){
                fullCurvePoints[i] = {
                    frameIndex: i,
                    value: firstFrameValue.value
                };
            }
            for (let i = 0; i < sortedKeyFrameValues.length - 1; i++) {
                let frameValueA = sortedKeyFrameValues[i];
                let frameValueB = sortedKeyFrameValues[i + 1];
                let curvePoints = thatUserAnimations.calcCurvePoints(frameValueA, frameValueB);
                for(let j = frameValueA.frameIndex; j < frameValueB.frameIndex; j++) {
                    fullCurvePoints[j] = {
                        frameIndex: j,
                        value: cmnPcr.toFixed(curvePoints[j - frameValueA.frameIndex].value, 4)
                    };
                }
            }

            let lastFrameValue = sortedKeyFrameValues[sortedKeyFrameValues.length - 1];
            for(let i = lastFrameValue.frameIndex; i <= frameCount; i++){
                fullCurvePoints[i] = {
                    frameIndex: i,
                    value: lastFrameValue.value
                };
            }
        }
        return fullCurvePoints;
    }

    this.calcCurvePoints = function (fromFrameValue, toFrameValue){
        let pointBX = 0;
        let pointBY = 0;
        switch (fromFrameValue.rightLineType){
            case "curve":{
                pointBX = fromFrameValue.frameIndex + (toFrameValue.frameIndex - fromFrameValue.frameIndex) / 3;
                pointBY = fromFrameValue.value;
                break;
            }
            case "linear":
            default:{
                pointBX = (toFrameValue.frameIndex + fromFrameValue.frameIndex) / 2;
                pointBY = (toFrameValue.value + fromFrameValue.value) / 2;
                break;
            }
        }
        let pointCX = 0;
        let pointCY = 0;
        switch (toFrameValue.leftLineType){
            case "curve":{
                pointCX = toFrameValue.frameIndex - (toFrameValue.frameIndex - fromFrameValue.frameIndex) / 3;
                pointCY = toFrameValue.value;
                break;
            }
            case "linear":
            default:{
                pointCX = (toFrameValue.frameIndex + fromFrameValue.frameIndex) / 2;
                pointCY = (toFrameValue.value + fromFrameValue.value) / 2;
                break;
            }
        }

        let pointA = new THREE.Vector2(fromFrameValue.frameIndex, fromFrameValue.value);
        let pointB = new THREE.Vector2(pointBX, pointBY);
        let pointC = new THREE.Vector2(pointCX, pointCY);
        let pointD = new THREE.Vector2(toFrameValue.frameIndex, toFrameValue.value);

        const curve = new THREE.CubicBezierCurve(
            pointA,
            pointB,
            pointC,
            pointD
        );

        let curvePoints = [];
        for(let i = fromFrameValue.frameIndex; i <= toFrameValue.frameIndex; i++){
            let y = thatUserAnimations.getYForXInBezier(curve, i);
            curvePoints.push({
                frameIndex: i,
                value: y
            });
        }
        return curvePoints;
    }

    // 定义一个函数来通过二分查找方法找到对应的 t 值
    this.findTForXInBezier = function (curve, x, tolerance = 0.0001) {
        let tMin = 0;
        let tMax = 1;
        let tMid;

        while (tMax - tMin > tolerance) {
            tMid = (tMin + tMax) / 2;
            const point = curve.getPoint(tMid);
            if (point.x < x) {
                tMin = tMid;
            } else {
                tMax = tMid;
            }
        }

        return (tMin + tMax) / 2;
    }

    // 定义一个函数来获取 y 坐标
    this.getYForXInBezier = function (curve, x) {
        const t = thatUserAnimations.findTForXInBezier(curve, x);
        const point = curve.getPoint(t);
        return point.y;
    }


    this.refreshViewerObject = function (objectId, groupName, groupType, groupFrameValue){
        switch(groupType){
            case s3dAnimationGroupType.material:{
                return thatUserAnimations.refreshViewerObjectMaterial(objectId, groupName, groupFrameValue);
            }
            case s3dAnimationGroupType.property:{
                return thatUserAnimations.refreshViewerObjectProperty(objectId, groupName, groupFrameValue);
            }
            default:{
                throw "不支持的分组类型. GroupType=" + groupType;
            }
        }
    }

    this.getMaterialPropertyItemByPath = function (objectId, path){
        let materialPropertyMap = thatUserAnimations.getObject3DMaterialPropertyMap(objectId);
        for(let materialPropertyName in materialPropertyMap){
            let materialPropertyObjItem = materialPropertyMap[materialPropertyName];
            if(materialPropertyObjItem.path === path){
                return materialPropertyObjItem;
            }
        }
    }


    this.getObject3DMaterialPropertyMap = function (objectId){
        let materialPropertyMap = {};
        let properties = ["opacity", "color"];
        let materialMap = thatUserAnimations.manager.viewer.getObject3DMaterialMap(objectId);
        for(let materialName in materialMap){
            let materialObjItem = materialMap[materialName];
            for(let i = 0; i < properties.length; i++){
                let property = properties[i];
                let propertyPath = materialObjItem.path + "." + property;
                let propertyText = materialObjItem.text + "." + thatUserAnimations.getMaterialPropertyText(property);
                materialPropertyMap[propertyPath] = {
                    path: propertyPath,
                    text: propertyText,
                    material: materialObjItem.material
                };
            }
        }
        return materialPropertyMap;
    }


    this.getMaterialPropertyText = function (propertyName) {
        let text = "";
        switch (propertyName) {
            case "opacity":{
                text = "透明度";
                break;
            }
            case "color":{
                text = "颜色";
                break;
            }
        }
        return text;
    }

    this.refreshViewerObjectMaterial = function (objectId, path, groupFrameValue){
        let materialPropertyItem = thatUserAnimations.getMaterialPropertyItemByPath(objectId, path);
        if(materialPropertyItem != null){
            let materialPropertyName = thatUserAnimations.manager.userAnimations.getMaterialPropertyPostfix(path);
            switch (materialPropertyName){
                case "opacity":{
                    materialPropertyItem.material.opacity = groupFrameValue.value;
                    break;
                }
                case "color":{
                    materialPropertyItem.material.color.r = groupFrameValue.r;
                    materialPropertyItem.material.color.g = groupFrameValue.g;
                    materialPropertyItem.material.color.b = groupFrameValue.b;
                    break;
                }
            }
        }
    }

    this.refreshViewerObjectProperty = function (objectId, propertyName, groupFrameValue){
        let object3D = thatUserAnimations.manager.viewer.getObject3DById(objectId);
        let objectPropertyInfo = {
            position: {
                x: object3D.position.x,
                y: object3D.position.y,
                z: object3D.position.z
            },
            rotation: {
                x: object3D.rotation.x,
                y: object3D.rotation.y,
                z: object3D.rotation.z
            },
            scale: {
                x: object3D.scale.x,
                y: object3D.scale.y,
                z: object3D.scale.z
            },
            visibility: {
                value: object3D.visible ? 1 : 0
            }
        };
        switch(propertyName){
            case "position":{
                objectPropertyInfo.position.x = common3DFunction.v2s(groupFrameValue.x, thatUserAnimations.manager.viewer.distanceRatio);
                objectPropertyInfo.position.y = common3DFunction.v2s(groupFrameValue.y, thatUserAnimations.manager.viewer.distanceRatio);
                objectPropertyInfo.position.z = common3DFunction.v2s(groupFrameValue.z, thatUserAnimations.manager.viewer.distanceRatio);
                break;
            }
            case "rotation":{
                objectPropertyInfo.rotation.x = common3DFunction.degree2radian(groupFrameValue.x);
                objectPropertyInfo.rotation.y = common3DFunction.degree2radian(groupFrameValue.y);
                objectPropertyInfo.rotation.z = common3DFunction.degree2radian(groupFrameValue.z);
                break;
            }
            case "scale":{
                objectPropertyInfo.scale.x = groupFrameValue.x;
                objectPropertyInfo.scale.y = groupFrameValue.y;
                objectPropertyInfo.scale.z = groupFrameValue.z;
                break;
            }
            case "visibility":{
                objectPropertyInfo.visibility.value = groupFrameValue.value;
                break;
            }
        }
        thatUserAnimations.manager.viewer.setObjectPositionRotationScaleById(objectId, object3D.userData.info.userWorldPosition, objectPropertyInfo.position, objectPropertyInfo.rotation, objectPropertyInfo.scale);
    }
    this.getEditValueFromOriginal = function (objectId, groupName, groupType){
        switch (groupType){
            case s3dAnimationGroupType.property:{
                return thatUserAnimations.getEditValueFromOriginalProperty(objectId, groupName);
            }
            case s3dAnimationGroupType.material:{
                return thatUserAnimations.getEditValueFromOriginalMaterial(objectId, groupName);
            }
            default:{
                throw "不支持的分组类型. GroupType=" + groupType;
            }
        }
    }

    this.getEditValueFromOriginalMaterial = function (objectId, path){
        let showValue = null;
        let materialPropertyItem = thatUserAnimations.getMaterialPropertyItemByPath(objectId, path);
        if(materialPropertyItem != null){
            let materialPropertyName = thatUserAnimations.getMaterialPropertyPostfix(path);
            switch(materialPropertyName) {
                case "opacity": {
                    showValue = {
                        value: materialPropertyItem.material.opacity
                    };
                    break;
                }
                case "color": {
                    showValue = {
                        r: materialPropertyItem.material.color.r,
                        g: materialPropertyItem.material.color.g,
                        b: materialPropertyItem.material.color.b
                    };
                    break;
                }
            }
        }
        return showValue;
    }

    this.getEditValueFromOriginalProperty = function (objectId, propertyName){
        let showValue = null;

        let object3D = thatUserAnimations.manager.viewer.getObject3DById(objectId);
        if(object3D != null) {
            switch (propertyName) {
                case "position": {
                    showValue = thatUserAnimations.convertGroupValueToShowValue(object3D.position, propertyName, s3dAnimationGroupType.property);
                    break;
                }
                case "rotation": {
                    showValue = thatUserAnimations.convertGroupValueToShowValue(object3D.rotation, propertyName, s3dAnimationGroupType.property);
                    break;
                }
                case "scale": {
                    showValue = thatUserAnimations.convertGroupValueToShowValue(object3D.scale, propertyName, s3dAnimationGroupType.property);
                    break;
                }
                case "visibility": {
                    showValue = thatUserAnimations.convertGroupValueToShowValue(object3D.visible, propertyName, s3dAnimationGroupType.property);
                    break;
                }
            }
        }
        return showValue;
    }

    this.convertToEditingValue = function (value, groupName, groupType){
        switch (groupType){
            case s3dAnimationGroupType.property:{
                return thatUserAnimations.convertToEditingPropertyValue(value, groupName);
            }
            case s3dAnimationGroupType.material:{
                return thatUserAnimations.convertToEditingMaterialValue(value, groupName);
            }
            default:{
                throw "不支持的分组类型. GroupType=" + groupType;
            }
        }
    }

    this.convertToEditingMaterialValue = function (value, propertyPath){
        let editValue = null;
        let materialPropertyName = thatUserAnimations.getMaterialPropertyPostfix(propertyPath);
        switch(materialPropertyName){
            case "opacity":{
                editValue = value;
                break;
            }
            case "color":{
                editValue = value;
                break;
            }
        }
        return editValue;
    }

    this.convertToEditingPropertyValue = function (value, propertyName){
        let editValue = null;
        switch(propertyName){
            case "position":{
                editValue = cmnPcr.toFixed(common3DFunction.s2v(value, thatUserAnimations.manager.viewer.distanceRatio), thatUserAnimations.positionPrecision);
                break;
            }
            case "rotation":{
                editValue = cmnPcr.toFixed(common3DFunction.radian2degree(value), thatUserAnimations.rotationPrecision);
                break;
            }
            case "scale":{
                editValue = cmnPcr.toFixed(value, thatUserAnimations.scalePrecision);
                break;
            }
            case "visibility":{
                editValue  = value;
                break;
            }
        }
        return editValue;
    }

    this.convertToGroupValue = function (value, groupName, groupType){
        let editValue = null;
        switch(groupName){
            case "position":{
                editValue = common3DFunction.v2s(value, thatUserAnimations.manager.viewer.distanceRatio);
                break;
            }
            case "rotation":{
                editValue = common3DFunction.degree2radian(value);
                break;
            }
            case "scale":{
                editValue = value;
                break;
            }
            case "visibility":{
                editValue = value;
                break;
            }
            default:{
                editValue = value;
            }
        }
        return editValue;
    }

    this.convertGroupValueToShowValue = function (propertyValue, groupName, groupType){
        switch (groupType){
            case s3dAnimationGroupType.property:{
                return thatUserAnimations.convertPropertyValueToShowValue(propertyValue, groupName);
            }
            case s3dAnimationGroupType.material:{
                return thatUserAnimations.convertMaterialValueToShowValue(value, groupName);
            }
            default:{
                throw "去支持的分组类型. GroupType=" + groupType;
            }
        }
    }

    this.convertMaterialValueToShowValue = function (propertyValue, propertyPath){
        let materialPropertyName = thatUserAnimations.getMaterialPropertyPostfix(propertyPath);
        let showValue = {};
        switch(materialPropertyName) {
            case "opacity": {
                showValue.value = propertyValue.value;
                break;
            }
            case "color": {
                showValue.r = propertyValue.r;
                showValue.g = propertyValue.g;
                showValue.b = propertyValue.b;
                break;
            }
        }
        return showValue;
    }

    this.convertPropertyValueToShowValue = function (propertyValue, propertyName){
        let showValue = {};
        switch(propertyName){
            case "position":{
                showValue.x = cmnPcr.toFixed(common3DFunction.s2v(propertyValue.x, thatUserAnimations.manager.viewer.distanceRatio), thatUserAnimations.positionPrecision);
                showValue.y = cmnPcr.toFixed(common3DFunction.s2v(propertyValue.y, thatUserAnimations.manager.viewer.distanceRatio), thatUserAnimations.positionPrecision);
                showValue.z = cmnPcr.toFixed(common3DFunction.s2v(propertyValue.z, thatUserAnimations.manager.viewer.distanceRatio), thatUserAnimations.positionPrecision);
                break;
            }
            case "rotation":{
                showValue.x = cmnPcr.toFixed(common3DFunction.radian2degree(propertyValue.x), thatUserAnimations.rotationPrecision);
                showValue.y = cmnPcr.toFixed(common3DFunction.radian2degree(propertyValue.y), thatUserAnimations.rotationPrecision);
                showValue.z = cmnPcr.toFixed(common3DFunction.radian2degree(propertyValue.z), thatUserAnimations.rotationPrecision);
                break;
            }
            case "scale":{
                showValue.x = cmnPcr.toFixed(propertyValue.x, thatUserAnimations.scalePrecision);
                showValue.y = cmnPcr.toFixed(propertyValue.y, thatUserAnimations.scalePrecision);
                showValue.z = cmnPcr.toFixed(propertyValue.z, thatUserAnimations.scalePrecision);
                break;
            }
            case "visibility":{
                showValue.value = propertyValue.value;
                break;
            }
            default:{
                break;
            }
        }
        return showValue;
    }

    this.getTrackText = function (trackName, groupType, groupName){
        switch (groupType){
            case s3dAnimationGroupType.property:{
                return thatUserAnimations.getTrackTextByProperty(trackName, groupName);
            }
            case s3dAnimationGroupType.material:{
                return thatUserAnimations.getTrackTextByMaterial(trackName, groupName);
            }
            default:{
                throw "不支持的分组类型. GroupType=" + groupType;
            }
        }
    }

    this.getTrackTextByMaterial = function (trackName, groupName){
        let propertyName = thatUserAnimations.getMaterialPropertyPostfix(groupName);
        switch(propertyName){
            case "opacity":{
                switch (trackName){
                    case "value":{
                        return "透明度";
                    }
                }
                break;
            }
            case "color":{
                switch (trackName){
                    case "r": {
                        return "红";
                    }
                    case "g": {
                        return "绿";
                    }
                    case "b": {
                        return "蓝";
                    }
                }
                break;
            }
        }
    }

    this.getTrackTextByProperty = function (trackName, propertyName){
        switch(propertyName){
            case "position":
            case "rotation":
            case "scale":{
                switch (trackName){
                    case "x": {
                        return "X";
                    }
                    case "y": {
                        return "Y";
                    }
                    case "z": {
                        return "Z";
                    }
                }
                break;
            }
            case "visibility":{
                return "可见";
            }
        }
    }

    this.getTrackMapByObjectGroup = function (groupName, groupType){
        switch (groupType){
            case s3dAnimationGroupType.property:{
                return thatUserAnimations.getTrackMapByObjectProperty(groupName);
            }
            case s3dAnimationGroupType.material:{
                return thatUserAnimations.getTrackMapByObjectMaterial(groupName);
            }
            default:{
                throw "不支持的分组类型. GroupType=" + groupType;
            }
        }
    }

    this.getTrackMapByObjectMaterial = function (propertyPath){
        let materialPropertyName = thatUserAnimations.getMaterialPropertyPostfix(propertyPath);
        let trackMap = {};
        switch(materialPropertyName){
            case "opacity":{
                trackMap["value"] = "value";
                break;
            }
            case "color":{
                trackMap["r"] = "r";
                trackMap["g"] = "g";
                trackMap["b"] = "b";
                break;
            }
        }
        return trackMap;
    }

    this.getTrackMapByObjectProperty = function (propertyName){
        let trackMap = {};
        switch(propertyName){
            case "position":{
                trackMap["x"] = "x";
                trackMap["y"] = "y";
                trackMap["z"] = "z";
                break;
            }
            case "rotation":{
                trackMap["x"] = "x";
                trackMap["y"] = "y";
                trackMap["z"] = "z";
                break;
            }
            case "scale":{
                trackMap["x"] = "x";
                trackMap["y"] = "y";
                trackMap["z"] = "z";
                break;
            }
            case "visibility":{
                trackMap["value"] = "value";
                break;
            }
        }
        return trackMap;
    }

    this.stopAnimations = function (){
        thatUserAnimations.manager.viewer.stopAnimations(true);
    }

    this.playAnimations = function (animationSettings){
        let mixerActions = [];
        let animationInfos = [];
        for(let i = 0; i < animationSettings.length; i++) {
            let animationSetting = animationSettings[i];
            let animationCode = animationSetting.code;
            let loop = animationSetting.loop;

            let animationInfo = thatUserAnimations.getAnimationInfo(animationCode);
            animationInfos.push(animationInfo);

            let runJson = thatUserAnimations.manager.userAnimations.animationInfoToRunJson(animationInfo, animationInfo.originalValueMap);
            let animationClipMap = thatUserAnimations.manager.userAnimations.generateAnimationClipMap(runJson);
            for (let objectId in animationClipMap) {
                let object3d = thatUserAnimations.manager.viewer.getObject3DById(objectId);
                if(object3d != null) {
                    let animation = animationClipMap[objectId];
                    let mixer = new THREE.AnimationMixer(object3d);
                    let animationAction = mixer.clipAction(animation);
                    animationAction.timeScale = 1;
                    animationAction.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
                    animationAction.clampWhenFinished = true;
                    mixerActions.push({
                        mixer: mixer,
                        action: animationAction,
                        animationCode: animationCode
                    });
                }
            }
        }
        thatUserAnimations.manager.viewer.playAnimations(mixerActions, animationInfos);
    }
}
export default JS3UserAnimations