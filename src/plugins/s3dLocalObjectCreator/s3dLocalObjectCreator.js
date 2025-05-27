import * as THREE from "three"
import {msgBox, s3dElement3DType} from "../../commonjs/common/common.js";

//S3dWeb 本地图元对象Creator
let S3dLocalObjectCreator = function (){
	//当前对象
	let thatS3dLocalObjectCreator = this;

	//containerId
	this.containerId = null;

	//s3d manager
	this.manager = null;

	//组件属性设置map
	this.componentKey2JsonMap = null;

	//正在构造的信息
	this.creatingInfo = {
		countInfo: null,
		objectJsons: null,
		cacheKey2InfoMap: {},
		resource2CacheKeysMap: {},
		afterCreateObject3D: null
	};

	//resource包围盒的外框
	this.resourceBoxEdgeMaterial = new THREE.LineBasicMaterial({
		color: 0x888888,
		linewidth: 1,
		opacity: 0.0,
		transparent: true,
		visible: false //默认显示外框不显示
	});

	//初始化
	this.init = function(p){
		thatS3dLocalObjectCreator.containerId = p.containerId;
		thatS3dLocalObjectCreator.manager = p.manager;
		thatS3dLocalObjectCreator.componentKey2JsonMap = thatS3dLocalObjectCreator.initComponentKey2JsonMap();
	}

	this.addComponentJson = function (componentJson){
		let componentKey2JsonMap = thatS3dLocalObjectCreator.componentKey2JsonMap;
		let key = componentJson.code + "_" + componentJson.versionNum;
		let localComponentJson = thatS3dLocalObjectCreator.manager.componentLibrary.getLocalComponentJson(componentJson);
		componentKey2JsonMap[key] = localComponentJson;
	}

	this.removeComponentJson = function (code, versionNum){
		let key = code + "_" + versionNum;
		let componentKey2JsonMap = thatS3dLocalObjectCreator.componentKey2JsonMap;
		delete componentKey2JsonMap[key];
	}

	this.initComponentKey2JsonMap = function (){
		let allComponentJsons = thatS3dLocalObjectCreator.manager.componentLibrary.getAllLocalComponentJsons();
		for(let i = 0; i < allComponentJsons.length; i++){
			let componentJson = allComponentJsons[i];
			let key = componentJson.code + "_" + componentJson.versionNum;
			allComponentJsons[key] = componentJson;
		}
		return allComponentJsons;
	}


	this.getComponentJsons = function(pArray, afterGetComponentJsons){
		let ps = [];
		for(let i = 0; i < pArray.length; i++) {
			let pJson = pArray[i];
			let key = pJson.code + "_" + pJson.versionNum;
			let componentJson = thatS3dLocalObjectCreator.componentKey2JsonMap[key];
			let p = {
				id: componentJson.id,
				code: componentJson.code,
				versionNum: componentJson.versionNum,
				name: componentJson.name,
				json: componentJson
			};
			ps.push(p);
		}
		afterGetComponentJsons(ps);
	}

	this.createObject3Ds = function(objectJsons, afterCreateObject3D, countInfo){
		//更新creatingInfo
		thatS3dLocalObjectCreator.creatingInfo.countInfo = countInfo;
		thatS3dLocalObjectCreator.creatingInfo.objectJsons = objectJsons;
		thatS3dLocalObjectCreator.creatingInfo.cacheKey2InfoMap = {};
		thatS3dLocalObjectCreator.creatingInfo.resource2CacheKeysMap = {};
		thatS3dLocalObjectCreator.creatingInfo.afterCreateObject3D = afterCreateObject3D;

		thatS3dLocalObjectCreator.createLocalObject3Ds();
	}

	this.createLocalObject3Ds = function(){
		let objectJsons = thatS3dLocalObjectCreator.creatingInfo.objectJsons;
		let pArray = [];
		//先构造objectSetting
		let createCount = objectJsons.length;
		for(let i = 0; i < objectJsons.length; i++){
			let objectJson = objectJsons[i];
			let componentInfo = thatS3dLocalObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
			let matchComponent = componentInfo != null;

			if(!matchComponent){
				//没有在模型列表中匹配到目标
				msgBox.alert({
					info: "没有在模型列表中匹配到目标. ComponentCode=" + objectJson.code + ", VersionNum=" + objectJson.versionNum
				});
			}

			let parameters = {};
			for(let paramName in objectJson.parameters){
				if(matchComponent) {
					if (componentInfo.parameters[paramName]) {
						parameters[paramName] = {
							value: objectJson.parameters[paramName].value,
							isGeo: componentInfo.parameters[paramName].isGeo
						};
					}
				}
				else{
					parameters[paramName] = {
						value: objectJson.parameters[paramName].value,
						isGeo: false
					};
				}
			}

			if(matchComponent) {
				//需要特殊处理的参数
				let specialParameters = [
					"文件名",
					"文件夹",
					"类型"
				];
				for (let i = 0; i < specialParameters.length; i++) {
					let paramName = specialParameters[i];
					parameters[paramName] = {
						value: componentInfo.parameters[paramName].defaultValue,
						isGeo: componentInfo.parameters[paramName].isGeo
					}
				}
			}

			//处理缩放
			if(objectJson.scale == null){
				objectJson.scale = [1, 1, 1];
			}

			let cacheKey = thatS3dLocalObjectCreator.getCacheKey(objectJson.code, objectJson.versionNum, parameters);
			let hasCache = thatS3dLocalObjectCreator.checkHasCache(cacheKey);
			let p = {
				code: objectJson.code,
				versionNum: objectJson.versionNum,
				parameters: parameters, //objectJson.parameters,
				parentId: objectJson.parentId,
				objectSetting: {
					id: objectJson.id,
					code: objectJson.code,
					versionNum: objectJson.versionNum,
					parentId: objectJson.parentId,
					hasError: !matchComponent,
					name: objectJson.name,
					position: [objectJson.position[0], objectJson.position[1], objectJson.position[2]],
					rotation: [objectJson.rotation[0], objectJson.rotation[1], objectJson.rotation[2]],
					scale: [objectJson.scale[0], objectJson.scale[1], objectJson.scale[2]],
					castShadow: objectJson.castShadow,
					receiveShadow: objectJson.receiveShadow,
					parameters: parameters, //objectJson.parameters,
					materials: objectJson.materials,
					isLocal: true,
					isTemp: objectJson.isTemp,
					userData: objectJson.userData,
					type: objectJson.type
				},
				cacheKey: cacheKey,
				otherInfo: {
					id: objectJson.id,
					name: objectJson.name,
					isOnGround: objectJson.isOnGround,
					createIndex: i,
					createCount: createCount,
					needSelectAfterAdd: objectJson.needSelectAfterAdd,
					userData: objectJson.userData
				},
				hasCache: hasCache
			};
			pArray.push(p);
		}

		//先处理本地有缓存的
		for(let i = 0; i < pArray.length; i++){
			let p = pArray[i];
			if(p.hasCache){
				thatS3dLocalObjectCreator.createObject3DByCloneCache(p);
			}
		}

		//再处理需要调用服务器端的
		for(let i = 0; i < pArray.length; i++){
			let p = pArray[i];
			if(!p.hasCache){
				let info = thatS3dLocalObjectCreator.creatingInfo.cacheKey2InfoMap[p.cacheKey];
				if(info == null){
					info = {
						waitingList: []
					};
					thatS3dLocalObjectCreator.creatingInfo.cacheKey2InfoMap[p.cacheKey] = info;
				}
				info.waitingList.push(p);
			}
		}
		for(let cacheKey in thatS3dLocalObjectCreator.creatingInfo.cacheKey2InfoMap){
			let waitingList = thatS3dLocalObjectCreator.creatingInfo.cacheKey2InfoMap[cacheKey].waitingList;
			let p = waitingList[0];
			thatS3dLocalObjectCreator.createLocalObject(p);
		}
	}

	this.getResourceKey = function (info){
		let parameters = info.parameters;
		let resourceDirectory = parameters["文件夹"].value;
		let resourceFileName = parameters["文件名"].value;
		let resourceType = parameters["类型"].value;
		return thatS3dLocalObjectCreator.manager.object3DCache.getResourceObject3DKey(resourceDirectory + "\\" + resourceFileName, resourceType);
	}

	this.createLocalObject = async function(p) {
		let objectSetting = p.objectSetting;
		let cacheKey = p.cacheKey;
		let otherInfo = p.otherInfo;
		let parameters = p.parameters;
		let hasError = p.objectSetting.hasError;

		//提前加载Resource
		let resourceDirectory = parameters["文件夹"].value;
		let resourceFileName = parameters["文件名"].value;
		let resourceType = parameters["类型"].value;
		let processType = parameters["处理方式"].value;
		let resourceKey = thatS3dLocalObjectCreator.manager.object3DCache.getResourceObject3DKey(resourceDirectory + "\\" + resourceFileName, resourceType);
		if (thatS3dLocalObjectCreator.manager.object3DCache.hasResourceObject3D(resourceKey)) {
			thatS3dLocalObjectCreator.createObject3DAfterLoadResource(cacheKey, p);
		}
		else {
			let cacheKeys = thatS3dLocalObjectCreator.creatingInfo.resource2CacheKeysMap[resourceKey];
			let isFirstInSameResourceKey = false;
			if (!cacheKeys) {
				cacheKeys = [];
				isFirstInSameResourceKey = true;
			}
			cacheKeys.push(cacheKey);
			if(isFirstInSameResourceKey){
				thatS3dLocalObjectCreator.creatingInfo.resource2CacheKeysMap[resourceKey] = cacheKeys;
				thatS3dLocalObjectCreator.manager.resourceLoader.loadLocalResource(resourceDirectory, resourceFileName, resourceType, processType, hasError, function (resourceKey) {
					let cacheKeys = thatS3dLocalObjectCreator.creatingInfo.resource2CacheKeysMap[resourceKey];
					for (let i = 0; i < cacheKeys.length; i++) {
						let cacheKey = cacheKeys[i];
						let info = thatS3dLocalObjectCreator.creatingInfo.cacheKey2InfoMap[cacheKey];
						thatS3dLocalObjectCreator.createObject3DAfterLoadResource(cacheKey, info.waitingList[0]);
						delete thatS3dLocalObjectCreator.creatingInfo.cacheKey2InfoMap[cacheKey];
						delete thatS3dLocalObjectCreator.creatingInfo.resource2CacheKeysMap[resourceKey];
					}
				});
			}
		}
	}

	this.createObject3DAfterLoadResource = function(cacheKey, objectJson){
		let object3D = thatS3dLocalObjectCreator.jsonToResourceObject3D(objectJson);
		let box = new THREE.Box3().setFromObject(object3D, true);
		thatS3dLocalObjectCreator.callbackCreateObject3D(cacheKey, object3D, box);
		delete thatS3dLocalObjectCreator.creatingInfo.cacheKey2InfoMap[cacheKey];
	}

	this.createBoxMesh = function (resourceObject3D){
		let box = new THREE.Box3().setFromObject(resourceObject3D, true);
		let xCenter = (box.min.x + box.max.x) / 2;
		let yCenter = (box.min.y + box.max.y) / 2;
		let zCenter = (box.min.z + box.max.z) / 2;
		resourceObject3D.position.set(-xCenter, -yCenter, -zCenter);

		let xSemiSize = (box.max.x - box.min.x) / 2;
		let ySemiSize = (box.max.y - box.min.y) / 2;
		let zSemiSize = (box.max.z - box.min.z) / 2;
		let offText = "OFF\n" +
			"8 0 12\n" +
			"-" + xSemiSize + " " + ySemiSize + " -" + zSemiSize + "\n" +
			xSemiSize + " " + ySemiSize + " -" + zSemiSize + "\n" +
			xSemiSize + " " + ySemiSize + " " + zSemiSize + "\n" +
			"-" + xSemiSize + " " + ySemiSize + " " + zSemiSize + "\n" +
			"-" + xSemiSize + " -" + ySemiSize + " -" + zSemiSize + "\n" +
			xSemiSize + " -" + ySemiSize + " -" + zSemiSize + "\n" +
			xSemiSize + " -" + ySemiSize + " " + zSemiSize + "\n" +
			"-" + xSemiSize + " -" + ySemiSize + " " + zSemiSize + "\n" +
			"2 4 5\n" +
			"2 4 0\n" +
			"2 4 7\n" +
			"2 0 1\n" +
			"2 1 2\n" +
			"2 2 3\n" +
			"2 3 0\n" +
			"2 5 6\n" +
			"2 6 7\n" +
			"2 1 5\n" +
			"2 2 6\n" +
			"2 3 7\n";

		//外框
		let boxMeshInfo = thatS3dLocalObjectCreator.getMeshInfoFromOff(offText);
		let boxMesh = thatS3dLocalObjectCreator.
		createResourceBoxMesh(boxMeshInfo, thatS3dLocalObjectCreator.resourceBoxEdgeMaterial);
		return boxMesh;
	}

	this.jsonToResourceObject3D = function(info){
		//三个scale属性 modified by ls 20230901
		//let scaleX = info.parameters["X缩放"].value;
		//let scaleY = info.parameters["Y缩放"].value;
		//let scaleZ = info.parameters["Z缩放"].value;
		let scaleX = info.objectSetting.scale[0];
		let scaleY = info.objectSetting.scale[1];
		let scaleZ = info.objectSetting.scale[2];


		let resourceDirectory = info.parameters["文件夹"].value;
		let resourceFileName = info.parameters["文件名"].value;
		let resourceType = info.parameters["类型"].value;
		let partName = info.parameters["组成部分"].value;
		let resourceKey = thatS3dLocalObjectCreator.manager.object3DCache.getResourceObject3DKey(resourceDirectory + "\\" + resourceFileName, resourceType);
		let resourceObject3D;
		if (partName == null || partName.length === 0) {
			resourceObject3D = thatS3dLocalObjectCreator.manager.object3DCache.cloneResourceObject3D(resourceKey, info.objectSetting.hasError);
		} else {
			resourceObject3D = thatS3dLocalObjectCreator.manager.object3DCache.clonePartSourceObject3D(resourceKey, partName, info.objectSetting.hasError);
		}

		//给hasError赋值
		info.objectSetting.hasError = info.objectSetting.hasError || thatS3dLocalObjectCreator.manager.object3DCache.getHasError(resourceKey);

		/*
		if(thatS3dLocalObjectCreator.manager.viewer.showShadow){
			thatS3dLocalObjectCreator.setResourceMeshShadow(resourceObject3D);
		}
		*/

		resourceObject3D.position.set(0, 0, 0);
		resourceObject3D.rotation.set(0, 0, 0);
		resourceObject3D.isResourceObject = true;

		let boxMesh = thatS3dLocalObjectCreator.createBoxMesh(resourceObject3D);

		let outerResourceObject3D = new THREE.Object3D();
		outerResourceObject3D.add(resourceObject3D);
		outerResourceObject3D.name = "outer";
		//thatS3dLocalObjectCreator.moveToCenter(outerResourceObject3D);
		//outerResourceObject3D.scale.set(scaleX, scaleY, scaleZ);
		//boxMesh.scale.set(scaleX, scaleY, scaleZ);

		let object3D = new THREE.Object3D();
		object3D.add(outerResourceObject3D);
		object3D.add(boxMesh);
		return object3D;
	}

	this.callbackCreateObject3D = function(cacheKey, object3D, box){
		thatS3dLocalObjectCreator.addCache({
			cacheKey: cacheKey,
			object3D: object3D,
			box: box
		});

		let waitingInfos = thatS3dLocalObjectCreator.creatingInfo.cacheKey2InfoMap[cacheKey].waitingList;
		for(let i = 0; i < waitingInfos.length; i++){
			let waitingInfo = waitingInfos[i];
			thatS3dLocalObjectCreator.createObject3DByCloneCache(waitingInfo);
		}
	}

	this.createObject3DByCloneCache = function (p){
		let cacheInfo = thatS3dLocalObjectCreator.manager.object3DCache.getRefComponentObject3D(p.cacheKey);
		if(p.otherInfo.isOnGround){
			let height = (cacheInfo.box.max.y - cacheInfo.box.min.y) * p.objectSetting.scale[1];
			p.objectSetting.position[1] = height / 2;
		}
		let newObject3D = thatS3dLocalObjectCreator.manager.object3DCache.cloneRefComponentObject3D(p.cacheKey);
		newObject3D.isS3dObject = true;
		newObject3D.userData.info = thatS3dLocalObjectCreator.createNodeData(p.objectSetting, cacheInfo.objectSetting);
		newObject3D.rotation.set(p.objectSetting.rotation[0], p.objectSetting.rotation[1], p.objectSetting.rotation[2]);
		newObject3D.position.set(p.objectSetting.position[0], p.objectSetting.position[1], p.objectSetting.position[2]);
		newObject3D.scale.set(p.objectSetting.scale[0], p.objectSetting.scale[1], p.objectSetting.scale[2]);

		//替换材质
		let info = newObject3D.userData.info;
		for(let sourceMaterialName in p.objectSetting.materials){
			let destMaterialInfo = p.objectSetting.materials[sourceMaterialName];
			for(let propertyName in destMaterialInfo){
				if(propertyName === "code"){
					let materialInfo = thatS3dLocalObjectCreator.manager.localMaterials.getUserMaterialInfo(destMaterialInfo.code);
					if(materialInfo != null) {
						thatS3dLocalObjectCreator.setLocalObject3DMaterial(newObject3D, info, sourceMaterialName, destMaterialInfo.code);
					}
				}
				else{
					thatS3dLocalObjectCreator.setLocalObject3DMaterialPropertyValue(newObject3D,info, sourceMaterialName, propertyName, destMaterialInfo[propertyName]);
				}
			}

		}

		thatS3dLocalObjectCreator.creatingInfo.countInfo.localSucceed = thatS3dLocalObjectCreator.creatingInfo.countInfo.localSucceed + 1;

		thatS3dLocalObjectCreator.creatingInfo.afterCreateObject3D({
			object3D: newObject3D,
			objectSetting: p.objectSetting,
			cacheKey: p.cacheKey,
			isServer: false,
			isLocal: true,
			ioInternal: false,
			otherInfo: p.otherInfo,
			countInfo: thatS3dLocalObjectCreator.creatingInfo.countInfo
		});
		thatS3dLocalObjectCreator.refreshProgress();
	}

	//材质有变化，更新到显示
	this.refreshMaterial = function (object3D,  materialCode, material){
		let info = object3D.userData.info;
		let resourceDirectory = info.parameters["文件夹"].value;
		let resourceFileName = info.parameters["文件名"].value;
		let resourcePartName = info.parameters["组成部分"].value;
		let resourceType = info.parameters["类型"].value;
		let resourceKey = thatS3dLocalObjectCreator.manager.object3DCache.getResourceObject3DKey(resourceDirectory + "\\" + resourceFileName, resourceType);
		let resourceObjectInfo = thatS3dLocalObjectCreator.manager.object3DCache.getResourceObject3D(resourceKey);
		let materialInfo = resourceObjectInfo.materialInfo;

		//更改材质
		let obj3D = object3D.children[0].children[0];
		thatS3dLocalObjectCreator.refreshLocalObject3DMaterial(resourcePartName, obj3D, materialInfo.pathHash, materialCode, material);
	}

	//重新构造了材质后，需要更新材质到显示
	this.refreshLocalObject3DMaterial = function(parentPath, object3D, pathHash, materialName, newMaterial) {
		if (!object3D.isResourceBoxLine) {
			let pathMaterials = pathHash[parentPath];
			if (pathMaterials != null) {
				let materialObj = object3D.material;
				if (materialObj.length != null) {
					for (let i = 0; i < pathMaterials.length; i++) {
						let mat = object3D.material[i];
						if(mat.name === materialName) {
							object3D.material[i] = newMaterial;
							if (object3D.originalMaterial != null) {
								object3D.originalMaterial[i] = newMaterial;
							}
						}
					}
				} else {
					let mat = object3D.material;
					if (mat.name === materialName) {
						object3D.material = newMaterial;
						if (object3D.originalMaterial != null) {
							object3D.originalMaterial = newMaterial;
						}
					}
				}
			} else {
				let childObjs = object3D.children;
				for (let i = 0; i < childObjs.length; i++) {
					let childObj = childObjs[i];
					let path = parentPath + "###" + i + "_" + childObj.name;
					thatS3dLocalObjectCreator.refreshLocalObject3DMaterial(path, childObj, pathHash, materialName, newMaterial);
				}
			}
		}
	}

	//设置本地构件材质
	this.setLocalObject3DMaterial = function (object3D, info, sourceMaterialName, newMaterialCode){
		let resourceDirectory = info.parameters["文件夹"].value;
		let resourceFileName = info.parameters["文件名"].value;
		let resourcePartName = info.parameters["组成部分"].value;
		let resourceType = info.parameters["类型"].value;
		let resourceKey = thatS3dLocalObjectCreator.manager.object3DCache.getResourceObject3DKey(resourceDirectory + "\\" + resourceFileName, resourceType);
		let resourceObjectInfo = thatS3dLocalObjectCreator.manager.object3DCache.getResourceObject3D(resourceKey);
		let materialInfo = resourceObjectInfo.materialInfo;

		let newMaterial;
		if (newMaterialCode == null || newMaterialCode.length === 0) {
			newMaterial = materialInfo.materialHash[sourceMaterialName].material;
		}
		else{
			newMaterial = thatS3dLocalObjectCreator.manager.localMaterials.getUserMaterial(newMaterialCode);
		}

		//更改材质
		let obj3D = object3D.children[0].children[0];
		thatS3dLocalObjectCreator.replaceLocalObject3DMaterial(resourcePartName, obj3D, materialInfo.pathHash, sourceMaterialName, newMaterial);
		return newMaterial;
	}

	this.replaceLocalObject3DMaterial = function(parentPath, object3D, pathHash, sourceMaterialName, newMaterial) {
		if (!object3D.isResourceBoxLine) {
			let pathMaterials = pathHash[parentPath];
			if (pathMaterials != null) {
				let materialObj = object3D.material;
				if (materialObj.length != null) {
					for (let i = 0; i < pathMaterials.length; i++) {
						if (pathMaterials[i] === sourceMaterialName) {
							object3D.material[i] = newMaterial;
							if (object3D.originalMaterial != null) {
								object3D.originalMaterial[i] = newMaterial;
							}
						}
					}
				} else {
					if (pathMaterials[0] === sourceMaterialName) {
						object3D.material = newMaterial;
						if (object3D.originalMaterial != null) {
							object3D.originalMaterial = newMaterial;
						}
					}
				}
			} else {
				let childObjs = object3D.children;
				for (let i = 0; i < childObjs.length; i++) {
					let childObj = childObjs[i];
					let path = parentPath + "###" + i + "_" + childObj.name;
					thatS3dLocalObjectCreator.replaceLocalObject3DMaterial(path, childObj, pathHash, sourceMaterialName, newMaterial);
				}
			}
		}
	}

	//设置本地构件材质属性值
	this.setLocalObject3DMaterialPropertyValue = function (object3D, info, materialName, propertyName, propertyValue){
		let resourceDirectory = info.parameters["文件夹"].value;
		let resourceFileName = info.parameters["文件名"].value;
		let resourcePartName = info.parameters["组成部分"].value;
		let resourceType = info.parameters["类型"].value;
		let resourceKey = thatS3dLocalObjectCreator.manager.object3DCache.getResourceObject3DKey(resourceDirectory + "\\" + resourceFileName, resourceType);
		let resourceObjectInfo = thatS3dLocalObjectCreator.manager.object3DCache.getResourceObject3D(resourceKey);
		let materialInfo = resourceObjectInfo.materialInfo;

		//更改材质
		let obj3D = object3D.children[0].children[0];
		thatS3dLocalObjectCreator.replaceLocalObject3DMaterialPropertyValue(resourcePartName, obj3D, materialInfo.pathHash, materialName, propertyName, propertyValue);
	}

	this.refreshMaterialPropertyValue = function (material, propertyName, propertyValue){
		switch(propertyName){
			case "envMapIntensity":{
				material[propertyName] = propertyValue;
				if(propertyValue == null || propertyValue === 0){
					material.envMap = null;
				}
				else{
					if(thatS3dLocalObjectCreator.manager.viewer.scene.environment != null) {
						material.envMap = thatS3dLocalObjectCreator.manager.viewer.scene.environment;
					}
				}
				break;
			}
			case "color":{
				material["color"].set(common3DFunction.stringToRGBInt(propertyValue));
				break;
			}
			default:{
				material[propertyName] = propertyValue;
				break;
			}
		}
	}

	this.replaceLocalObject3DMaterialPropertyValue = function(parentPath, object3D, pathHash, materialName, propertyName, propertyValue) {
		if (!object3D.isResourceBoxLine) {
			let pathMaterials = pathHash[parentPath];
			if (pathMaterials != null) {
				let materialObj = object3D.material;
				if (materialObj.length != null) {
					for (let i = 0; i < pathMaterials.length; i++) {
						if (pathMaterials[i] === materialName) {
							let m = object3D.material[i];
							if(m.name === materialName){
								thatS3dLocalObjectCreator.refreshMaterialPropertyValue(m, propertyName, propertyValue);
								return true;
							}
							if (object3D.originalMaterial != null) {
								let m = object3D.originalMaterial[i];
								if(m.name === materialName){
									thatS3dLocalObjectCreator.refreshMaterialPropertyValue(m, propertyName, propertyValue);
									return true;
								}
							}
						}
					}
				} else {
					if (pathMaterials[0] === materialName) {
						if(object3D.material.name === materialName){
							thatS3dLocalObjectCreator.refreshMaterialPropertyValue(object3D.material, propertyName, propertyValue);
							return true;
						}
						if(object3D.originalMaterial != null && object3D.originalMaterial.name === materialName){
							thatS3dLocalObjectCreator.refreshMaterialPropertyValue(object3D.originalMaterial, propertyName, propertyValue);
							return true;
						}
					}
				}
			} else {
				let childObjs = object3D.children;
				for (let i = 0; i < childObjs.length; i++) {
					let childObj = childObjs[i];
					let path = parentPath + "###" + i + "_" + childObj.name;
					let processed = thatS3dLocalObjectCreator.replaceLocalObject3DMaterialPropertyValue(path, childObj, pathHash, materialName, propertyName, propertyValue);
					if(processed){
						return true;
					}
				}
			}
		}
		return false;
	}

	//resource的外轮廓mesh
	this.createResourceBoxMesh = function (boxMeshInfo, lineMaterial){
		let mesh = new THREE.Object3D();
		mesh.noneGeometry = true;

		for(let i = 0; i < boxMeshInfo.lines.length; i++){
			let lineInfo = boxMeshInfo.lines[i];
			let pointsLine = [];
			pointsLine.push( new THREE.Vector3( lineInfo.start.x, lineInfo.start.y, lineInfo.start.z ) );
			pointsLine.push( new THREE.Vector3( lineInfo.end.x, lineInfo.end.y, lineInfo.end.z ) );
			let geometry = new THREE.BufferGeometry().setFromPoints( pointsLine );
			let line = new THREE.Line(geometry, lineMaterial);
			line.isResourceBoxLine = true;
			mesh.add(line);
		}
		return mesh;
	}

	this.getMeshInfoFromOff = function(offText){
		let txts = offText.split("\n");
		let counts = txts[1].split(" ");
		let pointCount = parseInt(counts[0]);
		let faceCount = parseInt(counts[1]);
		let lineCount = parseInt(counts[2]);
		let vertices = [];
		let positions = [];
		let faces = [];
		let indices = [];
		let lines = [];
		for(let i = 2; i < 2 + pointCount; i++){
			let parts = txts[i].split(" ");
			vertices.push(parseFloat(parts[0]));
			vertices.push(parseFloat(parts[1]));
			vertices.push(parseFloat(parts[2]));
		}
		let positionIndex = 0;
		for(let i = 2 + pointCount; i < 2 + pointCount + faceCount; i++){
			let parts = txts[i].split(" ");
			faces.push(parseInt(parts[1]));
			faces.push(parseInt(parts[2]));
			faces.push(parseInt(parts[3]));
			positions.push(vertices[parseInt(parts[1]) * 3]);
			positions.push(vertices[parseInt(parts[1]) * 3 + 1]);
			positions.push(vertices[parseInt(parts[1]) * 3 + 2]);
			positions.push(vertices[parseInt(parts[2]) * 3]);
			positions.push(vertices[parseInt(parts[2]) * 3 + 1]);
			positions.push(vertices[parseInt(parts[2]) * 3 + 2]);
			positions.push(vertices[parseInt(parts[3]) * 3]);
			positions.push(vertices[parseInt(parts[3]) * 3 + 1]);
			positions.push(vertices[parseInt(parts[3]) * 3 + 2]);
			indices.push(positionIndex);
			indices.push(positionIndex + 1);
			indices.push(positionIndex + 2);
			positionIndex = positionIndex + 3;
		}
		for(let i = 2 + pointCount + faceCount; i < 2 + pointCount + faceCount + lineCount; i++){
			let parts = txts[i].split(" ");
			let lineStartX = vertices[parseInt(parts[1]) * 3];
			let lineStartY = vertices[parseInt(parts[1]) * 3 + 1];
			let lineStartZ = vertices[parseInt(parts[1]) * 3 + 2];
			let lineEndX = vertices[parseInt(parts[2]) * 3];
			let lineEndY = vertices[parseInt(parts[2]) * 3 + 1];
			let lineEndZ = vertices[parseInt(parts[2]) * 3 + 2];
			let line = {
				start: {x: lineStartX, y: lineStartY, z: lineStartZ},
				end: {x: lineEndX, y: lineEndY, z: lineEndZ}
			}
			lines.push(line);
		}
		return {
			positions: positions,
			indices: indices,
			lines: lines
		};
	}

	this.moveToCenter = function(object3D){
		let box = new THREE.Box3().setFromObject(object3D, true);
		let xCenter = (box.min.x + box.max.x) / 2;
		let yCenter = (box.min.y + box.max.y) / 2;
		let zCenter = (box.min.z + box.max.z) / 2;

		//记录下居中时造成的偏移量 added by ls 20221208
		object3D.centerShift = {
			x: -xCenter,
			y: -yCenter,
			z: -zCenter
		};
		if(object3D.children.length !== 0) {
			for (let i = 0; i < object3D.children.length; i++) {
				let meshObj = object3D.children[i];
				let x = meshObj.position.x - xCenter;
				let y = meshObj.position.y - yCenter;
				let z = meshObj.position.z - zCenter;
				meshObj.position.set(x, y, z);
			}
		}

		//将辅助点的位置也平移，和整体一致
		if(object3D.assistPoints != null){
			for(let i = 0; i < object3D.assistPoints.length; i++){
				let assistPoint = object3D.assistPoints[i];
				assistPoint.x = assistPoint.x - xCenter;
				assistPoint.y = assistPoint.y - yCenter;
				assistPoint.z = assistPoint.z - zCenter;
			}
		}
	}

	this.setResourceMeshShadow = function(object3D){
		if(object3D.children.length > 0){
			for(let i = 0; i < object3D.children.length; i++){
				let childObj = object3D.children[i];
				thatS3dLocalObjectCreator.setResourceMeshShadow(childObj);
			}
		}
		else{
			object3D.castShadow = true;
			object3D.receiveShadow = true;
			if(object3D.material != null){
				if(object3D.material.length == null){
					object3D.material.flatShading = true;
				}
				else{
					for(let i = 0; i < object3D.material.length; i++){
						object3D.material[i].flatShading = true;
					}
				}
			}
		}
	}

	this.createNodeData = function(objectSetting){
		return {
			id: objectSetting.id,
			name: objectSetting.name,
			code: objectSetting.code,
			parentId: objectSetting.parentId,
			versionNum: objectSetting.versionNum,
			useWorldPosition: objectSetting.useWorldPosition,
			position: objectSetting.position,
			rotation: objectSetting.rotation,
			scale: objectSetting.scale,
			castShadow: objectSetting.castShadow,
			receiveShadow: objectSetting.receiveShadow,
			center: objectSetting.center,
			parameters: objectSetting.parameters,
			materials: objectSetting.materials,
			isLocal: true,
			isTemp: objectSetting.isTemp,
			userData: objectSetting.userData,
			type: s3dElement3DType.unit
		};
	}

	this.getComponentInfo = function(componentCode, versionNum){
		let key = componentCode + "_" + versionNum;
		return thatS3dLocalObjectCreator.componentKey2JsonMap[key];
	}

	this.getObjectCacheKey = function (objectJson){
		let parameters = thatS3dLocalObjectCreator.getRequestParameters(objectJson);
		return thatS3dLocalObjectCreator.getCacheKey(objectJson.code, objectJson.versionNum, parameters);
	}

	this.getRequestParameters = function (objectJson){
		let componentInfo = thatS3dLocalObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
		let parameters = {};
		for(let paramName in objectJson.parameters){
			if(componentInfo.parameters[paramName]){
				parameters[paramName] = {
					value: objectJson.parameters[paramName].value,
					isGeo: componentInfo.parameters[paramName].isGeo
				};
			}
		}
		return parameters;
	}

	this.getCacheKey = function(componentCode, versionNum, parameters){
		return thatS3dLocalObjectCreator.manager.object3DCache.getComponentObject3DKey(componentCode, versionNum, parameters, false, null, null, false);
	}

	this.checkHasCache = function(cacheKey){
		return thatS3dLocalObjectCreator.manager.object3DCache.hasRefComponentObject3D(cacheKey);
	}

	this.getCache = function(cacheKey){
		return thatS3dLocalObjectCreator.manager.object3DCache.getRefComponentObject3D(cacheKey);
	}

	this.addCache = function(p){
		thatS3dLocalObjectCreator.manager.object3DCache.addRefComponentObject3D(p.cacheKey, p.object3D, null, p.sameObjectId, p.objectSetting, p.box);
	}

	this.refreshProgress = function(){
		let succeedCount = thatS3dLocalObjectCreator.creatingInfo.countInfo.serverSucceed
			+ thatS3dLocalObjectCreator.creatingInfo.countInfo.localSucceed
			+ thatS3dLocalObjectCreator.creatingInfo.countInfo.internalSucceed;

		let message = "正在调用造型服务 (" + succeedCount + " / " + thatS3dLocalObjectCreator.creatingInfo.countInfo.all + ")"
		thatS3dLocalObjectCreator.manager.messageBox.show({
			percent: succeedCount / thatS3dLocalObjectCreator.creatingInfo.countInfo.all,
			message: message
		});

		if(succeedCount === thatS3dLocalObjectCreator.creatingInfo.countInfo.all){
			let message = "调用成功";
			thatS3dLocalObjectCreator.manager.messageBox.show({
				percent: 1,
				message: message
			});
			thatS3dLocalObjectCreator.manager.messageBox.hide({timeout: 200});
		}
	}
}
export default S3dLocalObjectCreator