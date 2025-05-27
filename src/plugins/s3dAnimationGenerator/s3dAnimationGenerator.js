import {
    cmnPcr,
    msgBox, PopupContainer,
    s3dAnimationEditType,
    s3dElement3DType,
    s3dOperateType,
    s3dProgressEditType,
    s3dUiStatus
} from "../../commonjs/common/common.js"
import "./S3dAnimationGenerator.css"
import * as THREE from "three";

//S3dWeb生成动画
let S3dAnimationGenerator = function (){
    //当前对象
    const thatAnimationGenerator= this;

    //containerId
    this.containerId = null;

    //s3d manager
    this.manager = null;

    //初始化
    this.init = function(p){
        thatAnimationGenerator.containerId = p.containerId;
        thatAnimationGenerator.manager = p.manager;
    }

    //弹出生成动画配置窗口
    this.show = function (p){
        let selectedObjectIds = thatAnimationGenerator.manager.viewer.getSelectedObject3DIds();
        if(selectedObjectIds.length === 0){
            msgBox.alert({info: "请先选择一个物体, 再点击此按钮."});
        }
        else if(selectedObjectIds.length > 1){
            msgBox.alert({info: "仅可选择一个物体."});
        }
        else {
            let objectId = selectedObjectIds[0];
            thatAnimationGenerator.showGeneratorWindow(objectId);
        }
    }

    this.showGeneratorWindow = function (objectId){
        let object3D = thatAnimationGenerator.manager.viewer.getObject3DById(objectId);
        let unitInfo = object3D.userData.info;
        let objectName = unitInfo.name;

        let popContainer = new PopupContainer( {
            width : 400,
            height : 180,
            top : 50,
            canClose: true,
            title: "生成动画",
            containerId: thatAnimationGenerator.containerId
        });
        popContainer.show();
        let innerHtml = thatAnimationGenerator.getGeneratorHtml();
        $("#" + popContainer.contentId).html(innerHtml);

        thatAnimationGenerator.setGeneratorValues({
            popContainer: popContainer,
            objectId: objectId,
            objectName: objectName
        });
        thatAnimationGenerator.bindGeneratorEvents(popContainer);
    }

    this.bindGeneratorEvents = function (popContainer){
        let popContainerDiv =  $("#" + popContainer.contentId)[0];
        $(popContainerDiv).find(".s3dAnimationGeneratorBtn[name='ok']").click(function (){
            let values = thatAnimationGenerator.getGeneratorValues(popContainer);
            if(values.orbitId.length === 0){
                msgBox.alert({info: "请选择路径."});
            }
            else {
                let orbit3D = thatAnimationGenerator.manager.viewer.getObject3DById(values.orbitId);
                let object3D = thatAnimationGenerator.manager.viewer.getObject3DById(values.objectId);
                thatAnimationGenerator.generateAnimation(popContainer, orbit3D, object3D);
            }
        });
    }

    //计算依此轨道和朝向，计算运行时物体的角度
    this.calcRotations = function (orbitInfo, objectInfo, objectParentInverseMatrixWorld, orbitMatrixWorld, orbitCreator, positions, isCycle, targetInObjectParent){
        let rotations = [];
        for(let i = 0; i < positions.length; i++) {
            //object朝向target，且object的y方向与target形成的面垂直于地面
            let pInObjectParent = positions[i];
            let tempTargetInObjectParent = targetInObjectParent;
            if(tempTargetInObjectParent === null) {
                let pNextInObjectParent = null;
                if (isCycle) {
                    pNextInObjectParent = i === positions.length - 1 ? positions[0] : positions[i + 1];
                } else {
                    if (i === positions.length - 1) {
                        pInObjectParent = positions[i - 1]
                        pNextInObjectParent = positions[i];
                    } else {
                        pNextInObjectParent = positions[i + 1];
                    }
                }

                tempTargetInObjectParent = new THREE.Vector3(
                    pNextInObjectParent.x + (pNextInObjectParent.x - pInObjectParent.x) * 1000,
                    pNextInObjectParent.y + (pNextInObjectParent.y - pInObjectParent.y) * 1000,
                    pNextInObjectParent.z + (pNextInObjectParent.z - pInObjectParent.z) * 1000);

            }

            let direction = new THREE.Vector3().subVectors(pInObjectParent, tempTargetInObjectParent).normalize();
            const quaternion = new THREE.Quaternion();
            const up = new THREE.Vector3(0, 1, 0);
            const right = new THREE.Vector3().crossVectors(up, direction).normalize();
            const objectUp = new THREE.Vector3().crossVectors(direction, right).normalize();
            const rotationMatrix = new THREE.Matrix4();
            rotationMatrix.makeBasis(right, objectUp, direction);
            quaternion.setFromRotationMatrix(rotationMatrix);
            const euler = new THREE.Euler().setFromQuaternion(quaternion);
            rotations.push({
                x: euler.x,
                y: euler.y,
                z: euler.z
            });
        }
        return rotations;
    }

    //计算依此轨道，计算运行时物体位置
    this.calcPositions = function (orbitInfo, objectInfo, objectParentInverseMatrixWorld, orbitMatrixWorld, orbitCreator, fps){
        let points = orbitCreator.createOrbitPoints(orbitInfo, fps);
        let positions = [];
        for(let i = 0; i < points.length; i++){
            let point = points[i];
            let pInOrbit = new THREE.Vector3(point.x, point.y, point.z);
            let pInWorld = pInOrbit.clone().applyMatrix4(orbitMatrixWorld);
            let pInObjectParent = pInWorld.clone().applyMatrix4(objectParentInverseMatrixWorld);
            positions.push({
                x: pInObjectParent.x,
                y: pInObjectParent.y,
                z: pInObjectParent.z
            });
        }
        return positions;
    }

    this.getTargetInObjectParent = function (orbitInfo, objectInfo, objectParentInverseMatrixWorld, orbitMatrixWorld){
        if(objectInfo.type === s3dElement3DType.camera){
            switch(orbitInfo.code){
                case "Orbit-Circle": {
                    let targetInOrbit = new THREE.Vector3(0, 0, 0);
                    let targetInWorld = targetInOrbit.clone().applyMatrix4(orbitMatrixWorld);
                    return targetInWorld.clone().applyMatrix4(objectParentInverseMatrixWorld);
                }
                default:{
                    return null;
                }
            }
        }
        else{
            return null;
        }
    }

    this.generateAnimation = function (popContainer, orbit3D, object3D) {
        let orbitInfo = orbit3D.userData.info;
        let objectInfo = object3D.userData.info;

        let objectParentInverseMatrixWorld = object3D.parent.matrixWorld.clone().invert();
        let orbitMatrixWorld = orbit3D.matrixWorld;

        let defaultFPS = thatAnimationGenerator.manager.userAnimations.defaultFPS;
        let orbitCreator = thatAnimationGenerator.manager.internalObjectCreator.orbitCreator;
        let isCycle = orbitCreator.getIsCycle(orbitInfo);
        let targetInObjectParent = thatAnimationGenerator.getTargetInObjectParent(orbitInfo, objectInfo, objectParentInverseMatrixWorld, orbitMatrixWorld);

        let positions = thatAnimationGenerator.calcPositions(orbitInfo, objectInfo, objectParentInverseMatrixWorld, orbitMatrixWorld, orbitCreator, defaultFPS);
        let rotations = thatAnimationGenerator.calcRotations(orbitInfo, objectInfo, objectParentInverseMatrixWorld, orbitMatrixWorld, orbitCreator, positions, isCycle, targetInObjectParent);

        let animationInfo = null;
        if (objectInfo.isInternal) {
            switch (objectInfo.type) {
                case s3dElement3DType.camera: {
                    animationInfo = thatAnimationGenerator.generateObjectAnimation({
                        positions: positions,
                        rotations: rotations,
                        orbitInfo: orbitInfo,
                        objectInfo: objectInfo
                    });
                    break;
                }
                default: {
                    msgBox.alert({info: "尚未支持的对象类型."});
                }
            }
        } else {
            animationInfo = thatAnimationGenerator.generateObjectAnimation({
                positions: positions,
                rotations: rotations,
                orbitInfo: orbitInfo,
                objectInfo: objectInfo
            });
        }
        if (animationInfo !== null) {
            thatAnimationGenerator.manager.userAnimations.updateAnimation(animationInfo);
            thatAnimationGenerator.manager.animationList.refreshAnimation(animationInfo.code);
            thatAnimationGenerator.manager.animationList.showAnimationList();
            thatAnimationGenerator.manager.animationList.showAnimationInfo(animationInfo.code);
            popContainer.close();
        }
    }

    this.generateObjectAnimation = function (p) {
        let positions = p.positions;
        let rotations = p.rotations;
        let orbitInfo = p.orbitInfo;
        let objectInfo = p.objectInfo;

        let animationName = objectInfo.name + "_" + orbitInfo.name + "_" + "动画";
        let animationInfo = thatAnimationGenerator.manager.userAnimations.getAnimationInfoByName(animationName);
        let needCreateNewAnimation = false;
        if(animationInfo !== null
            && msgBox.confirm({info: "已存在同名动画\"" + animationName + "\"，请问需要覆盖此动画吗?"})) {
            needCreateNewAnimation = true;
        }
        if(!needCreateNewAnimation) {
            animationInfo = animationInfo = thatAnimationGenerator.manager.userAnimations.getNewAnimationInfo(animationName);
        }

        //基本信息
        animationInfo.frameCount = positions.length;
        animationInfo.groups = [];
        animationInfo.eventMap = {};

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

        //位置属性
        let animationPositionGroupInfo = {
            type: "property",
            code: cmnPcr.createGuid(),
            objectId: objectInfo.id,
            name: "position",
            tracks: []
        };
        for (let i = 0; i < valueNameInfos.length; i++) {
            let valueNameInfo = valueNameInfos[i];
            let trackInfo = {
                code: cmnPcr.createGuid(),
                name: valueNameInfo.name,
                keyFrames: []
            };
            animationPositionGroupInfo.tracks.push(trackInfo);
            for(let j = 0; j < positions.length; j++){
                let position = positions[j];
                trackInfo.keyFrames.push({
                    frameIndex: j + 1,
                    value: position[valueNameInfo.name],
                    leftLineType: "linear",
                    rightLineType: "linear",
                });
            }
        }
        animationInfo.groups.push(animationPositionGroupInfo);

        //旋转属性
        let animationRotationGroupInfo = {
            type: "property",
            code: cmnPcr.createGuid(),
            objectId: objectInfo.id,
            name: "rotation",
            tracks: []
        };
        for (let i = 0; i < valueNameInfos.length; i++) {
            let valueNameInfo = valueNameInfos[i];
            let trackInfo = {
                code: cmnPcr.createGuid(),
                name: valueNameInfo.name,
                keyFrames: []
            };
            animationRotationGroupInfo.tracks.push(trackInfo);
            for(let j = 0; j < rotations.length; j++){
                let rotation = rotations[j];
                trackInfo.keyFrames.push({
                    frameIndex: j + 1,
                    value: rotation[valueNameInfo.name],
                    leftLineType: "linear",
                    rightLineType: "linear",
                });
            }
        }
        animationInfo.groups.push(animationRotationGroupInfo);

        return animationInfo;
    }

    this.getGeneratorValues = function (popContainer){
        let popContainerDiv =  $("#" + popContainer.contentId)[0];
        let objectInput = $(popContainerDiv).find(".s3dAnimationGeneratorItemInput[name='object']")[0];
        let objectId = $(objectInput).attr("objectId");

        let orbitInput = $(popContainerDiv).find(".s3dAnimationGeneratorItemInput[name='orbit']")[0];
        let orbitId = $(orbitInput).val();

        return {
            objectId: objectId,
            orbitId: orbitId
        };
    }


    this.setGeneratorValues = function (p){
        let popContainerDiv =  $("#" + p.popContainer.contentId)[0];
        //object
        let objectInput = $(popContainerDiv).find(".s3dAnimationGeneratorItemInput[name='object']")[0];
        $(objectInput).attr("objectId", p.objectId);
        $(objectInput).val(p.objectName);

        //allOrbitInfos
        let allOrbitInfos = thatAnimationGenerator.getAllOrbitInfos();
        let orbitInput = $(popContainerDiv).find(".s3dAnimationGeneratorItemInput[name='orbit']")[0];
        let orbitInnerHtml = "";
        for(let i = 0; i < allOrbitInfos.length; i++){
            let orbitInfo = allOrbitInfos[i];
            orbitInnerHtml += ("<option value='" + orbitInfo.id + "'>" + cmnPcr.htmlEncode(orbitInfo.name) + "</option>");
        }
        $(orbitInput).html(orbitInnerHtml);
    }

    this.getAllOrbitInfos = function (){
        let allOrbitInfos = [];
        for(let objectId in thatAnimationGenerator.manager.viewer.allObject3DMap){
            let object3D = thatAnimationGenerator.manager.viewer.getObject3DById(objectId);
            let unitInfo = object3D.userData.info;
            if(unitInfo.isInternal && unitInfo.type === s3dElement3DType.orbit){
                allOrbitInfos.push({
                    id: objectId,
                    name: unitInfo.name
                });
            }
        }
        return allOrbitInfos;
    }

    this.getGeneratorHtml = function (){
        return "<div class='s3dAnimationGeneratorContainer'>"
            + "<div class='s3dAnimationGeneratorInnerContainer'>"

            //对象
            + "<div class='s3dAnimationGeneratorItemContainer'>"
            + "<div class='s3dAnimationGeneratorItemTitle'>对象</div>"
            + "<div class='s3dAnimationGeneratorItemValue'>"
            + "<input type='text' name='object' readonly autocomplete='off' class='s3dAnimationGeneratorItemInput s3dAnimationGeneratorItemInputString s3dAnimationGeneratorItemInputReadonly' />"
            + "</div>"
            + "</div>"

            //路径
            + "<div class='s3dAnimationGeneratorItemContainer'>"
            + "<div class='s3dAnimationGeneratorItemTitle'>路径</div>"
            + "<div class='s3dAnimationGeneratorItemValue'>"
            + "<select name='orbit' autocomplete='off' class='s3dAnimationGeneratorItemInput s3dAnimationGeneratorItemInputString' ></select>"
            + "</div>"
            + "</div>"

            + "</div>"
            + "<div class='s3dAnimationGeneratorBottomContainer'>"
            + "<div class='s3dAnimationGeneratorBtn s3dAnimationGeneratorBtnOk' name='ok'>确定</div>"
            + "</div>"
            + "</div>";
    }
}

export default S3dAnimationGenerator