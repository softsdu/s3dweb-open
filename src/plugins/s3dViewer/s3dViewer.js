import * as THREE from "three"
import {CSS2DRenderer} from "three/examples/jsm/renderers/CSS2DRenderer.js";
import {CSS3DRenderer} from "three/examples/jsm/renderers/CSS3DRenderer.js";
import {OrbitControls} from "../../commonjs/threejs/custom/OrbitControls.js";
import {
	cmnPcr,
	msgBox,
	s3dElement3DType, s3dLayerType,
	s3dNormalViewport,
	s3dOperateType, s3dTransformMode,
	s3dUiStatus,
	s3dViewLevel
} from "../../commonjs/common/common.js"
import "./s3dViewer.css"
import * as TWEEN from "../../commonjs/threejs/custom/tween.module.js"
import Stats from "three/examples/jsm/libs/stats.module.js"
import js3StandardMaterials from "../../core/materials/js3StandardMaterials.js";

//S3dWeb Editor
let S3dViewer = function (){
	//当前对象
	const thatViewer = this; 
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	//移动设备自动旋转到宽屏状态
	this.mobileAutoRotate = false;

	//xy坐标互换
	this.xyExchange = false;

	//detailLevel
	this.detailLevel = null;

	//viewLevel
	this.viewLevel = null;
	
	//状态，默认为常规
	this.status = s3dUiStatus.normalView;	 

	//临时数据
	this.statusData = {};
		
	//被选中的object3D（多选）
	this.selectedObject3Ds = [];
	
	//所有object3D
	this.allObject3DMap = {};

	//根节点object3D
	this.rootObject3D = null;

	//根节点帮助object3D
	this.rootHelper3D = null;

	//camera椎体宽度
	this.frustumSize = 500;

	//距离比例（显示值与存储值的比例）
	this.distanceRatio = 1000;

	//camera初始信息
	this.cameraInfo = null;

	//主渲染相机的名称
	this.renderCamera = null;

	//统计信息
	this.stats = null;
	
	//可视化和交互相关
	this.scene = null;
	this.camera = null;
	this.renderer = null;
	this.renderer2d = null;
	this.renderer3d = null;
	this.orbitControl = null; 
	this.raycaster = null; //光投射器
	this.hemisphereLight = null;
	this.directionalLights = [];

	//默认背景颜色
	this.backgroundColor = 0x666666;

	//默认背景图
	this.backgroundImage = null;

	//背景透明
	this.alpha = false;

	//是否显示相机helper
	this.showCameraHelper = false;

	//是否显示阴影
	this.showShadow = false;

	//是否可选中构件
	this.canSelectObject3D = true;

	//包含动画
	this.hasAnimation = false;

	//是否使用选中材质
	this.useHighlightMaterial = true;

	//初始化后自动获取焦点，方便响应键盘事件
	this.autoFocusOnInit = false;

	//控制器配置
	this.orbitControlConfig = {};

	//是否显示统计
	this.statsVisible = false;

	//事件日志
	this.eventLogMap = {};

	//默认初始化后隐藏物体
	this.defaultObjectHidden = false;

	//动画相关
	this.runAnimationInfo = {
		runInfoMap: null,
		clock: null,
		allFinished: true,
		userStop: false
	};

	//默认相机的启用的层
	this.defaultCameraLayers = [
		s3dLayerType.editLayer,
		s3dLayerType.viewLayer,
		s3dLayerType.controlLayer
	];

	//scene控制器的限制设定
	this.controlConfig = {
		perspective: {
			minZoom: 0,
			maxZoom: Infinity,
			minPolarAngle: 0,
			maxPolarAngle: Math.PI,
			minDistance: -Infinity,
			maxDistance: Infinity,
			zoomSpeed: 1,
			panSpeed: 1,
			rotateSpeed: 1,
			enablePan: true,
			enableRotate: true,
			enableZoom: true,
			enableDamping: false,
			autoRotate: false,
			dampingFactor: 0.1,
			near: 0.01,
			far: 200
		},
		orthographic: {
			minZoom: 0,
			maxZoom: Infinity,
			minPolarAngle: 0,
			maxPolarAngle: Math.PI,
			minDistance: 0,
			maxDistance: Infinity,
			zoomSpeed: 1,
			panSpeed: 1,
			rotateSpeed: 1,
			enablePan: true,
			enableRotate: true,
			enableZoom: true,
			enableDamping: false,
			autoRotate: false,
			dampingFactor: 0.1,
			near: -200,
			far: 200
		}
	};

	//高亮显示的材质
	this.highLightMaterial = new THREE.MeshStandardMaterial({
		color: 0x0094FF,
		transparent: true,
		opacity: 0.7,
		flatShading: true,
		side: THREE.FrontSide,
		depthTest: false
	});

	//高亮显示的line材质
	this.highLightLineMaterial = new THREE.LineBasicMaterial({
		color: 0x0094FF,
		//transparent: true,
		//depthTest: false
	});

	//高亮resource边框材质
	this.highLightResourceBoxEdgeMaterial = new THREE.LineBasicMaterial({
		//color: 0x0094FF,
		color: 0x0094FF,
		linewidth: 1,
		opacity: 0.8,
		transparent: true,
		depthTest: false
	});

	//边框材质
	this.edgeMaterial = new THREE.LineBasicMaterial({
		color: 0x888888, 
		linewidth: 1
	});

	//line点击响应范围
	this.lineSelectThreshold = 0.1;
	
	//交互参数
	this.mouseDownPosition = null;
	this.mouseLastMovePosition = null;
	this.containerPos = {x: 0, y: 0};
	
	//事件
	this.eventFunctions = {};	
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatViewer.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatViewer.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}	
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatViewer.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		} 
	}
	 
	//初始化
	this.init = function(p) {
		thatViewer.containerId = p.containerId;
		thatViewer.manager = p.manager;
		thatViewer.showShadow = p.config.showShadow;
		thatViewer.mobileAutoRotate = p.config.mobileAutoRotate;
		thatViewer.useHighlightMaterial = p.config.useHighlightMaterial == null ? true : p.config.useHighlightMaterial;
		thatViewer.canSelectObject3D = p.config.canSelectObject3D == null ? true : p.config.canSelectObject3D;
		thatViewer.hasAnimation = p.config.hasAnimation == null ? false : p.config.hasAnimation;
		thatViewer.detailLevel = p.config.detailLevel == null ? 4 : p.config.detailLevel;
		thatViewer.viewLevel = p.config.viewLevel == null ? s3dViewLevel.always : p.config.viewLevel;
		thatViewer.backgroundColor = p.config.backgroundColor == null ? thatViewer.backgroundColor : p.config.backgroundColor;
		thatViewer.alpha = p.config.alpha == null ? thatViewer.alpha : p.config.alpha;
		thatViewer.lineSelectThreshold = p.config.lineSelectThreshold == null ? thatViewer.lineSelectThreshold : p.config.lineSelectThreshold;
		thatViewer.autoFocusOnInit = p.config.autoFocusOnInit == null ? thatViewer.autoFocusOnInit : p.config.autoFocusOnInit;
		thatViewer.renderCamera = p.config.renderCamera == null ? thatViewer.renderCamera : p.config.renderCamera;
		thatViewer.statsVisible = p.config.statsVisible == null ? thatViewer.statsVisible : p.config.statsVisible;
		thatViewer.distanceRatio = p.config.distanceRatio == null ? thatViewer.distanceRatio : p.config.distanceRatio;
		thatViewer.defaultCameraLayers = p.config.defaultCameraLayers == null ? thatViewer.defaultCameraLayers : p.config.defaultCameraLayers;
		thatViewer.defaultObjectHidden = p.config.defaultObjectHidden == null ? thatViewer.defaultObjectHidden : p.config.defaultObjectHidden;

		if (p.config.orbitControlConfig != null) {
			thatViewer.orbitControlConfig = p.config.orbitControlConfig;
		}

		thatViewer.updateScreenRotation();

		//初始化（修改）Threejs的功能
		thatViewer.initThreeFunction();


		//绑定事件
		//当选中构件时
		if (p.config.beforeInitScene != null) {
			thatViewer.addEventFunction("beforeInitScene", p.config.beforeInitScene);
		}

		//初始化环境
		thatViewer.initHtml();
		thatViewer.initScene();
		thatViewer.initRender();
		thatViewer.initCssRender3D();
		thatViewer.initCssRender2D();
		thatViewer.initRaycaster();
		thatViewer.initTitle();

		//绑定事件
		//当选中构件时
		if (p.config.onSelectChanged != null) {
			thatViewer.addEventFunction("onSelectChanged", p.config.onSelectChanged);
		}

		//当scene初始化完成后
		if (p.config.afterInitScene != null) {
			thatViewer.addEventFunction("afterInitScene", p.config.afterInitScene);
		}

		//当添加新构件对象后
		if (p.config.afterAddNewObject != null) {
			thatViewer.addEventFunction("afterAddNewObject", p.config.afterAddNewObject);
		}

		//当初始化一个构件对象后
		if (p.config.afterInitObject != null) {
			thatViewer.addEventFunction("afterInitObject", p.config.afterInitObject);
		}

		//当重新创建一个构件对象后（修改参数后，会自动参数化驱动造型，重新创建构件对象）
		if (p.config.afterRebuildObject != null) {
			thatViewer.addEventFunction("afterRebuildObject", p.config.afterRebuildObject);
		}

		//当重新创建一个构件对象前（事件中可以修改参数）
		if (p.config.beforeRebuildObject != null) {
			thatViewer.addEventFunction("beforeRebuildObject", p.config.beforeRebuildObject);
		}

		//当删除构件对象前
		if (p.config.beforeRemoveObjects != null) {
			thatViewer.addEventFunction("beforeRemoveObjects", p.config.beforeRemoveObjects);
		}

		//当删除构件对象后
		if (p.config.afterRemoveObject != null) {
			thatViewer.addEventFunction("afterRemoveObject", p.config.afterRemoveObject);
		}

		//当初始化所有构件对象完成后
		if (p.config.afterInitAllObjects != null) {
			thatViewer.addEventFunction("afterInitAllObjects", p.config.afterInitAllObjects);
		}

		//当渲染时（调用非常频繁）
		if (p.config.afterAnimate != null) {
			thatViewer.addEventFunction("afterAnimate", p.config.afterAnimate);
		}

		//当单击时
		if (p.config.onMouseClick != null) {
			thatViewer.addEventFunction("onMouseClick", p.config.onMouseClick);
		}

		//当双击时
		if (p.config.onMouseDblClick != null) {
			thatViewer.addEventFunction("onMouseDblClick", p.config.onMouseDblClick);
		}

		//当双击图层时
		if (p.config.onDblClickLayerObject != null) {
			thatViewer.addEventFunction("onDblClickLayerObject", p.config.onDblClickLayerObject);
		}

		//当双击构件时
		if (p.config.onDblClickObject != null) {
			thatViewer.addEventFunction("onDblClickObject", p.config.onDblClickObject);
		}

		//当单击图层时
		if (p.config.onClickLayerObject != null) {
			thatViewer.addEventFunction("onClickLayerObject", p.config.onClickLayerObject);
		}

		//在图层上mouseDown时
		if (p.config.onMouseDownUserLayerObject != null) {
			thatViewer.addEventFunction("onMouseDownUserLayerObject", p.config.onMouseDownUserLayerObject);
		}

		//在图层上mouseUp时
		if (p.config.onMouseUpUserLayerObject != null) {
			thatViewer.addEventFunction("onMouseUpUserLayerObject", p.config.onMouseUpUserLayerObject);
		}

		//在图层上做鼠标移动时
		if (p.config.onMouseMoveUserLayerObject != null) {
			thatViewer.addEventFunction("onMouseMoveUserLayerObject", p.config.onMouseMoveUserLayerObject);
		}

		//在图层上keydown时
		if (p.config.onKeyDownUserLayerObject != null) {
			thatViewer.addEventFunction("onKeyDownUserLayerObject", p.config.onKeyDownUserLayerObject);
		}

		//当单击构件时
		if (p.config.onClickObject != null) {
			thatViewer.addEventFunction("onClickObject", p.config.onClickObject);
		}

		//当更换父节点后
		if (p.config.afterChangeParentGroup != null) {
			thatViewer.addEventFunction("afterChangeParentGroup", p.config.afterChangeParentGroup);
		}

		//鼠标事件
		//鼠标按下
		let container = $("#" + thatViewer.containerId);
		$(container).find(".s3dViewerContainer").mousedown(thatViewer.onMouseDown);

		//鼠标移动
		$(container).mousemove(thatViewer.onMouseMove);

		//鼠标按键抬起
		$(container).find(".s3dViewerContainer").mouseup(thatViewer.onMouseUp);

		//键盘按下
		$(container).find(".s3dViewerContainer").keydown(thatViewer.onKeyDown);

		//将容器设为焦点，方便触发键盘事件
		if (thatViewer.autoFocusOnInit) {
			thatViewer.focus();
		}

		//初始化交互参数
		let s3dViewerContainer = $("#" + p.containerId).find(".s3dViewerContainer")[0];
		let s3dViewerContainerOffset = $(s3dViewerContainer).offset();
		thatViewer.containerPos = {
			x: s3dViewerContainerOffset.left,
			y: s3dViewerContainerOffset.top
		};

		//当窗口缩放时
		//window.addEventListener('resize', thatViewer.onWindowResize, false);
		let resizeObserver = new ResizeObserver((entries) => {
			for (let entry of entries) {
				if($(entry.target).hasClass("s3dViewerContainer")) {
					thatViewer.onWindowResize();
				}
			}
		});
		resizeObserver.observe(s3dViewerContainer);

		let allTypeObjectMap = thatViewer.getAllTypeObjects();
		let group2ParentMap = thatViewer.getAllGroup2ParentIdMap();

		thatViewer.initRootObject3D();
		thatViewer.initRootHelper3D();

		thatViewer.initAllGroup3Ds(group2ParentMap);
		thatViewer.initAllObject3Ds(allTypeObjectMap);
	}

	//初始化（修改）Threejs的部分功能
	this.initThreeFunction = function (){

		//动画功能中，实现通过路径查找object
		THREE.PropertyBinding.findNode = function ( root, nodeName ) {
			if ( nodeName === undefined || nodeName === '' || nodeName === '.' || nodeName === - 1 || nodeName === root.name || nodeName === root.uuid ) {
				return root;
			}

			// search into skeleton bones.
			if ( root.skeleton ) {
				const bone = root.skeleton.getBoneByName( nodeName );
				if ( bone !== undefined ) {
					return bone;
				}
			}

			// search into node subtree.
			if ( root.children ) {
				const searchNodeSubtree = function ( children, parentPath ) {
					for ( let i = 0; i < children.length; i ++ ) {
						const childNode = children[ i ];
						let path = parentPath + "." + childNode.name;
						if ( childNode.name === nodeName || childNode.uuid === nodeName || path === nodeName) {
							return childNode;
						}
						const result = searchNodeSubtree( childNode.children, path );
						if ( result ) return result;
					}
					return null;
				};
				const subTreeNode = searchNodeSubtree( root.children, "" );
				if ( subTreeNode ) {
					return subTreeNode;
				}
			}
			return null;
		}
	}

	this.checkIsMobileDevice = function () {
		return /Mobi|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
	}

	this.focus = function (){
		let container = $("#" + thatViewer.containerId);
		$(container).find(".s3dViewerContainer").focus();
	}

	this.updateScreenRotation = function (){
		if(thatViewer.mobileAutoRotate && thatViewer.checkIsMobileDevice()){
			let width = $(document.body).width();
			let height = $(document.body).height();
			let container = $("#" + thatViewer.containerId)[0];
			if(width < height){
				$(container).css({
					"transform-origin": "0px 0px",
					"transform": "rotate(90deg) translateY(-100%)",
					"width": height + "px",
					"height": width + "px",
				});
				thatViewer.xyExchange = true;
				if(thatViewer.orbitControl != null){
					thatViewer.orbitControl.xyExchange = true;
				}
			}
			else{
				$(container).css({
					"transform-origin": "",
					"transform": "",
					"width": width + "px",
					"height": height + "px",
				});
				thatViewer.xyExchange = false;
				if(thatViewer.orbitControl != null){
					thatViewer.orbitControl.xyExchange = false;
				}
			}
		}
	}

	//初始化所有Group
	this.initAllGroup3Ds = function(group2ParentMap) {
		let id2Group3Ds = {};
		for (let groupId in group2ParentMap) {
			let parentId = group2ParentMap[groupId];
			let groupJson = thatViewer.manager.s3dObject.groupMap[groupId];
			let group3D = new THREE.Group();
			group3D.position.set(groupJson.position[0], groupJson.position[1], groupJson.position[2]);
			group3D.rotation.set(groupJson.rotation[0], groupJson.rotation[1], groupJson.rotation[2]);
			group3D.scale.set(groupJson.scale[0], groupJson.scale[1], groupJson.scale[2]);
			group3D.userData.info = {
				id: groupId,
				name: groupJson.name,
				parentId: parentId,
				position: [group3D.position.x, group3D.position.y, group3D.position.z],
				rotation: [group3D.rotation.x, group3D.rotation.y, group3D.rotation.z],
				scale: [group3D.scale.x, group3D.scale.y, group3D.scale.z],
				type: s3dElement3DType.group
			};
			id2Group3Ds[groupId] = group3D;
		}
		for (let groupId in group2ParentMap) {
			let parentId = group2ParentMap[groupId];
			let group3D = id2Group3Ds[groupId];
			if(parentId == null) {
				thatViewer.rootObject3D.add(group3D);
			}
			else {
				let parent3D = id2Group3Ds[parentId];
				parent3D.add(group3D);
			}
			thatViewer.allObject3DMap[group3D.userData.info.id] = group3D;
		}
	}

	//添加分组
	this.addNewGroupObject = function(p, afterAddNewObject){
		let newIdAndName = thatViewer.getNewObjectIdAndName(p.name, p.name, p.parentId);
		if(p.id == null){
			p.id = newIdAndName.id;
		}
		p.name = newIdAndName.name;

		let group3D = new THREE.Group();
		group3D.position.set(0, 0, 0);
		group3D.rotation.set(0, 0, 0);
		group3D.userData.info = {
			id: p.id,
			name: p.name,
			parentId: p.parentId,
			position: [group3D.position.x, group3D.position.y, group3D.position.z],
			rotation: [group3D.rotation.x, group3D.rotation.y, group3D.rotation.z],
			scale: [group3D.scale.x, group3D.scale.y, group3D.scale.z],
			type: s3dElement3DType.group
		};

		let afterEventArgs ={
			object3D: group3D,
			objectSetting: group3D.userData.info,
			isServer: false,
			isInternal: false,
			isLocal: false,
			otherInfo: p.otherInfo
		}
		if(afterAddNewObject == null) {
			thatViewer.afterAddNewObject(afterEventArgs);
		}
		else{
			afterAddNewObject(afterEventArgs);
		}
	}

	//添加分组
	this.addNewGroupsInSilence = function(groupJsons){
		for(let i = 0; i < groupJsons.length; i++){
			let groupJson = groupJsons[i];
			thatViewer.addNewGroupInSilence(groupJson);
		}
	}

	//添加分组
	this.addNewGroupInSilence = function(groupJson){
		let group3D = new THREE.Group();
		if(groupJson.position != null){
			group3D.position.set(groupJson.position[0], groupJson.position[1], groupJson.position[2]);
		}
		if(groupJson.rotation != null){
			group3D.rotation.set(groupJson.rotation[0], groupJson.rotation[1], groupJson.rotation[2]);
		}
		if(groupJson.scale != null){
			group3D.scale.set(groupJson.scale[0], groupJson.scale[1], groupJson.scale[2]);
		}
		group3D.userData.info = {
			id: groupJson.id,
			name: groupJson.name,
			parentId: groupJson.parentId,
			position: [group3D.position.x, group3D.position.y, group3D.position.z],
			rotation: [group3D.rotation.x, group3D.rotation.y, group3D.rotation.z],
			scale: [group3D.scale.x, group3D.scale.y, group3D.scale.z],
			type: s3dElement3DType.group
		};

		let afterEventArgs ={
			object3D: group3D,
			objectSetting: group3D.userData.info,
			isServer: false,
			isInternal: false,
			isLocal: false,
			otherInfo: groupJson.otherInfo
		}
		thatViewer.afterAddNewGroupInSilence(afterEventArgs);
	}

	//使用服务器端添加新构件后
	this.afterAddNewGroupInSilence = function(p){
		let id = p.object3D.userData.info.id;
		thatViewer.allObject3DMap[id] = p.object3D;
		let parentObject3D = p.objectSetting.parentId == null ? thatViewer.rootObject3D : thatViewer.allObject3DMap[p.objectSetting.parentId];
		parentObject3D.add(p.object3D);
		thatViewer.addHelperObjectToScene(p.object3D);
		thatViewer.refreshObject3DPositionRotationScale(p.object3D);
	}

	//给object3d或group3d更换parent
	this.changeParentGroup = function (nodeIds, newParentId){
		let newParent3D =newParentId == null ? null : thatViewer.allObject3DMap[newParentId];
		let beginNodeJsons = [];
		for(let i = 0; i < nodeIds.length; i++){
			let nodeId = nodeIds[i];
			let obj3D = thatViewer.allObject3DMap[nodeId];
			let oldParent3D = obj3D.parent;
			let oldParentId = oldParent3D.isS3dRootObject ? null : oldParent3D.userData.info.id;
			beginNodeJsons.push({
				id: nodeId,
				parentId: oldParentId,
				position: [obj3D.position.x, obj3D.position.y, obj3D.position.z],
				rotation: [obj3D.rotation.x, obj3D.rotation.y, obj3D.rotation.z],
				scale: [obj3D.scale.x, obj3D.scale.y, obj3D.scale.z]
			});
		}

		let endNodeJsons = [];
		for(let i = 0; i < nodeIds.length; i++){
			let nodeId = nodeIds[i];
			let obj3D = thatViewer.allObject3DMap[nodeId];
			let oldParent3D = obj3D.parent;
			let newPosAndRot = thatViewer.getChangeParentPosAndRot(obj3D, oldParent3D, newParent3D);
			endNodeJsons.push({
				id: nodeId,
				parentId: newParentId,
				position: [newPosAndRot.position.x, newPosAndRot.position.y, newPosAndRot.position.z],
				rotation: [newPosAndRot.rotation.x, newPosAndRot.rotation.y, newPosAndRot.rotation.z],
				scale: [newPosAndRot.scale.x, newPosAndRot.scale.y, newPosAndRot.scale.z]
			});
		}
		thatViewer.beginAddToUndoList(s3dOperateType.changeParent, nodeIds, {
			nodeJsons: beginNodeJsons
		});

		thatViewer.changeParentGroupInSilence(endNodeJsons);

		for(let i = 0; i < nodeIds.length; i++){
			let nodeId = nodeIds[i];
			thatViewer.afterChangeParentGroup(nodeId, newParentId);
		}

		thatViewer.endAddToUndoList(s3dOperateType.changeParent, nodeIds, {
			nodeJsons: endNodeJsons
		})
	}

	this.changeParentGroupInSilence = function (nodeJsons){
		thatViewer.cancelSelectObject3Ds();
		for(let i = 0; i < nodeJsons.length; i++){
			let nodeJson = nodeJsons[i];
			let obj3D = thatViewer.allObject3DMap[nodeJson.id];
			let toPosition = nodeJson.position;
			let toRotation = nodeJson.rotation;
			let toScale = nodeJson.scale;
			let newParent3D = thatViewer.allObject3DMap[nodeJson.parentId];
			obj3D.parent.remove(obj3D);
			newParent3D.add(obj3D);
			obj3D.position.set(toPosition[0], toPosition[1], toPosition[2]);
			obj3D.rotation.set(toRotation[0], toRotation[1], toRotation[2]);
			obj3D.scale.set(toScale[0], toScale[1], toScale[2]);
		}
	}

	this.afterChangeParentGroup = function (nodeId, newParentId){
		thatViewer.doEventFunction("afterChangeParentGroup", {
			nodeId: nodeId,
			newParentId: newParentId
		});
	}

	this.getChangeParentPosAndRot = function (obj3D, oldParent3D, newParent3D){
		obj3D.updateWorldMatrix(true, false);
		newParent3D.updateWorldMatrix(true, false);

		const zeroPoint = new THREE.Vector3(0, 0, 0);
		let oldZeroPosition = obj3D.position.clone().applyMatrix4(oldParent3D.matrixWorld);

		//获取newParent3D和oldParent3D的世界矩阵
		let newParentWorldMatrix = newParent3D.matrixWorld;
		let obj3DWorldMatrix = obj3D.matrixWorld.clone();

		//逆转newParent3D的世界矩阵并应用到obj3D的世界矩阵上
		let invertNewParentWorldMatrix = newParentWorldMatrix.invert();
		let localMatrix = obj3DWorldMatrix.multiply(invertNewParentWorldMatrix);

		//获取obj3D相对于newParent3D的局部坐标、旋转和缩放
		let localPosition = new THREE.Vector3();
		let localRotation = new THREE.Euler();
		let localScale = new THREE.Vector3();
		localMatrix.decompose(localPosition, localRotation, localScale);
		localPosition = oldZeroPosition.applyMatrix4(invertNewParentWorldMatrix);
		return{
			position: localPosition,
			rotation: localRotation,
			scale: localScale
		}
	}

	//初始化所有构件
	this.initAllObject3Ds = function(allTypeObjectMap){
		let countInfo = {
			all: allTypeObjectMap.server.length + allTypeObjectMap.local.length + allTypeObjectMap.internal.length,
			serverAll: allTypeObjectMap.server.length,
			serverSucceed: 0,
			localAll: allTypeObjectMap.local.length,
			localSucceed: 0,
			internalAll: allTypeObjectMap.internal.length,
			internalSucceed: 0
		};
		if(countInfo.internalAll > 0) {
			thatViewer.manager.internalObjectCreator.createObject3Ds(allTypeObjectMap.internal, thatViewer.afterInitObject3D, countInfo);
		}
		if(countInfo.localAll > 0) {
			thatViewer.manager.localObjectCreator.createObject3Ds(allTypeObjectMap.local, thatViewer.afterInitObject3D, countInfo);
		}
		if(countInfo.serverAll > 0) {
			thatViewer.manager.serverObjectCreator.createObject3Ds(allTypeObjectMap.server, thatViewer.afterInitObject3D, countInfo);
		}

		if(countInfo.all === 0){
			thatViewer.afterInitAllInternalObjects();
			thatViewer.afterInitAllLocalObjects();
			thatViewer.afterInitAllServerObjects();
			thatViewer.afterInitAllObjects();
			thatViewer.afterInitScene();
		}
	}

	//初始化cacheKey对应的Object
	this.getAllTypeObjects = function (){
		let object2GroupMap = {};
		for(let groupId in thatViewer.manager.s3dObject.groupMap){
			let groupJson = thatViewer.manager.s3dObject.groupMap[groupId];
			let objects = groupJson.objects;
			if(objects != null){
				for(let i = 0; i < objects.length; i++){
					let objectId = objects[i];
					object2GroupMap[objectId] = groupId;
				}
			}
		}
		let serverObjects = [];
		let localObjects = [];
		let internalObjects = [];
		for(let oId in thatViewer.manager.s3dObject.objectMap){
			let oJson = thatViewer.manager.s3dObject.objectMap[oId];
			oJson.parentId = object2GroupMap[oId];
			if(oJson.isInternal){
				internalObjects.push(oJson);
			}
			else if(oJson.isServer){
				serverObjects.push(oJson);
			}
			else{
				localObjects.push(oJson);
			}
		}
		return {
			server: serverObjects,
			local: localObjects,
			internal: internalObjects
		};
	}

	//初始化groupId对应的parentId
	this.getAllGroup2ParentIdMap = function (){
		let group2ParentIdMap = {};
		for(let i = 0; i < thatViewer.manager.s3dObject.groups.length; i++){
			let groupId = thatViewer.manager.s3dObject.groups[i];
			group2ParentIdMap[groupId] = null;
		}
		for(let parentId in thatViewer.manager.s3dObject.groupMap){
			let groupJson = thatViewer.manager.s3dObject.groupMap[parentId];
			let subGroupIds = groupJson.groups;
			if(subGroupIds != null){
				for(let i = 0; i < subGroupIds.length; i++){
					let subGroupId = subGroupIds[i];
					group2ParentIdMap[subGroupId] = parentId;
				}
			}
		}
		return group2ParentIdMap;
	}

	this.getObjectCacheKey = function (objectJson){
		let cacheKey;
		if(objectJson.isInternal){
			cacheKey = thatViewer.manager.localObjectCreator.getObjectCacheKey(objectJson);
		}
		else if(objectJson.isServer){
			let componentInfo = thatViewer.manager.s3dObject.objectTypeMap[objectJson.code + "_" + objectJson.versionNum];
			cacheKey = thatViewer.manager.serverObjectCreator.getObjectCacheKey(objectJson, thatViewer.detailLevel, thatViewer.viewLevel, componentInfo);
		}
		else{
			cacheKey = thatViewer.manager.localObjectCreator.getObjectCacheKey(objectJson);
		}
		return cacheKey;
	}

	this.afterInitObject3D = function (p){
		//默认隐藏
		if(thatViewer.defaultObjectHidden){
			p.object3D.visible = false;
		}

		thatViewer.allObject3DMap[p.objectSetting.id] = p.object3D;

		let group3D = thatViewer.allObject3DMap[p.objectSetting.parentId];
		group3D.add(p.object3D);
		//thatViewer.rootObject3D.add(p.object3D);

		thatViewer.refreshObject3DShadow(p.object3D);

		thatViewer.addHelperObjectToScene(p.object3D);

		thatViewer.doEventFunction("afterInitObject", {
			object3D: p.object3D
		});

		if(p.objectSetting.isInternal && p.countInfo.internalAll === p.countInfo.internalSucceed){
			thatViewer.afterInitAllInternalObjects();
		}

		if(p.objectSetting.isLocal && p.countInfo.localAll === p.countInfo.localSucceed){
			thatViewer.afterInitAllLocalObjects();
		}

		if(p.objectSetting.isServer && p.countInfo.serverAll === p.countInfo.serverSucceed){
			thatViewer.afterInitAllServerObjects();
		}

		//全部初始化加载完成后
		if(p.countInfo.serverAll === p.countInfo.serverSucceed
			&& p.countInfo.localAll === p.countInfo.localSucceed
			&& p.countInfo.internalAll === p.countInfo.internalSucceed) {
			thatViewer.afterInitAllObjects();
			thatViewer.afterInitScene();
		}
	}

	//设置相机信息
	this.setCameraInfo = function(cameraInfo){
		let needChangeCamera = cameraInfo.type !== thatViewer.manager.s3dObject.camera.type;
		thatViewer.manager.s3dObject.camera.target = cameraInfo.target;
		thatViewer.manager.s3dObject.camera.position = cameraInfo.position;
		thatViewer.manager.s3dObject.camera.zoom = cameraInfo.zoom;

		if(needChangeCamera){
			thatViewer.manager.s3dObject.camera = thatViewer.getDefaultCameraInfo();
			thatViewer.initCamera();
			thatViewer.initControls();
			thatViewer.setNormalViewport(s3dNormalViewport.init);
			thatViewer.animate();

			if(thatViewer.manager.moveHelper != null){
				thatViewer.manager.moveHelper.initControl();
			}
		}
	}

	this.getDefaultCameraInfo = function (){
		let axisInfo = thatViewer.manager.s3dObject.axis;
		switch (thatViewer.manager.s3dObject.camera.type){
			case "Orthographic":{
				return {
					type: "Orthographic",
					target: [
						axisInfo.size.x / 2,
						axisInfo.size.y / 16,
						axisInfo.size.z / 2,
					],
					position: [
						axisInfo.size.x / 2,
						axisInfo.size.y ,
						axisInfo.size.z / 2
					],
					zoom: 100
				};
			}
			case "Perspective":
			default:{
				return {
					type: "Perspective",
					target: [
						axisInfo.size.x / 2,
						axisInfo.size.y / 16,
						axisInfo.size.z / 2,
					],
					position: [
						axisInfo.size.x / 2,
						axisInfo.size.y,
						axisInfo.size.z * 1.5
					],
					zoom: 1
				};
			}
		}
	}

	//获取相机信息
	this.getCameraInfo = function(){
		return thatViewer.manager.s3dObject.camera;
	}

	//获取object根对象
	this.initRootObject3D = function(){
		let rootObject3D = new THREE.Group();

		//打上标记
		rootObject3D.isS3dRootObject = true;
		thatViewer.addObject3DToScene(rootObject3D);
		thatViewer.rootObject3D = rootObject3D;
	}

	//获取Helper根对象
	this.initRootHelper3D = function(){
		let rootHelper3D = new THREE.Group();

		//打上标记
		rootHelper3D.isS3dRootHelper = true;
		thatViewer.addObject3DToScene(rootHelper3D);
		thatViewer.rootHelper3D = rootHelper3D;
	}

	//当初始化所有构件对象完成后
	this.afterInitAllObjects = function(){
		thatViewer.initControls();
		thatViewer.initBackgroundColor();
		thatViewer.initSky();
		thatViewer.doEventFunction("afterInitAllObjects", {});
	}

	//当初始化所有服务端对象
	this.afterInitAllServerObjects = function(){
	}

	//当初始化所有本地对象
	this.afterInitAllLocalObjects = function(){
	}

	//当初始化所有内部对象
	this.afterInitAllInternalObjects = function(){
		//本地对象包含相机（以及灯光、粒子），下一步需要可以初始化相机和控制器
		thatViewer.initCamera();
		thatViewer.animate();
	}

	//scene初始化完成后
	this.afterInitScene = function(){
		thatViewer.initStats();
    	thatViewer.doEventFunction("afterInitScene", {});
	}

	//scene初始化前
	this.beforeInitScene = function(){
		thatViewer.doEventFunction("beforeInitScene", {});
	}
	
    //初始化光投射器
    this.initRaycaster = function() { 
    	let raycaster = new THREE.Raycaster();

    	//点击感应的范围 added by ls 20221128
    	raycaster.params.Line.threshold = thatViewer.lineSelectThreshold;

		thatViewer.enableObjectLayer(raycaster, s3dLayerType.editLayer, true);

		for(let i = 0; i < thatViewer.defaultCameraLayers.length; i++){
			let layer = thatViewer.defaultCameraLayers[i];
			thatViewer.enableObjectLayer(raycaster, layer, true);
		}

		thatViewer.raycaster = raycaster;
    };

	//初始化html
	this.initHtml = function(){
		let container = $("#" + thatViewer.containerId);

		//viewer
		let viewerHtml = thatViewer.getViewerHtml();
		$(container).find(".s3dLayoutBlock[name='viewer']").append(viewerHtml);

		//toolbar
		let toolbarHtml = thatViewer.getToolbarHtml();
		let toolbarContainer = $(container).find(".s3dLayoutBlockToolbar[name='viewer']");
		$(toolbarContainer).append(toolbarHtml);

		$(toolbarContainer).find(".s3dViewerBtn").each(function (index, element){
			let imageName = $(element).attr("imageName");
			if(imageName != null) {
				let imageUrl = thatViewer.manager.layout.imagesFolder + "viewer/" + imageName + ".png";
				$(element).css("background-image", "url(" + imageUrl + ")");
			}
		});

		//绑定事件
		$(toolbarContainer).find(".s3dViewerBtn").click(function (){
			let btnName = $(this).attr("name");
			switch (btnName){
				case "rotationMode":{
					//控制器为旋转模式
					thatViewer.manager.moveHelper.setMode(s3dTransformMode.rotation);
					break;
				}
				case "scaleMode":{
					//控制器为缩放模式
					thatViewer.manager.moveHelper.setMode(s3dTransformMode.scale);
					break;
				}
				case "positionMode":{
					//控制器为位移模式
					thatViewer.manager.moveHelper.setMode(s3dTransformMode.position);
					break;
				}
				default:{
					msgBox.alert({info: "未知的按钮. btnName=" + btnName});
					break;
				}
			}
		});
	}

	//初始化html
	this.getViewerHtml = function(){
		let html = "<div class=\"s3dViewerContainer\" tabindex=\"0\"><img class=\"s3dViewerInnerContainerBackgroundImage\"  alt=\"\" src=\"\"/><div class=\"s3dViewerInnerContainer\"></div></div>";
		return html;
	}

	//获取树toolbar html
	this.getToolbarHtml = function(){
		let positionModeBtnHtml = "<div class=\"s3dViewerBtn\" imageName=\"positionMode\" title=\"切换为位移模式\" name=\"positionMode\"></div>";
		let rotationModeBtnHtml = "<div class=\"s3dViewerBtn\" imageName=\"rotationMode\" title=\"切换为旋转模式\" name=\"rotationMode\"></div>";
		let scaleModeBtnHtml = "<div class=\"s3dViewerBtn\" imageName=\"scaleMode\" title=\"切换为缩放模式\" name=\"scaleMode\"></div>";

		let html = "<div class='s3dViewerToolbar'>"
			+ "<div class='s3dViewerTitle'><div class='s3dViewerTitleLogo'></div><div class='s3dViewerTitleText'></div></div>"
			+ "<div class='s3dViewerBtns'>"
			+ positionModeBtnHtml
			+ rotationModeBtnHtml
			+ scaleModeBtnHtml
			+ "</div>"
			+ "</div>";
		return html;
	}

	//初始化Title
	this.initTitle = function (){
		thatViewer.refreshTitle();
	}

	//刷新标题
	this.refreshTitle = function (){
		let container = $("#" + thatViewer.containerId);
		let name = thatViewer.manager.s3dObject.name;
		let title = "Tada3D - " + name
		$(container).find(".s3dViewerToolbar .s3dViewerTitleText").text(title);
	}

	//重命名文件
	this.setModelName = function (modelName){
		thatViewer.manager.loader.setModelName(modelName);
		thatViewer.refreshTitle();
	}

	//测试
	this.test = function(){ 
        let boxGeometry = new THREE.BoxGeometry(10, 10, 10);
        let boxMaterial = new THREE.MeshLambertMaterial({
        	color: 0x444444
        });
        let box = new THREE.Mesh(boxGeometry, boxMaterial);
        box.position.set(0, 0, 0); 
        thatViewer.scene.add(box);  
	}
    
    //初始化Scene
    this.initScene = function() {
		thatViewer.beforeInitScene();
    	thatViewer.scene = new THREE.Scene();
	};

	//初始化统计
	this.initStats = function (){
		if(thatViewer.statsVisible) {
			setTimeout(function () {
				let container = $("#" + thatViewer.containerId);
				let stats = new Stats();
				$(stats.dom).addClass("s3dViewerStats");
				$(stats.dom).css({
					"position": "",
					"top": "",
					"left": ""
				})
				$(container).find(".s3dViewerInnerContainer").append(stats.dom);
				thatViewer.stats = stats;
			}, 200);
		}
	}

	//初始化Camera
	this.initCamera = function() {
		let camera = null;
		if(thatViewer.renderCamera == null){
			camera = thatViewer.createDefaultCamera();
		}
		else{
			camera = thatViewer.getObject3DByName(thatViewer.renderCamera.name);
		}

		thatViewer.camera = camera;
	};

	//初始化默认Camera
	this.createDefaultCamera = function() {
		let container = $("#" + thatViewer.containerId);
        let width = $(container).find(".s3dViewerInnerContainer").width();
        let height = $(container).find(".s3dViewerInnerContainer").height();
		let aspect = width / height;
		let camera;
		let cameraInfo = thatViewer.manager.s3dObject.camera;
		let controlConfig = thatViewer.getControlConfig();
		let orbitControlConfig = thatViewer.getOrbitControlConfig();
		let near = orbitControlConfig.near == null ? controlConfig.near : orbitControlConfig.near;
		let far = orbitControlConfig.far == null ? controlConfig.far : orbitControlConfig.far;
		switch(cameraInfo.type){
			//正交
			case "Orthographic":{
				let aspect = width / height;
				camera = new THREE.OrthographicCamera( -thatViewer.frustumSize * aspect,
					thatViewer.frustumSize * aspect,
					thatViewer.frustumSize,
					-thatViewer.frustumSize,
					near,
					far);
				break;
			}
			//透视
			case "Perspective":
			default:{
				camera = new THREE.PerspectiveCamera(45,
					aspect,
					near,
					far);
				break;
			}
		}
		camera.position.set(cameraInfo.position[0], cameraInfo.position[1], cameraInfo.position[2]);
		camera.lookAt(new THREE.Vector3(cameraInfo.target[0], cameraInfo.target[1], cameraInfo.target[2]));

		for(let i = 0; i < thatViewer.defaultCameraLayers.length; i++){
			let layer = thatViewer.defaultCameraLayers[i];
			camera.layers.enable(layer);
		}

		/*
		camera.near = 1;
		camera.far = 1000;
		camera.left = 1000;
		camera.right = 1000;
		camera.top = 1000;
		camera.bottom = 1000;
		 */
		return camera;
    };

	this.disableObjectLayer = function (object3D, layerType, recursion){
		if(object3D != null && object3D.layers != null){
			object3D.layers.disable(layerType);
		}
		if(object3D.children != null && recursion){
			for(let i = 0; i < object3D.children.length; i++){
				let subObj3D = object3D.children[i];
				thatViewer.disableObjectLayer(subObj3D, layerType, recursion);
			}
		}
	}

	this.enableObjectLayer = function (object3D, layerType, recursion){
		if(object3D != null && object3D.layers != null){
			object3D.layers.enable(layerType);
		}
		if(object3D.children != null && recursion){
			for(let i = 0; i < object3D.children.length; i++){
				let subObj3D = object3D.children[i];
				thatViewer.enableObjectLayer(subObj3D, layerType, recursion);
			}
		}
	}

    //初始化Render
    this.initRender = function() {
		thatViewer.renderer = new THREE.WebGLRenderer({
			antialias: true,
			logarithmicDepthBuffer: true,
			alpha: thatViewer.alpha
		});
		thatViewer.renderer.sortObjects = false;

		if(thatViewer.showShadow){
			thatViewer.renderer.shadowMap.enabled = true;
		}
		thatViewer.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
		thatViewer.renderer.localClippingEnabled = true;
		thatViewer.renderer.physicallyCorrectLights = true;

		thatViewer.renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
		thatViewer.renderer.toneMapping = THREE.LinearToneMapping;
		thatViewer.renderer.toneMappingExposure = 1.0;

		let container = $("#" + thatViewer.containerId);
        let width = $(container).find(".s3dViewerInnerContainer").width();
        let height = $(container).find(".s3dViewerInnerContainer").height();
        thatViewer.renderer.setSize(width, height);
		thatViewer.renderer.setPixelRatio( window.devicePixelRatio );

        $(container).find(".s3dViewerInnerContainer").append(thatViewer.renderer.domElement);
    };

	this.initBackgroundColor = function (){
		if(!thatViewer.alpha) {
			thatViewer.renderer.setClearColor(thatViewer.backgroundColor);
		}
	};

	this.initSky = function (){
		thatViewer.manager.skyBox.initSky(thatViewer.manager.s3dObject.scene.sky)
	}

	//初始化Render2D
	this.initCssRender2D = function() {
		thatViewer.renderer2d = new CSS2DRenderer();
		let container = $("#" + thatViewer.containerId);
		let width = $(container).find(".s3dViewerInnerContainer").width();
		let height = $(container).find(".s3dViewerInnerContainer").height();
		thatViewer.renderer2d.setSize( width, height );
		thatViewer.renderer2d.domElement.style.position = 'absolute';
		thatViewer.renderer2d.domElement.style.top = '0px';
		thatViewer.renderer2d.domElement.tabIndex = 0;
		thatViewer.renderer2d.domElement.className = "viewInnerRenderer2d";
		$(container).find(".s3dViewerContainer").append(thatViewer.renderer2d.domElement);
	};

	//初始化Render3D
	this.initCssRender3D = function() {
		thatViewer.renderer3d = new CSS3DRenderer();
		let container = $("#" + thatViewer.containerId);
		let width = $(container).find(".s3dViewerInnerContainer").width();
		let height = $(container).find(".s3dViewerInnerContainer").height();
		thatViewer.renderer3d.setSize( width, height );
		thatViewer.renderer3d.domElement.style.position = 'absolute';
		thatViewer.renderer3d.domElement.style.top = '0px';
		thatViewer.renderer3d.domElement.tabIndex = 0;
		thatViewer.renderer3d.domElement.className = "viewInnerRenderer3d";
		$(container).find(".s3dViewerContainer").append(thatViewer.renderer3d.domElement);
	};

    //window变化事件
    this.onWindowResize = function() {

		let container = $("#" + thatViewer.containerId);
		let s3dViewerContainer = $(container).find(".s3dViewerContainer")[0];
		let s3dViewerContainerOffset = $(s3dViewerContainer).offset();
		thatViewer.containerPos = {
			x: s3dViewerContainerOffset.left,
			y: s3dViewerContainerOffset.top
		};

		thatViewer.updateScreenRotation();

        let width = $(s3dViewerContainer).find(".s3dViewerInnerContainer").width();
        let height = $(s3dViewerContainer).find(".s3dViewerInnerContainer").height();
		let aspect = width / height; 	
		if(thatViewer.camera instanceof THREE.OrthographicCamera){
			thatViewer.camera.left = - thatViewer.frustumSize * aspect;
			thatViewer.camera.right = thatViewer.frustumSize * aspect;
			thatViewer.camera.top = thatViewer.frustumSize;
			thatViewer.camera.bottom = - thatViewer.frustumSize;
		}
		else if(thatViewer.camera instanceof THREE.PerspectiveCamera){
			thatViewer.camera.aspect = aspect;
		}
		thatViewer.camera.updateProjectionMatrix();
		thatViewer.renderer.setSize(width, height);
		thatViewer.renderer2d.setSize( width, height);
		thatViewer.renderer3d.setSize( width, height);
	};

	this.getControlConfig = function (){
		switch (thatViewer.manager.s3dObject.camera.type){
			case "Perspective":{
				return thatViewer.controlConfig.perspective;
			}
			case "Orthographic":
			default:{
				return thatViewer.controlConfig.orthographic;
			}
		}
	}

	this.getOrbitControlConfig = function (){
		let orbitControlConfig = null;
		switch (thatViewer.manager.s3dObject.camera.type){
			case "Perspective":{
				orbitControlConfig = thatViewer.orbitControlConfig.perspective;
				break;
			}
			case "Orthographic":
			default:{
				orbitControlConfig = thatViewer.orbitControlConfig.orthographic;
				break;
			}
		}

		if(orbitControlConfig == null){
			orbitControlConfig = {};
		}

		let orbitInfo = thatViewer.manager.s3dObject.camera.orbit;
		if(orbitInfo != null) {
			orbitControlConfig.minPolarAngle = orbitInfo.minPolarAngle;
			orbitControlConfig.maxPolarAngle = orbitInfo.maxPolarAngle;
			orbitControlConfig.minDistance = orbitInfo.minDistance;
			orbitControlConfig.maxDistance = orbitInfo.maxDistance;
		}
		return orbitControlConfig;
	}

	this.switchCamera = function (cameraObject){
		thatViewer.camera = cameraObject;

		for(let i = 0; i < thatViewer.defaultCameraLayers.length; i++){
			let layer = thatViewer.defaultCameraLayers[i];
			thatViewer.enableObjectLayer(cameraObject, layer, true);
		}
	}

    //初始化Controls
    this.initControls = function() {
		let camera = thatViewer.camera;
		let cameraTarget = null;
		if(thatViewer.renderCamera == null){
			cameraTarget = thatViewer.manager.s3dObject.camera.target;
		}
		else{
			if(thatViewer.renderCamera.target == null) {
				let info = thatViewer.camera.userData.info;
				let distanceToFocus = common3DFunction.v2s(info.parameters["distance"].value, thatViewer.distanceRatio);
				let distanceVector = new THREE.Vector3(0, 0, -distanceToFocus);
				let quaternion = new THREE.Quaternion().setFromEuler(camera.rotation);
				distanceVector.applyQuaternion(quaternion);
				let localTargetVector = new THREE.Vector3(
					camera.position.x + distanceVector.x,
					camera.position.y + distanceVector.y,
					camera.position.z + distanceVector.z
				);
				let worldTargetVector = camera.parent.localToWorld(localTargetVector.clone());
				cameraTarget = [worldTargetVector.x, worldTargetVector.y, worldTargetVector.z];
			}
			else{
				cameraTarget = [thatViewer.renderCamera.target[0], thatViewer.renderCamera.target[1], thatViewer.renderCamera.target[2]];
			}
		}
    	let orbitControl = new OrbitControls(camera, thatViewer.renderer2d.domElement);
    	orbitControl.target = new THREE.Vector3(cameraTarget[0], cameraTarget[1], cameraTarget[2]);

		let controlConfig = thatViewer.getControlConfig();
		let orbitControlConfig = thatViewer.getOrbitControlConfig();
		orbitControl.minZoom = orbitControlConfig.minZoom == null ? controlConfig.minZoom : orbitControlConfig.minZoom;
		orbitControl.maxZoom = orbitControlConfig.maxZoom == null ? controlConfig.maxZoom : orbitControlConfig.maxZoom;
		orbitControl.minPolarAngle = orbitControlConfig.minPolarAngle == null ? controlConfig.minPolarAngle : orbitControlConfig.minPolarAngle;
		orbitControl.maxPolarAngle = orbitControlConfig.maxPolarAngle == null ? controlConfig.maxPolarAngle : orbitControlConfig.maxPolarAngle;
		orbitControl.minDistance = orbitControlConfig.minDistance == null ? controlConfig.minDistance : orbitControlConfig.minDistance;
		orbitControl.maxDistance = orbitControlConfig.maxDistance == null ? controlConfig.maxDistance : orbitControlConfig.maxDistance;
		orbitControl.enablePan = orbitControlConfig.enablePan == null ? controlConfig.enablePan : orbitControlConfig.enablePan;
		orbitControl.enableRotate = orbitControlConfig.enableRotate == null ? controlConfig.enableRotate : orbitControlConfig.enableRotate;
		orbitControl.enableZoom = orbitControlConfig.enableZoom == null ? controlConfig.enableZoom : orbitControlConfig.enableZoom;
		orbitControl.zoomSpeed = orbitControlConfig.zoomSpeed == null ? controlConfig.zoomSpeed : orbitControlConfig.zoomSpeed;
		orbitControl.panSpeed = orbitControlConfig.panSpeed == null ? controlConfig.panSpeed : orbitControlConfig.panSpeed;
		orbitControl.rotateSpeed = orbitControlConfig.rotateSpeed == null ? controlConfig.rotateSpeed : orbitControlConfig.rotateSpeed;
		orbitControl.enableDamping = orbitControlConfig.enableDamping  == null ? controlConfig.enableDamping  : orbitControlConfig.enableDamping;
		orbitControl.dampingFactor = orbitControlConfig.dampingFactor  == null ? controlConfig.dampingFactor  : orbitControlConfig.dampingFactor;

		orbitControl.xyExchange = thatViewer.xyExchange;
    	orbitControl.update();
    	thatViewer.orbitControl = orbitControl;
	};

    
    //animate
    this.animate = function() {
		if(thatViewer.hasAnimation && TWEEN != null) {
			TWEEN.update();
		}
    	thatViewer.renderer.render(thatViewer.scene, thatViewer.camera);
		thatViewer.renderer2d.render(thatViewer.scene, thatViewer.camera);
		thatViewer.renderer3d.render(thatViewer.scene, thatViewer.camera);

		requestAnimationFrame(thatViewer.animate);

		if(thatViewer.runAnimationInfo.clock != null && thatViewer.runAnimationInfo.clock.running) {
			let delta = thatViewer.runAnimationInfo.clock.getDelta();
			for(let animationCode in thatViewer.runAnimationInfo.runInfoMap) {
				let runInfo = thatViewer.runAnimationInfo.runInfoMap[animationCode];
				for (let mixerId in runInfo.mixerMap) {
					let mixer = runInfo.mixerMap[mixerId];
					mixer.update(delta);
				}
			}
		}

		thatViewer.updateParticles();

		thatViewer.updateStats();

    	thatViewer.doEventFunction("afterAnimate", {});
    };

	this.updateStats = function (){
		if(thatViewer.stats != null) {
			thatViewer.stats.update();
		}
	}

	this.updateParticles = function (){
		for(let objectId in thatViewer.allObject3DMap){
			let object3D= thatViewer.allObject3DMap[objectId];
			let info = object3D.userData.info;
			if(info.type === s3dElement3DType.particle){
				object3D.update();
			}
		}
	}
	
	//复制参数集合
	this.cloneParameters = function(paramUrl){
		let propertyJArray = thatViewer.manager.s3dObject.parametersJson[paramUrl];
		let parameters = {};
		for(let i = 0; i < propertyJArray.length; i++){
			let propertyJson = propertyJArray[i];
			parameters[propertyJson.name] = propertyJson.value;
		}
		return parameters;
	}

	//设置某个构件对象的位置和旋转角度
	this.setObjectPositionRotationScaleById = function(nodeId, useWorldPosition, position, rotation, scale){
		let object3D = thatViewer.getObject3DById(nodeId);
		let info = object3D.userData.info;
		info.useWorldPosition = useWorldPosition;
		info.position = [position.x, position.y, position.z];
		info.rotation = [rotation.x, rotation.y, rotation.z];
		info.scale = [scale.x, scale.y, scale.z];
		if(info.isInternal){
			thatViewer.setObject3DPosition(nodeId, position);
			thatViewer.setObject3DRotation(nodeId, rotation);
			thatViewer.setObject3DScale(nodeId, scale);

			switch (info.type){
				case s3dElement3DType.light:
				case s3dElement3DType.camera:{
					let helper3D = thatViewer.getHelperObject3D(info.id);
					if(helper3D != null){
						helper3D.update();
					}
					break;
				}
				default:{
					break;
				}
			}
		}
		else if(info.isServer){
			thatViewer.refreshObject3DPositionRotationScale(object3D);
		}
		else{
			thatViewer.setObject3DPosition(nodeId, position);
			thatViewer.setObject3DRotation(nodeId, rotation);
			thatViewer.setObject3DScale(nodeId, scale);
		}
	}

	//刷新某个构件对象（由服务器端构造）的位置和旋转角度
	this.refreshObject3DPositionRotationScale = function(outerObject3D){
		let useWorldPosition = outerObject3D.userData.info.useWorldPosition;
		let position = outerObject3D.userData.info.position;
		let rotation = outerObject3D.userData.info.rotation;
		let scale = outerObject3D.userData.info.scale;
		let object3D = outerObject3D.children[0];
		if(useWorldPosition){
			object3D.position.set(0, 0, 0);
			outerObject3D.position.set(0, 0, 0);
			outerObject3D.rotation.set(0, 0, 0);
		}
		else {
			outerObject3D.position.set(position[0], position[1], position[2]);
			outerObject3D.rotation.set(rotation[0], rotation[1], rotation[2]);
			outerObject3D.scale.set(scale[0], scale[1], scale[2]);
		}

		thatViewer.updateHelper(outerObject3D.userData.info.id);
	}
    
    //获取与根节点object3D的相对位置
    this.getPositionInRoot = function(object3D){
    	let box = new THREE.Box3().setFromObject(object3D, true);
    	let rootPos = thatViewer.rootObject3D.position;
    	let pos = {
    		x: (box.min.x + box.max.x) / 2 - rootPos.x,
    		y: (box.min.y + box.max.y) / 2 - rootPos.y,
    		z: (box.min.z + box.max.z) / 2 - rootPos.z
    	};
    	return pos;
    }
    
    
    //根节点object3D
    this.getRootObject3D = function(){
    	return thatViewer.rootObject3D;
    }

    //将object3D添加到scene中
    this.addObject3DToScene = function(object3D){
    	object3D.position.set(0, 0, 0);
    	thatViewer.scene.add(object3D);
    }

	//获取Scene的外框
    this.getSceneBoxValues = function(){
		return new THREE.Box3().setFromObject(thatViewer.rootObject3D, true);
    }

    //设置常见视角
    this.setNormalViewport = function(viewport, distance){
    	let cameraPosition = thatViewer.camera.position; 
    	    	
    	//取外框盒子，用于计算外框的camera
    	let axisSize = thatViewer.manager.s3dObject.axis.size;
    	let xSize = axisSize.x * 2;
    	let ySize = axisSize.y * 2;
    	let zSize = axisSize.z * 2;
    	let xCenter = 0;
    	let yCenter = 0;
    	let zCenter = 0;
    	let cameraDistance = Math.sqrt(xSize * xSize + ySize * ySize + zSize * zSize);

		let controlConfig = thatViewer.getControlConfig();
		if(cameraDistance === Infinity || cameraDistance < controlConfig.minCameraDistace){
			cameraDistance = controlConfig.minCameraDistace;
		}
    	
    	let position = [];
		let target = [];
		let zoom = 1;
    	switch(viewport){ 
	    	case s3dNormalViewport.init:{
				let cameraInfo = thatViewer.manager.s3dObject.camera;
				position[0] = cameraInfo.position[0];
				position[1] = cameraInfo.position[1];
				position[2] = cameraInfo.position[2];
				target[0] = cameraInfo.target[0];
				target[1] = cameraInfo.target[1];
				target[2] = cameraInfo.target[2];
				zoom = cameraInfo.zoom;
	    		break;
	    	}
			case s3dNormalViewport.top:{
				position[0] = xCenter;
				position[1] = distance == null ? cameraDistance : distance;
				position[2] = zCenter;
				target[0] = xCenter;
				target[1] = yCenter / 8;
				target[2] = zCenter;
				zoom = thatViewer.camera.zoom;
				break;
			}
			default:{
	    		alert("Unknown viewport = " + viewport);
	    	}	    		
    	}   
    	thatViewer.setViewport(target, position, zoom);  
    }
    
    //设置视角
    this.setViewport = function(target, position, zoom) {
		switch (thatViewer.manager.s3dObject.camera.type) {
			case "Perspective": {
				thatViewer.orbitControl.target.set(target[0], target[1], target[2]);
				thatViewer.orbitControl.object.position.set(position[0], position[1], position[2]);
				thatViewer.orbitControl.zoom = zoom;
				thatViewer.orbitControl.update();
				break;
			}
			case "Orthographic":
			default: {
				thatViewer.orbitControl.target0.set(target[0], target[1], target[2]);
				thatViewer.orbitControl.position0.set(position[0], position[1], position[2]);
				thatViewer.orbitControl.zoom0 = zoom;
				thatViewer.orbitControl.reset();
				break;
			}
		}
	}

	this.getOrbitControlInfo = function (){
		let control = thatViewer.orbitControl;
		switch (thatViewer.manager.s3dObject.camera.type) {
			case "Perspective": {
				return {
					target: [control.target.x, control.target.y, control.target.z],
					position: [control.object.position.x, control.object.position.y, control.object.position.z],
					zoom: thatViewer.orbitControl.zoom
				}
			}
			case "Orthographic":
			default: {
				return {
					target: [control.target0.x, control.target0.y, control.target0.z],
					position: [control.position0.x, control.position0.y, control.position0.z],
					zoom: thatViewer.orbitControl.zoom0
				}
			}
		}
	}

	//设置视角（带动画）
	this.setViewportWithAnimation = function (target, position, zoom, duration){
		switch (thatViewer.manager.s3dObject.camera.type) {
			case "Perspective": {
				const tween = new TWEEN.Tween({
					zoom: thatViewer.orbitControl.zoom,
					targetX: thatViewer.orbitControl.target.x,
					targetY: thatViewer.orbitControl.target.y,
					targetZ: thatViewer.orbitControl.target.z,
					positionX: thatViewer.orbitControl.object.position.x,
					positionY: thatViewer.orbitControl.object.position.y,
					positionZ: thatViewer.orbitControl.object.position.z,
				}).to({
					zoom: zoom,
					targetX: target[0],
					targetY: target[1],
					targetZ: target[2],
					positionX: position[0],
					positionY: position[1],
					positionZ: position[2],
				}, duration * 1000)
					.easing(TWEEN.Easing.Quadratic.InOut)
					.onUpdate(() => {
						let obj = tween._object;
						let control = thatViewer.orbitControl;
						control.target.set(obj.targetX, obj.targetY, obj.targetZ);
						control.object.position.set(obj.positionX, obj.positionY, obj.positionZ);
						control.zoom = obj.zoom;
						control.update();
					})
					.onComplete(() => {
						let obj = tween._object;
						let control = thatViewer.orbitControl;
					})
					.start();

				/*
				const targetTween = new TWEEN.Tween(thatViewer.orbitControl.target)
					.to({x: target[0], y: target[1], z: target[2]}, duration)
					.easing(TWEEN.Easing.Quadratic.InOut)
					.onUpdate(() => {
						thatViewer.orbitControl.update(); // 更新控制器以便立即应用新的目标点
					});

				const zoomTween = new TWEEN.Tween(thatViewer.orbitControl, {zoom0: 1})
					.to({zoom0: zoom}, duration)
					.easing(TWEEN.Easing.Quadratic.InOut)
					.onUpdate(() => {
						thatViewer.orbitControl.update(); // 更新控制器以便立即应用新的缩放
					});

				// 同时开始三个动画
				TWEEN.all(posTween, targetTween, zoomTween).start();
				 */
				break;
			}
			case "Orthographic":
			default: {
				msgBox.alert({info: "尚未实现Orthographic的动画旋转."});
				break;
			}
		}

	}

	//获取当前camera信息
	this.getCurrentCameraInfo = function(){
		let target = thatViewer.orbitControl.target;
		let position = thatViewer.camera.position; 
    	let zoom = thatViewer.camera.zoom;
		return {
			target: [target.x, target.y, target.z],
			position: [position.x, position.y, position.z],
			zoom: zoom
		};
	}

	//设置显示状态
	this.setObject3DsVisible = function(ids, isVisible){
		let selectedObject3Ds = [];
    	for(let i = 0; i < ids.length; i++){
    		let id = ids[i];
    		let object3D = thatViewer.allObject3DMap[id];
			if(object3D != null) {
				selectedObject3Ds.push(object3D);
			}
    	} 
    	for(let i = 0; i < selectedObject3Ds.length; i++){
    		let object3D = selectedObject3Ds[i];
			if(object3D != null) {
				object3D.visible = isVisible;
			}
    	}
    }

	//根据id获取object3d
	this.getObject3DById = function(id){
		return thatViewer.allObject3DMap[id];
	}

	//获取box3
	this.getObject3DBox3 = function (object3D){
		return new THREE.Box3().setFromObject(object3D, true);
	}

	//根据name获取object3d
	this.getObject3DByName = function(name){
		for(let id in thatViewer.allObject3DMap){
			let object3D = thatViewer.allObject3DMap[id];
			if(object3D.userData.info.name === name){
				return object3D;
			}
		}
		return null;
	}

	//根据code获取object3d
	this.getObject3DsByCode = function(code){
		let object3Ds = [];
		for(let id in thatViewer.allObject3DMap){
			let object3D = thatViewer.allObject3DMap[id];
			if(object3D.userData.info.code === code){
				object3Ds.push(object3D);
			}
		}
		return object3Ds;
	}

	//根据code前缀获取object3d
	this.getObject3DsByCodePrefix = function(codePrefix){
		let object3Ds = [];
		for(let id in thatViewer.allObject3DMap){
			let object3D = thatViewer.allObject3DMap[id];
			if(object3D.userData.info.code.startsWith(codePrefix)){
				object3Ds.push(object3D);
			}
		}
		return object3Ds;
	}

	//双击图层构件
	this.dblClickUserLayerObject = function(layerObject3D, ev, mousePosition, intersects){
		//交给外部处理，暂不实现内置响应方法
		thatViewer.doEventFunction("onDblClickLayerObject", {
			layerObject3D: layerObject3D,
			event: ev,
			mousePosition: mousePosition,
			intersects: intersects
		});
	}

	//在图层构件上mouseDown
	this.mouseDownUserLayerObject = function(layerObject3D, ev, mousePosition, intersects){
		//交给外部处理，暂不实现内置响应方法
		thatViewer.doEventFunction("onMouseDownUserLayerObject", {
			layerObject3D: layerObject3D,
			event: ev,
			mousePosition: mousePosition,
			intersects: intersects
		});
	}

	//在图层构件上mouseUp
	this.mouseUpUserLayerObject = function(layerObject3D, ev, mousePosition, intersects){
		//交给外部处理，暂不实现内置响应方法
		thatViewer.doEventFunction("onMouseUpUserLayerObject", {
			layerObject3D: layerObject3D,
			event: ev,
			mousePosition: mousePosition,
			intersects: intersects
		});
	}

	//在图层构件上做鼠标移动时
	this.mouseMoveUserLayerObject = function(layerObject3D, ev, position, intersects){
		//交给外部处理，暂不实现内置响应方法
		thatViewer.doEventFunction("onMouseMoveUserLayerObject", {
			layerObject3D: layerObject3D,
			event: ev,
			position: position,
			intersects: intersects
		});
	}

	//单击图层构件
	this.clickUserLayerObject = function(layerObject3D, ev, mousePosition, intersects){
		//交给外部处理，暂不实现内置响应方法
		thatViewer.doEventFunction("onClickLayerObject", {
			layerObject3D: layerObject3D,
			event: ev,
			mousePosition: mousePosition,
			intersects: intersects
		});
	}

	//双击构件
	this.dblClickS3dObject = function(object3D, ev){
		//也执行选中
		if(object3D == null){
			//单选时，点到了没有object的地方，那么取消所有选中
			thatViewer.cancelSelectObject3Ds();
		}
		else {
			if (thatViewer.selectedObject3Ds.length !== 1) {
				thatViewer.cancelSelectObject3Ds();
				thatViewer.selectObject3D(object3D);
			} else {
				if (!object3D.isSelected || object3D.parent.isSelected) {
					thatViewer.cancelSelectObject3Ds();
					thatViewer.selectObject3D(object3D);
				}
			}
		}

		//交给外部处理，暂不实现内置响应方法
		thatViewer.doEventFunction("onDblClickObject", {
			object3D: object3D
		});
	}

	//点击
	this.clickS3dObject = function(object3D, ev){
    	if(object3D == null){
    		if(ev.ctrlKey){
    			//多选时，点到了没有object的地方，不做处理
    		}
    		else{
    			//单选时，点到了没有object的地方，那么取消所有选中
    			thatViewer.cancelSelectObject3Ds(); 
    		}
    	}
    	else {
    		if(ev.ctrlKey){
	        	if(object3D.isSelected){ 
	        		thatViewer.unSelectObject3D(object3D);
	        	}
	        	else{ 
	        		thatViewer.selectObject3D(object3D);
	        	}
	    	}
	    	else{
				if(thatViewer.selectedObject3Ds.length !== 1){
					thatViewer.cancelSelectObject3Ds(); 
					thatViewer.selectObject3D(object3D);
				}
				else{
					if(!object3D.isSelected || object3D.parent.isSelected){
						thatViewer.cancelSelectObject3Ds(); 
						thatViewer.selectObject3D(object3D);
					}
				}

	    	}
    	}

		//交给外部处理
		thatViewer.doEventFunction("onClickObject", {
			object3D: object3D
		});
    } 

	//获取选中的object3ds的ids
	this.getSelectedObject3DIds = function(){
		let object3Ds = thatViewer.selectedObject3Ds;
		let ids = [];
		if(object3Ds != null){
			for(let i = 0; i < object3Ds.length; i++){
				let object3D = object3Ds[i];
				ids.push(object3D.userData.info.id);
			}
		}
		return ids;
	}
    
    //选中object3D
    this.selectObject3D = function(object3D){ 
		if(thatViewer.canSelectObject3D){
			if(!object3D.disableSelect) {
				thatViewer.addToSelectedObject3Ds(object3D);
				thatViewer.highlightObject3D(object3D);
				thatViewer.highlightHelper3D(object3D);
			}
		} 
    }

	this.highlightHelper3D = function (object3D){
		let info = object3D.userData.info;
		let helper3D = thatViewer.getHelperObject3D(info.id);
		if(helper3D != null) {
			switch (info.type) {
				case s3dElement3DType.light:
				case s3dElement3DType.camera: {
					helper3D.update();
					helper3D.visible = true;
					break;
				}
				default: {
					break;
				}
			}
		}
	}

    //取消选中object3D
    this.unSelectObject3D = function(object3D){
    	thatViewer.removeFromSelectedObject3Ds(object3D);
		thatViewer.unHighlightObject3D(object3D);
		thatViewer.unHighlightHelper3D(object3D);
    }

	this.unHighlightHelper3D = function (object3D){
		let info = object3D.userData.info;
		let helper3D = thatViewer.getHelperObject3D(info.id);
		if(helper3D != null) {
			switch (info.type) {
				case s3dElement3DType.light:
				case s3dElement3DType.camera: {
					helper3D.visible = false;
					break;
				}
				default: {
					break;
				}
			}
		}
	}

	//获取构件对象信息（与s3d里的node对应）
	this.getNodeJson = function(nodeId){
		let object3D = thatViewer.allObject3DMap[nodeId];
		let info = object3D.userData.info;
		let name = info.name;
		let parameters = info.parameters;
		let materials = info.materials;
		let position = [object3D.position.x, object3D.position.y, object3D.position.z];
		let rotation = [object3D.rotation.x, object3D.rotation.y, object3D.rotation.z];
		let scale = [object3D.scale.x, object3D.scale.y, object3D.scale.z];
		return {
			id: nodeId,
			name: name,
			code: info.code,
			versionNum: info.versionNum,
			castShadow: info.castShadow,
			receiveShadow: info.receiveShadow,
			isServer: info.isServer,
			isInternal: info.isInternal,
			isLocal: info.isLocal,
			isTemp: info.isTemp,
			userData: info.userData,
			useWorldPosition: info.useWorldPosition,
			position: position,
			rotation: rotation,
			scale: scale,
			parameters: parameters,
			materials: materials,
			type: info.type
		};
	}

	this.getResourceObjectInfo = function (objectJson) {
		let resourceDirectory = objectJson.parameters["文件夹"].value;
		let resourceFileName = objectJson.parameters["文件名"].value;
		objectJson.parameters["组成部分"].value;
		let resourceType = objectJson.parameters["类型"].value;
		let resourceKey = thatViewer.manager.object3DCache.getResourceObject3DKey(resourceDirectory + "\\" + resourceFileName, resourceType);
		return thatViewer.manager.object3DCache.getResourceObject3D(resourceKey);
	};
    
	//当选中对象的集合变化时
    this.onSelectChanged = function(selectedObject3Ds){
    	let nodeJArray = [];
    	for(let i = 0; i < selectedObject3Ds.length; i++){
    		let object3D = selectedObject3Ds[i];
    		let nodeId = object3D.userData.info.id;
			let nodeJson = thatViewer.getNodeJson(nodeId);
    		nodeJArray.push(nodeJson);
    	}
		thatViewer.doEventFunction("onSelectChanged", {
    		selectedCount: nodeJArray.length,
    		nodeJArray: nodeJArray
    	});
    }

	//根据构件对象的id，复制描述其的json
	this.cloneJsonById = function(id){
		let object3D = thatViewer.getObject3DById(id);
		let parameters = {};
		for(let paramName in object3D.userData.info.parameters){
			parameters[paramName] = {
				value: object3D.userData.info.parameters[paramName].value
			};
		}
		let materials = {};
		for(let name in object3D.userData.info.materials){
			materials[name] = object3D.userData.info.materials[name];
		}
		let position = [object3D.position.x, object3D.position.y, object3D.position.z];
		let rotation = [object3D.rotation.x, object3D.rotation.y, object3D.rotation.z];
		let scale = [object3D.scale.x, object3D.scale.y, object3D.scale.z];
		let customInfo = thatViewer.cloneCustomInfoJson(object3D.userData.info.customInfo);
		return {
			id: object3D.userData.info.id,
			name: object3D.userData.info.name,
			code: object3D.userData.info.code,
			parentId: object3D.userData.info.parentId,
			versionNum: object3D.userData.info.versionNum,
			position: position,
			rotation: rotation,
			scale: scale,
			castShadow: object3D.userData.info.castShadow,
			receiveShadow: object3D.userData.info.receiveShadow,
			parameters: parameters,
			materials: materials,
			customInfo: customInfo,
			isServer: object3D.userData.info.isServer,
			isInternal: object3D.userData.info.isInternal,
			isLocal: object3D.userData.info.isLocal,
			isTemp: object3D.userData.info.isTemp,
			userData: object3D.userData.info.userData,
			type: object3D.userData.info.type
		};
	}

	//复制用户自定义的json
	this.cloneCustomInfoJson = function(json){
		if(!json){
			return null;
		}
		else if(json instanceof Array){
			return thatViewer.cloneCustomInfoJArray(json);
		}
		else{
			let childType = typeof json;
			if(childType === "object"){
				let newJson = {};		
				for(let propertyName in json){
					let childObj = json[propertyName];
					newJson[propertyName] = thatViewer.cloneCustomInfoJson(childObj);
				}
				return newJson;
			}
			else{
				return json;
			}
		}
	}

	//批量复制用户自定义的json
	this.cloneCustomInfoJArray = function(jArray){
		let newArray = [];
		for(let i = 0; i < jArray.length; i++){
			let json = jArray[i];
			newArray.push(thatViewer.cloneCustomInfoJson(json));
		}
		return newArray;
	} 

    //取消选中所有
    this.cancelSelectObject3Ds = function(){
    	let object3Ds = thatViewer.selectedObject3Ds;
    	for(let i = 0; i < object3Ds.length; i++){
    		let object3D = object3Ds[i];
        	thatViewer.unHighlightObject3D(object3D);
			thatViewer.unHighlightHelper3D(object3D);
    	}
    	thatViewer.selectedObject3Ds = [];
    	thatViewer.onSelectChanged(thatViewer.selectedObject3Ds);
    }

    //批量多选
    this.selectObject3Ds = function(ids){
    	thatViewer.cancelSelectObject3Ds();
    	let selectedObject3Ds = []; 
    	for(let i = 0; i < ids.length; i++){
    		let id = ids[i];
    		let object3D = thatViewer.allObject3DMap[id];
    		selectedObject3Ds.push(object3D);
    	}
		thatViewer.selectedObject3Ds = selectedObject3Ds;
    	for(let i = 0; i < selectedObject3Ds.length; i++){
    		let object3D = selectedObject3Ds[i];
        	thatViewer.highlightObject3D(object3D);
			thatViewer.highlightHelper3D(object3D);
    	}
    	thatViewer.onSelectChanged(thatViewer.selectedObject3Ds);
    }

    //添加到选中列表
    this.addToSelectedObject3Ds = function(object3D){
    	let needAdd = true;
    	for(let i = 0; i < thatViewer.selectedObject3Ds.length; i++){
    		let obj3D = thatViewer.selectedObject3Ds[i];
    		if(obj3D === object3D){
    			needAdd = false;
    		}
    	}
    	if(needAdd){
    		thatViewer.selectedObject3Ds.push(object3D);
        	thatViewer.onSelectChanged(thatViewer.selectedObject3Ds);
    	}
    } 

    //从到选中列表移除
    this.removeFromSelectedObject3Ds = function(object3D){
    	let needRemove = false;
    	let object3Ds = [];
    	for(let i = 0; i < thatViewer.selectedObject3Ds.length; i++){
    		let obj3D = thatViewer.selectedObject3Ds[i];
    		if(obj3D !== object3D){
    			object3Ds.push(obj3D);
    		}
    		else{
    			needRemove = true;
    		}
    	}
    	if(needRemove){
        	thatViewer.selectedObject3Ds = object3Ds;
        	thatViewer.onSelectChanged(thatViewer.selectedObject3Ds);
    	}
    }

	//高亮显示某个object3D
	this.highlightObject3D = function(object3D){
		object3D.isSelected = true;
		if(object3D.children.length === 0){
			if(object3D.isObjectLine){
				thatViewer.highlightMesh(object3D);
			}
			else {
				thatViewer.highlightMesh(object3D);
				thatViewer.addMeshEdges(object3D);
			}
		}
		else {
			//包含子构件，但是父构件也有几何的情况
			if(object3D.geometry != null){
				thatViewer.highlightMesh(object3D);
			}

			//递归设置子构件
			for(let i = 0; i < object3D.children.length; i++){
				let childObject3D = object3D.children[i];
				thatViewer.highlightObject3D(childObject3D);
			}
		}
	}

	//更换object3D的材质
	this.switchObject3DMaterial = function(object3D, newMaterial, newEdgeMaterial){
		if(object3D.children.length === 0){
			if(!object3D.isObjectLine && !object3D.isResourceBoxLine){
				thatViewer.switchMeshMaterial(object3D, newMaterial);
				thatViewer.switchMeshEdgeMaterial(object3D, newEdgeMaterial);
			}
		}
		else {
			//包含子构件，但是父构件也有几何的情况
			if(object3D.geometry != null){
				thatViewer.switchMeshMaterial(object3D, newMaterial);
			}

			//递归设置子构件
			for(let i = 0; i < object3D.children.length; i++){
				let childObject3D = object3D.children[i];
				thatViewer.switchObject3DMaterial(childObject3D, newMaterial, newEdgeMaterial);
			}
		}
	}

	//高亮显示某个mesh
	this.highlightMesh = function(mesh) {
		if (mesh.originalMaterial == null) {
			mesh.originalMaterial = mesh.material;
		}
		if(mesh.isResourceBoxLine){
			mesh.material = thatViewer.highLightResourceBoxEdgeMaterial;
		}
		if(mesh.isObjectLine) {
			if (thatViewer.useHighlightMaterial) {
				mesh.material = thatViewer.highLightLineMaterial;
			}
		}
		else {
			if (thatViewer.useHighlightMaterial) {
				if (mesh.material !== null && mesh.material !== undefined) {
					if (mesh.material.length > 0) {
						let highLightMaterials = [];
						for (let i = 0; i < mesh.originalMaterial.length; i++) {
							highLightMaterials.push(thatViewer.highLightMaterial);
						}
						mesh.material = highLightMaterials;
					} else {
						mesh.material = thatViewer.highLightMaterial;
					}
				}
			}
		}
	}

	//统一更换材质
	this.switchMeshMaterial = function(mesh, newMaterial) {
		if(!mesh.isObjectLine) {
			if (mesh.material !== null && mesh.material !== undefined) {
				if (mesh.material.length > 0) {
					let newMaterials = [];
					for (let i = 0; i < mesh.material.length; i++) {
						newMaterials.push(newMaterial);
					}
					mesh.material = newMaterials;
				} else {
					mesh.material = newMaterial;
				}
			}
		}
	}
    
    //取消高亮显示
    this.unHighlightObject3D = function(object3D){
    	object3D.isSelected = false;
		if(object3D.children.length === 0){
			if(object3D.isObjectLine){
				thatViewer.unHighlightMesh(object3D);
			}
			else {
				thatViewer.unHighlightMesh(object3D);
				thatViewer.removeMeshEdges(object3D);
			}
    	}
    	else {
			//包含子构件，但是父构件也有几何的情况
			if(object3D.geometry != null){
				thatViewer.unHighlightMesh(object3D);
			}

    		for(let i = 0; i < object3D.children.length; i++){
    			let childObject3D = object3D.children[i];
        		thatViewer.unHighlightObject3D(childObject3D);
    		}
    	}
    }

    //取消高亮显示某个mesh
    this.unHighlightMesh = function(mesh) {
		mesh.material = mesh.originalMaterial;

		//下一级，例如线
		for (let i = 0; i < mesh.children.length; i++) {
			let meshChild = mesh.children[i];
			if (meshChild.isObjectLine) {
				meshChild.material = meshChild.originalMaterial;
			}
		}
	}

	//添加边框
	this.addMeshEdges = function(mesh){
		if(mesh.hasGeometry && !mesh.isResourceBoxLine){
			let edges= new THREE.EdgesGeometry(mesh.geometry, 25);
			let line = new THREE.LineSegments(edges, thatViewer.edgeMaterial);
			line.isEdgeLine = true;
			mesh.add(line);
		}
	}

	//添加边框
	this.switchMeshEdgeMaterial = function(mesh, newMaterial){
		if(mesh.hasGeometry && !mesh.isResourceBoxLine){
			let edges= new THREE.EdgesGeometry(mesh.geometry, 25);
			let line = new THREE.LineSegments(edges, newMaterial);
			line.isEdgeLine = true;
			mesh.add(line);
		}
	}

    //移除边框
    this.removeMeshEdges = function(mesh){   
		if(mesh.hasGeometry && !mesh.isResourceBoxLine){
			let edgeLines = [];
			for(let i = 0; i < mesh.children.length; i++){
				let line = mesh.children[i];
				if(line.isEdgeLine){
					edgeLines.push(line);
				} 
			}
			for(let i = 0; i < edgeLines.length; i++){
				let edgeLine = edgeLines[i];
				mesh.remove(edgeLine);
			} 
		}
    }
    
    //判定是否为弹出窗口
    this.checkIsPopContainer = function(targetElement){
    	let tempElement = $(targetElement);
    	while(tempElement.length !== 0 && !$(tempElement).hasClass("s3dViewerInnerContainer")){
    		if($(tempElement).hasClass("zlpPopBox") || $(tempElement).hasClass("zlpOpacityBox")){
    			return true;
    		}
    		else{
        		tempElement = $(tempElement[0]).parent();
    		}    		
    	}
    	return !$(tempElement).hasClass("s3dViewerInnerContainer");
    }

    //鼠标按下
    this.onMouseDown = function(ev) { 
    	let targetElement = ev.target;
		let mousePosition = {
			x: ev.clientX - thatViewer.containerPos.x,
			y: ev.clientY - thatViewer.containerPos.y
		};
		thatViewer.mouseDownPosition = mousePosition;

		switch(thatViewer.status){
			case s3dUiStatus.draw: {
				ev.preventDefault();
				let intersects = thatViewer.getSceneIntersects(mousePosition);
				if(ev.button === 0){
					let layerObject3D = thatViewer.getUserLayerObject3DByRaycaster(intersects);
					if(layerObject3D != null) {
						thatViewer.mouseDownUserLayerObject(layerObject3D, ev, mousePosition, intersects);
					}
				}
				break;
			}
			default:{
				break;
			}
		}
    };

	//找到它属于哪个s3d object3D
	this.getS3dObject3D = function(checkObj){
		if(!checkObj.isEdgeLine){
			while(checkObj.type !== "Scene"){
				if(checkObj.visible && checkObj.userData.info != null && checkObj.userData.info.type !== s3dElement3DType.group){
					return checkObj;
				}
				else{
					checkObj = checkObj.parent;
				}
			}
		}
		return null;
	}

	//使用射线获取s3d object
	this.getS3dObject3DByRaycaster = function(intersects) {
		if (intersects.length > 0) {
			let index = 0;
			while(index < intersects.length){
				let object3D = thatViewer.getS3dObject3D(intersects[index].object);
				if(object3D != null){
					return object3D;
				}
				else{
					index++;
				}
			}
		}
		return null;
	};

	//找到是否点击了图层
	this.getUserLayerObject3D = function(checkObj){
		if(!checkObj.isEdgeLine){
			while(checkObj.type !== "Scene"){
				if(checkObj.isUserLayer && checkObj.visible){
					return checkObj;
				}
				else{
					checkObj = checkObj.parent;
				}
			}
		}
		return null;
	}

	//使用射线获取用户图层
	this.getUserLayerObject3DByRaycaster = function(intersects) {
		if (intersects.length > 0) {
			let index = 0;
			while(index < intersects.length){
				let object3D = thatViewer.getUserLayerObject3D(intersects[index].object);
				if(object3D != null){
					return object3D;
				}
				else{
					index++;
				}
			}
		}
		return null;
	};

	//使用射线获取groundPlane的坐标
    this.getPositionInGroundPlaneByRaycaster = function(intersects) {  
        if (intersects.length > 0) {
        	let index = 0;
        	while(index < intersects.length){ 
				let intersect = intersects[index];
				if(intersect.object.isGroundPlane){
					return intersect.point;
				} 
        		else{
        			index++;
        		}
        	} 
        }
        return null;
    }; 
	
	//射线穿过构件，获取其穿过的3D点坐标
    this.getIntersect3DPointByRaycaster = function(intersects, excludedObject3D){ 
    	let intersect = null;
        if (intersects.length > 0) {
        	let index = 0;
        	while(index < intersects.length){
            	let intersect = intersects[index];
				if(excludedObject3D === intersect.object){
        			index++;
				}
				else if(intersect.object.isEdgeLine){
        			index++;
				}
            	else if(intersect.object.isGroundPlane){
					return {
    		    		x: intersect.point.x,
    		    		y: 0,
    		    		z: intersect.point.z
    		    	};
        		}
            	else if(thatViewer.checkIsObject3D(intersect.object)){
					return {
    		    		x: intersect.point.x,
    		    		y: intersect.point.y,
    		    		z: intersect.point.z
    		    	};
        		}  
        		else{
        			index++;
        		}
        	}  
        }       
    	return null; 
    }
    
	//判定是否为构件对象
    this.checkIsObject3D = function(object){
    	let tempObject = object;
    	while(tempObject.type !== "Scene"){
    		if(tempObject.userData.info != null){
    			return true;
    		}
    		else{
    			tempObject = tempObject.parent;
    		}
    	}
    	return false;
    }  

	//更改状态
	this.changeStatus = function(p){
		if(thatViewer.endStatus(thatViewer.status)){
			return thatViewer.beginStatus(p.status, p.statusData);
		}
		else{
			thatViewer.manager.statusBar.refreshStatusText({
				status: thatViewer.status,
				message: "无法结束当前状态"
			});
			return false;
		}
	}

	//结束状态
	this.endStatus = function(status){
		switch(status){
			case s3dUiStatus.normalView: {
				return true;
			}
			case s3dUiStatus.draw: {
				return true;
			}
			case s3dUiStatus.specialView: {
				return true;
			}
			case s3dUiStatus.disable: {
				return true;
			}
			case s3dUiStatus.edit: {
				return true;
			}
			case s3dUiStatus.add: {
				thatViewer.manager.adder.cancelWaitAddComponent();
				return true;
			}
			case s3dUiStatus.pop: {
				//目前仅这一种情况，后续增加弹出窗口类型后，这里要修改
				thatViewer.manager.materialPicker.cancelPick();
				return true;
			}
			case s3dUiStatus.selectPoints:{
				thatViewer.manager.pointSelector.cancelPlacePoints();
				return true;
			}
			case s3dUiStatus.locateMaterial:{
				thatViewer.manager.materialLocator.cancelLocate();
				return true;
			}
			default:{
				return false;
			}
		}
	}

	//开始状态
	this.beginStatus = function(status, statusData){
		thatViewer.status = status;
		thatViewer.statusData = statusData;
		switch(status){
			case s3dUiStatus.normalView: {
				thatViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "转为常规状态"
				});
				break;
			}
			case s3dUiStatus.draw: {
				thatViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "转为绘制状态"
				});
				break;
			}
			case s3dUiStatus.specialView: {
				thatViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "转为特殊状态"
				});
				break;
			}
			case s3dUiStatus.disable: {
				thatViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "转为禁用状态"
				});
				break;
			}
			case s3dUiStatus.edit: {
				thatViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "正在编辑"
				});
				break;
			}
			case s3dUiStatus.add: {
				thatViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "准备新增 " + statusData.componentName + " (" + statusData.componentCode + ")"
				});
				$("#" + thatViewer.containerId).find(".s3dViewerContainer").focus();
				break;
			}
			case s3dUiStatus.selectPoints: {
				thatViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "正在使用选点功能"
				});
				$("#" + thatViewer.containerId).find(".s3dViewerContainer").focus();
				break;
			}
			case s3dUiStatus.locateMaterial: {
				thatViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "正在使用定位材质功能"
				});
				$("#" + thatViewer.containerId).find(".s3dViewerContainer").focus();
				thatViewer.manager.materialLocator.beginLocate();
				break;
			}
			case s3dUiStatus.pop: {
				thatViewer.manager.statusBar.refreshStatusText({
					status: status,
					message: "正在弹出窗口"
				}); 
				break;
			}
		}
		return true;
	}
    
    //按下按键
    this.onKeyDown = function(ev) {
		switch(thatViewer.status){
			case s3dUiStatus.normalView:{
				thatViewer.onKeyDownInStatusNormal(ev);
				break;
			}
			case s3dUiStatus.draw:{
				thatViewer.onKeyDownInStatusDraw(ev);
				break;
			}
			case s3dUiStatus.specialView:{
				break;
			}
			case s3dUiStatus.disable:{
				break;
			}
			case s3dUiStatus.edit:{
				break;
			}
			case s3dUiStatus.pop:{
				break;
			}
			case s3dUiStatus.add:{
				thatViewer.onKeyDownInStatusAdd(ev);
				break;
			}
			case s3dUiStatus.selectPoints:{
				thatViewer.onKeyDownInStatusSelectPoints(ev);
				break;
			}
			case s3dUiStatus.locateMaterial:{
				thatViewer.onKeyDownInStatusLocateMaterial(ev);
				break;
			}
		}
	}

	//当添加状态时，按下键盘按键
	this.onKeyDownInStatusAdd = function(ev){
		switch(ev.keyCode){			
			case 27:{ // esc 
				thatViewer.changeStatus({
					status: s3dUiStatus.normalView
				}); 
				break;
			} 
		}
	}

	//当复制状态时，按下键盘按键
	this.onKeyDownInStatusCopy = function(ev){
		switch(ev.keyCode){			
			case 27:{ // esc 
				thatViewer.changeStatus({
					status: s3dUiStatus.normalView
				}); 
				break;
			} 
		}
	}

	//当选点状态时，按下键盘按键
	this.onKeyDownInStatusSelectPoints = function(ev){
		switch(ev.keyCode){
			case 27:{ // esc 
				thatViewer.manager.pointSelector.cancelPlacePoints();
				thatViewer.changeStatus({
					status: s3dUiStatus.normalView
				});
				break;
			}
			case 13:{ //enter
				thatViewer.manager.pointSelector.endPlacePoints();
				thatViewer.changeStatus({
					status: s3dUiStatus.normalView
				});
				break;
			}
		}
	}

	//当定位材质状态时，按下键盘按键
	this.onKeyDownInStatusLocateMaterial = function(ev){
		switch(ev.keyCode){
			case 27:{ // esc
				thatViewer.manager.materialLocator.cancelLocate();
				thatViewer.changeStatus({
					status: s3dUiStatus.normalView
				});
				break;
			}
		}
	}

	//当普通状态时，按下键盘按键
	this.onKeyDownInStatusNormal = function(ev){
		switch(ev.keyCode){
			case 27:{ // esc 取消选择
				thatViewer.cancelSelectObject3Ds();
				break;
			}
			case 46:{ //delete 删除
				if(thatViewer.selectedObject3Ds.length > 0){
					let nodeIds = [];
					for(let i = 0; i < thatViewer.selectedObject3Ds.length; i++){
						let selectedObject3D = thatViewer.selectedObject3Ds[i];
						nodeIds.push(selectedObject3D.userData.info.id);
					}

					thatViewer.removeObjects(nodeIds, true);
				}
				break;
			}
			case 70:{ //f 居中
				let object3D = thatViewer.selectedObject3Ds.length === 0 ? null : thatViewer.selectedObject3Ds[0];
				thatViewer.setCenterObject(object3D);
				break;
			}
			case 67:{ //c 复制
				if(ev.ctrlKey && thatViewer.selectedObject3Ds.length !== 0){
					thatViewer.manager.copier.copy({object3Ds: thatViewer.selectedObject3Ds});
				}
				break;
			}
			case 86:{ //v 复制
				if(ev.ctrlKey){
					thatViewer.manager.copier.paste({});
				}
				break;
			}
			case 87:{ //w 切换transform translate模式
				thatViewer.manager.moveHelper.setMode(s3dTransformMode.position);
				break;
			}
			case 69:{ //e 切换transform rotate模式
				thatViewer.manager.moveHelper.setMode(s3dTransformMode.rotation);
				break;
			}
			case 82:{ //r 切换transform scale模式
				thatViewer.manager.moveHelper.setMode(s3dTransformMode.scale);
				break;
			}
			case 80:{ //p 切换定位材质状态
				thatViewer.changeStatus({
					status: s3dUiStatus.locateMaterial
				});
				break;
			}
		}
	}

	//在图层上keydown时
	this.onKeyDownInStatusDraw = function(ev){
		thatViewer.doEventFunction("onKeyDownUserLayerObject", {
			event: ev
		});
	}

	//根据构件对象id，设置其为3D展示的中心点
    this.setCenterObjectById = function(id){
		let object3D = thatViewer.getObject3DById(id);
		if(object3D != null){
			thatViewer.setCenterObject(object3D);
		}
	}
	
	//将某个构件对象设置为3D展示的中心点
    this.setCenterObject = function(object3D){
		let oldTarget = thatViewer.orbitControl.target0;
		let target;
		let position;
		if(object3D != null && object3D.userData.info != null){
			let info = object3D.userData.info;
			switch(info.type){
				case s3dElement3DType.group:{
					let parent3D = object3D.parent;
					parent3D.updateWorldMatrix(true, false);
					let targetPoint = object3D.position.clone().applyMatrix4(parent3D.matrixWorld);
					target = [targetPoint.x, targetPoint.y, targetPoint.z];
					position = [target[0],
						thatViewer.orbitControl.object.position.y + target[1] - oldTarget.y,
						target[2]];
					break;
				}
				default:{
					let box = new THREE.Box3().setFromObject(object3D, true);
					target = [(box.min.x + box.max.x) / 2, (box.min.y + box.max.y) / 2, (box.min.z + box.max.z) / 2];
					position = [thatViewer.orbitControl.object.position.x,
						thatViewer.orbitControl.object.position.y + target[1] - oldTarget.y,
						thatViewer.orbitControl.object.position.z];
					break;
				}
			}

    	}
		else{
			let axisInfo = thatViewer.manager.s3dObject.axis;
			target = [0, axisInfo.size.y / 2, 0];
			position = [target[0],
				thatViewer.orbitControl.object.position.y + target[1] - oldTarget.y,
				target[2]];
		}
		/*
		let cameraPosition = [thatViewer.orbitControl.object.position.x + target[0] - oldTarget.x,
			thatViewer.orbitControl.object.position.y + target[1] - oldTarget.y,
			thatViewer.orbitControl.object.position.z + target[2] - oldTarget.z];
		 */
		//俯视
		thatViewer.setViewport(target, position, thatViewer.camera.zoom);
    }

	this.getSceneIntersects = function (mousePosition){
		let mouse = new THREE.Vector2(); //二维向量
		let s3dViewerInnerContainer = $("#" + thatViewer.containerId).find(".s3dViewerInnerContainer")[0];
		mouse.x = (mousePosition.x / $(s3dViewerInnerContainer).width()) * 2 - 1;
		mouse.y = -(mousePosition.y / $(s3dViewerInnerContainer).height()) * 2 + 1;
		thatViewer.raycaster.setFromCamera(mouse, thatViewer.camera);

		//先判断是否点击了CSS2DRender中的元素
		let intersect2dObjects = thatViewer.getIntersectObject2Ds(mousePosition);
		if(intersect2dObjects.length === 0) {
			return thatViewer.raycaster.intersectObjects(thatViewer.scene.children, true); //将遍历数组内的所有模型的子类，也就是深度遍历
		}
		else{
			return intersect2dObjects;
		}
	}

	this.getAllCSS2DObjects = function (){
		let css2dObjects = [];
		for(let objectId in thatViewer.allObject3DMap){
			let object3D = thatViewer.allObject3DMap[objectId];
			if(object3D.getCSS2DObject){
				let css2dObject = object3D.getCSS2DObject();
				if(css2dObject != null){
					css2dObjects.push(css2dObject);
				}
			}
		}
		return css2dObjects;
	}

	this.getIntersectObject2Ds = function (mousePosition){
		let css2dObjects = thatViewer.getAllCSS2DObjects();
		return thatViewer.intersectObject2Ds(css2dObjects, mousePosition);
	}

	this.intersectObject2Ds = function (css2dObjects, mousePosition){
		let intersectObject2ds = [];
		for(let i = 0; i < css2dObjects.length; i++) {
			let css2dObject = css2dObjects[i];
			if(thatViewer.intersectObject2D(css2dObject.element, mousePosition)){
				intersectObject2ds.push({
					object: css2dObject
				});
			}
		}
		return intersectObject2ds;
	}

	this.intersectObject2D = function (dom2d, mousePosition) {
		if($(dom2d).attr("canIntersect") === "true") {
			let offset = $(dom2d).offset();
			let clientTop = offset.top;
			let clientLeft = offset.left;
			let width = $(dom2d).width();
			let height = $(dom2d).height();
			if (clientLeft - thatViewer.containerPos.x < mousePosition.x
				&& clientLeft - thatViewer.containerPos.x + width > mousePosition.x
				&& clientTop - thatViewer.containerPos.y < mousePosition.y
				&& clientTop - thatViewer.containerPos.y + height > mousePosition.y) {
				return true;
			}
		}
		let childNodes = $(dom2d).children();
		for(let i = 0; i < childNodes.length; i++){
			let childNode = childNodes[i];
			if(thatViewer.intersectObject2D(childNode, mousePosition)){
				return true;
			}
		}
		return false;
	}

	//鼠标移动
	this.onMouseMove = function(ev){
		let mousePosition = {
			x: ev.clientX - thatViewer.containerPos.x,
			y: ev.clientY - thatViewer.containerPos.y
		};

		switch(thatViewer.status){
			case s3dUiStatus.selectPoints:{				  
				ev.preventDefault();
				let intersects = thatViewer.getSceneIntersects(mousePosition);
				thatViewer.manager.pointSelector.movePlacePoint({intersects: intersects, shiftKey: ev.shiftKey});
 				break;
			}
			case s3dUiStatus.draw: {
				ev.preventDefault();
				let intersects = thatViewer.getSceneIntersects(mousePosition);
				let layerObject3D = thatViewer.getUserLayerObject3DByRaycaster(intersects);
				thatViewer.mouseMoveUserLayerObject(layerObject3D, ev, {
					from: thatViewer.mouseLastMovePosition,
					to: mousePosition
				}, intersects);
				break;
			}
			default:{
				break;
			}
		}
		thatViewer.mouseLastMovePosition = mousePosition;
	}
    
    //鼠标抬起
    this.onMouseUp = function(ev) {
		//判断是否为双击
		let lastMouseUpLog = thatViewer.eventLogMap["mouseUp"];
		let mouseUpLog = {
			eventType: "mouseUp",
			time: new Date(),
			position: {
				x: ev.clientX - thatViewer.containerPos.x,
				y: ev.clientY - thatViewer.containerPos.y
			}
		};
		thatViewer.eventLogMap["mouseUp"] = mouseUpLog;
		let isDoubleClick = lastMouseUpLog != null
			&& (mouseUpLog.time - lastMouseUpLog.time < 400)
			&& (Math.abs(mouseUpLog.position.x - lastMouseUpLog.position.x) < 2 && Math.abs(mouseUpLog.position.y - lastMouseUpLog.position.y) < 2 );
		if (isDoubleClick) {
			//处理双击
			thatViewer.onMouseDblClick(ev);
		} else {
			//处理单击
			thatViewer.onMouseClick(ev);
		}
	}

	//双击时
	this.onMouseDblClick = function (ev){
		let mouseUpPosition = {
			x: ev.clientX - thatViewer.containerPos.x,
			y: ev.clientY - thatViewer.containerPos.y
		};
		if(ev.button === 0 || ev.button === 2) {
			if (thatViewer.mouseDownPosition != null) {
				if (Math.abs(mouseUpPosition.x - thatViewer.mouseDownPosition.x) < 2 && Math.abs(mouseUpPosition.y - thatViewer.mouseDownPosition.y) < 2) {
					ev.preventDefault();

					let intersects = thatViewer.getSceneIntersects(mouseUpPosition);
					switch (thatViewer.status) {
						case s3dUiStatus.normalView: {
							let object3D = thatViewer.getS3dObject3DByRaycaster(intersects);
							thatViewer.dblClickS3dObject(object3D, ev);
							break;
						}
						case s3dUiStatus.draw: {
							let layerObject3D = thatViewer.getUserLayerObject3DByRaycaster(intersects);
							thatViewer.mouseUpUserLayerObject(layerObject3D, ev, mouseUpPosition, intersects);
							thatViewer.dblClickUserLayerObject(layerObject3D, ev, mouseUpPosition, intersects);
							break;
						}
						default: {
							break;
						}
					}

					thatViewer.doEventFunction("onMouseDblClick", {
						x: mouseUpPosition.x,
						y: mouseUpPosition.y,
						intersects: intersects
					});
				}
			}
		}
	}

	//单击后
	this.onMouseClick = function (ev){
        if (thatViewer.mouseDownPosition != null) {
        	let mouseUpPosition = {
        		x: ev.clientX - thatViewer.containerPos.x,
        		y: ev.clientY - thatViewer.containerPos.y
        	};
        	if(ev.button === 0 || ev.button === 2){
	        	if(Math.abs(mouseUpPosition.x - thatViewer.mouseDownPosition.x) < 2 && Math.abs(mouseUpPosition.y - thatViewer.mouseDownPosition.y) < 2 ){
	                ev.preventDefault();
	                let intersects = thatViewer.getSceneIntersects(mouseUpPosition);
					switch(thatViewer.status){
						case s3dUiStatus.normalView: {
							let object3D = thatViewer.getS3dObject3DByRaycaster(intersects, ev);
							thatViewer.clickS3dObject(object3D, ev);
							break;
						}
						case s3dUiStatus.draw: {
							let layerObject3D = thatViewer.getUserLayerObject3DByRaycaster(intersects);
							thatViewer.clickUserLayerObject(layerObject3D, ev, mouseUpPosition, intersects);
							break;
						}
						case s3dUiStatus.add:{
							let position = thatViewer.getPositionInGroundPlaneByRaycaster(intersects);
							if(position != null){
								let parameters = {};
								for(let paramName in thatViewer.statusData.componentJson.parameters){
									let param = thatViewer.statusData.componentJson.parameters[paramName];
									parameters[paramName] = {
										value: param.defaultValue,
										isGeo: param.isGeo
									};
								}

								let groupId = thatViewer.manager.treeEditor.getCurrentGroupId();

								//先取消选中当前的对象，再添加
								thatViewer.cancelSelectObject3Ds();
								if(thatViewer.statusData.isInternal){
									thatViewer.addNewInternalObject({
										position: [position.x, position.y, position.z],
										rotation: [0, 0, 0],
										scale: [1, 1, 1],
										castShadow: false,
										receiveShadow: false,
										name: thatViewer.statusData.componentName,
										code: thatViewer.statusData.componentCode,
										versionNum: thatViewer.statusData.versionNum,
										isOnGround: true,
										needSelectAfterAdd: true,
										groupId: groupId,
										parameters: parameters,
										isLocal: false,
										isServer: false,
										isInternal: true,
										type: thatViewer.statusData.type
									});
								}
								else if(thatViewer.statusData.isServer){
									thatViewer.addNewServerObject({
										position: [position.x, position.y, position.z],
										rotation: [0, 0, 0],
										scale: [1, 1, 1],
										castShadow: true,
										receiveShadow: true,
										name: thatViewer.statusData.componentName,
										code: thatViewer.statusData.componentCode,
										versionNum: thatViewer.statusData.versionNum,
										isOnGround: true,
										needSelectAfterAdd: true,
										groupId: groupId,
										parameters: parameters,
										isLocal: false,
										isServer: true,
										isInternal: false,
										type: thatViewer.statusData.type
									});
								}
								else {
									thatViewer.addNewLocalObject({
										position: [position.x, position.y, position.z],
										rotation: [0, 0, 0],
										scale: [1, 1, 1],
										castShadow: true,
										receiveShadow: true,
										name: thatViewer.statusData.componentName,
										code: thatViewer.statusData.componentCode,
										versionNum: thatViewer.statusData.versionNum,
										isOnGround: true,
										needSelectAfterAdd: true,
										groupId: groupId,
										parameters: parameters,
										isLocal: true,
										isServer: false,
										isInternal: false,
										type: thatViewer.statusData.type
									});
								}
							}
							break;
						}
						case s3dUiStatus.selectPoints:{
							thatViewer.manager.pointSelector.drawLimit3DPoints({intersects: intersects});
							break;
						}
						case s3dUiStatus.locateMaterial:{
							let object3D = thatViewer.getS3dObject3DByRaycaster(intersects, ev);
							thatViewer.clickS3dObject(object3D, ev);
							if(object3D != null) {
								thatViewer.manager.materialLocator.locate({
									object3D: object3D,
									intersects: intersects
								});
							}
							break;
						}
						case s3dUiStatus.pop:{
							//不做处理
							break;
						}
		                default:{
		                	throw "暂未支持 status = " + thatViewer.status;
		                }
	                }

	                thatViewer.doEventFunction("onMouseClick", {
        				x: ev.clientX - thatViewer.containerPos.x,
        				y: ev.clientY - thatViewer.containerPos.y,
	    	       		intersects: intersects
	    	       	});
	        	}
	        	else{
	        		//移动后，松开鼠标左键，为后续做拖拽操作扩展用
	        	}
        	}
        }
    }

	//使用参数化方式调用服务器端，添加新构件
	this.addNewServerObject = function(p){
		let countInfo = {
			all: 1,
			serverAll: 1,
			serverSucceed: 0,
			localAll: 0,
			localSucceed: 0,
			internalAll: 0,
			internalSucceed: 0
		};
		let newIdAndName = thatViewer.getNewObjectIdAndName(p.name, p.name, p.parentId);
		if(p.id == null){
			p.id = newIdAndName.id;
		}
		p.name = newIdAndName.name;
		thatViewer.manager.serverObjectCreator.createObject3Ds([{
			id: p.id,
			code: p.code,
			versionNum: p.versionNum,
			name: p.name,
			position: p.position,
			rotation: p.rotation,
			scale: p.scale,
			isOnGround: p.isOnGround,
			parentId: p.parentId,
			parameters: p.parameters,
			needSelectAfterAdd: p.needSelectAfterAdd,
			userData: p.userData,
			type: p.type,
			isTemp: p.isTemp
		}], thatViewer.afterAddNewObject, countInfo);
	}

	//使用参数化方式调用本地服务，添加新构件
	this.addNewLocalObject = function(p){
		let countInfo = {
			all: 1,
			serverAll: 1,
			serverSucceed: 0,
			localAll: 0,
			localSucceed: 0,
			internalAll: 0,
			internalSucceed: 0
		};
		let newIdAndName = thatViewer.getNewObjectIdAndName(p.name, p.name, p.parentId);
		if(p.id == null){
			p.id = newIdAndName.id;
		}
		p.name = newIdAndName.name;
		thatViewer.manager.localObjectCreator.createObject3Ds([{
			id: p.id,
			code: p.code,
			versionNum: p.versionNum,
			name: p.name,
			position: p.position,
			rotation: p.rotation,
			scale: p.scale,
			isOnGround: p.isOnGround,
			parentId: p.parentId,
			parameters: p.parameters,
			materials: p.materials,
			needSelectAfterAdd: p.needSelectAfterAdd,
			userData: p.userData,
			type: p.type,
			isTemp: p.isTemp
		}], thatViewer.afterAddNewObject, countInfo);
	}

	//使用参数化方式调用内部服务，添加新构件
	this.addNewInternalObject = function(p){
		let countInfo = {
			all: 1,
			serverAll: 0,
			serverSucceed: 0,
			localAll: 0,
			localSucceed: 0,
			internalAll: 1,
			internalSucceed: 0
		};
		let newIdAndName = thatViewer.getNewObjectIdAndName(p.name, p.name, p.parentId);
		if(p.id == null){
			p.id = newIdAndName.id;
		}
		p.name = newIdAndName.name;
		thatViewer.manager.internalObjectCreator.createObject3Ds([{
			id: p.id,
			code: p.code,
			versionNum: p.versionNum,
			name: p.name,
			position: p.position,
			rotation: p.rotation,
			scale: p.scale,
			isOnGround: p.isOnGround,
			parentId: p.parentId,
			parameters: p.parameters,
			needSelectAfterAdd: p.needSelectAfterAdd,
			userData: p.userData,
			type: p.type
		}], thatViewer.afterAddNewObject, countInfo);
	}

	//使用参数化方式调用服务器端，批量添加新构件
	this.addNewServerObjects = function(nodeJsons, afterAddNewObject){
		let newNodeJsons = [];
		let excludedNames = [];
		for(let i = 0; i < nodeJsons.length; i++){
			let nodeJson = nodeJsons[i];
			let componentInfo = thatViewer.manager.serverObjectCreator.getComponentInfo(nodeJson.code, nodeJson.versionNum);
			let newIdAndName = thatViewer.getNewObjectIdAndName(componentInfo.name + "_1", componentInfo.name, nodeJson.parentId, excludedNames);

			if(nodeJson.id == null){
				nodeJson.id = newIdAndName.id;
			}
			if(nodeJson.name == null){
				nodeJson.name = newIdAndName.name;
				excludedNames.push(newIdAndName.name);
			}

			newNodeJsons.push({
				id: nodeJson.id,
				code: nodeJson.code,
				versionNum: nodeJson.versionNum,
				name: nodeJson.name,
				position: nodeJson.position,
				rotation: nodeJson.rotation,
				scale: nodeJson.scale,
				parameters: nodeJson.parameters,
				parentId: nodeJson.parentId,
				useWorldPosition: nodeJson.useWorldPosition,
				isOnGround: nodeJson.isOnGround,
				needSelectAfterAdd: nodeJson.needSelectAfterAdd,
				userData: nodeJson.userData,
				type: nodeJson.type,
				isTemp: nodeJson.isTemp
			});
		}
		let countInfo = {
			all: newNodeJsons.length,
			serverAll: newNodeJsons.length,
			serverSucceed: 0,
			localAll: 0,
			localSucceed: 0,
			internalAll: 0,
			internalSucceed: 0
		};
		thatViewer.manager.serverObjectCreator.createObject3Ds(newNodeJsons, afterAddNewObject == null ? thatViewer.afterAddNewObject : afterAddNewObject, countInfo);
	}

	//使用参数化方式调用本地服务，批量添加新构件
	this.addNewLocalObjects = function(nodeJsons, afterAddNewObject){
		let newNodeJsons = [];
		let excludedNames = [];
		for(let i = 0; i < nodeJsons.length; i++){
			let nodeJson = nodeJsons[i];
			let componentInfo = thatViewer.manager.localObjectCreator.getComponentInfo(nodeJson.code, nodeJson.versionNum);
			let newIdAndName = thatViewer.getNewObjectIdAndName(componentInfo.name + "_1", componentInfo.name, nodeJson.parentId, excludedNames);
			if(nodeJson.id == null){
				nodeJson.id = newIdAndName.id;
			}
			if(nodeJson.name == null){
				nodeJson.name = newIdAndName.name;
				excludedNames.push(newIdAndName.name);
			}

			newNodeJsons.push({
				id: nodeJson.id,
				code: nodeJson.code,
				versionNum: nodeJson.versionNum,
				name: nodeJson.name,
				position: nodeJson.position,
				rotation: nodeJson.rotation,
				scale: nodeJson.scale,
				parameters: nodeJson.parameters,
				materials: nodeJson.materials,
				parentId: nodeJson.parentId,
				useWorldPosition: nodeJson.useWorldPosition,
				isOnGround: nodeJson.isOnGround,
				needSelectAfterAdd: nodeJson.needSelectAfterAdd,
				userData: nodeJson.userData,
				type: nodeJson.type,
				isTemp: nodeJson.isTemp
			});
		}
		let countInfo = {
			all: newNodeJsons.length,
			serverAll: 0,
			serverSucceed: 0,
			localAll: newNodeJsons.length,
			localSucceed: 0,
			internalAll: 0,
			internalSucceed: 0
		};
		thatViewer.manager.localObjectCreator.createObject3Ds(newNodeJsons, afterAddNewObject == null ? thatViewer.afterAddNewObject : afterAddNewObject, countInfo);
	}


	//使用参数化方式调用本地服务，批量添加新构件
	this.addNewInternalObjects = function(nodeJsons, afterAddNewObject){
		let newNodeJsons = [];
		let excludedNames = [];
		for(let i = 0; i < nodeJsons.length; i++){
			let nodeJson = nodeJsons[i];
			let componentInfo = thatViewer.manager.internalObjectCreator.getComponentInfo(nodeJson.code, nodeJson.versionNum);
			let newIdAndName = thatViewer.getNewObjectIdAndName(componentInfo.name + "_1", componentInfo.name, nodeJson.parentId, excludedNames);
			if(nodeJson.id == null){
				nodeJson.id = newIdAndName.id;
			}
			if(nodeJson.name == null){
				nodeJson.name = newIdAndName.name;
				excludedNames.push(newIdAndName.name);
			}

			newNodeJsons.push({
				id: nodeJson.id,
				code: nodeJson.code,
				versionNum: nodeJson.versionNum,
				name: nodeJson.name,
				position: nodeJson.position,
				rotation: nodeJson.rotation,
				scale: nodeJson.scale,
				parameters: nodeJson.parameters,
				parentId: nodeJson.parentId,
				isOnGround: nodeJson.isOnGround,
				needSelectAfterAdd: nodeJson.needSelectAfterAdd,
				userData: nodeJson.userData,
				type: nodeJson.type,
				isTemp: nodeJson.isTemp
			});
		}
		let countInfo = {
			all: newNodeJsons.length,
			serverAll: 0,
			serverSucceed: 0,
			localAll: 0,
			localSucceed: 0,
			internalAll: newNodeJsons.length,
			internalSucceed: 0
		};
		thatViewer.manager.internalObjectCreator.createObject3Ds(newNodeJsons, afterAddNewObject == null ? thatViewer.afterAddNewObject : afterAddNewObject, countInfo);
	}

	/*
	//静默添加构件
	this.addNewObjectsInSilence = function(nodeJsons){
		let groupJsons = [];
		let objectJsons = [];
		let internalJsons = [];
		for(let i = 0; i < nodeJsons.length; i++){
			let nodeJson = nodeJsons[i];
			switch (nodeJson.type){
				case s3dElement3DType.group:{
					groupJsons.push(nodeJson);
					break;
				}
				case s3dElement3DType.camera:{
					internalJsons.push(nodeJson);
					break;
				}
				default:{
					objectJsons.push(nodeJson);
					break;
				}
			}
		}
		if(groupJsons.length > 0) {
			thatViewer.addNewGroupsInSilence(groupJsons);
		}
		if(objectJsons.length > 0) {
			thatViewer.addNewObjectsInSilence(objectJsons);
		}
		if(internalJsons.length > 0) {
			thatViewer.addNewObjectsInSilence(internalJsons);
		}
	}
	*/

	//静默添加构件
	this.addNewObjectsInSilence = function(nodeJsons){
		//先处理分组
		for(let i = 0; i < nodeJsons.length; i++) {
			let nodeJson = nodeJsons[i];
			if(nodeJson.type === s3dElement3DType.group){
				let defaultName = nodeJson.name != null && nodeJson.name.length > 0 ? nodeJson.name : "分组";
				let newIdAndName = thatViewer.getNewObjectIdAndName(defaultName + "_1", defaultName, nodeJson.parentId);
				let groupJson = {
					id: nodeJson.id,
					name: newIdAndName.name,
					position: nodeJson.position,
					rotation: nodeJson.rotation,
					scale: nodeJson.scale,
					parentId: nodeJson.parentId,
					needSelectAfterAdd: nodeJson.needSelectAfterAdd,
					type: nodeJson.type
				};
				thatViewer.addNewGroupInSilence(groupJson);
			}
		}

		//再处理物体
		let serverObjectJsons = [];
		let localObjectJsons = [];
		let internalObjectJsons = [];
		for(let i = 0; i < nodeJsons.length; i++){
			let nodeJson = nodeJsons[i];
			if(nodeJson.isInternal){
				let componentInfo = thatViewer.manager.internalObjectCreator.getComponentInfo(nodeJson.code, nodeJson.versionNum);
				let defaultName = nodeJson.name != null && nodeJson.name.length > 0 ? nodeJson.name : componentInfo.name;
				let newIdAndName = thatViewer.getNewObjectIdAndName(defaultName + "_1", defaultName, nodeJson.parentId);
				let parameters = {};
				for(let paramName in componentInfo.parameters){
					let param = componentInfo.parameters[paramName];
					if(param != null){
						parameters[paramName] = {
							value: nodeJson.parameters[paramName] === undefined ? null : nodeJson.parameters[paramName].value,
							isGeo: param.isGeo
						};
					}
				}
				internalObjectJsons.push({
					id: nodeJson.id,
					code: nodeJson.code,
					versionNum: nodeJson.versionNum,
					name: newIdAndName.name,
					position: nodeJson.position,
					rotation: nodeJson.rotation,
					scale: nodeJson.scale,
					castShadow: false,
					receiveShadow: false,
					parameters: nodeJson.parameters,
					parentId: nodeJson.parentId,
					useWorldPosition: nodeJson.useWorldPosition,
					isOnGround: nodeJson.isOnGround,
					needSelectAfterAdd: nodeJson.needSelectAfterAdd,
					isInternal: true,
					isTemp: nodeJson.isTemp,
					type: nodeJson.type,
					userData: nodeJson.userData
				});
			}
			else if(nodeJson.isServer){
				let componentInfo = thatViewer.manager.serverObjectCreator.getComponentInfo(nodeJson.code, nodeJson.versionNum);
				let defaultName = nodeJson.name != null && nodeJson.name.length > 0 ? nodeJson.name : componentInfo.name;
				let newIdAndName = thatViewer.getNewObjectIdAndName(defaultName + "_1", defaultName, nodeJson.parentId);
				let parameters = {};
				for(let paramName in componentInfo.parameters){
					let param = componentInfo.parameters[paramName];
					if(param != null){
						parameters[paramName] = {
							value: nodeJson.parameters[paramName] === undefined ? null : nodeJson.parameters[paramName].value,
							isGeo: param.isGeo
						};
					}
				}
				serverObjectJsons.push({
					id: nodeJson.id,
					code: nodeJson.code,
					versionNum: nodeJson.versionNum,
					name: newIdAndName.name,
					position: nodeJson.position,
					rotation: nodeJson.rotation,
					scale: nodeJson.scale,
					castShadow: true,
					receiveShadow: true,
					parameters: nodeJson.parameters,
					parentId: nodeJson.parentId,
					useWorldPosition: nodeJson.useWorldPosition,
					isOnGround: nodeJson.isOnGround,
					needSelectAfterAdd: nodeJson.needSelectAfterAdd,
					isServer: true,
					type: nodeJson.type
				});
			}
			else if(nodeJson.isLocal){
				let componentInfo = thatViewer.manager.localObjectCreator.getComponentInfo(nodeJson.code, nodeJson.versionNum);
				let defaultName = nodeJson.name != null && nodeJson.name.length > 0 ? nodeJson.name : componentInfo.name;
				let newIdAndName = thatViewer.getNewObjectIdAndName(defaultName + "_1", defaultName, nodeJson.parentId);
				let parameters = {};
				for(let paramName in componentInfo.parameters){
					let param = componentInfo.parameters[paramName];
					if(param != null){
						parameters[paramName] = {
							value: nodeJson.parameters[paramName] === undefined ? null : nodeJson.parameters[paramName].value,
							isGeo: param.isGeo
						};
					}
				}
				localObjectJsons.push({
					id: nodeJson.id,
					code: nodeJson.code,
					versionNum: nodeJson.versionNum,
					name: newIdAndName.name,
					position: nodeJson.position,
					rotation: nodeJson.rotation,
					scale: nodeJson.scale,
					castShadow: true,
					receiveShadow: true,
					parameters: nodeJson.parameters,
					materials: nodeJson.materials,
					parentId: nodeJson.parentId,
					isOnGround: nodeJson.isOnGround,
					needSelectAfterAdd: nodeJson.needSelectAfterAdd,
					isLocal: true,
					type: nodeJson.type
				});
			}
		}
		let countInfo = {
			all: serverObjectJsons.length + localObjectJsons.length + internalObjectJsons.length,
			serverAll: serverObjectJsons.length,
			serverSucceed: 0,
			localAll: localObjectJsons.length,
			localSucceed: 0,
			internalAll: internalObjectJsons.length,
			internalSucceed: 0
		};

		if(internalObjectJsons.length > 0) {
			thatViewer.manager.internalObjectCreator.createObject3Ds(internalObjectJsons, thatViewer.afterAddNewObjectInSilence, countInfo);
		}
		if(serverObjectJsons.length > 0) {
			thatViewer.manager.serverObjectCreator.createObject3Ds(serverObjectJsons, thatViewer.afterAddNewObjectInSilence, countInfo);
		}
		if(localObjectJsons.length > 0) {
			thatViewer.manager.localObjectCreator.createObject3Ds(localObjectJsons, thatViewer.afterAddNewObjectInSilence, countInfo);
		}
	}

	//创建新的构件名称和id
	this.getNewObjectIdAndName = function(defaultName, namePrefix, parentId, excludedNames){
		let i = 0;
		let newName = defaultName;
		let hasSameName = true;
		while(hasSameName){
			hasSameName = false;
			let sameParentObject3Ds = parentId == null ? thatViewer.rootObject3D.children : thatViewer.allObject3DMap[parentId].children;
			for(let i = 0; i < sameParentObject3Ds.length; i++){
				let object3D = sameParentObject3Ds[i];
				if(object3D.userData.info != null && object3D.userData.info.name === newName){
					hasSameName = true;
					break;
				}
			}
			if(excludedNames != null){
				for(let j = 0; j < excludedNames.length; j++){
					if(excludedNames[j] === newName){
						hasSameName = true;
						break;
					}
				}
			}
			if(hasSameName){
				i++;
				newName = namePrefix + "_" + i;
			}
		}
		return {
			id: cmnPcr.createGuid(),
			name: newName
		};
	}

	//使用服务器端添加新构件后
	this.afterAddNewObject = function(p){
		let info =  p.object3D.userData.info;
		let id = info.id;

		//开始添加到undo list
		thatViewer.beginAddToUndoList(s3dOperateType.add, [id]);

		thatViewer.allObject3DMap[id] = p.object3D;
		let parentObject3D = info.parentId == null ? thatViewer.rootObject3D : thatViewer.allObject3DMap[info.parentId];
		parentObject3D.add(p.object3D);
		thatViewer.addHelperObjectToScene(p.object3D);

		thatViewer.refreshObject3DPositionRotationScale(p.object3D);

		thatViewer.doEventFunction("afterAddNewObject", {
			nodeJson: {
				id: id,
				name: info.name,
				code: info.code,
				parameters: info.parameters,
				parentId: info.parentId,
				type: info.type,
				children: []
			}
		});

		//结束添加到undo list
		thatViewer.endAddToUndoList(s3dUiStatus.add, [id]);

		thatViewer.refreshObject3DShadow(p.object3D);

		if(p.succeedCount === p.objectCount){
			thatViewer.changeStatus({
				status: s3dUiStatus.normalView
			});
		}

		if(p.otherInfo.needSelectAfterAdd){
			thatViewer.cancelSelectObject3Ds();
			thatViewer.selectObject3D(p.object3D);
			thatViewer.setCenterObject(p.object3D);
		}
	}

	//使用服务器端添加新构件后
	this.afterAddNewObjectInSilence = function(p){
		let info = p.object3D.userData.info;
		let id = info.id;
		thatViewer.allObject3DMap[id] = p.object3D;
		let parentObject3D = info.parentId == null ? thatViewer.rootObject3D : thatViewer.allObject3DMap[info.parentId];
		parentObject3D.add(p.object3D);
		thatViewer.addHelperObjectToScene(p.object3D);
		thatViewer.refreshObject3DPositionRotationScale(p.object3D);
	}

	//开启添加到undo list
	this.beginAddToUndoList = function(operateType, nodeIds, otherInfo){
		let tree = null;	
		let nodeJsons = [];
		let doOtherInfo = {};
		switch(operateType){
			case s3dOperateType.transform:{
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons.push(thatViewer.cloneJsonById(nodeId));
				}
				break;
			}
			case s3dOperateType.changeParent:{
				tree = thatViewer.manager.treeEditor.getTreeJson();
				nodeJsons = otherInfo.nodeJsons;
				break;
			}
			case s3dOperateType.add:{
				tree = thatViewer.manager.treeEditor.getTreeJson();				
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons.push({
						id: nodeId
					});
				}
				break;
			}
			case s3dOperateType.delete:{
				tree = thatViewer.manager.treeEditor.getTreeJson();
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons.push(thatViewer.cloneJsonById(nodeId));
				}
				break;
			}
			case s3dOperateType.splitLocal:{
				tree = thatViewer.manager.treeEditor.getTreeJson();
				doOtherInfo.sourceNodeJsons = [];
				doOtherInfo.sourceNodeJsons.push(thatViewer.cloneJsonById(otherInfo.sourceNodeId));
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons.push({
						id: nodeId
					});
				}
				break;
			}
		} 
		thatViewer.manager.statusBar.beginAddToUndoList({
			operateType: operateType,
			tree: tree,
			nodeJsons: nodeJsons,
			otherInfo: doOtherInfo
		});
	}

	//结束添加到undo list
	this.endAddToUndoList = function(operateType, nodeIds, otherInfo){
		let tree = null;	
		let nodeJsons = [];
		let doOtherInfo = {};
		switch(operateType){
			case s3dOperateType.transform:{
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons.push(thatViewer.cloneJsonById(nodeId));
				}
				break;
			}
			case s3dOperateType.changeParent:{
				tree = thatViewer.manager.treeEditor.getTreeJson();
				nodeJsons = otherInfo.nodeJsons;
				break;
			}
			case s3dOperateType.add:{
				tree = thatViewer.manager.treeEditor.getTreeJson();				
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons.push(thatViewer.cloneJsonById(nodeId));
				}
				break;
			}
			case s3dOperateType.delete:{
				tree = thatViewer.manager.treeEditor.getTreeJson();
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons.push({
						id: nodeId
					});
				}
				break;
			}
			case s3dOperateType.splitLocal:{
				tree = thatViewer.manager.treeEditor.getTreeJson();
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons.push(thatViewer.cloneJsonById(nodeId));
				}
				doOtherInfo.sourceNodeJsons = [];
				doOtherInfo.sourceNodeJsons.push({
					id: otherInfo.sourceNodeId
				});
				break;
			}
		} 
		thatViewer.manager.statusBar.endAddToUndoList({
			operateType: operateType,
			tree: tree,
			nodeJsons: nodeJsons,
			otherInfo: doOtherInfo
		});
	}

	//批量静默删除构件对象
	this.removeObjectsInSilence = function(nodeJsons){
		for(let i = 0; i < nodeJsons.length; i++){
			let nodeJson = nodeJsons[i];
			thatViewer.removeObjectByIdInSilence(nodeJson.id);
		}
	}

	//静默删除构件对象
	this.removeObjectByIdInSilence = function(nodeId){
		let nodeObject3D = thatViewer.allObject3DMap[nodeId];
		delete thatViewer.allObject3DMap[nodeId];
		let parentObject3D = nodeObject3D.parent;
		parentObject3D.remove(nodeObject3D);
	}

	//批量删除构件对象
	this.removeObjects = function(nodeIds, hasConfirm, ignoreUndo) {
		if (!hasConfirm || msgBox.confirm({info: "确定删除吗?" + (nodeIds.length > 0 ? ("已选择 " + nodeIds.length + " 个图元.") : "")})) {

			thatViewer.cancelSelectObject3Ds();

			thatViewer.doEventFunction("beforeRemoveObjects", {
				nodeIds: nodeIds
			});

			let allRelatedIds = [];
			for (let i = 0; i < nodeIds.length; i++) {
				let nodeId = nodeIds[i];
				thatViewer.getAllIdInObject(nodeId, allRelatedIds);
			}

			if (!ignoreUndo) {
				//开始添加到undo list
				thatViewer.beginAddToUndoList(s3dOperateType.delete, allRelatedIds);
			}

			thatViewer.removeObjectByIds(allRelatedIds);

			if (!ignoreUndo) {
				//结束添加到undo list
				thatViewer.endAddToUndoList(s3dOperateType.delete, allRelatedIds.reverse());
			}
		}
	}

	this.getAllIdInObject = function (nodeId, allObjectIds){
		let nodeObject3D = thatViewer.allObject3DMap[nodeId];
		let info = nodeObject3D.userData.info;
		if(info.type === s3dElement3DType.group) {
			for (let i = 0; i < nodeObject3D.children.length; i++) {
				let subNodeObject3D = nodeObject3D.children[i];
				let subInfo = subNodeObject3D.userData.info;
				if (subInfo != null) {
					thatViewer.getAllIdInObject(subInfo.id, allObjectIds);
				}
			}
		}
		allObjectIds.push(nodeId);
	}

	//删除构件对象
	this.removeObjectByIds = function(nodeIds){
		for(let i = 0; i < nodeIds.length; i++) {
			let objId = nodeIds[i];
			let obj3D = thatViewer.allObject3DMap[objId];
			delete thatViewer.allObject3DMap[objId];
			let parentObject3D = obj3D.parent;
			thatViewer.removeHelperObjectToScene(obj3D);

			if(obj3D.onRemove){
				obj3D.onRemove();
			}

			parentObject3D.remove(obj3D);

			thatViewer.doEventFunction("afterRemoveObject", {
				nodeId: objId
			});
		}
	}

	//检查是否重名
	this.checkObjectName = function(name){
		let existedName = false;
		for(let id in thatViewer.allObject3DMap){
			let obj3D = thatViewer.allObject3DMap[id];
			if(obj3D.userData.info.name === name){
				existedName = true;
				break;
			}
		}
		return existedName;
	}

	//更改object3D名称（唯一标识）
	this.changeObject3DName = function(nodeId, newName){
		let object3D = thatViewer.allObject3DMap[nodeId];
		object3D.userData.info.name = newName;
	}

	//设置object3D位置
	this.setObject3DPosition = function(nodeId, newPosition){
		let object3D = thatViewer.allObject3DMap[nodeId];
		object3D.position.set(newPosition.x, newPosition.y, newPosition.z);
	}

	//设置object3D旋转角度
	this.setObject3DRotation = function(nodeId, newRotation){
		let object3D = thatViewer.allObject3DMap[nodeId];
		object3D.rotation.set(newRotation.x, newRotation.y, newRotation.z);
	}

	//设置object3D缩放
	this.setObject3DScale = function(nodeId, newScale){
		let object3D = thatViewer.allObject3DMap[nodeId];
		object3D.scale.set(newScale.x, newScale.y, newScale.z);
	}

	//设置图元属性值
	this.setObjectParameters = function(nodeId, newParameters) {
		let object3D = thatViewer.getObject3DById(nodeId);
		let nodeData = object3D.userData.info;
		let componentInfo = null;
		if (nodeData.isInternal) {
			componentInfo = thatViewer.manager.internalObjectCreator.getComponentInfo(nodeData.code, nodeData.versionNum);
		} else if (nodeData.isServer) {
			componentInfo = thatViewer.manager.serverObjectCreator.getComponentInfo(nodeData.code, nodeData.versionNum);
		} else {
			componentInfo = thatViewer.manager.localObjectCreator.getComponentInfo(nodeData.code, nodeData.versionNum);
		}
		let parameters = {};
		for (let paramName in newParameters) {
			let comParam = componentInfo.parameters[paramName];
			parameters[paramName] = {
				value: newParameters[paramName] === undefined || newParameters[paramName] === null ? null : newParameters[paramName].value,
				isGeo: comParam.isGeo
			};
		}

		if (nodeData.isInternal) {
			thatViewer.rebuildInternalObject({
				id: nodeData.id,
				code: nodeData.code,
				versionNum: nodeData.versionNum,
				name: nodeData.name,
				parentId: nodeData.parentId,
				position: [object3D.position.x, object3D.position.y, object3D.position.z],
				rotation: [object3D.rotation.x, object3D.rotation.y, object3D.rotation.z],
				scale: [object3D.scale.x, object3D.scale.y, object3D.scale.z],
				useWorldPosition: nodeData.useWorldPosition,
				parameters: parameters,
				needSelectAfterAdd: object3D.isSelected,
				isTemp: nodeData.isTemp,
				type: nodeData.type,
				userData: nodeData.userData
			});
		}
		else if (nodeData.isServer) {
			thatViewer.rebuildServerObject({
				id: nodeData.id,
				code: nodeData.code,
				versionNum: nodeData.versionNum,
				name: nodeData.name,
				parentId: nodeData.parentId,
				position: [object3D.position.x, object3D.position.y, object3D.position.z],
				rotation: [object3D.rotation.x, object3D.rotation.y, object3D.rotation.z],
				scale: [object3D.scale.x, object3D.scale.y, object3D.scale.z],
				useWorldPosition: nodeData.useWorldPosition,
				parameters: parameters,
				needSelectAfterAdd: object3D.isSelected,
				isTemp: nodeData.isTemp,
				type: nodeData.type,
				userData: nodeData.userData
			});
		}
		else {
			thatViewer.rebuildLocalObject({
				id: nodeData.id,
				code: nodeData.code,
				versionNum: nodeData.versionNum,
				name: nodeData.name,
				parentId: nodeData.parentId,
				position: [object3D.position.x, object3D.position.y, object3D.position.z],
				rotation: [object3D.rotation.x, object3D.rotation.y, object3D.rotation.z],
				scale: [object3D.scale.x, object3D.scale.y, object3D.scale.z],
				useWorldPosition: nodeData.useWorldPosition,
				parameters: parameters,
				materials: nodeData.materials,
				customInfo: nodeData.customInfo,
				needSelectAfterAdd: object3D.isSelected,
				isTemp: nodeData.isTemp,
				type: nodeData.type,
				userData: nodeData.userData
			});
		}
	}

	//获取scene信息
	this.getSceneInfo = function(){
		let info = {
			meshCount: 0, 
			faceCount: 0
		};
		for(let id in thatViewer.allObject3DMap){
			let object = thatViewer.allObject3DMap[id];
			thatViewer.getObject3DInfo(object, info);
		}
		return info;
	}

	//重新构造图元
	this.rebuildInternalObject = function(p){
		thatViewer.rebuildInternalObjects([{
			id: p.id,
			code: p.code,
			versionNum: p.versionNum,
			name: p.name,
			parentId: p.parentId,
			position: p.position,
			rotation: p.rotation,
			scale: p.scale,
			useWorldPosition: p.useWorldPosition,
			parameters: p.parameters,
			needSelectAfterAdd: p.needSelectAfterAdd,
			type: p.type,
			isInternal: true,
			isTemp: p.isTemp,
			userData: p.userData
		}], thatViewer.afterRebuildObject);
	}

	//重新构造图元
	this.rebuildServerObject = function(p){
		thatViewer.rebuildServerObjects([{
			id: p.id,
			code: p.code,
			versionNum: p.versionNum,
			name: p.name,
			parentId: p.parentId,
			position: p.position,
			rotation: p.rotation,
			scale: p.scale,
			useWorldPosition: p.useWorldPosition,
			parameters: p.parameters,
			isTemp: p.isTemp,
			userData: p.userData,
			needSelectAfterAdd: p.needSelectAfterAdd
		}], thatViewer.afterRebuildObject);
	}

	//重新构造图元
	this.rebuildLocalObject = function(p){
		thatViewer.rebuildLocalObjects([{
			id: p.id,
			code: p.code,
			versionNum: p.versionNum,
			name: p.name,
			parentId: p.parentId,
			position: p.position,
			rotation: p.rotation,
			scale: p.scale,
			parameters: p.parameters,
			materials: p.materials,
			isTemp: p.isTemp,
			userData: p.userData,
			needSelectAfterAdd: p.needSelectAfterAdd
		}], thatViewer.afterRebuildObject);
	}

	this.rebuildInternalObjects = function(ps, afterRebuildObject){
		for(let i = 0; i < ps.length; i++){
			let p = ps[i];
			thatViewer.beforeRebuildObject(p);
		}
		let countInfo = {
			all: ps.length,
			serverAll: 0,
			serverSucceed: 0,
			localAll: 0,
			localSucceed: 0,
			internalAll: ps.length,
			internalSucceed: 0
		};
		thatViewer.manager.internalObjectCreator.createObject3Ds(ps, afterRebuildObject, countInfo);
	}

	this.rebuildServerObjects = function(ps, afterRebuildObject){
		for(let i = 0; i < ps.length; i++){
			let p = ps[i];
			thatViewer.beforeRebuildObject(p);
		}
		let countInfo = {
			all: ps.length,
			serverAll: ps.length,
			serverSucceed: 0,
			localAll: 0,
			localSucceed: 0,
			internalAll: 0,
			internalSucceed: 0
		};
		thatViewer.manager.serverObjectCreator.createObject3Ds(ps, afterRebuildObject, countInfo);
	}

	this.rebuildLocalObjects = function(ps, afterRebuildObject){
		for(let i = 0; i < ps.length; i++){
			let p = ps[i];
			thatViewer.beforeRebuildObject(p);
		}
		let countInfo = {
			all: ps.length,
			serverAll: 0,
			serverSucceed: 0,
			localAll: ps.length,
			localSucceed: 0,
			internalAll: 0,
			internalSucceed: 0
		};
		thatViewer.manager.localObjectCreator.createObject3Ds(ps, afterRebuildObject, countInfo);
	}

	//重新构造构件对象前
	this.beforeRebuildObject = function(p){
		thatViewer.doEventFunction("beforeRebuildObject", p);
	}

 	//重新构造构件对象后
	this.afterRebuildObject = function(p){
		let info = p.object3D.userData.info;
		let id = info.id;
		let name = info.name;
		let parameters = info.parameters;
		let parentObject3D = info.parentId == null ? thatViewer.rootObject3D : thatViewer.allObject3DMap[info.parentId];

		let oldObject3D = thatViewer.allObject3DMap[id];
		thatViewer.removeHelperObjectToScene(oldObject3D);

		if(oldObject3D.onRemove){
			oldObject3D.onRemove();
		}

		parentObject3D.remove(oldObject3D);
		thatViewer.allObject3DMap[id] = p.object3D;

		thatViewer.refreshObject3DPositionRotationScale(p.object3D);
		parentObject3D.add(p.object3D);

		thatViewer.refreshObject3DShadow(p.object3D);

		thatViewer.addHelperObjectToScene(p.object3D);


		//调用propertyEditor的endAddToUndoList，结束记录到undo list
		thatViewer.manager.propertyEditor.endAddToUndoList(id, parameters);

		thatViewer.doEventFunction("afterRebuildObject", {
			nodeJson: {
				id: id,
				name: name,
				parameters: parameters
			}
		});

		thatViewer.manager.statusBar.refreshStatusText({
			status: thatViewer.status,
			message: "已重新构造 " + name
		});

		if(p.otherInfo.needSelectAfterAdd){
			thatViewer.cancelSelectObject3Ds();
			thatViewer.selectObject3D(p.object3D);
		}
	}

	//获取threejs对象信息（统计用）
	this.getObject3DInfo = function(object, info) {
		// only count in Mesh and Line
		if (object instanceof THREE.Mesh || object instanceof THREE.Line) {
			info.meshCount++
			if (object.geometry instanceof THREE.BufferGeometry) {
				let geom = object.geometry;
				if (geom.index && geom.index.count) {
					info.faceCount += geom.index.count / 3;
				}
			}
		}
		else if(object instanceof THREE.Object3D){
			for(let i = 0; i < object.children.length; i++){
				let childObj = object.children[i];
				thatViewer.getObject3DInfo(childObj, info);
			}
		}
	}
    
	//获取相机信息
    this.getCameraViewport = function(){
    	return {
    		zoom: thatViewer.camera.zoom,
			position: [thatViewer.camera.position.x, thatViewer.camera.position.y, thatViewer.camera.position.z],
			target: [thatViewer.orbitControl.target.x, thatViewer.orbitControl.target.y, thatViewer.orbitControl.target.z],
			rotation: [thatViewer.camera.rotation.x, thatViewer.camera.rotation.y, thatViewer.camera.rotation.z],
			box: thatViewer.getSceneBoxValues()
    	}; 
    }

	this.getResultObjectMap = function (){
		let objectMap = {};
		for(let oId in thatViewer.allObject3DMap){
			let object3D = thatViewer.allObject3DMap[oId];
			let info = object3D.userData.info;
			if(info.type !== s3dElement3DType.group) {
				let parameters = {};
				for (let paramName in info.parameters) {
					let p = info.parameters[paramName];
					parameters[paramName] = {
						value: p.value
					};
				}
				let materials = {};
				for (let name in info.materials) {
					let p = info.materials[name];
					materials[name] = p;
				}
				objectMap[oId] = {
					id: info.id,
					code: info.code,
					versionNum: info.versionNum,
					name: info.name,
					position: [object3D.position.x, object3D.position.y, object3D.position.z],
					rotation: [object3D.rotation.x, object3D.rotation.y, object3D.rotation.z],
					scale: [object3D.scale.x, object3D.scale.y, object3D.scale.z],
					castShadow: info.castShadow,
					receiveShadow: info.receiveShadow,
					parameters: parameters,
					materials: materials,
					userWorldPosition: info.userWorldPosition,
					isServer: info.isServer,
					isInternal: info.isInternal,
					isLocal: info.isLocal,
					isTemp: info.isTemp,
					userData: info.userData,
					type: info.type
				};
			}
		}
		return objectMap;
	}

	this.getResultGroupMap = function (){
		let groupMap = {};
		for(let id in thatViewer.allObject3DMap) {
			let object3D = thatViewer.allObject3DMap[id];
			let info = object3D.userData.info;
			if (info.type === s3dElement3DType.group) {
				let group ={
					id: info.id,
					name: info.name,
					position: [object3D.position.x, object3D.position.y, object3D.position.z],
					rotation: [object3D.rotation.x, object3D.rotation.y, object3D.rotation.z],
					scale: [object3D.scale.x, object3D.scale.y, object3D.scale.z],
					objects: [],
					groups: []
				};
				for(let i = 0; i < object3D.children.length; i++){
					let childObj3D = object3D.children[i];
					let childInfo = childObj3D.userData.info;
					if(childInfo != null){
						if(childInfo.type === s3dElement3DType.group){
							group.groups.push(childInfo.id);
						}
						else{
							group.objects.push(childInfo.id);
						}
					}
				}

				groupMap[id] = group;
			}
		}
		return groupMap;
	}

	this.getResultObjectTypeMap = function (){
		let objectTypeMap = {};
		for(let objectId in thatViewer.allObject3DMap) {
			let object3D = thatViewer.allObject3DMap[objectId];
			let info = object3D.userData.info;
			if (info.isServer) {
				let code = info.code;
				let versionNum = info.versionNum;
				let key = code + "_" + versionNum;
				if (!objectTypeMap[key]) {
					let componentInfo = thatViewer.manager.serverObjectCreator.getComponentInfo(code, versionNum);
					let parameters = {};
					for (let paramName in componentInfo.parameters) {
						let p = componentInfo.parameters[paramName];
						parameters[paramName] = {
							name: p.name,
							paramType: p.paramType,
							valueType: p.valueType,
							categoryName: p.categoryName,
							groupName: p.groupName,
							indexInGroup: p.indexInGroup,
							isNullable: p.isNullable,
							maxValue: p.maxValue,
							minValue: p.minValue,
							defaultValue: p.defaultValue,
							listValues: p.listValues,
							isGeo: p.isGeo,
						};
					}
					objectTypeMap[key] = {
						code: code,
						versionNum: versionNum,
						name: componentInfo.name,
						parameters: parameters
					};
				}
			}
		}
		return objectTypeMap;
	}

	this.getResultMaterialMap = function (){
		let materialNameMap = {};
		let cacheKeyMap = {};
		for(let objectId in thatViewer.allObject3DMap) {
			let object3D = thatViewer.allObject3DMap[objectId];
			let info = object3D.userData.info;
			if (info.isServer) {
				let componentInfo = thatViewer.manager.serverObjectCreator.getComponentInfo(info.code, info.versionNum);
				let parameters = {};
				for(let paramName in info.parameters){
					if(componentInfo.parameters[paramName]){
						parameters[paramName] = {
							value: info.parameters[paramName].value,
							isGeo: componentInfo.parameters[paramName].isGeo
						};
					}
				}
				let cacheKey = thatViewer.manager.serverObjectCreator.getCacheKey(info.code, info.versionNum, parameters, info.useWorldPosition, thatViewer.detailLevel, thatViewer.viewLevel);
				if(!cacheKeyMap[cacheKey]) {
					cacheKeyMap[cacheKey] = true;
					let cacheInfo = thatViewer.manager.object3DCache.getRefComponentObject3D(cacheKey);
					thatViewer.manager.serverObjectCreator.getGeoMaterialNames(cacheInfo.geoJson, materialNameMap);
				}
			}
		}
		let materialMap = {};
		for(let materialName in materialNameMap){
			let materialInfo = js3StandardMaterials.getMaterialInfo(materialName);
			if(materialInfo != null){
				materialMap[materialName] = {
					name: materialInfo.name,
					imageAccessoryId: materialInfo.imageName,
					color: materialInfo.color,
					opacity: materialInfo.opacity,
					metalness: materialInfo.metalness
				};
			}
		}
		return materialMap;
	}

	this.removeHelperObjectToScene = function (object3D){
		let helper3D = thatViewer.getHelperObject3D(object3D.userData.info.id);
		thatViewer.rootHelper3D.remove(helper3D);
	}

	this.addHelperObjectToScene = function (object3D){
		if(object3D.userData.info.isServer) {
			//添加新的标注
			let cacheKey = object3D.cacheKey;
			let helper3D = thatViewer.manager.serverObjectCreator.cloneHelperRootObject3D(cacheKey);
			helper3D.isHelper = true;
			thatViewer.rootHelper3D.add(helper3D);
			helper3D.userData.objectId = object3D.userData.info.id;

			//根据object3D获取center造成的偏移量，并设置helperRootObject3D的偏移量
			let centerShift = object3D.centerShift;

			for (let i = 0; i < helper3D.children.length; i++) {
				let helperObj = helper3D.children[i];
				let x = helperObj.position.x + centerShift.x;
				let y = helperObj.position.y + centerShift.y;
				let z = helperObj.position.z + centerShift.z;
				helperObj.position.set(x, y, z);
			}

			//按照object3D设置helperRootObject3D的位置和旋转角度
			thatViewer.updateHelper(helper3D.userData.objectId);
		}
		else if(object3D.userData.info.isInternal){
			let helper3D = thatViewer.manager.internalObjectCreator.createHelperObject3D(object3D);
			if(helper3D != null){
				helper3D.isHelper = true;
				thatViewer.rootHelper3D.add(helper3D);
				helper3D.userData.objectId = object3D.userData.info.id;
			}
		}
	}

	this.getHelperObject3D = function (objectId){
		for(let i = 0; i < thatViewer.rootHelper3D.children.length; i++){
			let obj3D = thatViewer.rootHelper3D.children[i];
			if(obj3D.isHelper && obj3D.userData.objectId === objectId){
				return obj3D;
			}
		}
		return null;
	}

	this.runAnimationEvent = function (animationInfo, eventName){
		if(animationInfo.eventMap != null) {
			let eventInfo = animationInfo.eventMap[eventName];
			if (eventInfo != null) {
				let jsCode = eventInfo.jsCode;
				let manager = thatViewer.manager;
				let animationCode = animationInfo.code;
				let func = new Function("manager", "animationCode", jsCode);
				try {
					func(manager, animationCode);
				} catch (e) {
					msgBox.alert({
						info: "执行" + eventName + "出错, " + e
					});
				}
			}
		}
	}

	this.playAnimations = function (mixerActions, animationInfos){
		let clock = new THREE.Clock();
		clock.start();
		thatViewer.runAnimationInfo.clock = clock;
		thatViewer.runAnimationInfo.runInfoMap = {};
		thatViewer.runAnimationInfo.allFinished = false;
		thatViewer.runAnimationInfo.userStop = false;
		for(let i = 0; i < animationInfos.length; i++){
			let animationInfo = animationInfos[i];
			thatViewer.runAnimationInfo.runInfoMap[animationInfo.code] = {
				animationInfo: animationInfo,
				mixerMap: {},
				finished: false
			};

			//执行动画关联的事件
			thatViewer.runAnimationEvent(animationInfo, "onStart");
		}

		//执行动画
		for(let i = 0; i < mixerActions.length; i++){
			let mixerAction = mixerActions[i];

			let runInfo = thatViewer.runAnimationInfo.runInfoMap[mixerAction.animationCode];
			let mixerId = cmnPcr.createGuid();
			mixerAction.mixer.id = mixerId;
			mixerAction.mixer.finishedCount = 0;
			mixerAction.mixer.animationCode = mixerAction.animationCode;
			runInfo.mixerMap[mixerId] = mixerAction.mixer;

			mixerAction.mixer.addEventListener("finished", function (e) {
				thatViewer.onStopAnimationActionMixer(e);
			});

			mixerAction.action.play();
		}
	}

	this.onStopAnimationActionMixer = function (e){
		let allFinished = true;
		let currentMixer = e.target;
		let runInfo = thatViewer.runAnimationInfo.runInfoMap[currentMixer.animationCode];
		currentMixer.finishedCount++;
		for(let mixerId in runInfo.mixerMap){
			let mixer = runInfo.mixerMap[mixerId];
			if(mixer.finishedCount !== mixer.stats.actions.total){
				allFinished = false;
			}
		}
		if(allFinished){
			runInfo.finished = true;
			thatViewer.afterFinishAnimation(runInfo);
			thatViewer.afterEndAnimation(runInfo);
		}
	}

	this.stopAnimations = function (userStop){
		thatViewer.runAnimationInfo.userStop = userStop;
		if(thatViewer.runAnimationInfo.runInfoMap != null) {
			for(let animationCode in thatViewer.runAnimationInfo.runInfoMap) {
				let runInfo = thatViewer.runAnimationInfo.runInfoMap[animationCode];
				if (runInfo.mixerMap != null) {
					for (let mixerId in runInfo.mixerMap) {
						let mixer = runInfo.mixerMap[mixerId];
						mixer.stopAllAction();
					}
				}
				thatViewer.afterEndAnimation(runInfo);
			}
			thatViewer.afterEndAllAnimations();
		}
	}

	this.afterFinishAnimation = function (runInfo){
		let animationInfo = runInfo.animationInfo;
		thatViewer.runAnimationEvent(animationInfo, "onFinish");
	}

	this.afterEndAnimation = function (runInfo){
		if(runInfo.mixerMap != null) {
			let allMixerIds = [];
			for (let mixerId in runInfo.mixerMap) {
				allMixerIds.push(mixerId);
			}
			for (let i = 0; i < allMixerIds.length; i++) {
				let mixerId = allMixerIds[i];
				let mixer = runInfo.mixerMap[mixerId];
				delete runInfo.mixerMap[mixerId];
			}

			//执行动画关联的事件
			let animationInfo = runInfo.animationInfo;
			thatViewer.runAnimationEvent(animationInfo, "onEnd");
			runInfo.mixerMap = null;
			runInfo.animationInfo = null;
		}

		let allFinished = true;
		for(let animationCode in thatViewer.runAnimationInfo.runInfoMap){
			let runInfo = thatViewer.runAnimationInfo.runInfoMap[animationCode];
			if(!runInfo.finished){
				allFinished = false;
			}
		}
		if(allFinished){
			thatViewer.afterEndAllAnimations();
		}
	}

	this.afterEndAllAnimations = function (){
		thatViewer.runAnimationInfo.allFinished = true;
		thatViewer.runAnimationInfo.runInfoMap = null;
		if (thatViewer.runAnimationInfo.clock != null) {
			thatViewer.runAnimationInfo.clock.stop();
			thatViewer.runAnimationInfo.clock = null;
		}
	}

	//执行动画
	this.runAnimation = function(objectId, animationName, loop){
		let object3d = thatViewer.getObject3DById(objectId);
		let info = object3d.userData.info;
		let resourceDirectory = info.parameters["文件夹"].value;
		let resourceFileName = info.parameters["文件名"].value;
		let resourcePartName = info.parameters["组成部分"].value;
		let resourceType = info.parameters["类型"].value;
		let resourceKey = thatViewer.manager.object3DCache.getResourceObject3DKey(resourceDirectory + "\\" + resourceFileName, resourceType);
		let resourceObjectInfo = thatViewer.manager.object3DCache.getResourceObject3D(resourceKey);
		let resourceObject3d = resourceObjectInfo.object3D.children[0];
		let animation = thatViewer.getAnimationByName(resourceObject3d, animationName);
		let animationObject3d = object3d.children[0].children[0].children[0];
		let mixer = new THREE.AnimationMixer(animationObject3d);
		let animationAction = mixer.clipAction(animation);
		animationAction.timeScale = 1;
		animationAction.loop = loop ? THREE.LoopRepeat : THREE.LoopOnce;
		animationAction.clampWhenFinished = false;

		mixer.addEventListener( "finished", function(e) {
			thatViewer.stopAnimations();
		} );
		thatViewer.playAnimations([{
			mixer: mixer,
			action: animationAction
		}]);
	}

	this.getAnimationByName = function (object3d, name){
		let animations = object3d.animations;
		for(let i = 0; i < animations.length; i++){
			let animation = animations[i];
			if(animation.name === name){
				return animation;
			}
		}
		return null;
	}

	this.updateHelper = function (objectId) {
		let object3D = thatViewer.getObject3DById(objectId);
		let info = object3D.userData.info;
		switch (info.type) {
			case s3dElement3DType.unit: {
				let helper3D = thatViewer.getHelperObject3D(objectId);
				if(helper3D != null) {
					helper3D.position.set(object3D.position.x, object3D.position.y, object3D.position.z);
					helper3D.rotation.set(object3D.rotation.x, object3D.rotation.y, object3D.rotation.z);
				}
				break;
			}
			case s3dElement3DType.light:
			case s3dElement3DType.camera: {
				let helper3D = thatViewer.getHelperObject3D(objectId);
				if(helper3D != null) {
					helper3D.update();
				}
				break;
			}
			default: {
				break;
			}
		}
	}

	//材质有变化，更新到显示
	this.refreshMaterial = function (materialCode){
		let material =thatViewer.manager.localMaterials.getUserMaterial(materialCode);
		for(let objectId in thatViewer.allObject3DMap){
			let object3D = thatViewer.allObject3DMap[objectId];
			let info = object3D.userData.info;
			if(info.isLocal){
				thatViewer.manager.localObjectCreator.refreshMaterial(object3D, materialCode, material);
			}
			else {
				//暂不做处理
			}
		}
	}

	this.getObject3DMaterialMap = function (objectId){
		let object3D = thatViewer.getObject3DById(objectId);
		let info = object3D.userData.info;
		if(info.type === s3dElement3DType.unit){
			let materialMap = {};
			thatViewer.getSubObjectMaterialMap(object3D, materialMap, "");
			return materialMap;
		}
		else {
			return null;
		}
	}

	this.getSubObjectMaterial = function (materialMap, path, material){
		if(!materialMap[material.name]){
			let text = material.name;
			if(material.isS3dMaterial){
				let materialInfo = thatViewer.manager.localMaterials.getUserMaterialInfo(material.name);
				text = materialInfo.name;
			}
			materialMap[material.name] = {
				text: text,
				path: path,
				material: material
			};
		}
	}

	this.getSubObjectMaterialMap = function (parentObject3D, materialMap, parentPath){
		for(let i = 0; i < parentObject3D.children.length; i++){
			let childObject3D = parentObject3D.children[i];
			if(!childObject3D.isResourceBoxLine) {
				let path = parentPath + "." + childObject3D.name;
				if (childObject3D.material != null) {
					if (childObject3D.material.length != null) {
						let materials = childObject3D.material;
						for (let j = 0; j < materials.length; j++) {
							let material = materials[j];
							let materialPath = path + ".material[" + j + "]";
							thatViewer.getSubObjectMaterial(materialMap, materialPath, material);
						}
					} else {
						let material = childObject3D.material;
						let materialPath = path + ".material";
						thatViewer.getSubObjectMaterial(materialMap, materialPath, material);
					}
				}
				thatViewer.getSubObjectMaterialMap(childObject3D, materialMap, path);
			}
		}
	}

	this.updateObjectCastShadow = function (objectId, castShadow){
		let object3D = thatViewer.getObject3DById(objectId);
		let info = object3D.userData.info;
		info.castShadow = castShadow;
		thatViewer.refreshObject3DShadow(object3D);
	}

	this.updateObjectReceiveShadow = function (objectId, receiveShadow){
		let object3D = thatViewer.getObject3DById(objectId);
		let info = object3D.userData.info;
		info.receiveShadow = receiveShadow;
		thatViewer.refreshObject3DShadow(object3D);
	}

	this.updateObjectShadow = function (objectId, castShadow, receiveShadow){
		let object3D = thatViewer.getObject3DById(objectId);
		let info = object3D.userData.info;
		info.castShadow = castShadow;
		info.receiveShadow = receiveShadow;
		thatViewer.refreshObject3DShadow(object3D);
	}

	this.refreshObject3DShadow = function (object3D){
		if(thatViewer.showShadow){
			let info = object3D.userData.info;
			if(info.type === s3dElement3DType.unit){
				thatViewer.setSubObject3DShadow(object3D, info.castShadow, info.receiveShadow);
			}
		}
	}

	this.setSubObject3DShadow = function (object3D, castShadow, receiveShadow) {
		if(object3D.isMesh || object3D.isGroup || object3D.isObject3D) {
			if(object3D.isLight){
				object3D.castShadow = false;
				object3D.receiveShadow = false;
			}
			else {
				object3D.castShadow = castShadow;
				object3D.receiveShadow = receiveShadow;
				for (let i = 0; i < object3D.children.length; i++) {
					let subObject3D = object3D.children[i];
					if (!subObject3D.isResourceBoxLine) {
						thatViewer.setSubObject3DShadow(subObject3D, castShadow, receiveShadow);
					}
				}
			}
		}
	}

	this.getImageBase64 = function (){
		thatViewer.renderer.render(thatViewer.scene, thatViewer.camera);
		let imageWidth = 256;
		let canvas = thatViewer.renderer.domElement;
		let tempCanvas = document.createElement("canvas");
		let tempContext = tempCanvas.getContext("2d");
		tempCanvas.width = imageWidth;
		tempCanvas.height = canvas.height * imageWidth / canvas.width;
		tempContext.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, tempCanvas.width, tempCanvas.height);
		let data = tempCanvas.toDataURL("image/png");
		let splitIndex = data.indexOf(",");
		let imageBase64 = data.substr(splitIndex + 1);
		return imageBase64;
	}


	this.restoreAllObjectOriginalState = function () {
		thatViewer.stopAnimations();
		for(let objectId in thatViewer.allObject3DMap){
			let object3D = thatViewer.allObject3DMap[objectId];
			let unitInfo = object3D.userData.info;
			if(!unitInfo.isTemp) {
				//忽略临时对象
			}
			else {
				thatViewer.restoreObjectOriginalState(objectId);
			}
		}
	}

	this.removeAllTempObjects = function (){
		let tempObjectIds = [];
		for(let objectId in thatViewer.allObject3DMap){
			let object3D = thatViewer.allObject3DMap[objectId];
			let unitInfo = object3D.userData.info;
			if(unitInfo.isTemp) {
				tempObjectIds.push(objectId);
			}
		}
		thatViewer.removeObjects(tempObjectIds, false, true);
	}

	this.restoreObjectOriginalState = function (objectId){
		let object3D = thatViewer.getObject3DById(objectId);
		let objectInfo = thatViewer.manager.s3dObject.objectMap[objectId];
		if(objectInfo != null) {
			object3D.visible = true;
			thatViewer.setObjectPositionRotationScaleById(objectId,
				object3D.userData.info.userWorldPosition,
				{
					x: objectInfo.position[0],
					y: objectInfo.position[1],
					z: objectInfo.position[2]
				},
				{
					x: objectInfo.rotation[0],
					y: objectInfo.rotation[1],
					z: objectInfo.rotation[2]
				},
				{
					x: objectInfo.scale[0],
					y: objectInfo.scale[1],
					z: objectInfo.scale[2]
				});
		}
	}
}
export default S3dViewer