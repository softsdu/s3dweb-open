import {cmnPcr, msgBox, PopupContainer, s3dImageSourceType, s3dUiStatus} from "../../commonjs/common/common.js"
import * as THREE from "three"
import {OrbitControls} from "../../commonjs/threejs/custom/OrbitControls.js";
import {FBXLoader} from "three/examples/jsm/loaders/FBXLoader.js";
import "./s3dSystemMaterialPicker.css"

//S3dWeb 选择本地材质
let S3dSystemMaterialPicker = function (){
	//当前对象
	const thatS3dSystemMaterialPicker = this;

	this.manager = null;
	
	//containerId
	this.containerId = null;

	//参数信息
	this.paramInfo = null;

	//选中的材质编码
	this.materialCode = null;

	//选中的材质编码
	this.materialName = null;

	this.popContainer = null;

	this.onePageItemCount = 20;

	this.demoObject3D = null;

	//初始化
	this.init = function(p){
		thatS3dSystemMaterialPicker.manager = p.manager;
		thatS3dSystemMaterialPicker.containerId = p.containerId;
		thatS3dSystemMaterialPicker.title = p.config.title == null ? "选择系统材质" : p.config.title;
	}  
	
	//显示材质选择器
	this.showPicker = function(p){
		thatS3dSystemMaterialPicker.paramInfo = p.paramInfo;
		thatS3dSystemMaterialPicker.materialCode = p.paramInfo.materialCode;
		thatS3dSystemMaterialPicker.materialName = p.paramInfo.materialName;
		//材质列表
		thatS3dSystemMaterialPicker.showContainer();
    } 

	//添加条目
	this.addItemToList = function(p){
		let container = $("#" + thatS3dSystemMaterialPicker.popContainer.contentId).find(".s3dSystemMaterialPickerContainer")[0];
		let listContainer = $(container).find(".s3dSystemMaterialPickerListContainer")[0];
		p.index = $(listContainer).children().length;
		let itemHtml = thatS3dSystemMaterialPicker.getItemHtml(p);
		$(listContainer).append(itemHtml);
	} 

	//显示选择器的容器
	this.showContainer = function(p){
		let popContainer = new PopupContainer({
			width: 1000,
			height: 800,
			top: 50,
			canClose: true,
			title: "选择系统材质",
			containerId: thatS3dSystemMaterialPicker.containerId
		});
		popContainer.show();
		thatS3dSystemMaterialPicker.popContainer = popContainer;

		let winHtml = thatS3dSystemMaterialPicker.getMainHtml();
		$("#" + thatS3dSystemMaterialPicker.popContainer.contentId).html(winHtml);

		let materialsInfo = thatS3dSystemMaterialPicker.querySystemMaterials("", 0, thatS3dSystemMaterialPicker.onePageItemCount);
		thatS3dSystemMaterialPicker.showList(materialsInfo);

		thatS3dSystemMaterialPicker.initPreviewScene();

		let container = $("#" + thatS3dSystemMaterialPicker.popContainer.contentId).find(".s3dSystemMaterialPickerContainer")[0];

		$(container).find(".s3dSystemMaterialPickerQueryInput").change(function (){
			let keyword = $(this).val().trim();
			let materialsInfo = thatS3dSystemMaterialPicker.querySystemMaterials(keyword, 0, thatS3dSystemMaterialPicker.onePageItemCount);
			thatS3dSystemMaterialPicker.showList(materialsInfo);
		});

		$(container).find(".s3dSystemMaterialPickerMoreBtn").click(function (){
			let container = $("#" + thatS3dSystemMaterialPicker.popContainer.contentId).find(".s3dSystemMaterialPickerContainer")[0];
			let nextPageIndex = parseInt($(this).attr("nextPageIndex"));
			let keyword = $(container).find(".s3dSystemMaterialPickerQueryInput").val().trim();
			let materialsInfo = thatS3dSystemMaterialPicker.querySystemMaterials(keyword, nextPageIndex, thatS3dSystemMaterialPicker.onePageItemCount);
			thatS3dSystemMaterialPicker.showList(materialsInfo);
		});
		$(container).find(".s3dSystemMaterialPickerBtnOk").click(function(){
			if(thatS3dSystemMaterialPicker.materialCode != null && thatS3dSystemMaterialPicker.materialCode.length > 0) {
				thatS3dSystemMaterialPicker.endPick();
				thatS3dSystemMaterialPicker.manager.viewer.changeStatus({
					status: s3dUiStatus.normalView
				});
			}
			else{
				msgBox.alert({info: "请选择材质."});
			}
		});

		$(container).find(".s3dSystemMaterialPickerTitle").text(thatS3dSystemMaterialPicker.title);
		$(container).find(".s3dSystemMaterialPickerCloseBtn").click(function(event){
			thatS3dSystemMaterialPicker.hideContainer();
			thatS3dSystemMaterialPicker.manager.viewer.changeStatus({
				status: s3dUiStatus.normalView
			}); 
		})
		$(container).find(".s3dSystemMaterialPickerBtnCancel").click(function(event){
			thatS3dSystemMaterialPicker.hideContainer();
			thatS3dSystemMaterialPicker.manager.viewer.changeStatus({
				status: s3dUiStatus.normalView
			});
		})
	}

	this.querySystemMaterials = function (keyword, pageIndex, onePageItemCount){
	 	return thatS3dSystemMaterialPicker.manager.localMaterials.querySystemMaterials(keyword, pageIndex, onePageItemCount);
	}

	this.showList = function (materialsInfo){
		let container = $("#" + thatS3dSystemMaterialPicker.popContainer.contentId).find(".s3dSystemMaterialPickerContainer")[0];
		if(materialsInfo.pageIndex === 0){
			//清除列表里的内容
			$(container).find(".s3dSystemMaterialPickerListContainer").empty();
		}

		for(let i = 0; i < materialsInfo.materials.length; i++) {
			let material = materialsInfo.materials[i];
			thatS3dSystemMaterialPicker.addItemToList(material);

			let itemContainer = $(container).find(".s3dSystemMaterialPickerItemContainer[materialCode='" + material.code + "']");
			$(itemContainer).click(function(){
				let container = $("#" + thatS3dSystemMaterialPicker.popContainer.contentId).find(".s3dSystemMaterialPickerContainer")[0];
				$(container).find(".s3dSystemMaterialPickerItemContainer").removeClass("s3dSystemMaterialPickerItemContainerActive");
				$(this).addClass("s3dSystemMaterialPickerItemContainerActive");
				thatS3dSystemMaterialPicker.materialCode = $(this).attr("materialCode");
				thatS3dSystemMaterialPicker.materialName = $(this).attr("materialName");

				thatS3dSystemMaterialPicker.switchDemoMaterial(thatS3dSystemMaterialPicker.materialCode);
			});
		}

		$(container).find(".s3dSystemMaterialPickerMoreBtn").attr("nextPageIndex", materialsInfo.pageIndex + 1);

		if(materialsInfo.materials.length < thatS3dSystemMaterialPicker.onePageItemCount){
			//没有更多记录了
			$(container).find(".s3dSystemMaterialPickerListNoMoreContainer").removeClass("s3dSystemMaterialPickerHidden");
			$(container).find(".s3dSystemMaterialPickerListMoreContainer").addClass("s3dSystemMaterialPickerHidden");
		}
		else{
			$(container).find(".s3dSystemMaterialPickerListNoMoreContainer").addClass("s3dSystemMaterialPickerHidden");
			$(container).find(".s3dSystemMaterialPickerListMoreContainer").removeClass("s3dSystemMaterialPickerHidden");
		}
	}

	this.switchDemoMaterial = function (materialCode){
		let object3D = thatS3dSystemMaterialPicker.demoObject3D;
		if(object3D != null) {
			let material = thatS3dSystemMaterialPicker.manager.localMaterials.getSystemMaterial(materialCode);
			object3D.traverse((child) => {
				if (child.isMesh) {
					child.material = material;
				}
			});
		}
		let previewContainer = $("#" + thatS3dSystemMaterialPicker.popContainer.contentId).find(".s3dSystemMaterialPickerPreviewContainer")[0];
		$(previewContainer).find(".s3dSystemMaterialPickerPreviewAlert").remove();
	}

	this.initPreviewScene = function (){
		let previewContainer = $("#" + thatS3dSystemMaterialPicker.popContainer.contentId).find(".s3dSystemMaterialPickerPreviewContainer")[0];
		let containerWidth = $(previewContainer).width();
		let containerHeight = $(previewContainer).height();

		const scene = new THREE.Scene();
		scene.background = new THREE.Color(0x444444);

		// 创建相机
		let camera = new THREE.PerspectiveCamera(60, containerWidth /containerHeight, 0.1, 100);
		camera.position.z = 5;

		// 创建渲染器
		const renderer = new THREE.WebGLRenderer({
			antialias: true,
			logarithmicDepthBuffer: true
		});
		renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
		renderer.toneMapping = THREE.LinearToneMapping;
		renderer.toneMappingExposure = 1.0;
		renderer.setSize(containerWidth, containerHeight);
		previewContainer.appendChild(renderer.domElement);

		// 添加轨道控制器
		const controls = new OrbitControls(camera, renderer.domElement);

		// 创建 FBX 加载器
		let loader = new FBXLoader();

		// 加载 FBX 文件
		let fbxUrl = thatS3dSystemMaterialPicker.manager.layout.imagesFolder + "materialEditor/material.fbx";
		loader.load(
			// 替换为你的 FBX 文件路径
			fbxUrl,
			(object) => {
				object.scale.set(0.01, 0.01, 0.01);
				object.position.set(0, -1, 0);
				scene.add(object);
				thatS3dSystemMaterialPicker.demoObject3D = object;
			},
			(xhr) => {
				console.log((xhr.loaded / xhr.total) * 100 + '% loaded');
			},
			(error) => {
				console.error('加载 FBX 文件时出错:', error);
			}
		);

		let ambientLight = new THREE.AmbientLight(0xffffff, 3);
		scene.add(ambientLight);

		const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
		directionalLight.position.set(3, 3, 3);
		scene.add(directionalLight);

		// 渲染循环
		function animate() {
			requestAnimationFrame(animate);
			controls.update();
			renderer.render(scene, camera);
		}

		animate();
	}

	//构造材质列表html
	this.getMainHtml = function() {
		let html = "<div class=\"s3dSystemMaterialPickerContainer\">"
			+ "<div class=\"s3dSystemMaterialPickerInnerContainer\">";

		html += "<div class='s3dSystemMaterialPickerHeader'><input type='text' class='s3dSystemMaterialPickerQueryInput' placeholder='请输入关键词' /></div>";
		html += "<div class='s3dSystemMaterialPickerPartContainer'>";
		html += "<div class='s3dSystemMaterialPickerListContainer'>";
		html += "</div>";
		html += "<div class='s3dSystemMaterialPickerListMoreContainer'><div class='s3dSystemMaterialPickerMoreBtn'>更多...</div></div>";
		html += "<div class='s3dSystemMaterialPickerListNoMoreContainer'>- 无更多材质 -</div>";
		html += "</div>";

		html += ("</div>"
			+ "<div class='s3dSystemMaterialPickerPreviewContainer'>"
			+ "<div class='s3dSystemMaterialPickerPreviewAlert'>选中左侧材质</div>"
			+ "</div>"
			+ "<div class='s3dSystemMaterialPickerBottomContainer'>"
			+ "<div class='s3dSystemMaterialPickerBottomBtn s3dSystemMaterialPickerBtnCancel'>取&nbsp;&nbsp;消</div>"
			+ "<div class='s3dSystemMaterialPickerBottomBtn s3dSystemMaterialPickerBtnOK'>确&nbsp;&nbsp;定</div>"
			+ "</div>"
			+ "</div>");
		return html;
	}

	//构造材质条目html
	this.getItemHtml = function(p){
		let html = "<div class='s3dSystemMaterialPickerItemContainer' materialCode='" + p.code + "' materialName='" + p.name + "'>"
			+ "<div class='s3dSystemMaterialPickerItemInnerContainer'>"
		+ "<div class='s3dSystemMaterialPickerItemCell s3dSystemMaterialPickerItemName'>" + p.name + "</div>";
		if(p.imageName.length === 0){
			html += "<div class='s3dSystemMaterialPickerItemCell s3dSystemMaterialPickerItemColor' style='background-color:" + cmnPcr.getColorStr(p.color) + "'>&nbsp;</div>"
		}
		else{
			let imageUrl = thatS3dSystemMaterialPicker.manager.localImages.getImageUrl(s3dImageSourceType.system + "://" + p.imageName);
			html += "<div class='s3dSystemMaterialPickerItemCell s3dSystemMaterialPickerItemColor' style='background-image:url(" + imageUrl + ")'>&nbsp;</div>"
		}
		html +=  "</div></div>";
		return html;
	}

	//取消选择
	this.cancelPick = function(p){
		thatS3dSystemMaterialPicker.hideContainer(p);
	}  

	//隐藏选择器容器
	this.hideContainer = function(p){
		thatS3dSystemMaterialPicker.popContainer.close();
		thatS3dSystemMaterialPicker.demoObject3D = null;
	}

	//结束选择
	this.endPick = function(){
		let materialCode =  thatS3dSystemMaterialPicker.materialCode;
		let materialName =  thatS3dSystemMaterialPicker.materialName;
		thatS3dSystemMaterialPicker.hideContainer();

		thatS3dSystemMaterialPicker.paramInfo.afterPickSystemMaterial({
			materialCode: materialCode,
			materialName: materialName,
			paramInfo: thatS3dSystemMaterialPicker.paramInfo
		});
		
	}
}
export default S3dSystemMaterialPicker