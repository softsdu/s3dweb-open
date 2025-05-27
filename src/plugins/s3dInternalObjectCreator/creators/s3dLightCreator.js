import * as THREE from "three"
//import {RectAreaLightHelper} from "three/addons";
import {RectAreaLightHelper} from "three/examples/jsm/helpers/RectAreaLightHelper.js"
import {s3dLayerType} from "../../../commonjs/common/common.js";

let S3dLightCreator = function (){
    var thatLightCreator = this;

    this.manager = null;

    //图标材质
    this.iconMaterialMap = {};

    this.iconSize = [1, 1, 1]

    this.init = function (p){
        thatLightCreator.manager = p.manager;
    }

    this.create = function (p){
        let objectSetting = p.objectSetting;
        let componentInfo = p.componentInfo;
        let lightGroup = null;
        switch(objectSetting.code){
            case "Light-Ambient":{
                lightGroup = thatLightCreator.createAmbientLight(objectSetting, componentInfo);
                break;
            }
            case "Light-Hemisphere":{
                lightGroup = thatLightCreator.createHemisphereLight(objectSetting, componentInfo);
                break;
            }
            case "Light-Directional":{
                lightGroup = thatLightCreator.createDirectionalLight(objectSetting, componentInfo);
                break;
            }
            case "Light-Point":{
                lightGroup = thatLightCreator.createPointLight(objectSetting, componentInfo);
                break;
            }
            case "Light-Spot":{
                lightGroup = thatLightCreator.createSpotLight(objectSetting, componentInfo);
                break;
            }
            case "Light-RectArea":{
                lightGroup = thatLightCreator.createRectAreaLight(objectSetting, componentInfo);
                break;
            }
            default:{
                throw "未知的灯光类型. Code=" + objectSetting.code;
            }
        }

        let lightObj = lightGroup.children[0];
        let iconObj = lightGroup.children[1];
        thatLightCreator.manager.viewer.enableObjectLayer(lightObj, s3dLayerType.viewLayer, true);
        thatLightCreator.manager.viewer.enableObjectLayer(iconObj, s3dLayerType.editLayer, true);
        thatLightCreator.manager.viewer.disableObjectLayer(iconObj, s3dLayerType.viewLayer, true);
        return lightGroup;
    }

    this.getIconMaterial = function(objectSetting, componentInfo){
        let material = thatLightCreator.iconMaterialMap[objectSetting.code];
        if(material == null) {
            let loader = new THREE.TextureLoader();
            let texture = loader.load(thatLightCreator.manager.layout.imagesFolder + "internal/light/" + componentInfo.icon);
            switch(objectSetting.code){
                case "Light-Ambient":{
                    material = new THREE.SpriteMaterial({
                        map: texture,
                        color: 0xffffff,
                        transparent: true
                    });
                    break;
                }
                case "Light-Hemisphere":{
                    material = new THREE.SpriteMaterial({
                        map: texture,
                        color: 0xffffff,
                        transparent: true
                    });
                    break;
                }
                case "Light-Directional":{
                    material = new THREE.SpriteMaterial({
                        map: texture,
                        color: 0xFFC49E,
                        transparent: true
                    });
                    break;
                }
                case "Light-Point":{
                    material = new THREE.SpriteMaterial({
                        map: texture,
                        color: 0xffffff,
                        transparent: true
                    });
                    break;
                }
                case "Light-Spot":{
                    material = new THREE.SpriteMaterial({
                        map: texture,
                        color: 0xffffff,
                        transparent: true
                    });
                    break;
                }
                case "Light-RectArea":{
                    material = new THREE.SpriteMaterial({
                        map: texture,
                        color: 0xffffff,
                        transparent: true
                    });
                    break;
                }
            }
            thatLightCreator.iconMaterialMap[objectSetting.code] = material;
        }
        return material;
    }

    this.createHelper = function (light3D){
        let info = light3D.userData.info;
        let light = light3D.children[0];
        let helper = null;
        switch(info.code){
            case "Light-Ambient":{
                //无Helper
                break;
            }
            case "Light-Hemisphere":{
                //无Helper
                break;
            }
            case "Light-Directional":{
                helper = thatLightCreator.createDirectionalHelper(light, info);
                break;
            }
            case "Light-Point":{
                //无Helper，自带的helper功能不好
                break;
            }
            case "Light-Spot":{
                helper = thatLightCreator.createSpotHelper(light, info);
                break;
            }
            case "Light-RectArea":{
                helper = thatLightCreator.createRectAreaHelper(light, info);
                break;
            }
            default:{
                throw "未知的灯光类型. Code=" + info.code;
            }
        }
        if(helper != null){
            thatLightCreator.manager.viewer.enableObjectLayer(helper, s3dLayerType.editLayer, true);
            thatLightCreator.manager.viewer.disableObjectLayer(helper, s3dLayerType.viewLayer, true);
        }
        return helper;
    }


    this.createAmbientLight = function (objectSetting, componentInfo){
        let parameters = objectSetting.parameters;
        let colorStr = parameters.color.value;
        let color = common3DFunction.stringToRGBInt(colorStr);
        let intensity = parameters.intensity.value;

        let light=new THREE.AmbientLight(color, intensity);
        light.position.set(0, 0, 0);

        let iconMaterial = thatLightCreator.getIconMaterial(objectSetting, componentInfo);
        let icon = new THREE.Sprite(iconMaterial);
        icon.position.set(0, 0, 0);
        icon.scale.set(thatLightCreator.iconSize[0], thatLightCreator.iconSize[1], thatLightCreator.iconSize[2]);

        let group = new THREE.Group();
        group.add(light);
        group.add(icon);
        group.position.set(objectSetting.position[0], objectSetting.position[1], objectSetting.position[2]).normalize();
        return group;
    }

    this.createHemisphereLight = function (objectSetting, componentInfo){
        let parameters = objectSetting.parameters;
        let skyColorStr = parameters.skyColor.value;
        let skyColor = common3DFunction.stringToRGBInt(skyColorStr);
        let groundColorStr = parameters.groundColor.value;
        let groundColor = common3DFunction.stringToRGBInt(groundColorStr);
        let intensity = parameters.intensity.value;

        let light=new THREE.HemisphereLight(skyColor, groundColor, intensity);
        light.position.set(0, 0, 0);

        let iconMaterial = thatLightCreator.getIconMaterial(objectSetting, componentInfo);
        let icon = new THREE.Sprite(iconMaterial);
        icon.position.set(0, 0, 0);
        icon.scale.set(thatLightCreator.iconSize[0], thatLightCreator.iconSize[1], thatLightCreator.iconSize[2]);

        let group = new THREE.Group();
        group.add(light);
        group.add(icon);
        group.position.set(objectSetting.position[0], objectSetting.position[1], objectSetting.position[2]).normalize();
        return group;
    }

    this.createDirectionalLight = function (objectSetting, componentInfo){
        let parameters = objectSetting.parameters;
        let colorStr = parameters.color.value;
        let color = common3DFunction.stringToRGBInt(colorStr);
        let intensity = parameters.intensity.value;

        let light=new THREE.DirectionalLight(color, intensity);
        light.position.set(0, 0, 0);
        light.castShadow = parameters.castShadow.value;

        light.shadow.mapSize.height = parameters.mapSizeHeight.value;
        light.shadow.mapSize.width = parameters.mapSizeWidth.value;

        light.shadow.camera.left = parameters.cameraLeft.value;
        light.shadow.camera.right = parameters.cameraRight.value;
        light.shadow.camera.top = parameters.cameraTop.value;
        light.shadow.camera.bottom = parameters.cameraBottom.value;
        light.shadow.camera.near = parameters.cameraNear.value;
        light.shadow.camera.far = parameters.cameraFar.value;

        light.shadow.bias = parameters.bias.value;

        let targetObject = new THREE.Object3D();
        targetObject.position.set(0, -10, 0);
        light.target = targetObject;

        let iconMaterial = thatLightCreator.getIconMaterial(objectSetting, componentInfo);
        let icon = new THREE.Sprite(iconMaterial);
        icon.position.set(0, 0, 0);
        icon.scale.set(thatLightCreator.iconSize[0], thatLightCreator.iconSize[1], thatLightCreator.iconSize[2]);

        let group = new THREE.Group();
        group.add(light);
        group.add(icon);
        group.add(targetObject);
        group.position.set(objectSetting.position[0], objectSetting.position[1], objectSetting.position[2]).normalize();
        return group;
    }

    this.createDirectionalHelper = function (light){
        //let lightHelper= new THREE.DirectionalLightHelper(light, 1, 0xFFD800);
        let lightHelper =  new THREE.CameraHelper(light.shadow.camera);
        return lightHelper;
    }

    this.createPointLight = function (objectSetting, componentInfo){
        let parameters = objectSetting.parameters;
        let colorStr = parameters.color.value;
        let color = common3DFunction.stringToRGBInt(colorStr);
        let intensity = parameters.intensity.value;
        let distance = parameters.distance.value;
        let decay = parameters.decay.value;

        let light=new THREE.PointLight(color, intensity, distance, decay);
        light.position.set(0, 0, 0);
        light.castShadow = parameters.castShadow.value;

        light.shadow.mapSize.height = parameters.mapSizeHeight.value;
        light.shadow.mapSize.width = parameters.mapSizeWidth.value;

        light.shadow.camera.left = parameters.cameraLeft.value;
        light.shadow.camera.right = parameters.cameraRight.value;
        light.shadow.camera.top = parameters.cameraTop.value;
        light.shadow.camera.bottom = parameters.cameraBottom.value;
        light.shadow.camera.near = parameters.cameraNear.value;
        light.shadow.camera.far = parameters.cameraFar.value;

        light.shadow.bias = parameters.bias.value;

        let iconMaterial = thatLightCreator.getIconMaterial(objectSetting, componentInfo);
        let icon = new THREE.Sprite(iconMaterial);
        icon.position.set(0, 0, 0);
        icon.scale.set(thatLightCreator.iconSize[0], thatLightCreator.iconSize[1], thatLightCreator.iconSize[2]);

        let group = new THREE.Group();
        group.add(light);
        group.add(icon);
        group.position.set(objectSetting.position[0], objectSetting.position[1], objectSetting.position[2]).normalize();
        return group;
    }

    this.createSpotLight = function (objectSetting, componentInfo){
        let parameters = objectSetting.parameters;
        let colorStr = parameters.color.value;
        let color = common3DFunction.stringToRGBInt(colorStr);
        let intensity = parameters.intensity.value;
        let distance = parameters.distance.value;
        let angle = parameters.angle.value;
        let penumbra = parameters.penumbra.value;
        let decay = parameters.decay.value;
        let light=new THREE.SpotLight( color, intensity, distance, angle, penumbra, decay);
        light.position.set(0, 0, 0);
        light.castShadow = parameters.castShadow.value;

        light.shadow.mapSize.height = parameters.mapSizeHeight.value;
        light.shadow.mapSize.width = parameters.mapSizeWidth.value;

        light.shadow.camera.left = parameters.cameraLeft.value;
        light.shadow.camera.right = parameters.cameraRight.value;
        light.shadow.camera.top = parameters.cameraTop.value;
        light.shadow.camera.bottom = parameters.cameraBottom.value;
        light.shadow.camera.near = parameters.cameraNear.value;
        light.shadow.camera.far = parameters.cameraFar.value;

        light.shadow.bias = parameters.bias.value;

        let targetObject = new THREE.Object3D();
        targetObject.position.set(0, -1, 0);
        light.target = targetObject;

        let iconMaterial = thatLightCreator.getIconMaterial(objectSetting, componentInfo);
        let icon = new THREE.Sprite(iconMaterial);
        icon.position.set(0, 0, 0);
        icon.scale.set(thatLightCreator.iconSize[0], thatLightCreator.iconSize[1], thatLightCreator.iconSize[2]);

        let group = new THREE.Group();
        group.add(light);
        group.add(icon);
        group.add(targetObject);
        group.position.set(objectSetting.position[0], objectSetting.position[1], objectSetting.position[2]).normalize();
        return group;
    }

    this.createSpotHelper = function (light){
        let lightHelper= new THREE.SpotLightHelper(light, 0xFFD800);
        return lightHelper;
    }

    this.createRectAreaLight = function (objectSetting, componentInfo){
        let parameters = objectSetting.parameters;
        let colorStr = parameters.color.value;
        let color = common3DFunction.stringToRGBInt(colorStr);
        let intensity = parameters.intensity.value;
        let width = parameters.width.value;
        let height = parameters.height.value;
        let light=new THREE.RectAreaLight(color, intensity, width, height);
        light.position.set(0, 0, 0);

        let iconMaterial = thatLightCreator.getIconMaterial(objectSetting, componentInfo);
        let icon = new THREE.Sprite(iconMaterial);
        icon.position.set(0, 0, 0);
        icon.scale.set(thatLightCreator.iconSize[0], thatLightCreator.iconSize[1], thatLightCreator.iconSize[2]);

        let group = new THREE.Group();
        group.add(light);
        group.add(icon);
        group.position.set(objectSetting.position[0], objectSetting.position[1], objectSetting.position[2]).normalize();
        return group;
    }

    this.createRectAreaHelper = function (light){
        let lightHelper= new RectAreaLightHelper(light, light.color);
        lightHelper.update = function (){

        }
        return lightHelper;
    }
}
export default S3dLightCreator