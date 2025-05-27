import * as THREE from "three"
import {S3dParticleWater} from "./particle/s3dParticleWater.js";

let S3dParticleCreator = function (){
    var thatParticleCreator = this;

    this.manager = null;

    this.init = function (p){
        thatParticleCreator.manager = p.manager;
    }

    this.create = function (p){
        let objectSetting = p.objectSetting;
        let componentInfo = p.componentInfo;
        let particleGroup = null;
        switch(objectSetting.code){
            case "Particle-Water":{
                particleGroup = thatParticleCreator.createParticleWater(objectSetting, componentInfo);
                break;
            }
            default:{
                throw "未知的粒子类型. Code=" + objectSetting.code;
            }
        }
        if(particleGroup != null){
            particleGroup.update = function (){
                this.children[0].update();
            }
        }

        return particleGroup;
    }

    this.createParticleWater = function (objectSetting, componentInfo){
        let parameters = objectSetting.parameters;
        let speed = parameters.speed.value;
        let waterColorStr = parameters.waterColor.value;
        let waterColor = common3DFunction.stringToRGBInt(waterColorStr);
        let options = {
            normalImageUrl: thatParticleCreator.manager.layout.imagesFolder + "internal/particle/" + componentInfo.textureMap.normal,
            speed: speed,
            waterColor: waterColor
        };
        let particleObj = new S3dParticleWater(options);
        particleObj.rotation.set(-Math.PI / 2, 0, 0);
        let group = new THREE.Group();
        group.add(particleObj);
        group.position.set(objectSetting.position[0], objectSetting.position[1], objectSetting.position[2]).normalize();
        return group;
    }

    this.createHelper = function (particle3D){
        return null;
    }
}
export default S3dParticleCreator