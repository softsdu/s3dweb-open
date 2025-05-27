import * as THREE from "three"
import {s3dClockDirection, s3dLayerType} from "../../../commonjs/common/common.js";
import {S3dOrbitCircle} from "./orbit/s3dOrbitCircle.js";

let S3dOrbitCreator = function (){
    var thatOrbitCreator = this;

    this.manager = null;

    this.init = function (p){
        thatOrbitCreator.manager = p.manager;
    }

    this.orbitLineMaterial = new THREE.LineBasicMaterial({
        color: 0xffffff,
        linewidth: 1,
        transparent: true,
        opacity: 0.5
    });

    this.create = function (p){
        let objectSetting = p.objectSetting;
        let componentInfo = p.componentInfo;
        let orbitObj = null;
        let defaultFPS = thatOrbitCreator.manager.userAnimations.defaultFPS;
        switch(objectSetting.code){
            case "Orbit-Circle":{
                orbitObj = thatOrbitCreator.createCircleOrbit(objectSetting, defaultFPS);
                break;
            }
            default:{
                throw "未知的相机轨道类型. Code=" + objectSetting.code;
            }
        }

        thatOrbitCreator.manager.viewer.enableObjectLayer(orbitObj, s3dLayerType.editLayer, true);
        return orbitObj;
    }

    this.createHelper = function (orbit3D){
        let info = orbit3D.userData.info;
        let helper = null;
        switch(info.code){
            default:{
                //无helper
                break;
            }
        }
        if(helper != null){
            thatOrbitCreator.manager.viewer.enableObjectLayer(helper, s3dLayerType.editLayer, true);
        }
        return helper;
    }

    this.createOrbitPoints = function (objectSetting, fps){
        switch(objectSetting.code){
            case "Orbit-Circle":{
                let parameters = objectSetting.parameters;
                let radius = parameters.radius.value;
                let height = parameters.height.value;
                let startAngle = parameters.startAngle.value;
                let frequency = parameters.frequency.value;
                let duration = parameters.duration.value;
                let direction = parameters.direction.value;
                return  thatOrbitCreator.calcCirclePoints(fps, radius, height, startAngle, frequency, duration, direction);
            }
            default:{
                throw "未知的相机轨道类型. Code=" + objectSetting.code;
            }
        }
    }

    this.getIsCycle = function (objectSetting){
        switch(objectSetting.code){
            case "Orbit-Circle":{
                return true;
            }
            default:{
                return false;
            }
        }
    }

    this.createCircleOrbit = function (objectSetting, fps){
        let parameters = objectSetting.parameters;
        let radius = parameters.radius.value;
        let height = parameters.height.value;
        let startAngle = parameters.startAngle.value;
        let frequency = parameters.frequency.value;
        let duration = parameters.duration.value;
        let direction = parameters.direction.value;
        let points = thatOrbitCreator.calcCirclePoints(fps, radius, height, startAngle, frequency, duration, direction);

        let orbit=new S3dOrbitCircle({
            radius: radius,
            height: height,
            startAngle: startAngle,
            frequency: frequency,
            duration: duration,
            points: points,
            orbitLineMaterial: thatOrbitCreator.orbitLineMaterial
        });
        orbit.position.set(objectSetting.position[0], objectSetting.position[1], objectSetting.position[2]).normalize();

        thatOrbitCreator.manager.viewer.enableObjectLayer(orbit, s3dLayerType.editLayer, true);
        thatOrbitCreator.manager.viewer.disableObjectLayer(orbit, s3dLayerType.viewLayer, true);

        return orbit;
    }

    this.calcCirclePoints = function (fps, radius, height, startAngle, frequency, duration, direction){
        let points = [];
        let frameCount = duration * fps;

        let radianStep = (2 * Math.PI) / frameCount;
        let startRadian = Math.PI * startAngle / 180;
        for (let i = 0; i < frameCount; i++) {
            let tempRadian = startRadian + i * radianStep;
            let x = radius * Math.cos(tempRadian);
            let y = 0;
            let z = radius * Math.sin(tempRadian);
            points.push({
                x: x,
                y: y,
                z: z
            });
        }

        if(direction === s3dClockDirection.anticlockwise){
            points.reverse();
        }

        let yRadianStep = frequency * 2 * Math.PI / frameCount
        for(let i = 0; i < frameCount; i++){
            let tempRadian = i * yRadianStep;
            points[i].y = height * Math.sin(tempRadian) / 2;
        }

        return points;
    }

}
export default S3dOrbitCreator