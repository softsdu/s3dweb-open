
import {s3dElement3DType} from "../../commonjs/common/common.js";
import S3dLightCreator from "./creators/s3dLightCreator.js"
import s3dLightSelector from "./selector/s3dLightSelector.js";
import {lightComponentList} from "./componentList/lightComponentList.js";
import S3dCameraCreator from "./creators/s3dCameraCreator.js"
import s3dCameraSelector from "./selector/s3dCameraSelector.js";
import {cameraComponentList} from "./componentList/cameraComponentList.js";
import S3dParticleCreator from "./creators/s3dParticleCreator.js"
import s3dParticleSelector from "./selector/s3dParticleSelector.js";
import {particleComponentList} from "./componentList/particleComponentList.js";
import S3dTagCreator from "./creators/s3dTagCreator.js";
import {tagComponentList} from "./componentList/tagComponentList.js";
import s3dTagSelector from "./selector/s3dTagSelector.js";
import {orbitComponentList} from "./componentList/orbitComponentList.js";
import s3dOrbitSelector from "./selector/s3dOrbitSelector.js";
import S3dOrbitCreator from "./creators/s3dOrbitCreator.js";

//S3dWeb 内部图元对象Creator
let S3dInternalObjectCreator = function (){
	//当前对象
	const thatS3dInternalObjectCreator = this;

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

	//Light Creator
	this.lightCreator = null;

	//Light Selector
	this.lightSelector = null;

	//Camera Creator
	this.cameraCreator = null;

	//Camera Selector
	this.cameraSelector = null;

	//Particle Creator
	this.particleCreator = null;

	//Particle Selector
	this.particleSelector = null;

	//Tag Creator
	this.tagCreator = null;

	//Tag Selector
	this.tagSelector = null;

	//Orbit Creator
	this.orbitCreator = null;

	//Orbit Selector
	this.orbitSelector = null;

	//初始化
	this.init = function(p){
		thatS3dInternalObjectCreator.containerId = p.containerId;
		thatS3dInternalObjectCreator.manager = p.manager;
		thatS3dInternalObjectCreator.componentKey2JsonMap = thatS3dInternalObjectCreator.initComponentKey2JsonMap();
	}

	this.initComponentKey2JsonMap = function (){
		let allComponentJsonMap = {};
		for(let i = 0; i < lightComponentList.length; i++){
			let componentJson = lightComponentList[i];
			let key = componentJson.code + "_" + componentJson.versionNum;
			allComponentJsonMap[key] = componentJson;
		}
		for(let i = 0; i < cameraComponentList.length; i++){
			let componentJson = cameraComponentList[i];
			let key = componentJson.code + "_" + componentJson.versionNum;
			allComponentJsonMap[key] = componentJson;
		}
		for(let i = 0; i < particleComponentList.length; i++){
			let componentJson = particleComponentList[i];
			let key = componentJson.code + "_" + componentJson.versionNum;
			allComponentJsonMap[key] = componentJson;
		}
		for(let i = 0; i < tagComponentList.length; i++){
			let componentJson = tagComponentList[i];
			let key = componentJson.code + "_" + componentJson.versionNum;
			allComponentJsonMap[key] = componentJson;
		}
		for(let i = 0; i < orbitComponentList.length; i++){
			let componentJson = orbitComponentList[i];
			let key = componentJson.code + "_" + componentJson.versionNum;
			allComponentJsonMap[key] = componentJson;
		}
		return allComponentJsonMap;
	}

	this.showOrbitSelector = function (p){
		if(thatS3dInternalObjectCreator.orbitSelector == null){
			thatS3dInternalObjectCreator.orbitSelector = new s3dOrbitSelector();
			thatS3dInternalObjectCreator.orbitSelector.init({
				containerId: thatS3dInternalObjectCreator.containerId,
				manager: thatS3dInternalObjectCreator.manager,
			});
		}
		thatS3dInternalObjectCreator.orbitSelector.show(p);
	}

	this.showTagSelector = function (p){
		if(thatS3dInternalObjectCreator.tagSelector == null){
			thatS3dInternalObjectCreator.tagSelector = new s3dTagSelector();
			thatS3dInternalObjectCreator.tagSelector.init({
				containerId: thatS3dInternalObjectCreator.containerId,
				manager: thatS3dInternalObjectCreator.manager,
			});
		}
		thatS3dInternalObjectCreator.tagSelector.show(p);
	}

	this.showParticleSelector = function (p){
		if(thatS3dInternalObjectCreator.particleSelector == null){
			thatS3dInternalObjectCreator.particleSelector = new s3dParticleSelector();
			thatS3dInternalObjectCreator.particleSelector.init({
				containerId: thatS3dInternalObjectCreator.containerId,
				manager: thatS3dInternalObjectCreator.manager,
			});
		}
		thatS3dInternalObjectCreator.particleSelector.show(p);
	}

	this.showLightSelector = function (p){
		if(thatS3dInternalObjectCreator.lightSelector == null){
			thatS3dInternalObjectCreator.lightSelector = new s3dLightSelector();
			thatS3dInternalObjectCreator.lightSelector.init({
				containerId: thatS3dInternalObjectCreator.containerId,
				manager: thatS3dInternalObjectCreator.manager,
			});
		}
		thatS3dInternalObjectCreator.lightSelector.show(p);
	}

	this.showCameraSelector = function (p){
		if(thatS3dInternalObjectCreator.cameraSelector == null){
			thatS3dInternalObjectCreator.cameraSelector = new s3dCameraSelector();
			thatS3dInternalObjectCreator.cameraSelector.init({
				containerId: thatS3dInternalObjectCreator.containerId,
				manager: thatS3dInternalObjectCreator.manager,
			});
		}
		thatS3dInternalObjectCreator.cameraSelector.show(p);
	}

	this.createObject3Ds = function(objectJsons, afterCreateObject3D, countInfo){
		//更新creatingInfo
		thatS3dInternalObjectCreator.creatingInfo.countInfo = countInfo;
		thatS3dInternalObjectCreator.creatingInfo.objectJsons = objectJsons;
		thatS3dInternalObjectCreator.creatingInfo.cacheKey2InfoMap = {};
		thatS3dInternalObjectCreator.creatingInfo.resource2CacheKeysMap = {};
		thatS3dInternalObjectCreator.creatingInfo.afterCreateObject3D = afterCreateObject3D;

		thatS3dInternalObjectCreator.createInternalObject3Ds();
	}

	this.createInternalObject3Ds = function(){
		let objectJsons = thatS3dInternalObjectCreator.creatingInfo.objectJsons;
		let pArray = [];
		//先构造objectSetting
		let createCount = objectJsons.length;
		for(let i = 0; i < objectJsons.length; i++){
			let objectJson = objectJsons[i];
			let componentInfo = thatS3dInternalObjectCreator.getComponentInfo(objectJson.code, objectJson.versionNum);
			let parameters = {};
			for(let paramName in componentInfo.parameters){
				let comParam = componentInfo.parameters[paramName];
				let objectParam = objectJson.parameters[paramName];
				let paramValue = objectParam == null ? comParam.defaultValue : objectParam.value;
				parameters[paramName] = {
					value: paramValue,
					isGeo: true
				};
			}

			//位置和旋转
			let position = objectJson.position;
			if(position == null){
				if(componentInfo.position == null) {
					position = [0, 1, 0];
				}
				else{
					position = [componentInfo.position[0], componentInfo.position[1], componentInfo.position[2]];
				}
			}
			let rotation = objectJson.rotation;
			if(rotation == null){
				if(componentInfo.rotation == null) {
					rotation = [0, 0, 0];
				}
				else{
					rotation = [componentInfo.rotation[0], componentInfo.rotation[1], componentInfo.rotation[2]];
				}
			}
			let scale = objectJson.scale;
			if(scale == null){
				if(componentInfo.scale == null) {
					scale = [1, 1, 1];
				}
				else{
					scale = [componentInfo.scale[0], componentInfo.scale[1], componentInfo.scale[2]];
				}
			}

			let p = {
				code: objectJson.code,
				versionNum: objectJson.versionNum,
				type: objectJson.type,
				parameters: parameters,
				parentId: objectJson.parentId,
				objectSetting: {
					id: objectJson.id,
					code: objectJson.code,
					versionNum: objectJson.versionNum,
					parentId: objectJson.parentId,
					name: objectJson.name,
					position: position,
					rotation: rotation,
					scale: scale,
					castShadow: objectJson.castShadow,
					receiveShadow: objectJson.receiveShadow,
					parameters: parameters,
					type: objectJson.type,
					isInternal: true,
					isTemp: objectJson.isTemp,
					userData: objectJson.userData
				},
				otherInfo: {
					createIndex: i,
					createCount: createCount,
					needSelectAfterAdd: objectJson.needSelectAfterAdd,
					userData: objectJson.userData
				},
				hasCache: false
			};
			pArray.push(p);
		}
		for(let i = 0; i < pArray.length; i++){
			let p = pArray[i];
			thatS3dInternalObjectCreator.createInternalObject(p);
		}
	}

	this.getCreator = function (objectSetting){
		let creator = null;
		switch (objectSetting.type){
			case s3dElement3DType.light:{
				creator = thatS3dInternalObjectCreator.lightCreator;
				if(creator == null){
					creator = new S3dLightCreator();
					creator.init({
						manager: thatS3dInternalObjectCreator.manager,
					})
					thatS3dInternalObjectCreator.lightCreator = creator;
				}
				break;
			}
			case s3dElement3DType.camera:{
				creator = thatS3dInternalObjectCreator.cameraCreator;
				if(creator == null){
					creator = new S3dCameraCreator();
					creator.init({
						manager: thatS3dInternalObjectCreator.manager,
					})
					thatS3dInternalObjectCreator.cameraCreator = creator;
				}
				break;
			}
			case s3dElement3DType.particle:{
				creator = thatS3dInternalObjectCreator.particleCreator;
				if(creator == null){
					creator = new S3dParticleCreator();
					creator.init({
						manager: thatS3dInternalObjectCreator.manager,
					})
					thatS3dInternalObjectCreator.particleCreator = creator;
				}
				break;
			}
			case s3dElement3DType.tag:{
				creator = thatS3dInternalObjectCreator.tag;
				if(creator == null){
					creator = new S3dTagCreator();
					creator.init({
						manager: thatS3dInternalObjectCreator.manager,
					})
					thatS3dInternalObjectCreator.tagCreator = creator;
				}
				break;
			}
			case s3dElement3DType.orbit:{
				creator = thatS3dInternalObjectCreator.orbit;
				if(creator == null){
					creator = new S3dOrbitCreator();
					creator.init({
						manager: thatS3dInternalObjectCreator.manager,
					})
					thatS3dInternalObjectCreator.orbitCreator = creator;
				}
				break;
			}
			default:{
				throw "未实现的内部造型服务. Type=" + objectSetting.type;
			}
		}
		return creator;
	}

	this.createInternalObject = function(p) {
		let creator = thatS3dInternalObjectCreator.getCreator(p.objectSetting);
		let componentInfo = thatS3dInternalObjectCreator.getComponentInfo(p.objectSetting.code, p.objectSetting.versionNum);
		let newObject3D = creator.create({
			objectSetting: p.objectSetting,
			componentInfo: componentInfo
		});
		newObject3D.isS3dObject = true;
		newObject3D.userData.info = thatS3dInternalObjectCreator.createNodeData(p.objectSetting);
		newObject3D.rotation.set(p.objectSetting.rotation[0], p.objectSetting.rotation[1], p.objectSetting.rotation[2]);
		newObject3D.position.set(p.objectSetting.position[0], p.objectSetting.position[1], p.objectSetting.position[2]);
		newObject3D.scale.set(p.objectSetting.scale[0], p.objectSetting.scale[1], p.objectSetting.scale[2]);

		thatS3dInternalObjectCreator.creatingInfo.countInfo.internalSucceed = thatS3dInternalObjectCreator.creatingInfo.countInfo.internalSucceed + 1;

		thatS3dInternalObjectCreator.creatingInfo.afterCreateObject3D({
			object3D: newObject3D,
			objectSetting: p.objectSetting,
			isServer: false,
			isLocal: false,
			ioInternal: true,
			otherInfo: p.otherInfo,
			countInfo: thatS3dInternalObjectCreator.creatingInfo.countInfo
		});
		thatS3dInternalObjectCreator.refreshProgress();
	}

	this.createHelperObject3D = function (object3D){
		let info = object3D.userData.info;
		let creator = null;
		switch (info.type){
			case s3dElement3DType.light:{
				creator = thatS3dInternalObjectCreator.lightCreator;
				break;
			}
			case s3dElement3DType.camera:{
				creator = thatS3dInternalObjectCreator.cameraCreator;
				break;
			}
			case s3dElement3DType.particle:{
				creator = thatS3dInternalObjectCreator.particleCreator;
				break;
			}
			case s3dElement3DType.tag:{
				creator = thatS3dInternalObjectCreator.tagCreator;
				break;
			}
			case s3dElement3DType.orbit:{
				creator = thatS3dInternalObjectCreator.orbitCreator;
				break;
			}
			default:{
				return null;
			}
		}
		let helper3D = creator.createHelper(object3D);
		if(helper3D!= null){
			helper3D.visible = false;
		}
		return helper3D;
	}

	this.refreshProgress = function(){
		let succeedCount = thatS3dInternalObjectCreator.creatingInfo.countInfo.serverSucceed
			+ thatS3dInternalObjectCreator.creatingInfo.countInfo.localSucceed
			+ thatS3dInternalObjectCreator.creatingInfo.countInfo.internalSucceed;

		let message = "正在调用造型服务 (" + succeedCount + " / " + thatS3dInternalObjectCreator.creatingInfo.countInfo.all + ")"
		thatS3dInternalObjectCreator.manager.messageBox.show({
			percent: succeedCount / thatS3dInternalObjectCreator.creatingInfo.countInfo.all,
			message: message
		});

		if(succeedCount === thatS3dInternalObjectCreator.creatingInfo.countInfo.all){
			let message = "调用成功";
			thatS3dInternalObjectCreator.manager.messageBox.show({
				percent: 1,
				message: message
			});
			thatS3dInternalObjectCreator.manager.messageBox.hide({timeout: 200});
		}
	}

	this.createNodeData = function(objectSetting){
		return {
			id: objectSetting.id,
			name: objectSetting.name,
			code: objectSetting.code,
			parentId: objectSetting.parentId,
			versionNum: objectSetting.versionNum,
			useWorldPosition: false,
			position: objectSetting.position,
			rotation: objectSetting.rotation,
			scale: objectSetting.scale,
			castShadow: objectSetting.castShadow,
			receiveShadow: objectSetting.receiveShadow,
			parameters: objectSetting.parameters,
			isInternal: true,
			isTemp: objectSetting.isTemp,
			userData: objectSetting.userData,
			type: objectSetting.type
		};
	}

	this.getComponentInfo = function(componentCode, versionNum){
		let key = componentCode + "_" + versionNum;
		return thatS3dInternalObjectCreator.componentKey2JsonMap[key];
	}
}
export default S3dInternalObjectCreator