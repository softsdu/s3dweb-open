import JS3BaseMaterials from "./js3BaseMaterials.js";
import * as THREE from "three"
import {cmnPcr, s3dImageSourceType} from "../../commonjs/common/common.js";

let JS3LocalMaterials = function(){
    const thatLocalMaterials = this;

    this.manager = null;

    this.userInfoMap = {};

    this.systemInfoMap = {};

    this.userMaterialMap = {};

    this.systemList = null;

    this.userList = null;

    this.baseMaterials;

    this.defaultMaterial = new THREE.MeshPhongMaterial({
       color: 0x666666
    });

    this.init = function(p){
        thatLocalMaterials.manager = p.manager;
        thatLocalMaterials.systemList = p.materialList;
        thatLocalMaterials.initBaseMaterials();
        thatLocalMaterials.initSystemMaterialInfos();
    }

    this.initBaseMaterials = function (){
        thatLocalMaterials.baseMaterials = new JS3BaseMaterials();
        thatLocalMaterials.baseMaterials.init({
            manager: thatLocalMaterials.manager
        });
    }

    this.setUserMaterial = function(materialCode, material){
        thatLocalMaterials.userMaterialMap[materialCode] = material;
    }

    this.removeUserMaterialFromMap = function(materialCode){
        delete thatLocalMaterials.userInfoMap[materialCode];
        delete thatLocalMaterials.userMaterialMap[materialCode];
    }

    this.getSystemMaterial = function (materialCode){
        let systemMaterialInfo = thatLocalMaterials.getSystemMaterialInfo(materialCode);
        let tempMaterialInfo = thatLocalMaterials.cloneMaterialInfoFromSystemMaterialInfo(systemMaterialInfo);
        let materialCreate = thatLocalMaterials.manager.materials.baseMaterials.creators[tempMaterialInfo.typeCode];
        let material = null;
        if (materialCreate != null) {
            material = materialCreate(tempMaterialInfo);
        } else {
            material = thatLocalMaterials.manager.materials.baseMaterials.defaultCreator(tempMaterialInfo);
        }
        return material;
    }

    this.getUserMaterial = function(materialCode){
        let material = thatLocalMaterials.userMaterialMap[materialCode];
        if(material == null) {
            let materialInfo = thatLocalMaterials.getUserMaterialInfo(materialCode);
            if (materialInfo != null) {
                let materialCreate = thatLocalMaterials.manager.materials.baseMaterials.creators[materialInfo.typeCode];
                if (materialCreate != null) {
                    material = materialCreate(materialInfo);
                } else {
                    material = thatLocalMaterials.manager.materials.baseMaterials.defaultCreator(materialInfo);
                }
            } else {
                let materialCreate = thatLocalMaterials.manager.materials.baseMaterials.creators["PlasticsSmoothy"];
                material = materialCreate({});
            }
            thatLocalMaterials.manager.materials.setMaterial(materialCode, material);
        }
        return material;
    }

    this.getNewMaterialInfo = function (name){
        let newName = thatLocalMaterials.getNewMaterialName(name);
        let newMaterialInfo = {
            code: cmnPcr.createGuid(),
            name: newName,
            color: 0x888888,
            imageAccessoryId: "",
            imageName: "",
            normalImageAccessoryId: "",
            normalImageName: "",
            transparent: false,
            opacity: 1,
            opacityImageAccessoryId: "",
            opacityImageName: "",
            metalness: 0.5,
            metalnessImageAccessoryId: "",
            metalnessImageName: "",
            roughness: 0.5,
            roughnessImageAccessoryId:"",
            roughnessImageName: "",
            envMapIntensity: 0.5,
            scaleWidth: 1,
            scaleHeight: 1,
            rotation: 0,
            isMirror: false,
            isDoubleSide: false,
            typeCode: "Standard",
            isServer: false,
            isSystem: false
        };
        return newMaterialInfo;
    }

    this.createMaterialBySourceMaterial = function (materialObject){
        let newMaterialInfo = thatLocalMaterials.getNewMaterialInfo(materialObject.name);

        newMaterialInfo.isDoubleSide = (materialObject.side === THREE.DoubleSide);

        newMaterialInfo.color = materialObject.color.isColor? materialObject.color.getHex() : 0;
        if(materialObject.map != null){
            let map = materialObject.map;
            if(map.repeat != null){
                newMaterialInfo.scaleWidth = map.repeat.x;
                newMaterialInfo.scaleHeight = map.repeat.y;
            }
            newMaterialInfo.rotation = 90 + map.rotation * 180 / Math.PI;
            newMaterialInfo.isMirror = (map.wrapS === THREE.MirroredRepeatWrapping);

            newMaterialInfo.imageName = thatLocalMaterials.getObjectImageUrl(materialObject.map);

        }

        newMaterialInfo.normalImageName = thatLocalMaterials.getObjectImageUrl(materialObject.normalMap);

        newMaterialInfo.transparent = materialObject.transparent;
        newMaterialInfo.opacity = materialObject.opacity == null ? 1 : materialObject.opacity;
        newMaterialInfo.opacityImageName = thatLocalMaterials.getObjectImageUrl(materialObject.alphaMap);

        newMaterialInfo.roughness = materialObject.roughness == null ? 0.5 : materialObject.roughness;
        newMaterialInfo.roughnessImageName = thatLocalMaterials.getObjectImageUrl(materialObject.roughnessMap);

        newMaterialInfo.metalness = materialObject.metalness == null ? 0.3 : materialObject.metalness;
        newMaterialInfo.metalnessImageName = thatLocalMaterials.getObjectImageUrl(materialObject.metalnessMap);

        newMaterialInfo.envMapIntensity = materialObject.envMapIntensity == null ? 0.5 : materialObject.envMapIntensity;

        return newMaterialInfo;
    }

    this.getObjectImageUrl = function (map){
        if(map != null
            && map.source != null
            && map.source.data != null) {
            let src = map.source.data.src;
            if(src != null && src.length > 0) {
                let localObjectPartDirName = thatLocalMaterials.manager.resourceLoader.getLocalObjectPartDirName();
                let postfixIndex =  src.lastIndexOf(localObjectPartDirName);
                let imageUrl = src.substr(postfixIndex + localObjectPartDirName.length);
                return s3dImageSourceType.object + "://" + imageUrl;
            }
        }
        return "";
    }

    this.cloneUserMaterialInfo = function (materialInfo){
        let newName = thatLocalMaterials.getNewMaterialName(materialInfo.name);
        let newMaterialInfo = {
            code: cmnPcr.createGuid(),
            name: newName,
            color: materialInfo.color,
            imageAccessoryId: materialInfo.imageAccessoryId,
            imageName: materialInfo.imageName,
            normalImageAccessoryId: materialInfo.normalImageAccessoryId,
            normalImageName: materialInfo.normalImageName,
            transparent: materialInfo.transparent,
            opacity: materialInfo.opacity,
            opacityImageAccessoryId: materialInfo.opacityImageAccessoryId,
            opacityImageName: materialInfo.opacityImageName,
            metalness: materialInfo.metalness,
            metalnessImageAccessoryId: materialInfo.metalnessImageAccessoryId,
            metalnessImageName: materialInfo.metalnessImageName,
            roughness: materialInfo.roughness,
            roughnessImageAccessoryId: materialInfo.roughnessImageAccessoryId,
            roughnessImageName: materialInfo.roughnessImageName,
            envMapIntensity: materialInfo.envMapIntensity,
            scaleWidth: materialInfo.scaleWidth,
            scaleHeight: materialInfo.scaleHeight,
            rotation: materialInfo.rotation,
            isMirror: materialInfo.isMirror,
            isDoubleSide: materialInfo.isDoubleSide,
            typeCode: materialInfo.typeCode,
            isServer: false,
            isSystem: false
        };
        return newMaterialInfo;
    }

    this.getUserMaterialInfo = function(materialCode){
        if(materialCode == null || materialCode.length === 0) {
            return null;
        }
        else{
            let materialInfo = thatLocalMaterials.userInfoMap[materialCode];
            if (materialInfo == null) {
                console.log("None user material. Code=" + materialCode)
                return null;
            } else {
                return materialInfo;
            }
        }
    }

    this.getSystemMaterialInfo = function(materialCode){
        if(materialCode == null || materialCode.length === 0) {
            return null;
        }
        else{
            let materialInfo = thatLocalMaterials.systemInfoMap[materialCode];
            if (materialInfo == null) {
                console.log("None system material. Code=" + materialCode)
                return null;
            } else {
                return materialInfo;
            }
        }
    }

    this.cloneMaterialInfoFromSystemMaterialInfo = function (systemMaterialInfo){

        let newMaterialInfo = thatLocalMaterials.getNewMaterialInfo("Demo")

        let systemImagePrefix = s3dImageSourceType.system + "://";

        let typeInfo = thatLocalMaterials.manager.localMaterials.baseMaterials.getTypeInfo(systemMaterialInfo.typeCode);
        newMaterialInfo.typeCode = typeInfo.code;
        newMaterialInfo.typeName = typeInfo.name;

        if(systemMaterialInfo.color != null) {
            newMaterialInfo.color = systemMaterialInfo.color;
        }
        else{
            newMaterialInfo.color = 0xFFFFFF;
        }

        if (systemMaterialInfo.imageName != null && systemMaterialInfo.imageName.length > 0) {
            newMaterialInfo.imageName = systemImagePrefix + systemMaterialInfo.imageName;
        }

        let transparent = systemMaterialInfo.transparent;

        if (systemMaterialInfo.opacity != null) {
            newMaterialInfo.opacity = systemMaterialInfo.opacity;
            if (systemMaterialInfo.opacity < 1) {
                transparent = true;
            }
        }
        else {
            newMaterialInfo.opacity = 1;
        }

        if (systemMaterialInfo.opacityImageName != null && systemMaterialInfo.opacityImageName.length > 0) {
            newMaterialInfo.opacityImageName = systemImagePrefix + systemMaterialInfo.opacityImageName;
            transparent = true;
        }

        newMaterialInfo.transparent = transparent;

        if (systemMaterialInfo.metalness != null) {
            newMaterialInfo.metalness = systemMaterialInfo.metalness;
        }
        else {
            newMaterialInfo.metalness = 0;
        }

        if (systemMaterialInfo.metalnessImageName != null && systemMaterialInfo.metalnessImageName.length > 0) {
            newMaterialInfo.metalnessImageName = systemImagePrefix + systemMaterialInfo.metalnessImageName;
        }

        if (systemMaterialInfo.roughness != null) {
            newMaterialInfo.roughness = systemMaterialInfo.roughness;
        }
        else {
            newMaterialInfo.roughness = 1;
        }

        if (systemMaterialInfo.roughnessImageName != null && systemMaterialInfo.roughnessImageName.length > 0) {
            newMaterialInfo.roughnessImageName = systemImagePrefix + systemMaterialInfo.roughnessImageName;
        }

        if (systemMaterialInfo.scaleWidth != null) {
            newMaterialInfo.scaleWidth = systemMaterialInfo.scaleWidth;
        }

        if (systemMaterialInfo.scaleHeight != null) {
            newMaterialInfo.scaleHeight = systemMaterialInfo.scaleHeight;
        }

        if (systemMaterialInfo.envMapIntensity != null) {
            newMaterialInfo.envMapIntensity = systemMaterialInfo.envMapIntensity;
        }
        else {
            newMaterialInfo.envMapIntensity = systemMaterialInfo.envMapIntensity;
        }

        if (systemMaterialInfo.rotation != null) {
            newMaterialInfo.rotation = systemMaterialInfo.rotation;
        } else {
            newMaterialInfo.rotation = 90;
        }

        if (systemMaterialInfo.isMirror != null) {
            newMaterialInfo.isMirror = systemMaterialInfo.isMirror;
        } else {
            newMaterialInfo.isMirror = false;
        }

        if (systemMaterialInfo.isDoubleSide != null) {
            newMaterialInfo.isDoubleSide = systemMaterialInfo.isDoubleSide;
        } else {
            newMaterialInfo.isDoubleSide = false;
        }
        return newMaterialInfo;
    }

    this.loadUserMaterial = function(materialCode,
                                     materialName,
                                     color,
                                     imageAccessoryId,
                                     imageName,
                                     normalImageAccessoryId,
                                     normalImageName,
                                     transparent,
                                     opacity,
                                     opacityImageAccessoryId,
                                     opacityImageName,
                                     metalness,
                                     metalnessImageAccessoryId,
                                     metalnessImageName,
                                     roughness,
                                     roughnessImageAccessoryId,
                                     roughnessImageName,
                                     envMapIntensity,
                                     scaleWidth,
                                     scaleHeight,
                                     rotation,
                                     isMirror,
                                     isDoubleSide,
                                     typeCode,
                                     isServer,
                                     isSystem){
        thatLocalMaterials.userInfoMap[materialCode] = {
            code: materialCode,
            name: materialName,
            color: color,
            imageAccessoryId: imageAccessoryId,
            imageName: imageName,
            normalImageAccessoryId: normalImageAccessoryId,
            normalImageName: normalImageName,
            transparent: transparent,
            opacity: opacity,
            opacityImageAccessoryId: opacityImageAccessoryId,
            opacityImageName: opacityImageName,
            metalness: metalness,
            metalnessImageAccessoryId: metalnessImageAccessoryId,
            metalnessImageName: metalnessImageName,
            roughness: roughness,
            roughnessImageAccessoryId: roughnessImageAccessoryId,
            roughnessImageName: roughnessImageName,
            envMapIntensity: envMapIntensity,
            scaleWidth: scaleWidth,
            scaleHeight: scaleHeight,
            rotation: rotation,
            isMirror: isMirror,
            isDoubleSide: isDoubleSide,
            typeCode: typeCode,
            isServer: isServer,
            isSystem: isSystem
        };
    }


    this.loadSystemMaterial = function(materialCode,
                                     materialName,
                                     color,
                                     imageAccessoryId,
                                     imageName,
                                     normalImageAccessoryId,
                                     normalImageName,
                                     transparent,
                                     opacity,
                                     opacityImageAccessoryId,
                                     opacityImageName,
                                     metalness,
                                     metalnessImageAccessoryId,
                                     metalnessImageName,
                                     roughness,
                                     roughnessImageAccessoryId,
                                     roughnessImageName,
                                     envMapIntensity,
                                     scaleWidth,
                                     scaleHeight,
                                     rotation,
                                     isMirror,
                                     isDoubleSide,
                                     typeCode,
                                     isServer,
                                     isSystem){
        thatLocalMaterials.systemInfoMap[materialCode] = {
            code: materialCode,
            name: materialName,
            color: color,
            imageAccessoryId: imageAccessoryId,
            imageName: imageName,
            normalImageAccessoryId: normalImageAccessoryId,
            normalImageName: normalImageName,
            transparent: transparent,
            opacity: opacity,
            opacityImageAccessoryId: opacityImageAccessoryId,
            opacityImageName: opacityImageName,
            metalness: metalness,
            metalnessImageAccessoryId: metalnessImageAccessoryId,
            metalnessImageName: metalnessImageName,
            roughness: roughness,
            roughnessImageAccessoryId: roughnessImageAccessoryId,
            roughnessImageName: roughnessImageName,
            envMapIntensity: envMapIntensity,
            scaleWidth: scaleWidth,
            scaleHeight: scaleHeight,
            rotation: rotation,
            isMirror: isMirror,
            isDoubleSide: isDoubleSide,
            typeCode: typeCode,
            isServer: isServer,
            isSystem: isSystem
        };
    }

    this.querySystemMaterials = function (keyword, pageIndex, onePageItemCount){
        let materialList = [];
        let index = 0;
        let rangeBeginIndex = pageIndex * onePageItemCount;
        let rangeEndIndex = (pageIndex + 1) * onePageItemCount - 1;
        keyword = keyword.toLowerCase();
        for(let i = 0; i < thatLocalMaterials.systemList.length; i++){
            let material = thatLocalMaterials.systemList[i];
            if(material.name.toLowerCase().indexOf(keyword) >= 0){
                if(index >= rangeBeginIndex){
                    if(index <= rangeEndIndex){
                        materialList.push(material);
                    }
                    else {
                        break;
                    }
                }
                index++;
            }
        }
        return {
            pageIndex: pageIndex,
            materials: materialList
        };
    }

    this.initSystemMaterialInfos = function (){
        let materialInfos = thatLocalMaterials.systemList;
        if(materialInfos != null) {
            for (let i = 0; i < materialInfos.length; i++) {
                let materialInfo = materialInfos[i];
                thatLocalMaterials.loadSystemMaterial(
                    materialInfo.code,
                    materialInfo.name,
                    materialInfo.color,
                    materialInfo.imageAccessoryId,
                    materialInfo.imageName,
                    materialInfo.normalImageAccessoryId,
                    materialInfo.normalImageName,
                    materialInfo.transparent,
                    materialInfo.opacity,
                    materialInfo.opacityImageAccessoryId,
                    materialInfo.opacityImageName,
                    materialInfo.metalness,
                    materialInfo.metalnessImageAccessoryId,
                    materialInfo.metalnessImageName,
                    materialInfo.roughness,
                    materialInfo.roughnessImageAccessoryId,
                    materialInfo.roughnessImageName,
                    materialInfo.envMapIntensity,
                    materialInfo.scaleWidth,
                    materialInfo.scaleHeight,
                    materialInfo.rotation,
                    materialInfo.isMirror,
                    materialInfo.isDoubleSide,
                    materialInfo.typeCode,
                    materialInfo.isServer,
                    true);
            }
        }
    }

    this.checkHasMaterial = function (matertialCode){
        return thatLocalMaterials.userInfoMap[matertialCode] != null;
    }

    this.checkSameNameMaterial = function (code, name){
        for(let c in thatLocalMaterials.userInfoMap){
            let materialInfo = thatLocalMaterials.userInfoMap[c];
            if(materialInfo.name === name && (code === null || materialInfo.code !== code)){
                return true;
            }
        }
        return false;
    }

    this.getNewMaterialName = function (name){
        let index = 1;
        let newName = name;
        while(thatLocalMaterials.checkSameNameMaterial(null, newName)){
            newName = name + "_" + index;
            index++;
        }
        return newName;
    }

    this.addUserMaterial = function (newMaterialInfo) {
        //添加userList
        thatLocalMaterials.userList.push(newMaterialInfo);

        //添加到infoMap
        thatLocalMaterials.loadUserMaterial(
            newMaterialInfo.code,
            newMaterialInfo.name,
            newMaterialInfo.color,
            "",
            newMaterialInfo.imageName,
            "",
            newMaterialInfo.normalImageName,
            newMaterialInfo.transparent,
            newMaterialInfo.opacity,
            "",
            newMaterialInfo.opacityImageName,
            newMaterialInfo.metalness,
            "",
            newMaterialInfo.metalnessImageName,
            newMaterialInfo.roughness,
            "",
            newMaterialInfo.roughnessImageName,
            newMaterialInfo.envMapIntensity,
            newMaterialInfo.scaleWidth,
            newMaterialInfo.scaleHeight,
            newMaterialInfo.rotation,
            newMaterialInfo.isMirror,
            newMaterialInfo.isDoubleSide,
            newMaterialInfo.typeCode,
            false,
            false);
    }

    this.updateUserMaterial = function (materialInfo) {
        //更新到userList
        let oldMaterialInfo = thatLocalMaterials.getUserMaterialFromList(materialInfo.code);
        oldMaterialInfo.code = materialInfo.code;
        oldMaterialInfo.name = materialInfo.name;
        oldMaterialInfo.color = materialInfo.color;
        oldMaterialInfo.imageName = materialInfo.imageName;
        oldMaterialInfo.normalImageName = materialInfo.normalImageName;
        oldMaterialInfo.transparent = materialInfo.transparent;
        oldMaterialInfo.opacity = materialInfo.opacity;
        oldMaterialInfo.opacityImageName = materialInfo.opacityImageName;
        oldMaterialInfo.metalness = materialInfo.metalness;
        oldMaterialInfo.metalnessImageName = materialInfo.metalnessImageName;
        oldMaterialInfo.roughness = materialInfo.roughness;
        oldMaterialInfo.roughnessImageName = materialInfo.roughnessImageName;
        oldMaterialInfo.envMapIntensity = materialInfo.envMapIntensity;
        oldMaterialInfo.scaleWidth = materialInfo.scaleWidth;
        oldMaterialInfo.scaleHeight = materialInfo.scaleHeight;
        oldMaterialInfo.rotation = materialInfo.rotation;
        oldMaterialInfo.isMirror = materialInfo.isMirror
        oldMaterialInfo.isDoubleSide = materialInfo.isDoubleSide
        oldMaterialInfo.typeCode = materialInfo.typeCode;


        //删除原有的材质对象，刷新材质时，会重新构造材质对象
        thatLocalMaterials.removeUserMaterialFromMap(materialInfo.code);

        //更新到infoMap
        thatLocalMaterials.loadUserMaterial(
            materialInfo.code,
            materialInfo.name,
            materialInfo.color,
            "",
            materialInfo.imageName,
            "",
            materialInfo.normalImageName,
            materialInfo.transparent,
            materialInfo.opacity,
            "",
            materialInfo.opacityImageName,
            materialInfo.metalness,
            "",
            materialInfo.metalnessImageName,
            materialInfo.roughness,
            "",
            materialInfo.roughnessImageName,
            materialInfo.envMapIntensity,
            materialInfo.scaleWidth,
            materialInfo.scaleHeight,
            materialInfo.rotation,
            materialInfo.isMirror,
            materialInfo.isDoubleSide,
            materialInfo.typeCode,
            false,
            false
        );

        thatLocalMaterials.manager.viewer.refreshMaterial(materialInfo.code);
    }

    this.removeUserMaterial = function (code){
        let newUserList = [];
        for(let i = 0; i < thatLocalMaterials.userList.length; i++){
            let materialInfo = thatLocalMaterials.userList[i];
            if(materialInfo.code !== code){
                newUserList.push(materialInfo);
            }
        }
        thatLocalMaterials.userList = newUserList;

        //删除原有的材质对象
        thatLocalMaterials.removeUserMaterialFromMap(code);

        //刷新材质时，会构造橱默认的灰色材质
        thatLocalMaterials.manager.viewer.refreshMaterial(code);
    }

    this.getUserMaterialFromList = function (code){
        for(let i = 0; i < thatLocalMaterials.userList.length; i++){
            let materialInfo = thatLocalMaterials.userList[i];
            if(materialInfo.code === code){
                return materialInfo;
            }
        }
        return null;
    }

    this.getUserMaterialList = function (){
        return thatLocalMaterials.userList;
    }

    this.initUserMaterialInfos = function (userMaterialList) {
        if (userMaterialList == null) {
            userMaterialList = [];
        }
        thatLocalMaterials.userList = userMaterialList;
        for (let i = 0; i < userMaterialList.length; i++) {
            let materialInfo = userMaterialList[i];
            thatLocalMaterials.loadUserMaterial(
                materialInfo.code,
                materialInfo.name,
                materialInfo.color,
                "",
                materialInfo.imageName,
                "",
                materialInfo.normalImageName,
                materialInfo.transparent,
                materialInfo.opacity,
                "",
                materialInfo.opacityImageName,
                materialInfo.metalness,
                "",
                materialInfo.metalnessImageName,
                materialInfo.roughness,
                "",
                materialInfo.roughnessImageName,
                materialInfo.envMapIntensity,
                materialInfo.scaleWidth,
                materialInfo.scaleHeight,
                materialInfo.rotation,
                materialInfo.isMirror,
                materialInfo.isDoubleSide,
                materialInfo.typeCode,
                false,
                false);
        }
    }

    this.refreshMaterialObjectPropertyValues = function (materialCode, propertyValueMap) {
        let materialObject = thatLocalMaterials.getUserMaterial(materialCode);
        if (materialObject == null) {
            throw "None material. Code=" + materialCode;
        }
        else {
            for(let propertyName in propertyValueMap) {
                switch (propertyName) {
                    case "opacity":{
                        let value = propertyValueMap.opacity;
                        if(value !== 1){
                            materialObject.transparent = true;
                        }
                        materialObject.opacity = value;
                        break;
                    }
                }
            }
        }
    }
}
export default JS3LocalMaterials