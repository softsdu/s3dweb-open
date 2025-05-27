import {
    cmnPcr,
    msgBox,
    s3dProgressEditType,
    s3dElement3DType,
    s3dOperateType,
    s3dUiStatus, PopupContainer
} from "../../commonjs/common/common.js"
import "./s3dProgressOperator.css"
import * as THREE from "three";

//流程设计
let S3dProgressOperator = function () {
    //当前对象
    const thatProgressOperator = this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;


    //TempObject边框材质
    this.tempObjectEdgeMaterial = new THREE.LineBasicMaterial({
        color: 0x888888,
        linewidth: 1
    });

    //TempObject高亮显示的材质
    this.tempObjectMaterial = new THREE.MeshStandardMaterial({
        color: 0xAAAAAA,
        transparent: true,
        opacity: 0.3,
        flatShading: true,
        side: THREE.FrontSide
    });

    //事件
    this.eventFunctions = {};
    this.addEventFunction = function (eventName, func) {
        let allFuncs = thatProgressOperator.eventFunctions[eventName];
        if (allFuncs == null) {
            allFuncs = [];
            thatProgressOperator.eventFunctions[eventName] = allFuncs;
        }
        allFuncs.push(func);
    }
    this.doEventFunction = function (eventName, p) {
        let allFuncs = thatProgressOperator.eventFunctions[eventName];
        if (allFuncs != null) {
            for (let i = 0; i < allFuncs.length; i++) {
                let func = allFuncs[i];
                func(p);
            }
        }
    }

    //初始化
    this.init = function (p) {
        thatProgressOperator.containerId = p.containerId;
        thatProgressOperator.manager = p.manager;
        thatProgressOperator.showProgressList(p.config.title);
    }

    this.onObject3DPosRotScaleChanged = function (p){
        let unitJson = p.objectJson;
        let tempObjectId = unitJson.userData == null ? null : unitJson.userData.tempObjectId;
        if(tempObjectId != null){
            let tempObject3D = thatProgressOperator.manager.viewer.getObject3DById(tempObjectId);
            if(tempObject3D != null) {
                let currentObject3D = thatProgressOperator.manager.viewer.getObject3DById(p.objectJson.id);

                //判断位置是否靠近了
                let box = new THREE.Box3().setFromObject(currentObject3D, true);
                let attachXDistance = (box.max.x - box.min.x) / 20;
                let attachYDistance = (box.max.y - box.min.y) / 20;
                let attachZDistance = (box.max.z - box.min.z) / 20;
                let currentPosition = new THREE.Vector3(
                    currentObject3D.position.x,
                    currentObject3D.position.y,
                    currentObject3D.position.z
                );
                currentPosition = currentPosition.applyMatrix4(tempObject3D.matrixWorld);
                let tempPosition = new THREE.Vector3(
                    tempObject3D.position.x,
                    tempObject3D.position.y,
                    tempObject3D.position.z
                );
                tempPosition = tempPosition.applyMatrix4(tempObject3D.matrixWorld);
                let isPositionAttached = (Math.abs(currentPosition.x - tempPosition.x) < attachXDistance
                    && Math.abs(currentPosition.y - tempPosition.y) < attachYDistance
                    && Math.abs(currentPosition.z - tempPosition.z) < attachZDistance);


                //判断角度是否一致了
                let attachRotation = Math.PI / 18;
                let isRotationAttached = (Math.abs(currentObject3D.rotation.x - tempObject3D.rotation.x) < attachRotation
                    && Math.abs(currentObject3D.rotation.y - tempObject3D.rotation.y) < attachRotation
                    && Math.abs(currentObject3D.rotation.z - tempObject3D.rotation.z) < attachRotation);

                //判断缩放是否一致了
                let attachScale = 1 / 5;
                let isScaleAttached = ((currentObject3D.scale.x !== 0 && Math.abs((currentObject3D.scale.x - tempObject3D.scale.x) / currentObject3D.scale.x) < attachScale)
                    && (currentObject3D.scale.y !== 0 && Math.abs(currentObject3D.scale.y - tempObject3D.scale.y) < attachScale)
                    && (currentObject3D.scale.z !== 0 && Math.abs(currentObject3D.scale.z - tempObject3D.scale.z) < attachScale));

                if(isPositionAttached && isRotationAttached && isScaleAttached){
                    thatProgressOperator.manager.viewer.setObjectPositionRotationScaleById(unitJson.id,
                        currentObject3D.userData.info.userWorldPosition,
                        tempObject3D.position,
                        tempObject3D.rotation,
                        tempObject3D.scale);

                    //跳转到下一步
                    thatProgressOperator.manager.moveHelper.detach();
                    thatProgressOperator.gotoNextStep();
                }
            }
        }
    }

    this.gotoNextStep = function (){
        let container = $("#" + thatProgressOperator.containerId);
        let currentProgressItem = $(container).find(".s3dProgressOperatorStepItemActive")[0];
        let nextProgressItem = $(currentProgressItem).next()[0];
        if(nextProgressItem == null){
            //结束
            let popContainer = new PopupContainer( {
                width : 360,
                height : 150,
                top : 50,
                canClose: true,
                title: "提示",
                containerId: thatProgressOperator.containerId
            });
            popContainer.show();
            let html = thatProgressOperator.getSucceedFormHtml();
            $("#" + popContainer.contentId).html(html);
            thatProgressOperator.bindSucceedFormEvents(popContainer);
        }
        else{
            //进入下一步
            let popContainer = new PopupContainer( {
                width : 500,
                height : 240,
                top : 50,
                canClose: true,
                title: "提示",
                containerId: thatProgressOperator.containerId
            });
            popContainer.show();
            let nextStepId = $(nextProgressItem).attr("stepId");
            let html = thatProgressOperator.getNextProgressFormHtml(nextStepId);
            $("#" + popContainer.contentId).html(html);
            thatProgressOperator.bindNextProgressFormEvents(popContainer);
        }
    }

    this.bindSucceedFormEvents = function (popContainer){
        let container = $("#" + thatProgressOperator.containerId);
        $(container).find(".s3dProgressOperatorFormOuterContainer .s3dProgressOperatorFormBottomBtnOk").click(function (){
            thatProgressOperator.manager.viewer.removeAllTempObjects();
            popContainer.close();
        });
    }

    this.bindNextProgressFormEvents = function (popContainer){
        let container = $("#" + thatProgressOperator.containerId);
        $(container).find(".s3dProgressOperatorFormOuterContainer .s3dProgressOperatorFormBottomBtnNext").click(function (){
            let nextStepId = $(this).attr("nextStepId");
            thatProgressOperator.focusStep(nextStepId);
            popContainer.close();
        });
    }

    this.getSucceedFormHtml = function (){
        let html = ("<div class='s3dProgressOperatorFormOuterContainer'>"
            + "<div class='s3dProgressOperatorFormInnerContainer'>"
            + "<div class='s3dProgressOperatorFormBottomLine'>恭喜你, 已成功操作全部步骤!</div>"
            + "</div>"
            + "<div class='s3dProgressOperatorFormBottomContainer'>"
            + "<div class='s3dProgressOperatorFormBottomBtn s3dProgressOperatorFormBottomBtnOk'>确定</div>"
            + "</div>"
            + "</div>");
        return html;
    }

    this.getNextProgressFormHtml = function (nextStepId) {
        let container = $("#" + thatProgressOperator.containerId);
        let nextStepItem = $(container).find(".s3dProgressOperatorStepItem[stepId='" + nextStepId + "']")[0];
        let nextStepJson = cmnPcr.strToJson($(nextStepItem).attr("stepJson"));
        let html = ("<div class='s3dProgressOperatorFormOuterContainer'>"
            + "<div class='s3dProgressOperatorFormInnerContainer'>"
            + "<div class='s3dProgressOperatorFormBottomLine'>操作成功! 点击按钮\"下一步\"进行后续操作.</div>");

        if (nextStepJson.description != null && nextStepJson.description.length !== 0) {
            html += "<div class='s3dProgressOperatorFormBottomLine'>下一步信息: " + cmnPcr.htmlEncode(nextStepJson.description) + "</div>";
        }
        html += ("</div>"
            + "<div class='s3dProgressOperatorFormBottomContainer'>"
            + "<div class='s3dProgressOperatorFormBottomBtn s3dProgressOperatorFormBottomBtnNext' nextStepId='" + nextStepId + "'>下一步</div>"
            + "</div>"
            + "</div>");
        return html;
    }

    //获取动画列表
    this.getProgressList = function () {
        return thatProgressOperator.progressList;
    }

    //显示
    this.showProgressList = function () {
        //构造html
        let html = thatProgressOperator.getHtml();
        let container = $("#" + thatProgressOperator.containerId);
        let animationListContainer = $(container).find(".s3dLayoutBlock[name='progressOperator']");
        $(animationListContainer).html(html);

        thatProgressOperator.refreshNoneProgressItem();
        thatProgressOperator.setStepValues();
        thatProgressOperator.bindEvents();
    }

    this.setStepValues = function () {
        let container = $("#" + thatProgressOperator.containerId);
        let progressItems = $(container).find(".s3dProgressOperatorItem");
        for (let i = 0; i < progressItems.length; i++) {
            let progressItem = progressItems[i];
            let progressCode = $(progressItem).attr("progressCode");
            let progressInfo = thatProgressOperator.manager.userProgresses.getProgressInfo(progressCode);
            let stepItems = $(progressItem).find(".s3dProgressOperatorStepItem");
            for (let j = 0; j < stepItems.length; j++) {
                let stepItem = stepItems[j];
                let stepId = $(stepItem).attr("stepId");
                let stepInfo = progressInfo.nodeMap[stepId];
                let StepJsonStr = cmnPcr.jsonToStr(stepInfo);
                $(stepItem).attr("stepJson", StepJsonStr);
            }
        }
    }

    this.refreshNoneProgressItem = function () {
        let container = $("#" + thatProgressOperator.containerId);
        let items = $(container).find(".s3dProgressOperatorItem");
        $(container).find(".s3dProgressOperatorNoneItem").css({display: (items.length > 0 ? "none" : "block")});
    }

    this.bindEvents = function () {
        let container = $("#" + thatProgressOperator.containerId);

        $(container).find(".s3dProgressOperatorItem").click(function () {
            let progressCode = $(this).attr("progressCode");
            thatProgressOperator.focusProgress(progressCode);
        });

        $(container).find(".s3dProgressOperatorStepItem").click(function () {
            let stepId = $(this).attr("stepId");
            thatProgressOperator.focusStep(stepId);
        });

        $(container).find(".s3dProgressOperatorItem .s3dProgressOperatorItemBtnExpand").click(function () {
            let progressCode = $(this).parent().parent().attr("progressCode");
            thatProgressOperator.expandProgressSteps(progressCode);
        });
    }

    this.expandProgressSteps = function (progressCode) {
        let container = $("#" + thatProgressOperator.containerId);
        let progressItem = $(container).find(".s3dProgressOperatorItem[progressCode='" + progressCode + "']");
        if (progressItem.hasClass("s3dProgressOperatorItemExpand")) {
            $(progressItem).removeClass("s3dProgressOperatorItemExpand");
        } else {
            $(progressItem).addClass("s3dProgressOperatorItemExpand");
        }
        return false;
    }

    //获取list html
    this.getHtml = function () {
        let html = "";
        html += ("<div class='s3dProgressOperatorContainer'>");
        html += ("<div class='s3dProgressOperatorHeaderContainer'><div class='s3dProgressOperatorHeader'>");
        html += ("<div class='s3dProgressOperatorListTitle'>流程列表</div>");
        html += ("</div></div>");
        html += ("<div class='s3dAnimationPlayerListContainer'></div>");
        html += thatProgressOperator.getProgressListHtml(thatProgressOperator.manager.userProgresses.progressList);
        html += thatProgressOperator.getNoneProgressItemHtml();
        html += ("</div>");
        html += "</div>";
        return html;
    }

    this.getProgressListHtml = function (progressList) {
        let html = "";
        if (progressList != null && progressList.length !== 0) {
            let sortedList = thatProgressOperator.getSortedList(progressList);
            for (let i = 0; i < sortedList.length; i++) {
                let progressInfo = sortedList[i];
                html += thatProgressOperator.getProgressItemHtml(i, progressInfo);
            }
        }
        return html;
    }

    this.getProgressItemHtml = function (index, progressInfo) {
        let indexStr = cmnPcr.arabicToChinese(index + 1);
        let html = "";
        html += ("<div class='s3dProgressOperatorItem' progressCode='" + progressInfo.code + "'>");
        html += ("<div class='s3dProgressOperatorItemHeader'>");
        html += ("<div class='s3dProgressOperatorItemName'>");
        html += ("<span class='s3dProgressOperatorItemIndex'>" + indexStr + ".</span>");
        html += ("<span class='s3dProgressOperatorItemTitle'>" + cmnPcr.htmlEncode(progressInfo.name) + "</span>");
        html += ("</div>");
        html += ("<div class='s3dProgressOperatorItemBtn s3dProgressOperatorItemBtnExpand'>&#x25B6;</div>");
        html += ("</div>");
        html += ("<div class='s3dProgressOperatorStepContainer'>");

        let stepList = thatProgressOperator.getSortedStepList(progressInfo);
        if (stepList.length > 0) {
            for (let i = 0; i < stepList.length; i++) {
                let stepInfo = stepList[i];
                html += ("<div class='s3dProgressOperatorStepItem' stepId='" + stepInfo.id + "'>");
                html += ("<div class='s3dProgressOperatorStepItemName'>");
                html += ("<span class='s3dProgressOperatorStepItemIndex'>" + cmnPcr.htmlEncode(stepInfo.code) + ".</span>");
                html += ("<span class='s3dProgressOperatorStepItemTitle'>" + cmnPcr.htmlEncode(stepInfo.name) + "</span>");
                html += ("</div>");
                html += ("</div>");
            }
        } else {
            html += thatProgressOperator.getNoneStepItemHtml();
        }

        html += ("</div>");
        html += ("</div>");
        return html;
    }

    this.getNoneProgressItemHtml = function () {
        let html = "";
        html += ("<div class='s3dProgressOperatorNoneItem'>尚未定义流程</div>");
        return html;
    }

    this.getNoneStepItemHtml = function () {
        let html = "";
        html += ("<div class='s3dProgressOperatorNoneStepItem'>尚未定义步骤</div>");
        return html;
    }

    this.focusProgress = function (progressCode) {
        thatProgressOperator.manager.viewer.stopAnimations();
        let container = $("#" + thatProgressOperator.containerId);
        let activeProgressItem = $(container).find(".s3dProgressOperatorItemActive");
        let activeProgressCode = (activeProgressItem).attr("progressCode");
        if (activeProgressCode !== progressCode) {
            thatProgressOperator.manager.viewer.restoreAllObjectOriginalState();
            thatProgressOperator.manager.viewer.removeAllTempObjects();
            $(container).find(".s3dProgressOperatorItem").removeClass("s3dProgressOperatorItemActive");
            let progressItem = $(container).find(".s3dProgressOperatorItem[progressCode='" + progressCode + "']")[0];
            $(progressItem).addClass("s3dProgressOperatorItemActive");
        }
    }

    this.focusStep = function (stepId) {
        let container = $("#" + thatProgressOperator.containerId);
        let stepItem = $(container).find(".s3dProgressOperatorStepItem[stepId='" + stepId + "']")[0];

        let progressItem = $(stepItem).parent().parent();
        let progressCode = $(progressItem).attr("progressCode");
        thatProgressOperator.focusProgress(progressCode);


        $(container).find(".s3dProgressOperatorStepItem").removeClass("s3dProgressOperatorStepItemActive");
        $(stepItem).addClass("s3dProgressOperatorStepItemActive");

        let preStepItems = $(stepItem).prevAll('.s3dProgressOperatorStepItem');
        let nextStepItems = $(stepItem).nextAll('.s3dProgressOperatorStepItem');

        thatProgressOperator.manager.viewer.removeAllTempObjects();
        thatProgressOperator.refreshStepObjectStatus(stepItem, preStepItems, nextStepItems);
    }

    this.refreshStepObjectStatus = function (currentStepItem, preStepItems, nextStepItems) {
        let objectPropertyMap = {};
        let displayObjectIds = [];

        //pre
        for (let i = 0; i < preStepItems.length; i++) {
            let preStepItem = preStepItems[i];
            let stepInfo = cmnPcr.strToJson($(preStepItem).attr("stepJson"));
            let endFrame = stepInfo.startFrame + stepInfo.durationFrame;
            let objectId = stepInfo.objectId;
            let objectInfo = objectPropertyMap[objectId];
            if (objectInfo == null) {
                objectInfo = {
                    propertyMap: {}
                };
                objectPropertyMap[objectId] = objectInfo;
                displayObjectIds.push(objectId);
            }

            for (let propertyName in stepInfo.propertyMap) {
                let newProperty = stepInfo.propertyMap[propertyName];
                let lastProperty = objectInfo.propertyMap[propertyName];
                if (lastProperty == null || lastProperty.endFrame < endFrame) {
                    objectInfo.propertyMap[propertyName] = {
                        endFrame: endFrame,
                        values: {
                            x: newProperty.toValues[0],
                            y: newProperty.toValues[1],
                            z: newProperty.toValues[2]
                        }
                    };
                }
            }
        }

        for (let objectId in objectPropertyMap) {
            let objectInfo = objectPropertyMap[objectId];
            for (let propertyName in objectInfo.propertyMap) {
                let values = objectInfo.propertyMap[propertyName].values;
                thatProgressOperator.manager.userAnimations.refreshViewerObject(objectId, propertyName, "property", values);
            }
        }

        //current
        let currentStepInfo = cmnPcr.strToJson($(currentStepItem).attr("stepJson"));
        let currentObjectId = currentStepInfo.objectId;
        let currentObject3D = thatProgressOperator.manager.viewer.getObject3DById(currentObjectId);
        displayObjectIds.push(currentObjectId);
        let toPosition = [
            currentObject3D.position.x,
            currentObject3D.position.y,
            currentObject3D.position.z
        ];
        let toRotation = [
            currentObject3D.rotation.x,
            currentObject3D.rotation.y,
            currentObject3D.rotation.z
        ];
        let toScale = [
            currentObject3D.scale.x,
            currentObject3D.scale.y,
            currentObject3D.scale.z
        ];

        for (let propertyName in currentStepInfo.propertyMap) {
            let property = currentStepInfo.propertyMap[propertyName];
            let values = {
                x: property.fromValues[0],
                y: property.fromValues[1],
                z: property.fromValues[2]
            }
            switch(propertyName){
                case "position":{
                    toPosition[0] = property.toValues[0];
                    toPosition[1] = property.toValues[1];
                    toPosition[2] = property.toValues[2];
                    break;
                }
                case "rotation":{
                    toRotation[0] = property.toValues[0];
                    toRotation[1] = property.toValues[1];
                    toRotation[2] = property.toValues[2];
                    break;
                }
                case "scale":{
                    toScale[0] = property.toValues[0];
                    toScale[1] = property.toValues[1];
                    toScale[2] = property.toValues[2];
                    break;
                }
            }
            thatProgressOperator.manager.userAnimations.refreshViewerObject(currentStepInfo.objectId, propertyName, "property", values);
        }

        //在目标位置，添加临时对象
        thatProgressOperator.addTempTargetObject(currentObjectId, toPosition, toRotation, toScale);


        //next
        let hideObjectIds = [];
        for (let i = 0; i < nextStepItems.length; i++) {
            let nextStepItem = nextStepItems[i];
            let stepInfo = cmnPcr.strToJson($(nextStepItem).attr("stepJson"));
            let objectId = stepInfo.objectId;
            if (objectId !== currentObjectId && !objectPropertyMap[objectId]) {
                hideObjectIds.push(objectId);
            }
        }
        thatProgressOperator.manager.viewer.setObject3DsVisible(displayObjectIds, true);
        thatProgressOperator.manager.viewer.setObject3DsVisible(hideObjectIds, false);
    }

    this.getSortedList = function (sourceList) {
        let newList = [];
        for (let i = 0; i < sourceList.length; i++) {
            let sourceItem = sourceList[i];
            let added = false;
            let tempList = [];
            for (let j = 0; j < newList.length; j++) {
                let newItem = newList[j];
                if (!added && newItem.name.localeCompare(sourceItem.name) > 0) {
                    tempList.push(sourceItem);
                    added = true;
                }
                tempList.push(newItem);
            }
            if (!added) {
                tempList.push(sourceItem);
            }
            newList = tempList;
        }
        return newList;
    }

    this.addTempTargetObject = function (objectId, position, rotation, scale) {
        //先取消选中当前的对象，再添加
        thatProgressOperator.manager.viewer.cancelSelectObject3Ds();

        //创建临时对象
        let object3D = thatProgressOperator.manager.viewer.getObject3DById(objectId);
        let unitInfo = object3D.userData.info;
        let componentInfo = null;
        if (unitInfo.isInternal) {
            componentInfo = thatProgressOperator.manager.internalObjectCreator.getComponentInfo(unitInfo.code, unitInfo.versionNum);
        } else if (unitInfo.isServer) {
            componentInfo = thatProgressOperator.manager.serverObjectCreator.getComponentInfo(unitInfo.code, unitInfo.versionNum);
        } else {
            componentInfo = thatProgressOperator.manager.localObjectCreator.getComponentInfo(unitInfo.code, unitInfo.versionNum);
        }
        let parameters = {};
        for (let paramName in componentInfo.parameters) {
            let param = componentInfo.parameters[paramName];
            parameters[paramName] = {
                value: unitInfo.parameters[paramName] == null ? null : unitInfo.parameters[paramName].value,
                isGeo: param.isGeo
            };
        }

        if (unitInfo.isInternal) {
            let newInternalNodeJson = {
                position: position,
                rotation: rotation,
                scale: scale,
                code: unitInfo.code,
                versionNum: unitInfo.versionNum,
                isOnGround: false,
                needSelectAfterAdd: true,
                customInfo: unitInfo.customInfo,
                parameters: parameters,
                parentId: unitInfo.parentId,
                isInternal: true,
                isServer: false,
                isLocal: false,
                isTemp: true,
                userData: {
                    objectId: objectId
                }
            };
            thatProgressOperator.manager.viewer.addNewInternalObjects([newInternalNodeJson], thatProgressOperator.afterAddTempObject3D);
        } else if (unitInfo.isServer) {
            let newServerNodeJson = {
                position: position,
                rotation: rotation,
                scale: scale,
                code: unitInfo.code,
                versionNum: unitInfo.versionNum,
                isOnGround: false,
                needSelectAfterAdd: true,
                customInfo: unitInfo.customInfo,
                parameters: parameters,
                parentId: unitInfo.parentId,
                isInternal: false,
                isServer: true,
                isLocal: false,
                isTemp: true,
                userData: {
                    objectId: objectId
                }
            };
            thatProgressOperator.manager.viewer.addNewServerObjects([newServerNodeJson], thatProgressOperator.afterAddTempObject3D);
        } else {
            let newLocalNodeJson = {
                position: position,
                rotation: rotation,
                scale: scale,
                code: unitInfo.code,
                versionNum: unitInfo.versionNum,
                isOnGround: false,
                needSelectAfterAdd: true,
                customInfo: unitInfo.customInfo,
                parameters: parameters,
                materials: unitInfo.materials,
                parentId: unitInfo.parentId,
                isInternal: false,
                isServer: false,
                isLocal: true,
                isTemp: true,
                userData: {
                    objectId: objectId
                }
            };
            thatProgressOperator.manager.viewer.addNewLocalObjects([newLocalNodeJson], thatProgressOperator.afterAddTempObject3D);
        }
    }

    this.afterAddTempObject3D = function (p){
        //设置临时对象相关属性
        thatProgressOperator.manager.viewer.afterAddNewObjectInSilence(p);
        thatProgressOperator.manager.viewer.switchObject3DMaterial(p.object3D, thatProgressOperator.tempObjectMaterial, thatProgressOperator.tempObjectEdgeMaterial);

        //选中当前对象
        let tempUnitInfo = p.object3D.userData.info;
        let currentObjectId = tempUnitInfo.userData.objectId;
        let currentObject3D = thatProgressOperator.manager.viewer.getObject3DById(currentObjectId);
        let currentUnitInfo = currentObject3D.userData.info;
        if(currentUnitInfo.userData == null){
            currentUnitInfo.userData = {};
        }
        currentUnitInfo.userData.tempObjectId = tempUnitInfo.id;
        thatProgressOperator.manager.viewer.selectObject3D(currentObject3D);

        //重新绑定拖拽事件
        thatProgressOperator.manager.moveHelper.removeEventFunction("onObject3DPosRotScaleChanged", thatProgressOperator.onObject3DPosRotScaleChanged);
        thatProgressOperator.manager.moveHelper.addEventFunction("onObject3DPosRotScaleChanged", thatProgressOperator.onObject3DPosRotScaleChanged);
    }

    this.getSortedStepList = function (progressInfo) {
        let newList = [];
        for (let nodeId in progressInfo.nodeMap) {
            let sourceNodeItem = progressInfo.nodeMap[nodeId];
            if (!sourceNodeItem.isGroup) {
                let added = false;
                let tempList = [];
                for (let j = 0; j < newList.length; j++) {
                    let newItem = newList[j];
                    if (!added && sourceNodeItem.startFrame < newItem.startFrame) {
                        tempList.push(sourceNodeItem);
                        added = true;
                    }
                    tempList.push(newItem);
                }
                if (!added) {
                    tempList.push(sourceNodeItem);
                }
                newList = tempList;
            }
        }
        return newList;
    }
}

export default S3dProgressOperator