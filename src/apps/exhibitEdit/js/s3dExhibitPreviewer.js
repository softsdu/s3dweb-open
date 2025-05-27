import S3dWebEditManager from "../../../core/manager/s3dWebEditManager.js";
import "../../../commonjs/jQuery/jquery.min.js";
import {cmnPcr, msgBox, s3dLayerType, s3dUiStatus, serverAccess} from "../../../commonjs/common/common.js";

let S3dExhibitPreviewer  = function () {
	const thatPreviewer = this;

	//容器div id
	this.containerId = null;

	//管理器
	this.manager = null;

	//应用信息
	this.app = null;

	//服务信息
	this.server = null;

	//路径信息
	this.path = null;

	//模型信息
	this.model = null;

	//界面布局设置
	this.layoutConfig = null;

	//系统材质
	this.materialList = null;

	//贴图
	this.imageList = null;

	//3D物体模型
	this.componentList = null;

	//天空盒子
	this.skyMap = null;

	//Content2D
	this.content2D = null;

	this.init = function (p){
		thatPreviewer.containerId = p.containerId;
		thatPreviewer.layoutConfig = p.layoutConfig;
		thatPreviewer.app = p.app;
		thatPreviewer.server = p.server;
		thatPreviewer.model = p.model;
		thatPreviewer.timestamp = p.timestamp;

		thatPreviewer.loadUserInfo();
	}

	this.refreshPageTitle = function (modelName){
		$("title").text("预览 - " + modelName + " - 数孪·万象");
	}

	//加载用户信息
	this.loadUserInfo = function (){
		let requestParam = {
			modelId: thatPreviewer.model.id
		};
		serverAccess.request({
			serverUrl: thatPreviewer.server.rootUrl,
			serviceName: "s3dUserNcpService",
			appKey: thatPreviewer.app.key,
			funcName: "getUser",
			args: {
				requestParam: cmnPcr.jsonToStr(requestParam)
			},
			successFunc: function (obj){
				let userInfo = obj.result.userInfo;
				thatPreviewer.user = {
					id: userInfo.id,
					name: decodeURIComponent(userInfo.name),
					code: decodeURIComponent(userInfo.code)
				};
				thatPreviewer.path = {
					images: "../../images/",
					fonts:  "../../fonts/",
					userResources: "../../../appResources/user/" + userInfo.id + "/",
					publicResources: "../../../appResources/"
				};
				thatPreviewer.checkImageListConfig();
				thatPreviewer.checkComponentListConfig();
				thatPreviewer.checkMaterialListConfig();
				thatPreviewer.importSkyMapConfig();
				thatPreviewer.importContent2DConfig();
			},
			failFunc: function (obj){
				msgBox.alert({info: obj.message});
			},
			errorFunc: function(httpRequest, textStatus, errorThrown){
				msgBox.alert({info: "无法获取模型文件."});
			}
		});
	}

	this.loadModelText = function (){
		//判断需要的资源是否都已经加载完成
		if(thatPreviewer.imageList != null
			&& thatPreviewer.materialList != null
			&& thatPreviewer.componentList != null
			&& thatPreviewer.skyMap != null
			&& thatPreviewer.content2D != null) {
			let requestParam = {
				modelId: thatPreviewer.model.id
			};
			serverAccess.request({
				serverUrl: thatPreviewer.server.rootUrl,
				serviceName: "s3dModelNcpService",
				appKey: thatPreviewer.app.key,
				funcName: "getModel",
				args: {
					requestParam: cmnPcr.jsonToStr(requestParam)
				},
				successFunc: function (obj) {
					let modelInfo = obj.result.modelInfo;
					thatPreviewer.model.text = decodeURIComponent(modelInfo.text);
					thatPreviewer.refreshPageTitle(modelInfo.name);
					thatPreviewer.initManager();
				},
				failFunc: function (obj) {
					msgBox.alert({info: obj.message});
				},
				errorFunc: function (httpRequest, textStatus, errorThrown) {
					msgBox.alert({info: "无法获取模型文件."});
				}
			});
		}
	}

	this.saveModel = function (p){
		const afterSaveModel = p.afterSaveModel;
		let modelJson = thatPreviewer.manager.getModelJson();
		let imageBase64 = thatPreviewer.manager.viewer.getImageBase64();

		let requestParam = {
			modelId: modelJson.id,
			modelName: encodeURIComponent(modelJson.name),
			modelText: encodeURIComponent(cmnPcr.jsonToStr(modelJson)),
			imageBase64: imageBase64
		};

		serverAccess.request({
			serverUrl: thatPreviewer.server.rootUrl,
			serviceName: "s3dModelNcpService",
			appKey: thatPreviewer.app.key,
			funcName: "saveModel",
			args: {
				requestParam: cmnPcr.jsonToStr(requestParam)
			},
			successFunc: function (obj) {
				if(afterSaveModel){
					afterSaveModel({
						modelId: obj.result.modelId,
						modelName: obj.result.modelName
					});
				}
				else {
					msgBox.alert({info: "保存成功."});
				}
			},
			failFunc: function (obj) {
				msgBox.error({title: "提示", info: obj.message});
			},
			errorFunc: function (httpRequest, textStatus, errorThrown) {
				msgBox.error({info: "无法连通服务"});
			}
		});
	}

	this.initManager = function () {
		thatPreviewer.manager = new S3dWebEditManager();
		thatPreviewer.manager.init({
			containerId: thatPreviewer.containerId,
			timestamp: thatPreviewer.timestamp,
			pluginConfigs: {
				loader: {
					modelInfo: {
						id: thatPreviewer.model.id,
						text: thatPreviewer.model.text
					}
				},
				layout:{
					layoutConfig: thatPreviewer.layoutConfig,
					imagesFolder: thatPreviewer.path.images,
					fontsFolder: thatPreviewer.path.fonts,
					resourcesUserFolder: thatPreviewer.path.userResources,
					resourcesPublicFolder: thatPreviewer.path.publicResources
				},
				localMaterials: {
					materialList: thatPreviewer.materialList
				},
				localImages: {
					imageList: thatPreviewer.imageList,
				},
				localContent2D: {
					content2D: thatPreviewer.content2D,
				},
				viewer: {
					showShadow: false,
					canSelectObject3D: false,
					mobileAutoRotate: false,
					useHighlightMaterial: false,
					statsVisible: true,
					defaultObjectHidden: true,
					distanceRatio: 1,
					detailLevel: 4,
					hasAnimation: true,
					defaultCameraLayers: [
						s3dLayerType.viewLayer
					],
					orbitControlConfig: {
						perspective: {
							near: 0.1,
							far: 5000,
							enableRotate: true,
							enableZoom: true,
							enablePan: true
						}
					},
					afterInitScene: function (){
						thatPreviewer.manager.localContent2D.showContent2DPage();
						thatPreviewer.manager.appSimpleRunner.setAllObjectsVisible(true);
						thatPreviewer.manager.appSimpleRunner.setAllTagsVisible(false);
					},
				},
				appSimpleRunner: {},
				skyBox: {
					resourcesPublicFolder: thatPreviewer.path.publicResources,
					skyMap: thatPreviewer.skyMap,
					isGeometrySkyHidden: true
				},
				componentLibrary: {
					categories: thatPreviewer.componentList
				},
				axis: {
					hasAxis: false,
					hasPlane: false,
				},
				cameraRender: {},
				animationGenerator: {},
				screen2D: {},
				internalObjectCreator: {},
				localObjectCreator: {},
				serverObjectCreator: {},
				object3DCache: {},
				resourceLoader: {},
				messageBox: {},
				ruler: {},
				splitter: {}
			}
		});
	}

	this.uploadAndSelectResourceImage = function (file){
		const formData = new FormData();
		formData.append("image", file);
		let uploadUrl = thatPreviewer.server.rootUrl + "s3d/s3dUploadImageFile?appKey=" + thatPreviewer.app.key;
		fetch(uploadUrl, {
			method: "POST",
			body: formData
		})
			.then(response => response.json())
			.then(data => {
				let imageJson = data[0].result.image;
				thatPreviewer.manager.localImagePicker.imageUrl = imageJson.url;
				thatPreviewer.manager.localImagePicker.endPick();
				thatPreviewer.updateImageListConfig();
			})
			.catch(error => {
				msgBox.alert({info: "上传失败", error});
			});
	}

	this.removeResourceComponent = function (p){
		let requestParam = {
			componentCode: p.componentCode,
			versionNum: p.versionNum
		};

		serverAccess.request({
			serverUrl: thatPreviewer.server.rootUrl,
			serviceName: "s3dComponentNcpService",
			appKey: thatPreviewer.app.key,
			funcName: "removeComponentLocal",
			args: {
				requestParam: cmnPcr.jsonToStr(requestParam)
			},
			successFunc: function (obj) {
				thatPreviewer.manager.localObjectCreator.removeComponentJson(p.componentCode, p.versionNum);
				thatPreviewer.updateComponentListConfig();
			},
			failFunc: function (obj) {
				msgBox.error({title: "提示", info: obj.message});
			},
			errorFunc: function (httpRequest, textStatus, errorThrown) {
				msgBox.error({info: "无法连通服务"});
			}
		});
	}

	this.uploadAndSelectResourceComponent = function (p){
		const formData = new FormData();
		for(let i = 0; i < p.files.length; i++){
			let file = p.files[i];
			formData.append("file_" + i, file);
		}
		let uploadUrl = thatPreviewer.server.rootUrl + "s3d/s3dUploadComponentLocalFile?appKey=" + thatPreviewer.app.key + "&comTypeCode=" + p.comTypeCode;
		fetch(uploadUrl, {
			method: "POST",
			body: formData
		})
			.then(response => response.json())
			.then(data => {
				let componentJson = data[0].result.component;
				thatPreviewer.manager.localObjectCreator.addComponentJson(componentJson);
				thatPreviewer.manager.adder.addComponent({
					componentName: componentJson.name,
					componentId: componentJson.id,
					componentCode: componentJson.code,
					versionNum: componentJson.versionNum,
					isServer: false,
					isLocal: true,
					isInternal: false
				});
				thatPreviewer.manager.adder.hide();
				thatPreviewer.updateComponentListConfig();
			})
			.catch(error => {
				msgBox.alert({info: "上传失败", error});
			});
	}

	this.removeResourceImage = function (imageName){
		let requestParam = {
			imageName: imageName,
			autoGenerate: true
		};

		serverAccess.request({
			serverUrl: thatPreviewer.server.rootUrl,
			serviceName: "s3dImageNcpService",
			appKey: thatPreviewer.app.key,
			funcName: "removeImage",
			args: {
				requestParam: cmnPcr.jsonToStr(requestParam)
			},
			successFunc: function (obj) {
				thatPreviewer.updateImageListConfig();
			},
			failFunc: function (obj) {
				msgBox.error({title: "提示", info: obj.message});
			},
			errorFunc: function (httpRequest, textStatus, errorThrown) {
				msgBox.error({info: "无法连通服务"});
			}
		});
	}

	this.getImageListUrl = function (){
		return "../../../../appResources/user/" + thatPreviewer.user.id + "/config/imageList.js?t=" + (new Date());
	}

	this.getComponentListUrl = function (){
		return "../../../../appResources/user/" + thatPreviewer.user.id + "/config/componentList.js?t=" + (new Date());
	}

	this.getMaterialListUrl = function (){
		return "../../../../appResources/user/" + thatPreviewer.user.id + "/config/materialList.js?t=" + (new Date());
	}

	this.getSkyMapUrl = function (){
		return "../../../../appResources/skies/skyMap.js?t=" + (new Date());
	}

	this.getContent2DUrl = function (){
		return "../../../../appResources/content2D/content2D.js?t=" + (new Date());
	}

	this.updateImageListConfig = function (){
		let imageListConfigFileUrl = thatPreviewer.getImageListUrl();
		import(imageListConfigFileUrl)
			.then((module) => {
				thatPreviewer.imageList = module.imageList;
				thatPreviewer.manager.localImages.updateImageList(module.imageList);
			})
			.catch((error) => {
				console.error('Failed to load module', error);
			});
	}

	this.updateComponentListConfig = function (){
		let componentListConfigFileUrl = thatPreviewer.getComponentListUrl();
		import(componentListConfigFileUrl)
			.then((module) => {
				thatPreviewer.componentList = module.componentList;
				thatPreviewer.manager.componentLibrary.categories = module.componentList;
			})
			.catch((error) => {
				console.error('Failed to load module', error);
			});
	}

	this.importImageListConfig = function (){
		let imageListConfigFileUrl = thatPreviewer.getImageListUrl();
		import(imageListConfigFileUrl)
			.then((module) => {
				thatPreviewer.imageList = module.imageList;
				thatPreviewer.loadModelText();
			})
			.catch((error) => {
				console.error('Failed to load image list', error);
			});
	}

	this.importComponentListConfig = function (){
		let componentListConfigFileUrl = thatPreviewer.getComponentListUrl();
		import(componentListConfigFileUrl)
			.then((module) => {
				thatPreviewer.componentList = module.componentList;
				thatPreviewer.loadModelText();
			})
			.catch((error) => {
				console.error('Failed to load component list', error);
			});
	}

	this.importMaterialListConfig = function (){
		let materialListConfigFileUrl = thatPreviewer.getMaterialListUrl();
		import(materialListConfigFileUrl)
			.then((module) => {
				thatPreviewer.materialList = module.materialList;
				thatPreviewer.loadModelText();
			})
			.catch((error) => {
				console.error('Failed to load material list', error);
			});
	}

	this.importSkyMapConfig = function (){
		let skyMapConfigFileUrl = thatPreviewer.getSkyMapUrl();
		import(skyMapConfigFileUrl)
			.then((module) => {
				thatPreviewer.skyMap = module.skyMap;
				thatPreviewer.loadModelText();
			})
			.catch((error) => {
				console.error('Failed to load sky map', error);
			});
	}

	this.importContent2DConfig = function (){
		let content2DConfigFileUrl = thatPreviewer.getContent2DUrl();
		import(content2DConfigFileUrl)
			.then((module) => {
				thatPreviewer.content2D = module.content2D;
				thatPreviewer.loadModelText();
			})
			.catch((error) => {
				console.error('Failed to load content2D', error);
			});
	}

	this.checkImageListConfig = function (){
		let requestParam = {
			appKey: thatPreviewer.app.key,
			autoGenerate: true
		};

		serverAccess.request({
			serverUrl: thatPreviewer.server.rootUrl,
			serviceName: "s3dImageNcpService",
			appKey: thatPreviewer.app.key,
			funcName: "checkAppImagesAndConfig",
			args: {
				requestParam: cmnPcr.jsonToStr(requestParam)
			},
			successFunc: function (obj) {
				thatPreviewer.importImageListConfig();
			},
			failFunc: function (obj) {
				msgBox.error({title: "提示", info: obj.message});
			},
			errorFunc: function (httpRequest, textStatus, errorThrown) {
				msgBox.error({info: "无法连通服务"});
			}
		});
	}

	this.checkComponentListConfig = function (){
		let requestParam = {
			appKey: thatPreviewer.app.key,
			autoGenerate: true
		};

		serverAccess.request({
			serverUrl: thatPreviewer.server.rootUrl,
			serviceName: "s3dComponentNcpService",
			appKey: thatPreviewer.app.key,
			funcName: "checkAppComponentsAndConfig",
			args: {
				requestParam: cmnPcr.jsonToStr(requestParam)
			},
			successFunc: function (obj) {
				thatPreviewer.importComponentListConfig();
			},
			failFunc: function (obj) {
				msgBox.error({title: "提示", info: obj.message});
			},
			errorFunc: function (httpRequest, textStatus, errorThrown) {
				msgBox.error({info: "无法连通服务"});
			}
		});
	}

	this.checkMaterialListConfig = function (){
		let requestParam = {
			appKey: thatPreviewer.app.key,
			autoGenerate: true
		};

		serverAccess.request({
			serverUrl: thatPreviewer.server.rootUrl,
			serviceName: "s3dSystemNcpService",
			appKey: thatPreviewer.app.key,
			funcName: "checkAppMaterialConfig",
			args: {
				requestParam: cmnPcr.jsonToStr(requestParam)
			},
			successFunc: function (obj) {
				thatPreviewer.importMaterialListConfig();
			},
			failFunc: function (obj) {
				msgBox.error({title: "提示", info: obj.message});
			},
			errorFunc: function (httpRequest, textStatus, errorThrown) {
				msgBox.error({info: "无法连通服务"});
			}
		});
	}
}

export default S3dExhibitPreviewer