import S3dLayout from "../../plugins/s3dLayout/s3dLayout.js";
import S3dAdder from "../../plugins/s3dAdder/s3dAdder.js";
import S3dAxis from "../../plugins/s3dAxis/s3dAxis.js";
import S3dCopier from "../../plugins/s3dCopier/s3dCopier.js";
import S3dExporter from "../../plugins/s3dExporter/s3dExporter.js";
import S3dLoader from "../../plugins/s3dLoader/s3dLoader.js";
import S3dMaterialPicker from "../../plugins/s3dMaterialPicker/s3dMaterialPicker.js";
import S3dLocalMaterialPicker from "../../plugins/s3dLocalMaterialPicker/s3dLocalMaterialPicker.js";
import S3dSystemMaterialPicker from "../../plugins/s3dSystemMaterialPicker/s3dSystemMaterialPicker.js";
import S3dLocalImagePicker from "../../plugins/s3dLocalImagePicker/s3dLocalImagePicker.js";
import S3dLocalContent2DPicker from "../../plugins/s3dLocalContent2DPicker/s3dLocalContent2DPicker.js";
import S3dMessageBox from "../../plugins/s3dMessageBox/s3dMessageBox.js";
import S3dMoveHelper from "../../plugins/s3dMoveHelper/s3dMoveHelper.js";
import S3dObject3DCache from "../../plugins/s3dObject3DCache/s3dObject3DCache.js";
import S3dResourceLoader from "../../plugins/s3dResourceLoader/s3dResourceLoader.js";
import S3dServerObjectCreator from "../../plugins/s3dServerObjectCreator/s3dServerObjectCreator.js";
import S3dLocalObjectCreator from "../../plugins/s3dLocalObjectCreator/s3dLocalObjectCreator.js";
import S3dInternalObjectCreator from "../../plugins/s3dInternalObjectCreator/s3dInternalObjectCreator.js";
import S3dPointSelector from "../../plugins/s3dPointSelector/s3dPointSelector.js";
import S3dPropertyEditor from "../../plugins/s3dPropertyEditor/s3dPropertyEditor.js";
import S3dPropertyList from "../../plugins/s3dPropertyList/s3dPropertyList.js";
import S3dAnimationList from "../../plugins/s3dAnimationList/s3dAnimationList.js";
import S3dAnimationEditor from "../../plugins/s3dAnimationEditor/s3dAnimationEditor.js";
import S3dProgressList from "../../plugins/s3dProgressList/s3dProgressList.js";
import S3dProgressEditor from "../../plugins/s3dProgressEditor/s3dProgressEditor.js";
import S3dContent2DList from "../../plugins/s3dContent2DList/s3dContent2DList.js";
import S3dContent2DEditor from "../../plugins/s3dContent2DEditor/s3dContent2DEditor.js";
import S3dAnimationPlayer from "../../plugins/s3dAnimationPlayer/s3dAnimationPlayer.js";
import S3dProgressOperator from "../../plugins/s3dProgressOperator/s3dProgressOperator.js";
import S3dAnimationGenerator from "../../plugins/s3dAnimationGenerator/s3dAnimationGenerator.js";
import S3dAiAssistant from "../../plugins/s3dAiAssistant/s3dAiAssistant.js";
import S3dScreen2D from "../../plugins/s3dScreen2D/s3dScreen2D.js";
import S3dRuler from "../../plugins/s3dRuler/s3dRuler.js";
import S3dSetting from "../../plugins/s3dSetting/s3dSetting.js";
import S3dSetting2D from "../../plugins/s3dSetting2D/s3dSetting2D.js";
import S3dStatusBar from "../../plugins/s3dStatusBar/s3dStatusBar.js";
import S3dHelper from "../../plugins/s3dHelper/s3dHelper.js";
import S3dToolbar from "../../plugins/s3dToolbar/s3dToolbar.js";
import S3dTree from "../../plugins/s3dTree/s3dTree.js";
import S3dTreeEditor from "../../plugins/s3dTreeEditor/s3dTreeEditor.js";
import S3dViewer from "../../plugins/s3dViewer/s3dViewer.js";
import S3dCameraRender from "../../plugins/s3dCameraRender/s3dCameraRender.js";
import S3dSkyBox from "../../plugins/s3dSkyBox/s3dSkyBox.js";
import S3dSkyBoxSetting from "../../plugins/s3dSkyBoxSetting/s3dSkyBoxSetting.js";
import S3dComponentLibrary from "../../plugins/s3dComponentLibrary/s3dComponentLibrary.js";
import S3dSplitter from "../../plugins/s3dSplitter/s3dSplitter.js";
import S3dAppearanceSetting from "../../plugins/s3dAppearanceSetting/s3dAppearanceSetting.js";
import S3dPathDrawingTool from "../../plugins/s3dPathDrawingTool/S3dPathDrawingTool.js";
import S3dHouse2DToolbar from "../../plugins/s3dHouse2DToolbar/s3dHouse2DToolbar.js";
import S3dScene3dToolbar from "../../plugins/s3dScene3dToolbar/s3dScene3dToolbar.js";
import S3dMaterialEditor from "../../plugins/s3dMaterialEditor/s3dMaterialEditor.js";
import S3dAlignment from "../../plugins/s3dAlignment/s3dAlignment.js";
import S3dMaterialLocator from "../../plugins/s3dMaterialLocator/s3dMaterialLocator.js";
import S3dAppSimpleHeader from "../../plugins/s3dAppSimpleHeader/s3dAppSimpleHeader.js";
import S3dAppSimpleToolbar from "../../plugins/s3dAppSimpleToolbar/s3dAppSimpleToolbar.js";
import S3dAppSimpleEditor from "../../plugins/s3dAppSimpleEditor/s3dAppSimpleEditor.js";
import S3dAppSimpleRunner from "../../plugins/s3dAppSimpleRunner/s3dAppSimpleRunner.js";
import JS3StandardMaterials from "../materials/js3StandardMaterials.js"
import JS3LocalMaterials from "../materials/js3LocalMaterials.js";
import JS3UserAnimations from "../animations/js3UserAnimations.js";
import JS3UserProgresses from "../progresses/js3UserProgresses.js";
import JS3UserContent2D from "../content2D/js3UserContent2D.js";
import JS3LocalImages from "../materials/js3LocalImages.js";
import JS3LocalContent2D from "../content2D/js3LocalContent2D.js";
import "../../commonjs/jQuery/jquery.min.js";
import "../../commonjs/bootstrap/bootstrap.min.js";
import {serverAccess, cmnPcr, msgBox} from "../../commonjs/common/common.js";
import "../../commonjs/common/common3D.js";
import "../../commonjs/common/common2DLine.js";
import "../../css/s3dWebManager.css"
import "../../css/bootstrap.min.css"

//s3dWeb管理器
let S3dWebEditManager = function(){
	const thatManager = this;
	
	//插件配置
	this.pluginConfigs = null;

	//容器
	this.containerId = null;

	//时间戳
	this.timestamp = null;

	//服务
	this.service = null;

	//3D模型相关
	this.s3dObject = null;

	//本地内存数据
	this.nodeId2jsonMap = null;

	//材质库
	this.standardMaterials = null;

	//本地材质库
	this.localMaterials = null;

	//用户定义动画
	this.userAnimations = null;

	//用户定义2D内容
	this.userContent2D = null;

	//用户定义流程
	this.userProgresses = null;

	//本地材质库选择器
	this.localMaterialPicker = null;

	//系统材质库选择器
	this.systemMaterialPicker = null;

	//本地图片库
	this.localImages = null;

	//本地图片选择器
	this.localImagePicker = null;

	//本地内容模板、导航库
	this.localContent2D = null;

	//本地内容模板选择器
	this.localContent2DPicker = null;
	
	//应用插件
	//插件：模型加载器
	this.loader = null;

	//插件：3D编辑器
	this.viewer = null;

	//插件：天空盒
	this.skyBox = null;
	
	//插件：模型结构树
	this.tree = null;
	
	//插件：模型结构树（可编辑）
	this.treeEditor = null;
	
	//插件：构件属性列表
	this.propertyList = null;
	
	//插件：工具栏
	this.toolbar = null;
	
	//插件：帮助功能
	this.helper = null;

	//插件：状态栏
	this.statusBar = null;

	//插件：构件属性编辑器
	this.propertyEditor = null;

	//插件：动画列表
	this.animationList = null;

	//插件：动画编辑器
	this.animationEditor = null;

	//插件：流程列表
	this.progressList = null;

	//插件：流程编辑器
	this.progressEditor = null;

	//插件：2D内容
	this.content2DList = null;

	//插件：2D内容编辑器
	this.content2DEditor = null;

	//插件：动画播放
	this.animationPlayer = null;

	//插件：流程操作
	this.progressOperator = null;

	//插件：生成动画
	this.animationGenerator = null;

	//插件：AI助手
	this.aiAssistant = null;

	//插件：2D屏幕
	this.screen2D = null;

	//插件：资源加载
	this.resourceLoader = null;

	//插件：造型缓存
	this.object3DCache = null;

	//插件：内置造型功能
	this.internalObjectCreator = null;

	//插件：本地造型功能
	this.localObjectCreator = null;

	//插件：服务器造型功能
	this.serverObjectCreator = null;

	//插件：导出模型（含保存）
	this.exporter = null;

	//插件：消息框
	this.messageBox = null;
	
	//插件：轴网（含地平面）
	this.axis = null;
	
	//插件：构件移动helper
	this.moveHelper = null;

	//插件：3D点选择功能（用于绘制）
	this.pointSelector = null;

	//插件：全局参数配置
	this.setting = null;

	//插件：测距功能
	this.ruler = null;

	//插件：复制粘贴构件功能
	this.copier = null;

	//插件：材质选择器
	this.materialPicker = null;

	//插件：分解工具
	this.splitter = null;

	//插件：外观设置
	this.appearanceSetting = null;

	//插件：2D绘图
	this.pathDrawingTool = null;

	//插件：户型工具栏
	this.house2DToolbar = null;

	//插件：排版
	this.alignment = null;

	//插件：定位材质
	this.materialLocator = null;

	//插件：标题栏（简版）
	this.appSimpleHeader = null;

	//插件：AppSimple运行
	this.appSimpleRunner = null;

	//插件Map
	this.pluginMap = {};

	this.isEditor = true;
	
	//初始化管理器
	this.init = function(initParams){
		thatManager.pluginConfigs = initParams.pluginConfigs;
		thatManager.containerId = initParams.containerId;
		thatManager.timestamp = initParams.timestamp;
		if(initParams.service){
			thatManager.service = {
				url: initParams.service.url,
				name: initParams.service.name,
				appKey: initParams.service.appKey,
				active: true
			}
		}
		thatManager.initMaterials();
		thatManager.initLocalImages(initParams.pluginConfigs.localImages || {});
		thatManager.initLocalMaterials( initParams.pluginConfigs.localMaterials || {});
		thatManager.initLocalContent2D( initParams.pluginConfigs.localContent2D || {});
		thatManager.initUserAnimations();
		thatManager.initUserProgresses();
		thatManager.initUserContent2D();
		thatManager.initLayout(initParams.pluginConfigs.layout || {});
		thatManager.initLoader(initParams.pluginConfigs.loader || {});
	}

	this.initMaterials = function (){
		thatManager.materials = new JS3StandardMaterials();
		thatManager.materials.init({
			manager: thatManager
		});
	}

	this.initLocalMaterials = function (p){
		thatManager.localMaterials = new JS3LocalMaterials();
		thatManager.localMaterials.init({
			manager: thatManager,
			materialList: p.materialList
		});
	}

	this.initLocalContent2D = function (p){
		thatManager.localContent2D = new JS3LocalContent2D();
		thatManager.localContent2D.init({
			manager: thatManager,
			content2D: p.content2D
		});
	}

	this.initUserAnimations = function (p){
		thatManager.userAnimations = new JS3UserAnimations();
		thatManager.userAnimations.init({
			manager: thatManager
		});
	}

	this.initUserContent2D = function (p){
		thatManager.userContent2D = new JS3UserContent2D();
		thatManager.userContent2D.init({
			manager: thatManager
		});
	}

	this.initUserProgresses = function (p){
		thatManager.userProgresses = new JS3UserProgresses();
		thatManager.userProgresses.init({
			manager: thatManager
		});
	}

	this.initLocalImages = function (p){
		thatManager.localImages = new JS3LocalImages();
		thatManager.localImages.init({
			manager: thatManager,
			imageList: p.imageList,
			imageFolder: p.imageFolder
		});
	}

	//调用服务器端方法
	this.request = function(p){
		if(thatManager.service.active){
			serverAccess.request({			
				serverUrl: thatManager.service.url,
				serviceName: thatManager.service.name,
				appKey: thatManager.service.appKey,
				funcName: p.funcName,
				args: {requestParam: cmnPcr.jsonToStr(p.requestParam)}, 
				successFunc: p.successFunc,
				failFunc: p.failFunc,
				errorFunc: function(httpRequest, textStatus, errorThrown){
					thatManager.service.active = false;
					thatManager.statusBar.refreshStatusText({
						status: thatManager.viewer.status,
						message: "无法连通S3d服务"
					});
				}
			})
		}
		else{
			thatManager.statusBar.refreshStatusText({
				status: thatManager.viewer.status,
				message: "无法连通S3d服务"
			});
		}
	}

	this.addPluginToMap = function(name, pluginObject, isUI2D){
		thatManager.pluginMap[name] = {
			name: name,
			object: pluginObject,
			isUI2D: isUI2D
		}
	}

	this.getUI2DPlugVisibilities = function (){
		let visibilities = [];
		for(let name in thatManager.pluginMap){
			let pluginInfo = thatManager.pluginMap[name];
			if(pluginInfo.isUI2D){
				visibilities.push({
					name: name,
					visible: pluginInfo.object.getVisible()
				});
			}
		}
		return visibilities;
	}

	this.setUI2DPlugVisibilities = function (visibilities){
		for(let i = 0; i < visibilities.length; i++){
			let visibility = visibilities[i];
			let name = visibility.name;
			let pluginInfo = thatManager.pluginMap[name];
			if(pluginInfo.isUI2D){
				if(visibility.visible) {
					pluginInfo.object.show();
				}
				else{
					pluginInfo.object.hide();
				}
			}
		}
	}

	//初始化布局
	this.initLayout = function(layoutConfig){
		thatManager.layout = new S3dLayout();
		thatManager.layout.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: layoutConfig
		});
	}

	//初始化加载器
	this.initLoader = function(loaderConfig){
		thatManager.loader = new S3dLoader();
		thatManager.loader.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config:{
				modelInfo: loaderConfig.modelInfo,
				afterLoadS3dFile: loaderConfig.afterLoadS3dFile,
				systemAfterLoadS3dFile: function(p){
					thatManager.s3dObject = p.s3dObject;

					//加载用户定义材质
					thatManager.localMaterials.initUserMaterialInfos(p.s3dObject.materials);

					//加载用户动画
					thatManager.userAnimations.initAnimationInfos(p.s3dObject.animations);

					//加载2D页面
					thatManager.userContent2D.initContent2DInfo(p.s3dObject.content2D);

					//加载用户流程
					thatManager.userProgresses.initProgressInfos(p.s3dObject.progresses);

					//appSimpleRunner
					if(typeof S3dAppSimpleRunner != "undefined" && thatManager.pluginConfigs.appSimpleRunner != null){
						thatManager.initAppSimpleRunner(thatManager.pluginConfigs.appSimpleRunner);
						thatManager.addPluginToMap("appSimpleRunner", thatManager.appSimpleRunner, true);
					}

					//statusbar
					if(typeof S3dStatusBar != "undefined" && thatManager.pluginConfigs.statusBar != null){
						thatManager.initStatusBar(thatManager.pluginConfigs.statusBar);
						thatManager.addPluginToMap("statusBar", thatManager.statusBar, true);
					}

					//object3DCache
					if(typeof S3dObject3DCache != "undefined" && thatManager.pluginConfigs.object3DCache != null){
						thatManager.initObject3DCache(thatManager.pluginConfigs.object3DCache);
						thatManager.addPluginToMap("object3DCache", thatManager.object3DCache, false);
					}

					//appSimpleToolbar
					if(typeof S3dAppSimpleToolbar != "undefined" && thatManager.pluginConfigs.appSimpleToolbar != null){
						thatManager.initAppSimpleToolbar(thatManager.pluginConfigs.appSimpleToolbar);
						thatManager.addPluginToMap("appSimpleToolbar", thatManager.appSimpleToolbar, true);
					}

					//appSimpleEditor
					if(typeof S3dAppSimpleEditor != "undefined" && thatManager.pluginConfigs.appSimpleEditor != null){
						thatManager.initAppSimpleEditor(thatManager.pluginConfigs.appSimpleEditor);
						thatManager.addPluginToMap("appSimpleEditor", thatManager.appSimpleEditor, true);
					}

					//object3DCreator
					if(typeof S3dResourceLoader != "undefined" && thatManager.pluginConfigs.resourceLoader != null){
						thatManager.initResourceLoader(thatManager.pluginConfigs.resourceLoader);
						thatManager.addPluginToMap("resourceLoader", thatManager.resourceLoader, false);
					}

					//ComponentLibrary
					if(typeof S3dComponentLibrary != "undefined" && thatManager.pluginConfigs.componentLibrary != null){
						thatManager.initComponentLibrary(thatManager.pluginConfigs.componentLibrary);
						thatManager.addPluginToMap("componentLibrary", thatManager.componentLibrary, false);
					}

					//internalObjectCreator
					if(typeof S3dInternalObjectCreator != "undefined" && thatManager.pluginConfigs.internalObjectCreator != null){
						thatManager.initInternalObjectCreator(thatManager.pluginConfigs.internalObjectCreator);
						thatManager.addPluginToMap("internalObjectCreator", thatManager.internalObjectCreator, false);
					}

					//localObjectCreator
					if(typeof S3dLocalObjectCreator != "undefined" && thatManager.pluginConfigs.localObjectCreator != null){
						thatManager.initLocalObjectCreator(thatManager.pluginConfigs.localObjectCreator);
						thatManager.addPluginToMap("localObjectCreator", thatManager.localObjectCreator, false);
					}

					//serverObjectCreator
					if(typeof S3dServerObjectCreator != "undefined" && thatManager.pluginConfigs.serverObjectCreator != null){
						thatManager.initServerObjectCreator(thatManager.pluginConfigs.serverObjectCreator);
						thatManager.addPluginToMap("serverObjectCreator", thatManager.serverObjectCreator, false);
					}

					//messageBox 
					if(typeof S3dMessageBox != "undefined" && thatManager.pluginConfigs.messageBox != null){
						thatManager.initMessageBox(thatManager.pluginConfigs.messageBox);
						thatManager.addPluginToMap("messageBox", thatManager.messageBox, true);
					}

					//appearanceSetting
					if(typeof S3dAppearanceSetting != "undefined" && thatManager.pluginConfigs.appearanceSetting != null){
						thatManager.initAppearanceSetting(thatManager.pluginConfigs.appearanceSetting);
						thatManager.addPluginToMap("appearanceSetting", thatManager.appearanceSetting, true);
					}

					//skyBox
					if(typeof S3dSkyBox != "undefined" && thatManager.pluginConfigs.skyBox != null){
						thatManager.initSkyBox(thatManager.pluginConfigs.skyBox);
						thatManager.addPluginToMap("skyBox", thatManager.skyBox, false);
					}

					//viewer
					if(typeof S3dViewer != "undefined" && thatManager.pluginConfigs.viewer != null){
						thatManager.initViewer(thatManager.pluginConfigs.viewer);
						thatManager.addPluginToMap("viewer", thatManager.viewer, false);
					}

					//cameraRender
					if(typeof S3dCameraRender != "undefined" && thatManager.pluginConfigs.cameraRender != null){
						thatManager.initCameraRender(thatManager.pluginConfigs.cameraRender);
						thatManager.addPluginToMap("cameraRender", thatManager.cameraRender, false);
					}

					//skyBoxSetting
					if(typeof S3dSkyBoxSetting != "undefined" && thatManager.pluginConfigs.skyBoxSetting != null){
						thatManager.initSkyBoxSetting(thatManager.pluginConfigs.skyBoxSetting);
						thatManager.addPluginToMap("skyBoxSetting", thatManager.skyBoxSetting, true);
					}
					
					//adder 
					if(typeof S3dAdder != "undefined" && thatManager.pluginConfigs.adder != null){
						thatManager.initAdder(thatManager.pluginConfigs.adder);
						thatManager.addPluginToMap("adder", thatManager.adder, true);
					}
					
					//toolbar 
					if(typeof S3dToolbar != "undefined" && thatManager.pluginConfigs.toolbar != null){
						thatManager.initToolbar(thatManager.pluginConfigs.toolbar);
						thatManager.addPluginToMap("toolbar", thatManager.toolbar, true);
					}
					
					//tree 
					if(typeof S3dTree != "undefined" && thatManager.pluginConfigs.tree != null){
						thatManager.initTree(thatManager.pluginConfigs.tree);
						thatManager.addPluginToMap("tree", thatManager.tree, true);
					}
					
					//treeViewer
					if(typeof S3dTreeEditor != "undefined" && thatManager.pluginConfigs.treeEditor != null){
						thatManager.initTreeEditor(thatManager.pluginConfigs.treeEditor);
						thatManager.addPluginToMap("treeEditor", thatManager.treeEditor, true);
					}
					
					//propertyList 
					if(typeof S3dPropertyList != "undefined" && thatManager.pluginConfigs.propertyList != null){
						thatManager.initPropertyList(thatManager.pluginConfigs.propertyList);
						thatManager.addPluginToMap("propertyList", thatManager.propertyList, true);
					}	
					
					//helper 
					if(typeof S3dHelper != "undefined" && thatManager.pluginConfigs.helper != null){
						thatManager.initHelper(thatManager.pluginConfigs.helper);
						thatManager.addPluginToMap("helper", thatManager.helper, false);
					}

					//propertyEditor 
					if(typeof S3dPropertyEditor != "undefined" && thatManager.pluginConfigs.propertyEditor != null){
						thatManager.initPropertyEditor(thatManager.pluginConfigs.propertyEditor);
						thatManager.addPluginToMap("propertyEditor", thatManager.propertyEditor, true);
					}

					//animationList
					if(typeof S3dAnimationList != "undefined" && thatManager.pluginConfigs.animationList != null){
						thatManager.initAnimationList(thatManager.pluginConfigs.animationList);
						thatManager.addPluginToMap("animationList", thatManager.animationList, true);
					}

					//animationEditor
					if(typeof S3dAnimationEditor != "undefined" && thatManager.pluginConfigs.animationEditor != null){
						thatManager.initAnimationEditor(thatManager.pluginConfigs.animationEditor);
						thatManager.addPluginToMap("animationEditor", thatManager.animationEditor, true);
					}

					//progressList
					if(typeof S3dProgressList != "undefined" && thatManager.pluginConfigs.progressList != null){
						thatManager.initProgressList(thatManager.pluginConfigs.progressList);
						thatManager.addPluginToMap("progressList", thatManager.progressList, true);
					}

					//progressEditor
					if(typeof S3dProgressEditor != "undefined" && thatManager.pluginConfigs.progressEditor != null){
						thatManager.initProgressEditor(thatManager.pluginConfigs.progressEditor);
						thatManager.addPluginToMap("progressEditor", thatManager.progressEditor, true);
					}

					//content2DList
					if(typeof S3dContent2DList != "undefined" && thatManager.pluginConfigs.content2DList != null){
						thatManager.initContent2DList(thatManager.pluginConfigs.content2DList);
						thatManager.addPluginToMap("content2DList", thatManager.content2DList, true);
					}

					//content2DEditor
					if(typeof S3dContent2DEditor != "undefined" && thatManager.pluginConfigs.content2DEditor != null){
						thatManager.initContent2DEditor(thatManager.pluginConfigs.content2DEditor);
						thatManager.addPluginToMap("content2DEditor", thatManager.content2DEditor, true);
					}

					//animationPlayer
					if(typeof S3dAnimationPlayer != "undefined" && thatManager.pluginConfigs.animationPlayer != null){
						thatManager.initAnimationPlayer(thatManager.pluginConfigs.animationPlayer);
						thatManager.addPluginToMap("animationPlayer", thatManager.animationPlayer, true);
					}

					//progressOperator
					if(typeof S3dProgressOperator != "undefined" && thatManager.pluginConfigs.progressOperator != null){
						thatManager.initProgressOperator(thatManager.pluginConfigs.progressOperator);
						thatManager.addPluginToMap("animationPlayer", thatManager.progressOperator, true);
					}

					//animationGenerator
					if(typeof S3dAnimationGenerator != "undefined" && thatManager.pluginConfigs.animationGenerator != null){
						thatManager.initAnimationGenerator(thatManager.pluginConfigs.animationGenerator);
						thatManager.addPluginToMap("animationGenerator", thatManager.animationGenerator, true);
					}

					//aiAssistant
					if(typeof S3dAiAssistant != "undefined" && thatManager.pluginConfigs.aiAssistant != null){
						thatManager.initAiAssistant(thatManager.pluginConfigs.aiAssistant);
						thatManager.addPluginToMap("aiAssistant", thatManager.aiAssistant, true);
					}

					//exporter
					if(typeof S3dExporter != "undefined" && thatManager.pluginConfigs.exporter != null){
						thatManager.initExporter(thatManager.pluginConfigs.exporter);
						thatManager.addPluginToMap("exporter", thatManager.exporter, true);
					}	
					
					//pointSelector 
					if(typeof S3dPointSelector != "undefined" && thatManager.pluginConfigs.pointSelector != null){
						thatManager.initPointSelector(thatManager.pluginConfigs.pointSelector);
						thatManager.addPluginToMap("pointSelector", thatManager.pointSelector, false);
					}

					//setting 
					if(typeof S3dSetting != "undefined" && thatManager.pluginConfigs.setting != null){
						thatManager.initSetting(thatManager.pluginConfigs.setting);
						thatManager.addPluginToMap("setting", thatManager.setting, true);
					}

					//setting2D
					if(typeof S3dSetting2D != "undefined" && thatManager.pluginConfigs.setting2D != null){
						thatManager.initSetting2D(thatManager.pluginConfigs.setting2D);
						thatManager.addPluginToMap("setting2D", thatManager.setting2D, true);
					}

					//ruler 
					if(typeof S3dRuler != "undefined" && thatManager.pluginConfigs.ruler != null){
						thatManager.initRuler(thatManager.pluginConfigs.ruler);
						thatManager.addPluginToMap("ruler", thatManager.ruler, false);
					}	
					
					//copier 
					if(typeof S3dCopier != "undefined" && thatManager.pluginConfigs.copier != null){
						thatManager.initCopier(thatManager.pluginConfigs.copier);
						thatManager.addPluginToMap("copier", thatManager.copier, false);
					}

					//materialPicker 
					if(typeof S3dMaterialPicker != "undefined" && thatManager.pluginConfigs.materialPicker != null){
						thatManager.initMaterialPicker(thatManager.pluginConfigs.materialPicker);
						thatManager.addPluginToMap("materialPicker", thatManager.materialPicker, true);
					}

					//localMaterialPicker
					if(typeof S3dLocalMaterialPicker != "undefined" && thatManager.pluginConfigs.localMaterialPicker != null){
						thatManager.initLocalMaterialPicker(thatManager.pluginConfigs.localMaterialPicker);
						thatManager.addPluginToMap("localMaterialPicker", thatManager.localMaterialPicker, true);
					}

					//systemMaterialPicker
					if(typeof S3dSystemMaterialPicker != "undefined" && thatManager.pluginConfigs.systemMaterialPicker != null){
						thatManager.initSystemMaterialPicker(thatManager.pluginConfigs.systemMaterialPicker);
						thatManager.addPluginToMap("systemMaterialPicker", thatManager.systemMaterialPicker, true);
					}

					//localContent2DPicker
					if(typeof S3dLocalContent2DPicker != "undefined" && thatManager.pluginConfigs.localContent2DPicker != null){
						thatManager.initLocalContent2DPicker(thatManager.pluginConfigs.localContent2DPicker);
						thatManager.addPluginToMap("localContent2DPicker", thatManager.localContent2DPicker, true);
					}

					//localImagePicker
					if(typeof S3dLocalImagePicker != "undefined" && thatManager.pluginConfigs.localImagePicker != null){
						thatManager.initLocalImagePicker(thatManager.pluginConfigs.localImagePicker);
						thatManager.addPluginToMap("localImagePicker", thatManager.localImagePicker, true);
					}

					//splitter
					if(typeof S3dSplitter != "undefined" && thatManager.pluginConfigs.splitter != null){
						thatManager.initSplitter(thatManager.pluginConfigs.splitter);
						thatManager.addPluginToMap("splitter", thatManager.splitter, false);
					}

					//pathDrawingTool
					if(typeof S3dPathDrawingTool != "undefined" && thatManager.pluginConfigs.pathDrawingTool != null){
						thatManager.initPathDrawingTool(thatManager.pluginConfigs.pathDrawingTool);
						thatManager.addPluginToMap("pathDrawingTool", thatManager.pathDrawingTool, false);
					}

					//house3DToolbar
					if(typeof S3dHouse2DToolbar != "undefined" && thatManager.pluginConfigs.house2DToolbar != null){
						thatManager.initHouse2DToolbar(thatManager.pluginConfigs.house2DToolbar);
						thatManager.addPluginToMap("house3DToolbar", thatManager.house2DToolbar, true);
					}

					//scene3dToolbar
					if(typeof S3dScene3dToolbar != "undefined" && thatManager.pluginConfigs.scene3dToolbar != null){
						thatManager.initScene3dToolbar(thatManager.pluginConfigs.scene3dToolbar);
						thatManager.addPluginToMap("scene3dToolbar", thatManager.scene3dToolbar, true);
					}

					//alignment
					if(typeof S3dAlignment != "undefined" && thatManager.pluginConfigs.alignment != null){
						thatManager.initAlignment(thatManager.pluginConfigs.alignment);
						thatManager.addPluginToMap("alignment", thatManager.alignment, true);
					}

					//materialLocator
					if(typeof S3dMaterialLocator != "undefined" && thatManager.pluginConfigs.materialLocator != null){
						thatManager.initMaterialLocator(thatManager.pluginConfigs.materialLocator);
						thatManager.addPluginToMap("materialLocator", thatManager.materialLocator, true);
					}

					//materialEditor
					if(typeof S3dMaterialEditor != "undefined" && thatManager.pluginConfigs.materialEditor != null){
						thatManager.initMaterialEditor(thatManager.pluginConfigs.materialEditor);
						thatManager.addPluginToMap("materialEditor", thatManager.materialEditor, true);
					}

					//screen2D
					if(typeof S3dScreen2D != "undefined" && thatManager.pluginConfigs.screen2D != null){
						thatManager.initScreen2D(thatManager.pluginConfigs.screen2D);
						thatManager.addPluginToMap("screen2D", thatManager.screen2D, true);
					}

					//appSimpleHeader
					if(typeof S3dAppSimpleHeader != "undefined" && thatManager.pluginConfigs.appSimpleHeader != null){
						thatManager.initAppSimpleHeader(thatManager.pluginConfigs.appSimpleHeader);
						thatManager.addPluginToMap("appSimpleHeader", thatManager.appSimpleHeader, true);
					}
				}
			}
		});	
	}

	this.createViewer = function(){
		return new S3dViewer();
	}

	this.initViewer = function(viewerConfig){
		thatManager.viewer = thatManager.createViewer();
		thatManager.viewer.addEventFunction("afterInitScene", function(p){
			//axis 
			if(typeof S3dAxis != "undefined" && thatManager.pluginConfigs.axis != null){
				thatManager.initAxis(thatManager.pluginConfigs.axis);
			}
			//moveHelper 
			if(typeof S3dMoveHelper != "undefined" && thatManager.pluginConfigs.moveHelper != null){
				thatManager.initMoveHelper(thatManager.pluginConfigs.moveHelper);
			}
		});
		thatManager.viewer.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: viewerConfig
		});
	}

	this.createCameraRender = function(){
		return new S3dCameraRender();
	}

	this.initCameraRender = function(cameraRenderConfig){
		thatManager.cameraRender = thatManager.createCameraRender();
		thatManager.cameraRender.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: cameraRenderConfig
		});
	}

	this.createSkyBox = function(){
		return new S3dSkyBox();
	}

	this.initSkyBox = function(skyBoxConfig){
		thatManager.skyBox = thatManager.createSkyBox();
		thatManager.skyBox.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: skyBoxConfig
		});
	}

	this.createAdder = function(){
		return new S3dAdder();
	}

	this.initAdder = function(adderConfig){
		thatManager.adder = thatManager.createAdder();
		thatManager.adder.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: adderConfig
		});
	}

	this.createAxis = function(){
		return new S3dAxis();
	}

	this.initAxis = function(axisConfig){
		thatManager.axis = thatManager.createAxis(); 
		thatManager.axis.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: axisConfig
		});
	}

	this.createMoveHelper = function(){
		return new S3dMoveHelper();
	}

	this.initMoveHelper = function(moveHelperConfig){
		thatManager.moveHelper = thatManager.createMoveHelper(); 
		thatManager.moveHelper.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: moveHelperConfig
		});
	}

	this.createTree = function(){
		return new S3dTree();
	}
	
	this.initTree = function(treeConfig){
		thatManager.tree = thatManager.createTree(); 
		thatManager.tree.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: treeConfig
		});
	}

	this.createTreeEditor = function(){
		return new S3dTreeEditor();
	}
	
	this.initTreeEditor = function(treeEditorConfig){
		thatManager.treeEditor = thatManager.createTreeEditor(); 
		thatManager.treeEditor.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: treeEditorConfig
		});
	}

	this.createHelper = function(){
		return new S3dHelper();
	}
	
	this.initHelper = function(helperConfig){
		thatManager.helper = thatManager.createHelper(); 
		thatManager.helper.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: helperConfig
		});
	}

	this.createPropertyList = function(){
		return new S3dPropertyList();
	}
	
	this.initPropertyList = function(propertyListConfig){
		thatManager.propertyList = thatManager.createPropertyList(); 
		thatManager.propertyList.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: propertyListConfig
		});
	}

	this.createToolbar = function(){
		return new S3dToolbar();
	}
	
	this.initToolbar = function(toolbarConfig){
		thatManager.toolbar = thatManager.createToolbar();
		thatManager.toolbar.init({
			containerId: thatManager.containerId,
			manager: thatManager, 
			config: toolbarConfig
		});
	}

	this.createStatusBar = function(){
		return new S3dStatusBar();
	}
	
	this.initStatusBar = function(statusBarConfig){
		thatManager.statusBar = thatManager.createStatusBar();
		thatManager.statusBar.init({
			containerId: thatManager.containerId,
			manager: thatManager, 
			config: statusBarConfig
		});
	}

	this.createPropertyEditor = function(){
		return new S3dPropertyEditor();
	}

	this.initPropertyEditor = function(propertyEditorConfig){
		thatManager.propertyEditor = thatManager.createPropertyEditor();
		thatManager.propertyEditor.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: propertyEditorConfig
		});
	}

	this.createAnimationList = function(){
		return new S3dAnimationList();
	}

	this.initAnimationList = function(animationListConfig){
		thatManager.animationList = thatManager.createAnimationList();
		thatManager.animationList.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: animationListConfig
		});
	}

	this.createAnimationEditor = function(){
		return new S3dAnimationEditor();
	}

	this.initAnimationEditor = function(animationEditorConfig){
		thatManager.animationEditor = thatManager.createAnimationEditor();
		thatManager.animationEditor.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: animationEditorConfig
		});
	}

	this.createProgressList = function(){
		return new S3dProgressList();
	}

	this.initProgressList = function(progressListConfig){
		thatManager.progressList = thatManager.createProgressList();
		thatManager.progressList.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: progressListConfig
		});
	}

	this.createProgressEditor = function(){
		return new S3dProgressEditor();
	}

	this.initProgressEditor = function(progressEditorConfig){
		thatManager.progressEditor = thatManager.createProgressEditor();
		thatManager.progressEditor.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: progressEditorConfig
		});
	}

	this.createContent2DList = function(){
		return new S3dContent2DList();
	}

	this.initContent2DList = function(content2DConfig){
		thatManager.content2DList = thatManager.createContent2DList();
		thatManager.content2DList.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: content2DConfig
		});
	}

	this.createContent2DEditor = function(){
		return new S3dContent2DEditor();
	}

	this.initContent2DEditor = function(content2DEditorConfig){
		thatManager.content2DEditor = thatManager.createContent2DEditor();
		thatManager.content2DEditor.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: content2DEditorConfig
		});
	}

	this.createAnimationPlayer = function(){
		return new S3dAnimationPlayer();
	}

	this.initAnimationPlayer = function(animationPlayerConfig){
		thatManager.animationPlayer = thatManager.createAnimationPlayer();
		thatManager.animationPlayer.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: animationPlayerConfig
		});
	}

	this.createProgressOperator = function(){
		return new S3dProgressOperator();
	}

	this.initProgressOperator = function(progressOperatorConfig){
		thatManager.progressOperator = thatManager.createProgressOperator();
		thatManager.progressOperator.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: progressOperatorConfig
		});
	}

	this.createAnimationGenerator = function(){
		return new S3dAnimationGenerator();
	}

	this.initAnimationGenerator = function(animationGeneratorConfig){
		thatManager.animationGenerator = thatManager.createAnimationGenerator();
		thatManager.animationGenerator.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: animationGeneratorConfig
		});
	}

	this.createAiAssistant = function(){
		return new S3dAiAssistant();
	}

	this.initAiAssistant = function(aiAssistantConfig){
		thatManager.aiAssistant = thatManager.createAiAssistant();
		thatManager.aiAssistant.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: aiAssistantConfig
		});
	}

	this.createScreen2D = function(){
		return new S3dScreen2D();
	}

	this.initScreen2D = function(screen2DConfig){
		thatManager.screen2D = thatManager.createScreen2D();
		thatManager.screen2D.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: screen2DConfig
		});
	}

	this.createObject3DCache = function(){
		return new S3dObject3DCache();
	}

	this.initObject3DCache = function(object3DCacheConfig){
		thatManager.object3DCache = thatManager.createObject3DCache();
		thatManager.object3DCache.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: object3DCacheConfig
		});
	}

	this.createResourceLoader = function(){
		return new S3dResourceLoader();
	}

	this.initResourceLoader = function(resourceLoaderConfig){
		thatManager.resourceLoader = thatManager.createResourceLoader();
		thatManager.resourceLoader.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: resourceLoaderConfig
		});
	}

	this.createServerObjectCreator = function(){
		return new S3dServerObjectCreator();
	}

	this.initServerObjectCreator = function(serverObjectCreatorConfig){
		thatManager.serverObjectCreator = thatManager.createServerObjectCreator();
		thatManager.serverObjectCreator.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: serverObjectCreatorConfig
		});
	}

	this.createLocalObjectCreator = function(){
		return new S3dLocalObjectCreator();
	}

	this.initLocalObjectCreator = function(localObjectCreatorConfig){
		thatManager.localObjectCreator = thatManager.createLocalObjectCreator();
		thatManager.localObjectCreator.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: localObjectCreatorConfig
		});
	}

	this.createInternalObjectCreator = function(){
		return new S3dInternalObjectCreator();
	}

	this.initInternalObjectCreator = function(internalObjectCreatorConfig){
		thatManager.internalObjectCreator = thatManager.createInternalObjectCreator();
		thatManager.internalObjectCreator.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: internalObjectCreatorConfig
		});
	}

	this.createExporter = function(){
		return new S3dExporter();
	}
	
	this.initExporter = function(exporterConfig){
		thatManager.exporter = thatManager.createExporter();
		thatManager.exporter.init({
			containerId: thatManager.containerId,
			manager: thatManager, 
			config: exporterConfig
		});
	}

	this.createMessageBox = function(){
		return new S3dMessageBox();
	}
	
	this.initMessageBox = function(messageBoxConfig){
		thatManager.messageBox = thatManager.createMessageBox();
		thatManager.messageBox.init({
			containerId: thatManager.containerId,
			manager: thatManager, 
			config: messageBoxConfig
		});
	}

	this.createPointSelector = function(){
		return new S3dPointSelector();
	}
	
	this.initPointSelector = function(pointSelectorConfig){
		thatManager.pointSelector = thatManager.createPointSelector();
		thatManager.pointSelector.init({
			containerId: thatManager.containerId,
			manager: thatManager, 
			config: pointSelectorConfig
		});
	}

	this.createSetting = function(){
		return new S3dSetting();
	}

	this.initSetting = function(settingConfig){
		thatManager.setting = thatManager.createSetting();
		thatManager.setting.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: settingConfig
		});
	}

	this.createSkyBoxSetting = function(){
		return new S3dSkyBoxSetting();
	}

	this.initSkyBoxSetting = function(skyBoxSettingConfig){
		thatManager.skyBoxSetting = thatManager.createSkyBoxSetting();
		thatManager.skyBoxSetting.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: skyBoxSettingConfig
		});
	}

	this.createSetting2D = function(){
		return new S3dSetting2D();
	}

	this.initSetting2D = function(setting2DConfig){
		thatManager.setting2D = thatManager.createSetting2D();
		thatManager.setting2D.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: setting2DConfig
		});
	}

	this.createRuler = function(){
		return new S3dRuler();
	}
	
	this.initRuler = function(rulerConfig){
		thatManager.ruler = thatManager.createRuler();
		thatManager.ruler.init({
			containerId: thatManager.containerId,
			manager: thatManager, 
			config: rulerConfig
		});
	}

	this.createCopier = function(){
		return new S3dCopier();
	}

	this.initCopier = function(copierConfig){
		thatManager.copier = thatManager.createCopier();
		thatManager.copier.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: copierConfig
		});
	}

	this.createMaterialPicker = function(){
		return new S3dMaterialPicker();
	}

	this.initMaterialPicker = function(materialPickerConfig){
		thatManager.materialPicker = thatManager.createMaterialPicker();
		thatManager.materialPicker.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: materialPickerConfig
		});
	}

	this.createLocalMaterialPicker = function(){
		return new S3dLocalMaterialPicker();
	}

	this.initLocalMaterialPicker = function(localMaterialPickerConfig){
		thatManager.localMaterialPicker = thatManager.createLocalMaterialPicker();
		thatManager.localMaterialPicker.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: localMaterialPickerConfig
		});
	}

	this.createSystemMaterialPicker = function(){
		return new S3dSystemMaterialPicker();
	}

	this.initSystemMaterialPicker = function(systemMaterialPickerConfig){
		thatManager.systemMaterialPicker = thatManager.createSystemMaterialPicker();
		thatManager.systemMaterialPicker.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: systemMaterialPickerConfig
		});
	}

	this.createLocalContent2DPicker = function(){
		return new S3dLocalContent2DPicker();
	}

	this.initLocalContent2DPicker = function(localContent2DPickerConfig){
		thatManager.localContent2DPicker = thatManager.createLocalContent2DPicker();
		thatManager.localContent2DPicker.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: localContent2DPickerConfig
		});
	}

	this.createLocalImagePicker = function(){
		return new S3dLocalImagePicker();
	}

	this.initLocalImagePicker = function(localImagePickerConfig){
		thatManager.localImagePicker = thatManager.createLocalImagePicker();
		thatManager.localImagePicker.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: localImagePickerConfig
		});
	}

	this.createComponentLibrary = function(){
		return new S3dComponentLibrary();
	}

	this.initComponentLibrary = function(componentLibraryConfig){
		thatManager.componentLibrary = thatManager.createComponentLibrary();
		thatManager.componentLibrary.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: componentLibraryConfig
		});
	}

	this.createSplitter = function(){
		return new S3dSplitter();
	}

	this.initSplitter = function(splitterConfig){
		thatManager.splitter = thatManager.createSplitter();
		thatManager.splitter.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: splitterConfig
		});
	}

	this.createAppearanceSetting = function(){
		return new S3dAppearanceSetting();
	}

	this.initAppearanceSetting = function(appearanceSettingConfig){
		thatManager.appearanceSetting = thatManager.createAppearanceSetting();
		thatManager.appearanceSetting.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: appearanceSettingConfig
		});
	}

	this.createPathDrawingTool = function(){
		return new S3dPathDrawingTool();
	}

	this.initPathDrawingTool = function(pathDrawingToolConfig){
		thatManager.pathDrawingTool = thatManager.createPathDrawingTool();
		thatManager.pathDrawingTool.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: pathDrawingToolConfig
		});
	}

	this.createHouse2DToolbar = function(){
		return new S3dHouse2DToolbar();
	}

	this.initHouse2DToolbar = function(house2DToolbarConfig){
		thatManager.house2DToolbar = thatManager.createHouse2DToolbar();
		thatManager.house2DToolbar.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: house2DToolbarConfig
		});
	}

	this.createScene3dToolbar = function(){
		return new S3dScene3dToolbar();
	}

	this.initScene3dToolbar = function(scene3dToolbarConfig){
		thatManager.scene3dToolbar = thatManager.createScene3dToolbar();
		thatManager.scene3dToolbar.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: scene3dToolbarConfig
		});
	}

	this.createAlignment = function(){
		return new S3dAlignment();
	}

	this.initAlignment = function(alignmentConfig){
		thatManager.alignment = thatManager.createAlignment();
		thatManager.alignment.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: alignmentConfig
		});
	}

	this.createMaterialLocator = function(){
		return new S3dMaterialLocator();
	}

	this.initMaterialLocator = function(materialLocatorConfig){
		thatManager.materialLocator = thatManager.createMaterialLocator();
		thatManager.materialLocator.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: materialLocatorConfig
		});
	}

	this.createAppSimpleRunner = function(){
		return new S3dAppSimpleRunner();
	}

	this.initAppSimpleRunner = function(appSimpleRunnerConfig){
		thatManager.appSimpleRunner = thatManager.createAppSimpleRunner();
		thatManager.appSimpleRunner.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: appSimpleRunnerConfig
		});
	}

	this.createMaterialEditor = function(){
		return new S3dMaterialEditor();
	}

	this.initMaterialEditor = function(materialEditorConfig){
		thatManager.materialEditor = thatManager.createMaterialEditor();
		thatManager.materialEditor.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: materialEditorConfig
		});
	}

	this.createAppSimpleHeader = function(){
		return new S3dAppSimpleHeader();
	}

	this.initAppSimpleHeader = function(appSimpleHeaderConfig){
		thatManager.appSimpleHeader = thatManager.createAppSimpleHeader();
		thatManager.appSimpleHeader.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: appSimpleHeaderConfig
		});
	}

	this.createAppSimpleToolbar = function(){
		return new S3dAppSimpleToolbar();
	}

	this.initAppSimpleToolbar = function(appSimpleToolbarConfig){
		thatManager.appSimpleToolbar = thatManager.createAppSimpleToolbar();
		thatManager.appSimpleToolbar.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: appSimpleToolbarConfig
		});
	}

	this.createAppSimpleEditor = function(){
		return new S3dAppSimpleEditor();
	}

	this.initAppSimpleEditor = function(appSimpleEditorConfig){
		thatManager.appSimpleEditor = thatManager.createAppSimpleEditor();
		thatManager.appSimpleEditor.init({
			containerId: thatManager.containerId,
			manager: thatManager,
			config: appSimpleEditorConfig
		});
	}

	this.getModelJson = function () {
		//保存界面上编辑的值
		if (thatManager.progressEditor != null) {
			thatManager.progressEditor.applyProgress();
		}
		if (thatManager.animationEditor != null) {
			thatManager.animationEditor.applyAnimation();
		}
		if (thatManager.content2DEditor != null) {
			thatManager.content2DEditor.applyPage();
		}

		//组织json
		let s3dObject = thatManager.s3dObject;
		s3dObject.groups = thatManager.treeEditor.getResultGroups();
		s3dObject.groupMap = thatManager.viewer.getResultGroupMap();
		s3dObject.objectMap = thatManager.viewer.getResultObjectMap();
		s3dObject.objectTypeMap = thatManager.viewer.getResultObjectTypeMap();
		s3dObject.materials = thatManager.localMaterials.getUserMaterialList();
		s3dObject.animations = thatManager.userAnimations.getAnimationList();
		s3dObject.progresses = thatManager.userProgresses.getProgressList();
		s3dObject.content2D = thatManager.userContent2D.getContentInfo();

		//暂不启用
		s3dObject.materialMap = {};
		return s3dObject;
	}

	this.getUserData = function (userDataName){
		let otherInfo = thatManager.s3dObject.otherInfo;
		if(otherInfo != null){
			return otherInfo[userDataName];
		}
		else{
			return null;
		}
	}

	this.addUserData = function (userDataName, userDataInfo){
		if(thatManager.s3dObject.otherInfo == null){
			thatManager.s3dObject.otherInfo = {};
		}
		thatManager.s3dObject.otherInfo[userDataName] = userDataInfo;
	}
}
export default S3dWebEditManager
