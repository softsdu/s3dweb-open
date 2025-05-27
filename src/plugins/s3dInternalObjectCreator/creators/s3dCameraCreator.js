import * as THREE from "three"
import {RectAreaLightHelper} from "three/addons/helpers/RectAreaLightHelper.js";
import {s3dLayerType} from "../../../commonjs/common/common.js";

let S3dCameraCreator = function () {
    var thatCameraCreator = this;

    this.manager = null;

    //图标材质
    this.iconMaterialMap = {};

    this.iconSize = [1, 1, 1]

    this.init = function (p) {
        thatCameraCreator.manager = p.manager;
    }

    this.create = function (p) {
        let objectSetting = p.objectSetting;
        let componentInfo = p.componentInfo;
        return thatCameraCreator.createCamera(objectSetting, componentInfo);
    }

    this.getIconMaterial = function (objectSetting, componentInfo) {
        let material = thatCameraCreator.iconMaterialMap[objectSetting.code];
        if (material == null) {
            let loader = new THREE.TextureLoader();
            let texture = loader.load(thatCameraCreator.manager.layout.imagesFolder + "internal/camera/" + componentInfo.icon);
            material = new THREE.SpriteMaterial({
                map: texture,
                color: 0xffffff,
                transparent: true
            });
            thatCameraCreator.iconMaterialMap[objectSetting.code] = material;
        }
        return material;
    }

    this.createHelper = function (camera3D) {
        let info = camera3D.userData.info;
        return thatCameraCreator.createCameraHelper(camera3D, info);
    }

    this.getAspectValue = function (aspectStr){
        switch(aspectStr){
            case "auto":{
                return 16 / 9;
            }
            case "1:1":{
                return 1;
            }
            case "3:4":{
                return 3 / 4;
            }
            case "4:3":{
                return 4 / 3;
            }
            case "9:16":{
                return 9 / 16;
            }
            case "16:9":{
                return 16 / 9;
            }
            case "16:10":{
                return 16 / 10;
            }
            case "21:9":{
                return 12 / 9;
            }
            case "32:9":{
                return 32 / 9;
            }
            default:{
                throw "不支持的比例. Aspect=" + aspectStr;
            }
        }
    }


    this.createCamera = function (objectSetting, componentInfo) {
        let parameters = objectSetting.parameters;
        let fov = parameters.fov.value;
        let aspect = thatCameraCreator.getAspectValue(parameters.aspect.value);
        let near = parameters.near.value;
        let far = parameters.far.value;

        let camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        camera.position.set(0, 0, 0);
        camera.lookAt(new THREE.Vector3(0, 0, -1));
        camera.layers.disable(s3dLayerType.editLayer);
        camera.layers.enable(s3dLayerType.viewLayer);

        let iconMaterial = thatCameraCreator.getIconMaterial(objectSetting, componentInfo);
        let icon = new THREE.Sprite(iconMaterial);
        icon.position.set(0, 0, 0);
        icon.scale.set(thatCameraCreator.iconSize[0], thatCameraCreator.iconSize[1], thatCameraCreator.iconSize[2]);

        camera.add(icon);
        camera.position.set(objectSetting.position[0], objectSetting.position[1], objectSetting.position[2]).normalize();

        thatCameraCreator.manager.viewer.enableObjectLayer(icon, s3dLayerType.editLayer, true);
        thatCameraCreator.manager.viewer.disableObjectLayer(icon, s3dLayerType.viewLayer, true);

        return camera;
    }

    this.createCameraHelper = function (camera) {
        let cameraHelper = new THREE.CameraHelper(camera);
        thatCameraCreator.manager.viewer.enableObjectLayer(cameraHelper, s3dLayerType.editLayer, true);
        thatCameraCreator.manager.viewer.disableObjectLayer(cameraHelper, s3dLayerType.viewLayer, true);
        return cameraHelper;
    }
}
export default S3dCameraCreator