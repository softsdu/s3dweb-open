import * as THREE from "three"
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader.js";
import {RGBELoader} from "three/examples/jsm/loaders/RGBELoader.js";
import {s3dLayerType} from "../../commonjs/common/common.js";

//S3dSkyBox 天空盒
let S3dSkyBox = function () {
	//当前对象
	const thatS3dSkyBox = this;

	//containerId
	this.containerId = null;

	//s3d manager
	this.manager = null;

	this.skyMap = null;

	this.isGeometrySkyHidden = false;

	//事件
	this.eventFunctions = {};
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dSkyBox.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dSkyBox.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dSkyBox.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		}
	}

	//初始化
	this.init = function (p) {
		thatS3dSkyBox.containerId = p.containerId;
		thatS3dSkyBox.manager = p.manager;
		thatS3dSkyBox.skyMap = p.config.skyMap;
		thatS3dSkyBox.resourcesPublicFolder = p.config.resourcesPublicFolder;
		thatS3dSkyBox.isGeometrySkyHidden = p.config.isGeometrySkyHidden ? p.config.isGeometrySkyHidden : thatS3dSkyBox.isGeometrySkyHidden;
		if(p.config.beforeInitSkyBox != null){
			thatS3dSkyBox.addEventFunction("beforeInitSkyBox", p.config.beforeInitSkyBox);
		}
		if(p.config.afterInitSkyBox != null){
			thatS3dSkyBox.addEventFunction("afterInitSkyBox", p.config.afterInitSkyBox);
		}
	}

	this.setSkyInfo = function (skyInfo, userDefaultGeometrySky) {
		thatS3dSkyBox.initSky(skyInfo, userDefaultGeometrySky);
	}

	this.initSky = function (skyInfo, userDefaultGeometrySky) {
		thatS3dSkyBox.doEventFunction("beforeInitSkyBox", {});

		thatS3dSkyBox.clearSky();
		if (thatS3dSkyBox.manager.viewer.camera instanceof THREE.PerspectiveCamera) {
			let skyConfigInfo = thatS3dSkyBox.skyMap[skyInfo.name];

			let hasImage = this.initImageSky(skyConfigInfo, skyInfo);
			if(!hasImage && thatS3dSkyBox.isGeometrySkyHidden){
				thatS3dSkyBox.initColorSky(skyConfigInfo, skyInfo);
			}

			if(skyConfigInfo.type !== "None"){
				thatS3dSkyBox.initGeometrySky(skyConfigInfo, skyInfo, hasImage || thatS3dSkyBox.isGeometrySkyHidden);
			}
			else if(userDefaultGeometrySky){
				let defaultSkyInfo = thatS3dSkyBox.manager.s3dObject.scene.sky;
				skyConfigInfo = thatS3dSkyBox.skyMap[defaultSkyInfo.name];
				thatS3dSkyBox.initGeometrySky(skyConfigInfo, defaultSkyInfo, true);
			}
		}
	}

	this.initColorSky = function (skyConfigInfo, skyInfo){
		//使用背景色
		if(skyInfo.backgroundColor != null){
			thatS3dSkyBox.setBackgroundColor(skyConfigInfo, skyInfo.backgroundColor);
		}
	}

	this.initImageSky = function (skyConfigInfo, skyInfo){
		//使用背景图
		if(skyInfo.backgroundImage != null && skyInfo.backgroundImage.length > 0){
			thatS3dSkyBox.setBackgroundImage(skyConfigInfo, skyInfo.backgroundImage);
			return true;
		}
		else{
			return false;
		}
	}

	this.initGeometrySky = function (skyConfigInfo, skyInfo, hidden){
		switch (skyConfigInfo.type) {
			case "None": {
				//不做处理
				break;
			}
			case "Hemisphere": {
				thatS3dSkyBox.loadHdrTexture(skyConfigInfo, skyInfo.scale, skyInfo.rotation, hidden);
				break;
			}
			case "Box": {
				thatS3dSkyBox.setBoxSky(skyConfigInfo, skyInfo.scale, skyInfo.rotation, hidden);
				break;
			}
			case "Sphere": {
				thatS3dSkyBox.setSphereSky(skyConfigInfo, skyInfo.scale, skyInfo.rotation, hidden);
				break;
			}
			default: {
				//未知的天空类型
				throw "未知的天空类型";
			}
		}
	}

	//清除天空
	this.clearSky = function () {
		//清除box
		let scene = thatS3dSkyBox.manager.viewer.scene;
		scene.background = null;
		scene.environment = null;

		//清除色和背景图
		thatS3dSkyBox.manager.viewer.renderer.alpha = false;
		let image = $("#" + thatS3dSkyBox.manager.viewer.containerId).find(".s3dViewerInnerContainerBackgroundImage");
		$(image).removeClass("s3dViewerInnerContainerBackgroundImageActive");

		//清除天空球体
		thatS3dSkyBox.clearSkyObject();
	}

	this.clearSkyObject = function (){
		let scene = thatS3dSkyBox.manager.viewer.scene;
		let skyObj = thatS3dSkyBox.getSkyObj();
		if (skyObj != null) {
			scene.remove(skyObj);
		}
	}

	//隐藏天空盒
	this.hideSky = function (){
		let skyObj = thatS3dSkyBox.getSkyObj();
		if (skyObj != null) {
			skyObj.visible = false;
		}
	}

	this.getSkyObj = function () {
		let scene = thatS3dSkyBox.manager.viewer.scene;
		let skyObj = null;
		for (let i = 0; i < scene.children.length; i++) {
			let obj = scene.children[i];
			if (obj.isSky) {
				skyObj = obj;
			}
		}
		return skyObj;
	}

	this.refreshLights = function (skyInfo){
		let viewer = thatS3dSkyBox.manager.viewer;
		/*
		viwer.hemisphereLight.intensity = skyInfo.lightMap.hemisphere;

		for(let i = 0; i < viewer.directionalLights.length; i++){
			viewer.directionalLights[i].intensity = skyInfo.lightMap.directions[i];
		}
		 */
	}

	this.setHemisphereSky = function (skyInfo, scale, rotation, hidden) {
		let path = thatS3dSkyBox.resourcesPublicFolder + "skies/" + skyInfo.name + "/" + skyInfo.name + ".fbx";
		let fbxLoader = new FBXLoader();
		fbxLoader.load(path, function (hemisphereObj) {
			let scene = thatS3dSkyBox.manager.viewer.scene;
			let hdrTexture = scene.environment;

			hemisphereObj.scale.set(scale, scale, scale);
			hemisphereObj.rotation.set(0, rotation, 0);

			//设置底面的y为0
			let box = new THREE.Box3().setFromObject(hemisphereObj, true);
			let minY = box.min.y;
			hemisphereObj.position.set(hemisphereObj.position.x, hemisphereObj.position.y - minY, hemisphereObj.position.z);

			hemisphereObj.isSky = true;
			hemisphereObj.castShadow = false;
			hemisphereObj.receiveShadow = true;
			let innerObj = hemisphereObj.children[0];
			innerObj.castShadow = false;
			innerObj.receiveShadow = true;

			innerObj.material = new THREE.MeshPhongMaterial({
				color: 0xFFFFFF,
				map: hdrTexture,
				//emissive: 0xffffff,
				//emissiveIntensity: 0.2
			});
			if(hidden){
				hemisphereObj.visible = false;
			}

			thatS3dSkyBox.clearSkyObject();


			thatS3dSkyBox.manager.viewer.enableObjectLayer(hemisphereObj, s3dLayerType.viewLayer, true);
			scene.add(hemisphereObj);
			thatS3dSkyBox.doEventFunction("afterInitSkyBox", {});
		});
	}

	//半球
	this.loadHdrTexture = function (skyInfo, scale, rotation, hidden) {
		let path = thatS3dSkyBox.resourcesPublicFolder + "skies/" + skyInfo.name + "/" + skyInfo.hdrName;
		let loader = new RGBELoader();
		loader.load(path, function (hdrTexture) {
			hdrTexture.mapping = THREE.EquirectangularReflectionMapping;
			//hdrTexture.intensity = skyInfo.intensity;
			//thatS3dSkyBox.refreshLights(skyInfo);
			thatS3dSkyBox.manager.viewer.scene.environment = hdrTexture;
			thatS3dSkyBox.setHemisphereSky(skyInfo, scale, rotation, hidden);
			thatS3dSkyBox.refreshAllObject3DEnvMap(hdrTexture);
		});
	}

	//为所有构件更新环境贴图
	this.refreshAllObject3DEnvMap = function (hdrTexture) {
		let allObject3DMap = thatS3dSkyBox.manager.viewer.allObject3DMap;
		let id2MaterialMap = {};
		for (let objectId in allObject3DMap) {
			let object3D = allObject3DMap[objectId];
			thatS3dSkyBox.refreshObject3DMaterialEnvMap(object3D, id2MaterialMap, hdrTexture);
		}
	}

	this.refreshMaterialEnvMap = function (material, id2MaterialMap, hdrTexture){
		if(material != null && id2MaterialMap[material.id] !== true){
			if(material.envMapIntensity != null && material.envMapIntensity > 0) {
				material.envMap = hdrTexture;
			}
			id2MaterialMap[material.id] = true;
		}
	}

	this.refreshObject3DMaterialEnvMap = function (object3D, id2MaterialMap, hdrTexture) {
		if (object3D.children.length === 0) {
			let materialObj = object3D.material;
			if(materialObj != null) {
				if (materialObj.length != null) {
					for (let i = 0; i < materialObj.length; i++) {
						let m = materialObj[i];
						thatS3dSkyBox.refreshMaterialEnvMap(m, id2MaterialMap, hdrTexture);
						if (object3D.originalMaterial != null) {
							let om = object3D.originalMaterial[i];
							thatS3dSkyBox.refreshMaterialEnvMap(om, id2MaterialMap, hdrTexture);
						}
					}
				} else {
					thatS3dSkyBox.refreshMaterialEnvMap(materialObj, id2MaterialMap, hdrTexture);
					if (object3D.originalMaterial != null) {
						thatS3dSkyBox.refreshMaterialEnvMap(object3D.originalMaterial, id2MaterialMap, hdrTexture);
					}
				}
			}
		} else {
			let childObjs = object3D.children;
			for (let i = 0; i < childObjs.length; i++) {
				let childObj = childObjs[i];
				thatS3dSkyBox.refreshObject3DMaterialEnvMap(childObj, id2MaterialMap, hdrTexture);
			}
		}
	}

	//方盒子
	this.setBoxSky = function (skyInfo, scale, rotation, hidden){
		let path = thatS3dSkyBox.resourcesPublicFolder + "skies/" + skyInfo.name + "/";
		let format = '.jpg';
		let urls = [
			path + 'right' + format,
			path + 'left' + format,
			path + 'up' + format,
			path + 'down' + format,
			path + 'front' + format,
			path + 'back' + format
		];
		if(!hidden) {
			thatS3dSkyBox.manager.viewer.scene.background = new THREE.CubeTextureLoader().load(urls);
		}

		let sphereTexture = new THREE.CubeTextureLoader();
		thatS3dSkyBox.manager.viewer.scene.environment = sphereTexture.load(urls);

		thatS3dSkyBox.doEventFunction("afterInitSkyBox", {});
	}

	//背景色
	this.setBackgroundColor = function (skyInfo, backgroundColor){
		thatS3dSkyBox.manager.viewer.renderer.alpha = false;
		thatS3dSkyBox.manager.viewer.renderer.setClearColor(backgroundColor);
		thatS3dSkyBox.doEventFunction("afterInitSkyBox", {});
	}

	//背景图片
	this.setBackgroundImage = function (skyInfo, backgroundImage){
		thatS3dSkyBox.manager.viewer.renderer.alpha = true;
		thatS3dSkyBox.manager.viewer.renderer.setClearColor(0x0000, 0);
		let imageUrl = thatS3dSkyBox.manager.localImages.getImageUrl(backgroundImage);
		let image = $("#" + thatS3dSkyBox.manager.viewer.containerId).find(".s3dViewerInnerContainerBackgroundImage");
		$(image).addClass("s3dViewerInnerContainerBackgroundImageActive");
		$(image).attr("src", imageUrl);

		thatS3dSkyBox.doEventFunction("afterInitSkyBox", {});
	}

	//球形
	this.setSphereSky = function (skyInfo, scale, rotation, hidden){
		let path = thatS3dSkyBox.getSphereSkyImageUrl(thatS3dSkyBox.resourcesPublicFolder, skyInfo.name, skyInfo.imageName);
		let dotIndex = skyInfo.imageName.lastIndexOf(".");
		let postfix = skyInfo.imageName.substr(dotIndex + 1).toLowerCase();
		let loader = null;
		switch(postfix){
			case "hdr":{
				loader = new RGBELoader();
				break;
			}
			case "jpg":
			case "png":
			default:{
				loader = new THREE.TextureLoader();
				break;
			}
		}
		loader.load(path, function (texture) {
			texture.mapping = THREE.EquirectangularReflectionMapping;
			texture.wrapS = THREE.RepeatWrapping;
			texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(-1, 1);
			thatS3dSkyBox.manager.viewer.scene.environment = texture;
			let sphereGeometry = new THREE.SphereGeometry(32, 100, 100);
			let sphereMaterial = new THREE.MeshStandardMaterial({
				map: texture,
				side: THREE.DoubleSide,
			});
			let sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

			sphere.scale.set(scale, scale, scale);
			sphere.rotation.set(0, rotation, 0);

			sphere.isSky = true;
			sphere.castShadow = false;
			sphere.receiveShadow = false;

			if(hidden){
				sphere.visible = false;
			}

			thatS3dSkyBox.clearSkyObject();


			thatS3dSkyBox.manager.viewer.enableObjectLayer(sphere, s3dLayerType.viewLayer, true);
			thatS3dSkyBox.manager.viewer.scene.add(sphere);

			thatS3dSkyBox.refreshAllObject3DEnvMap(texture);

			thatS3dSkyBox.doEventFunction("afterInitSkyBox", {});
		});
	}

	this.getSphereSkyImageUrl = function (rootUrl, dirName, imageName){
		return rootUrl + "skies/" + dirName + "/" + imageName
	}
}

export default S3dSkyBox