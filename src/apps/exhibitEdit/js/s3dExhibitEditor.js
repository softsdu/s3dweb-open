import S3dWebEditManager from "../../../core/manager/s3dWebEditManager.js";
import "../../../commonjs/jQuery/jquery.min.js";
import {cmnPcr, msgBox, PopupContainer, s3dUiStatus, serverAccess} from "../../../commonjs/common/common.js";

let S3dExhibitEditor  = function () {
	const thatEditor = this;

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
		thatEditor.containerId = p.containerId;
		thatEditor.layoutConfig = p.layoutConfig;
		thatEditor.app = p.app;
		thatEditor.server = p.server;
		thatEditor.model = p.model;
		thatEditor.timestamp = p.timestamp;

		thatEditor.loadUserInfo();
	}

	this.refreshPageTitle = function (modelName){
		$("title").text("编辑 - " + modelName + " - 数孪·万象");
	}

	//加载用户信息
	this.loadUserInfo = function (){
		let requestParam = {
			modelId: thatEditor.model.id
		};
		serverAccess.request({
			serverUrl: thatEditor.server.rootUrl,
			serviceName: "s3dUserNcpService",
			appKey: thatEditor.app.key,
			funcName: "getUser",
			args: {
				requestParam: cmnPcr.jsonToStr(requestParam)
			},
			successFunc: function (obj){
				let userInfo = obj.result.userInfo;
				thatEditor.user = {
					id: userInfo.id,
					name: decodeURIComponent(userInfo.name),
					code: decodeURIComponent(userInfo.code)
				};
				thatEditor.path = {
					images: "../../images/",
					fonts:  "../../fonts/",
					userResources: "../../../appResources/user/" + userInfo.id + "/",
					publicResources: "../../../appResources/"
				};
				thatEditor.checkImageListConfig();
				thatEditor.checkComponentListConfig();
				thatEditor.checkMaterialListConfig();
				thatEditor.importSkyMapConfig();
				thatEditor.importContent2DConfig();
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
		if(thatEditor.imageList != null
			&& thatEditor.materialList != null
			&& thatEditor.componentList != null
			&& thatEditor.skyMap != null
			&& thatEditor.content2D != null) {
			let requestParam = {
				modelId: thatEditor.model.id
			};
			serverAccess.request({
				serverUrl: thatEditor.server.rootUrl,
				serviceName: "s3dModelNcpService",
				appKey: thatEditor.app.key,
				funcName: "getModel",
				args: {
					requestParam: cmnPcr.jsonToStr(requestParam)
				},
				successFunc: function (obj) {
					let modelInfo = obj.result.modelInfo;
					thatEditor.model.text = decodeURIComponent(modelInfo.text);
					thatEditor.refreshPageTitle(modelInfo.name);
					thatEditor.initManager();
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
		let modelJson = thatEditor.manager.getModelJson();
		let imageBase64 = thatEditor.manager.viewer.getImageBase64();

		let requestParam = {
			modelId: modelJson.id,
			modelName: encodeURIComponent(modelJson.name),
			modelText: encodeURIComponent(cmnPcr.jsonToStr(modelJson)),
			imageBase64: imageBase64
		};

		serverAccess.request({
			serverUrl: thatEditor.server.rootUrl,
			serviceName: "s3dModelNcpService",
			appKey: thatEditor.app.key,
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

	this.publish = function (){
		const modelId = thatEditor.manager.s3dObject.id;
		let requestParam = {
			id: modelId
		};
  
		serverAccess.request({
			serverUrl: thatEditor.server.rootUrl,
			serviceName: "s3dPublishNcpService",
			appKey: thatEditor.app.key,
			funcName: "publishModel",
			args: {
				requestParam: cmnPcr.jsonToStr(requestParam)
			},
			successFunc: function (obj) {
				let popContainer = new PopupContainer( {
					width : 300,
					height : 160,
					top : 50,
					canClose: false,
					title: "发布",
					containerId: thatEditor.containerId
				});

				popContainer.show();

				let downloadUrl =  "../../../publish/temp/" + obj.result.zipFilePath;
				let pageUrl = "../../../publish/module/apps/exhibitView/exhibitViewer.html?user=" + thatEditor.user.id + "&model=" + modelId;

				let html = "<div class='s3dPublishContainer'>"
					+ "<div class='s3dPublishInnerContainer'>"
					+ "<div class='s3dPublishInfoItem'>发布成功.</div>"
					+ "<div class='s3dPublishInfoSubItem'>1. 请点击<a class='s3dPublishInfoItemLink' href='" + downloadUrl + "' target='_blank'>下载发布包</a></div>"
					+ "<div class='s3dPublishInfoSubItem'>2. 请点击<a class='s3dPublishInfoItemLink' href='" + pageUrl + "' target='_blank'>在线查看</a></div>"
					+ "</div>"
					+ "</div>";
				$("#" + popContainer.contentId).html(html);
			},
			failFunc: function (obj) {
				msgBox.error({title: "提示", info: obj.message});
			},
			errorFunc: function (httpRequest, textStatus, errorThrown) {
				msgBox.error({info: "无法连通服务"});
			}
		});
	}

	this.preview = function (){
		let modelJson = thatEditor.manager.getModelJson();
		let previewUrl = "./exhibitPreviewer.html?modelId=" + modelJson.id + "&modelName=" + encodeURIComponent(modelJson.name);
		window.open(previewUrl, "_blank");
	}

	this.initManager = function () {
		thatEditor.manager = new S3dWebEditManager();
		thatEditor.manager.init({
			containerId: thatEditor.containerId,
			timestamp: thatEditor.timestamp,
			pluginConfigs: {
				loader: {
					modelInfo: {
						id: thatEditor.model.id,
						text: thatEditor.model.text
					}
				},
				layout:{
					layoutConfig: thatEditor.layoutConfig,
					imagesFolder: thatEditor.path.images,
					fontsFolder: thatEditor.path.fonts,
					resourcesUserFolder: thatEditor.path.userResources,
					resourcesPublicFolder: thatEditor.path.publicResources
				},
				localMaterials: {
					materialList: thatEditor.materialList
				},
				localImages: {
					imageList: thatEditor.imageList,
				},
				localContent2D: {
					content2D: thatEditor.content2D,
				},
				viewer: {
					showShadow: false,
					canSelectObject3D: true,
					mobileAutoRotate: false,
					useHighlightMaterial: false,
					statsVisible: false,
					distanceRatio: 1,
					detailLevel: 4,
					orbitControlConfig: {
						perspective: {
							near: 0.1,
							far: 5000,
							enableRotate: true,
							enableZoom: true,
							enablePan: true
						},
						orthographic: {
							near: -1000,
							far: 5000,
							enableRotate: true,
							enableZoom: true,
							enablePan: true
						}
					},
					onSelectChanged: function (p) {
						thatEditor.manager.treeEditor.highlightNodes(p.nodeJArray);
						thatEditor.manager.moveHelper.attach(p.nodeJArray);
						thatEditor.manager.cameraRender.rebindCamera(p.nodeJArray);
					},
					afterAddNewObject: function (p) {
						thatEditor.manager.treeEditor.addNodeInSilence(p.nodeJson);
					},
					afterRebuildObject: function (p) {
					},
					beforeRemoveObjects: function (p) {
						thatEditor.manager.moveHelper.detach();
					},
					afterRemoveObject: function (p) {
						thatEditor.manager.treeEditor.removeNodeInSilence(p.nodeId);
					},
					afterInitAllObjects: function (p) {
						let sortedPageList = thatEditor.manager.userContent2D.getSortedPageList();
						thatEditor.manager.appSimpleEditor.showPage(sortedPageList[0], true);
					},
					afterChangeParentGroup: function (p){
						thatEditor.manager.treeEditor.changeNodeParentInSilence(p.nodeId, p.newParentId);
					}
				},
				treeEditor: {
					onNodeClick: function (p) {
						let nodeId = p.nodeJson.id;
						thatEditor.manager.viewer.changeStatus({
							status: s3dUiStatus.normalView
						});
						let	selectNodeIds = [nodeId];
						if (selectNodeIds.length > 0) {
							thatEditor.manager.viewer.selectObject3Ds(selectNodeIds);
						} else {
							thatEditor.manager.viewer.cancelSelectObject3Ds();
						}
					},
					onNodeCheckStatusChange: function (p) {
						thatEditor.manager.viewer.setObject3DsVisible(p.changedNodeIds, p.checked);
					}
				},
				localImagePicker: {
					onUploadImage: function (p){
						thatEditor.uploadAndSelectResourceImage(p.file);
						p.processed = true;
					},
					onRemoveImage: function (p){
						thatEditor.removeResourceImage(p.imageCode);
						p.processed = true;
					}
				},
				propertyEditor: {},
				skyBox: {
					resourcesPublicFolder: thatEditor.path.publicResources,
					skyMap: thatEditor.skyMap,
					isGeometrySkyHidden: true
				},
				setting: {
					skyMap: thatEditor.skyMap
				},
				skyBoxSetting: {
					skyMap: thatEditor.skyMap
				},
				componentLibrary: {
					categories: thatEditor.componentList
				},
				axis: {
					hasAxis: false,
					hasPlane: false,
				},
				moveHelper: {
					attachDistance: 0.1
				},
				pointSelector: {
					placePointRadius: 0.1
				},
				alignment: {},
				adder: {
					onUploadComponent: function (p){
						thatEditor.uploadAndSelectResourceComponent(p);
						p.processed = true;
					},
					onRemoveComponent: function (p){
						thatEditor.removeResourceComponent({
							componentCode: p.componentCode,
							versionNum: p.versionNum
						});
						p.processed = true;
					}
				},
				appSimpleHeader: {
					title: "数孪 · 万象设计器",
					onButtonClick: function (p){
						switch (p.buttonName){
							case "saveModel":{
								thatEditor.saveModel({});
								p.processed = true;
								break;
							}
							case "preview":{
								thatEditor.saveModel({
									afterSaveModel: thatEditor.preview
								});
								p.processed = true;
								break;
							}
							case "publish":{
								thatEditor.saveModel({
									afterSaveModel: thatEditor.publish
								});
								p.processed = true;
								break;
							}
							default:{
								//不做自定义处理
							}
						}
					}
				},
				appSimpleToolbar: {},
				appSimpleEditor: {
					userDataName: "exhibit"
				},
				statusBar: {},
				cameraRender: {},
				animationGenerator: {},
				screen2D: {},
				internalObjectCreator: {},
				localObjectCreator: {},
				serverObjectCreator: {},
				object3DCache: {},
				resourceLoader: {},
				exporter: {},
				messageBox: {},
				ruler: {},
				splitter: {},
				copier: {},
				materialPicker: {},
				localMaterialPicker: {},
				systemMaterialPicker: {},
				materialLocator: {
					afterLocateMaterial: function (p){
						thatEditor.manager.appSimpleEditor.materialEditor.scrollToMaterialItem(p.materialName);
					}
				},
				localContent2DPicker: {}
			}
		});
	}

	this.uploadAndSelectResourceImage = function (file){
		const formData = new FormData();
		formData.append("image", file);
		let uploadUrl = thatEditor.server.rootUrl + "s3d/s3dUploadImageFile?appKey=" + thatEditor.app.key;
		fetch(uploadUrl, {
			method: "POST",
			body: formData
		})
			.then(response => response.json())
			.then(data => {
				let imageJson = data[0].result.image;
				thatEditor.manager.localImagePicker.imageUrl = imageJson.url;
				thatEditor.manager.localImagePicker.endPick();
				thatEditor.updateImageListConfig();
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
			serverUrl: thatEditor.server.rootUrl,
			serviceName: "s3dComponentNcpService",
			appKey: thatEditor.app.key,
			funcName: "removeComponentLocal",
			args: {
				requestParam: cmnPcr.jsonToStr(requestParam)
			},
			successFunc: function (obj) {
				thatEditor.manager.localObjectCreator.removeComponentJson(p.componentCode, p.versionNum);
				thatEditor.updateComponentListConfig();
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
		let uploadUrl = thatEditor.server.rootUrl + "s3d/s3dUploadComponentLocalFile?appKey=" + thatEditor.app.key + "&comTypeCode=" + p.comTypeCode;
		fetch(uploadUrl, {
			method: "POST",
			body: formData
		})
			.then(response => response.json())
			.then(data => {
				let componentJson = data[0].result.component;
				thatEditor.manager.localObjectCreator.addComponentJson(componentJson);
				thatEditor.manager.adder.addComponent({
					componentName: componentJson.name,
					componentId: componentJson.id,
					componentCode: componentJson.code,
					versionNum: componentJson.versionNum,
					isServer: false,
					isLocal: true,
					isInternal: false
				});
				thatEditor.manager.adder.hide();
				thatEditor.updateComponentListConfig();
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
			serverUrl: thatEditor.server.rootUrl,
			serviceName: "s3dImageNcpService",
			appKey: thatEditor.app.key,
			funcName: "removeImage",
			args: {
				requestParam: cmnPcr.jsonToStr(requestParam)
			},
			successFunc: function (obj) {
				thatEditor.updateImageListConfig();
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
		return "../../../../appResources/user/" + thatEditor.user.id + "/config/imageList.js?t=" + (new Date());
	}

	this.getComponentListUrl = function (){
		return "../../../../appResources/user/" + thatEditor.user.id + "/config/componentList.js?t=" + (new Date());
	}

	this.getMaterialListUrl = function (){
		return "../../../../appResources/user/" + thatEditor.user.id + "/config/materialList.js?t=" + (new Date());
	}

	this.getSkyMapUrl = function (){
		return "../../../../appResources/skies/skyMap.js?t=" + (new Date());
	}

	this.getContent2DUrl = function (){
		return "../../../../appResources/content2D/content2D.js?t=" + (new Date());
	}

	this.updateImageListConfig = function (){
		let imageListConfigFileUrl = thatEditor.getImageListUrl();
		import(imageListConfigFileUrl)
			.then((module) => {
				thatEditor.imageList = module.imageList;
				thatEditor.manager.localImages.updateImageList(module.imageList);
			})
			.catch((error) => {
				console.error('Failed to load module', error);
			});
	}

	this.updateComponentListConfig = function (){
		let componentListConfigFileUrl = thatEditor.getComponentListUrl();
		import(componentListConfigFileUrl)
			.then((module) => {
				thatEditor.componentList = module.componentList;
				thatEditor.manager.componentLibrary.categories = module.componentList;
			})
			.catch((error) => {
				console.error('Failed to load module', error);
			});
	}

	this.importImageListConfig = function (){
		let imageListConfigFileUrl = thatEditor.getImageListUrl();
		import(imageListConfigFileUrl)
			.then((module) => {
				thatEditor.imageList = module.imageList;
				thatEditor.loadModelText();
			})
			.catch((error) => {
				console.error('Failed to load image list', error);
			});
	}

	this.importComponentListConfig = function (){
		let componentListConfigFileUrl = thatEditor.getComponentListUrl();
		import(componentListConfigFileUrl)
			.then((module) => {
				thatEditor.componentList = module.componentList;
				thatEditor.loadModelText();
			})
			.catch((error) => {
				console.error('Failed to load component list', error);
			});
	}

	this.importMaterialListConfig = function (){
		let materialListConfigFileUrl = thatEditor.getMaterialListUrl();
		import(materialListConfigFileUrl)
			.then((module) => {
				thatEditor.materialList = module.materialList;
				thatEditor.loadModelText();
			})
			.catch((error) => {
				console.error('Failed to load material list', error);
			});
	}

	this.importSkyMapConfig = function (){
		let skyMapConfigFileUrl = thatEditor.getSkyMapUrl();
		import(skyMapConfigFileUrl)
			.then((module) => {
				thatEditor.skyMap = module.skyMap;
				thatEditor.loadModelText();
			})
			.catch((error) => {
				console.error('Failed to load sky map', error);
			});
	}

	this.importContent2DConfig = function (){
		let content2DConfigFileUrl = thatEditor.getContent2DUrl();
		import(content2DConfigFileUrl)
			.then((module) => {
				thatEditor.content2D = module.content2D;
				thatEditor.loadModelText();
			})
			.catch((error) => {
				console.error('Failed to load content2D', error);
			});
	}

	this.checkImageListConfig = function (){
		let requestParam = {
			appKey: thatEditor.app.key,
			autoGenerate: true
		};

		serverAccess.request({
			serverUrl: thatEditor.server.rootUrl,
			serviceName: "s3dImageNcpService",
			appKey: thatEditor.app.key,
			funcName: "checkAppImagesAndConfig",
			args: {
				requestParam: cmnPcr.jsonToStr(requestParam)
			},
			successFunc: function (obj) {
				thatEditor.importImageListConfig();
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
			appKey: thatEditor.app.key,
			autoGenerate: true
		};

		serverAccess.request({
			serverUrl: thatEditor.server.rootUrl,
			serviceName: "s3dComponentNcpService",
			appKey: thatEditor.app.key,
			funcName: "checkAppComponentsAndConfig",
			args: {
				requestParam: cmnPcr.jsonToStr(requestParam)
			},
			successFunc: function (obj) {
				thatEditor.importComponentListConfig();
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
			appKey: thatEditor.app.key,
			autoGenerate: true
		};

		serverAccess.request({
			serverUrl: thatEditor.server.rootUrl,
			serviceName: "s3dSystemNcpService",
			appKey: thatEditor.app.key,
			funcName: "checkAppMaterialConfig",
			args: {
				requestParam: cmnPcr.jsonToStr(requestParam)
			},
			successFunc: function (obj) {
				thatEditor.importMaterialListConfig();
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

export default S3dExhibitEditor