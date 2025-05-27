import S3dWebViewManager from "../../../core/manager/s3dWebViewManager.js";
import "../../../commonjs/jQuery/jquery.min.js";
import {cmnPcr, msgBox, s3dLayerType} from "../../../commonjs/common/common.js";

let S3dExhibitViewer  = function () {
	const thatViewer = this;

	//容器div id
	this.containerId = null;

	//管理器
	this.manager = null;

	//应用信息
	this.app = null;

	//ai
	this.ai = null;

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

	this.init = function (p) {
		thatViewer.containerId = p.containerId;
		thatViewer.layoutConfig = p.layoutConfig;
		thatViewer.app = p.app;
		thatViewer.user = p.user;
		thatViewer.model = p.model;
		thatViewer.timestamp = p.timestamp;
		thatViewer.importConfig();
	}

	this.refreshPageTitle = function (modelName){
		$("title").text(modelName + " - 数孪·万象");
	}

	//加载配置信息
	this.importConfig = function () {
		thatViewer.path = {
			images: "../../images/",
			fonts: "../../fonts/",
			userResources: "../../../appResources/user/" + thatViewer.user.id + "/" + thatViewer.model.id + "/",
			publicResources: "../../../appResources/user/" + thatViewer.user.id + "/" + thatViewer.model.id + "/"
		};
		thatViewer.importImageListConfig();
		thatViewer.importComponentListConfig();
		thatViewer.importMaterialListConfig();
		thatViewer.importSkyMapConfig();
		thatViewer.importContent2DConfig();
	}

	this.loadModelText = async function (){
		//判断需要的资源是否都已经加载完成
		if(thatViewer.imageList != null
			&& thatViewer.materialList != null
			&& thatViewer.componentList != null
			&& thatViewer.skyMap != null
			&& thatViewer.content2D != null) {

			let modelUrl = thatViewer.getModelUrl();
			let mainResponse = await fetch(modelUrl);
			thatViewer.model.text = await mainResponse.text();
			thatViewer.initManager();
		}
	}

	this.initManager = function () {
		thatViewer.manager = new S3dWebViewManager();
		thatViewer.manager.init({
			containerId: thatViewer.containerId,
			timestamp: thatViewer.timestamp,
			pluginConfigs: {
				loader: {
					modelInfo: {
						id: thatViewer.model.id,
						text: thatViewer.model.text
					}
				},
				layout:{
					layoutConfig: thatViewer.layoutConfig,
					imagesFolder: thatViewer.path.images,
					fontsFolder: thatViewer.path.fonts,
					resourcesUserFolder: thatViewer.path.userResources,
					resourcesPublicFolder: thatViewer.path.publicResources
				},
				localMaterials: {
					materialList: thatViewer.materialList
				},
				localImages: {
					imageList: thatViewer.imageList,
				},
				localContent2D: {
					content2D: thatViewer.content2D,
				},
				viewer: {
					showShadow: true,
					canSelectObject3D: false,
					mobileAutoRotate: false,
					useHighlightMaterial: false,
					statsVisible: false,
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
						},
						orthographic: {
							near: -5000,
							far: 5000,
							enableRotate: true,
							enableZoom: true,
							enablePan: true
						}
					},
					afterInitScene: function (){
						thatViewer.refreshPageTitle(thatViewer.manager.s3dObject.name);
						thatViewer.manager.localContent2D.showContent2DPage();
						thatViewer.manager.appSimpleRunner.setAllObjectsVisible(true);
						thatViewer.manager.appSimpleRunner.setAllTagsVisible(false);
					}
				},
				skyBox: {
					resourcesPublicFolder: thatViewer.path.publicResources,
					skyMap: thatViewer.skyMap,
					isGeometrySkyHidden: true
				},
				appSimpleRunner: {},
				componentLibrary: {
					categories: thatViewer.componentList
				},
				axis: {
					hasAxis: false,
					hasPlane: false,
				},
				statusBar: {},
				moveHelper: {},
				internalObjectCreator: {},
				localObjectCreator: {},
				serverObjectCreator: {},
				object3DCache: {},
				resourceLoader: {},
				messageBox: {},
				ruler: {},
				screen2D: {},
				progressOperator: {},
				animationPlayer: {}
			}
		});
	}

	this.getImageListUrl = function (){
		return "../../../../appResources/user/" + thatViewer.user.id + "/" + thatViewer.model.id + "/config/imageList.js?t=" + (new Date());
	}

	this.getComponentListUrl = function (){
		return "../../../../appResources/user/" + thatViewer.user.id + "/" + thatViewer.model.id + "/config/componentList.js?t=" + (new Date());
	}

	this.getMaterialListUrl = function (){
		return "../../../../appResources/user/" + thatViewer.user.id + "/" + thatViewer.model.id +  "/config/materialList.js?t=" + (new Date());
	}

	this.getSkyMapUrl = function (){
		return "../../../../appResources/user/" + thatViewer.user.id + "/" + thatViewer.model.id +  "/config/skyMap.js?t=" + (new Date());
	}

	this.getContent2DUrl = function (){
		return "../../../../appResources/user/" + thatViewer.user.id + "/" + thatViewer.model.id +  "/config/content2D.js?t=" + (new Date());
	}

	this.getModelUrl = function (){
		return "../../../appResources/user/" + thatViewer.user.id + "/" + thatViewer.model.id +  "/config/model.s3dc?t=" + (new Date());
	}

	this.importSkyMapConfig = function (){
		let skyMapConfigFileUrl = thatViewer.getSkyMapUrl();
		import(skyMapConfigFileUrl)
			.then((module) => {
				thatViewer.skyMap = module.skyMap;
				thatViewer.loadModelText();
			})
			.catch((error) => {
				console.error('Failed to load sky map', error);
			});
	}

	this.importContent2DConfig = function (){
		let content2DConfigFileUrl = thatViewer.getContent2DUrl();
		import(content2DConfigFileUrl)
			.then((module) => {
				thatViewer.content2D = module.content2D;
				thatViewer.loadModelText();
			})
			.catch((error) => {
				console.error('Failed to load content2D', error);
			});
	}

	this.importImageListConfig = function (){
		let imageListConfigFileUrl = thatViewer.getImageListUrl();
		import(imageListConfigFileUrl)
			.then((module) => {
				thatViewer.imageList = module.imageList;
				thatViewer.loadModelText();
			})
			.catch((error) => {
				console.error('Failed to load image list', error);
			});
	}

	this.importComponentListConfig = function (){
		let componentListConfigFileUrl = thatViewer.getComponentListUrl();
		import(componentListConfigFileUrl)
			.then((module) => {
				thatViewer.componentList = module.componentList;
				thatViewer.loadModelText();
			})
			.catch((error) => {
				console.error('Failed to load component list', error);
			});
	}

	this.importMaterialListConfig = function (){
		let materialListConfigFileUrl = thatViewer.getMaterialListUrl();
		import(materialListConfigFileUrl)
			.then((module) => {
				thatViewer.materialList = module.materialList;
				thatViewer.loadModelText();
			})
			.catch((error) => {
				console.error('Failed to load material list', error);
			});
	}
}

export default S3dExhibitViewer