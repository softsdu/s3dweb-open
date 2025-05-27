import {cmnPcr, msgBox} from "../../commonjs/common/common.js"
import S3dAppSimpleSceneEditor from './editors/s3dAppSimpleSceneEditor.js'
import S3dAppSimpleSkyEditor from './editors/s3dAppSimpleSkyEditor.js'
import S3dAppSimpleMaterialEditor from './editors/s3dAppSimpleMaterialEditor.js'
import "./S3dAppSimpleEditor.css"
import {s3dAppSimpleEditorStatic} from "./s3dAppSimpleEditorStatic.js";
import S3dAppSimpleCameraEditor from "./editors/s3dAppSimpleCameraEditor.js";
import S3dAppSimpleAnimationEditor from "./editors/s3dAppSimpleAnimationEditor.js";
import S3dAppSimpleTagEditor from "./editors/s3dAppSimpleTagEditor.js";

let S3dAppSimpleEditor = function (){
	
	//当前对象
	const thatS3dAppSimpleEditor = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	this.sceneEditor = null;

	this.skyEditor = null;

	this.materialEditor = null;

	this.cameraEditor = null;

	this.animationEditor = null;

	this.tagEditor = null;

	this.userDataName = null;

	this.pageInfo = null;

	//初始化
	this.init = function(p){
		thatS3dAppSimpleEditor.containerId = p.containerId;
		thatS3dAppSimpleEditor.manager = p.manager;
		thatS3dAppSimpleEditor.userDataName = p.config.userDataName;

		thatS3dAppSimpleEditor.initHtml();
	}

	this.showPage = function (pageInfo, editing){
		thatS3dAppSimpleEditor.pageInfo = pageInfo;
		const firstPageJson = {
			refJson: null,
			moduleHtml: null,
			pageInfo: thatS3dAppSimpleEditor.pageInfo,
			editing: editing
		};
		thatS3dAppSimpleEditor.manager.localContent2D.getPageRefJson({
			themeCode: firstPageJson.pageInfo.themeCode,
			moduleCode: firstPageJson.pageInfo.moduleCode,
			afterGetPageRefJson: function (p){
				firstPageJson.refJson = p.refJson;
				thatS3dAppSimpleEditor.initPageUIInfo(firstPageJson);
			}
		});

		thatS3dAppSimpleEditor.manager.localContent2D.getPageHtml({
			themeCode: firstPageJson.pageInfo.themeCode,
			moduleCode: firstPageJson.pageInfo.moduleCode,
			afterGetPageHtml: function (p){
				firstPageJson.moduleHtml = p.moduleHtml;
				thatS3dAppSimpleEditor.initPageUIInfo(firstPageJson);
			}
		});
	}

	this.initPageUIInfo = function (firstPageJson){
		if (firstPageJson.moduleHtml != null && firstPageJson.refJson != null) {


			thatS3dAppSimpleEditor.manager.localContent2D.showPageInScreen2D({
				pageIndex: 0,
				pageInfo: firstPageJson.pageInfo,
				moduleHtml: firstPageJson.moduleHtml,
				refJson: firstPageJson.refJson,
				editing: firstPageJson.editing
			});

			thatS3dAppSimpleEditor.manager.skyBox.setSkyInfo(firstPageJson.pageInfo.sky, true);
			thatS3dAppSimpleEditor.initSideUI();
			thatS3dAppSimpleEditor.initObjectProperty();
			thatS3dAppSimpleEditor.manager.appSimpleToolbar.showEditor("scene");
		}
	}

	this.initObjectProperty = function (){
		let targetObject = thatS3dAppSimpleEditor.manager.viewer.getObject3DByName(s3dAppSimpleEditorStatic.name.target);
		targetObject.disableSelect = true;

		let shadowObject = thatS3dAppSimpleEditor.manager.viewer.getObject3DByName(s3dAppSimpleEditorStatic.name.shadow);
		shadowObject.disableSelect = true;
	}

	this.initSideUI = function (){
		thatS3dAppSimpleEditor.sceneEditor = thatS3dAppSimpleEditor.createEditor("scene");
		thatS3dAppSimpleEditor.skyEditor = thatS3dAppSimpleEditor.createEditor("sky");
		thatS3dAppSimpleEditor.materialEditor = thatS3dAppSimpleEditor.createEditor("materials");
		thatS3dAppSimpleEditor.cameraEditor = thatS3dAppSimpleEditor.createEditor("camera");
		thatS3dAppSimpleEditor.animationEditor = thatS3dAppSimpleEditor.createEditor("animation");
		thatS3dAppSimpleEditor.tagEditor = thatS3dAppSimpleEditor.createEditor("tags");
	}

	this.initHtml = function () {
		let headerHtml = "<div class='s3dAppSimpleEditorContainer'></div>";
		let container = $("#" + thatS3dAppSimpleEditor.containerId);
		let headerContainer = $(container).find(".s3dLayoutBlock[name='appSimpleEditor']");
		$(headerContainer).append(headerHtml);
	}

	this.showEditor = function (name, editor){

		//设置所有物体不可选择
		for(let objectId  in thatS3dAppSimpleEditor.manager.viewer.allObject3DMap){
			let object3D = thatS3dAppSimpleEditor.manager.viewer.getObject3DById(objectId);
			object3D.disableSelect = true;
		}
		thatS3dAppSimpleEditor.manager.viewer.cancelSelectObject3Ds();


		let container = $("#" + thatS3dAppSimpleEditor.containerId).find(".s3dAppSimpleEditorContainer");
		$(container).find(".s3dAppSimpleEditorInnerContainer").addClass("s3dAppSimpleEditorInnerContainerHidden");
		$(container).find(".s3dAppSimpleEditorInnerContainer[name='" + name + "']").removeClass("s3dAppSimpleEditorInnerContainerHidden");
		editor.show();
	}

	this.getUserData = function (name){
		let userDataName = s3dAppSimpleEditorStatic.name.userDataName;
		let userDataInfo = thatS3dAppSimpleEditor.manager.getUserData(userDataName);
		if(userDataInfo == null){
			userDataInfo = {
				scene: {},
				sky: {},
				materials: [],
				camera: {},
				animation: {},
				tag: []
			};
			thatS3dAppSimpleEditor.manager.addUserData(userDataName, userDataInfo);
		}
		return userDataInfo;
	}

	this.createEditor = function (name){
		let editorClass = null;
		switch (name){
			case "scene":{
				editorClass = S3dAppSimpleSceneEditor;
				break;
			}
			case "sky":{
				editorClass = S3dAppSimpleSkyEditor;
				break;
			}
			case "materials":{
				editorClass = S3dAppSimpleMaterialEditor;
				break;
			}
			case "camera":{
				editorClass = S3dAppSimpleCameraEditor;
				break;
			}
			case "animation":{
				editorClass = S3dAppSimpleAnimationEditor;
				break;
			}
			case "tags":{
				editorClass = S3dAppSimpleTagEditor;
				break;
			}
			default:{
				msgBox.alert({info: "未知的编辑器类型: " + name});
				return;
			}
		}
		let editor = new editorClass();
		editor.init({
			containerId: thatS3dAppSimpleEditor.containerId,
			manager: thatS3dAppSimpleEditor.manager
		});
		let editorHtml = "<div class='s3dAppSimpleEditorInnerContainer s3dAppSimpleEditorInnerContainerHidden' name='" + name + "'>" + editor.getHtml() + "</div>";
		let container = $("#" + thatS3dAppSimpleEditor.containerId).find(".s3dAppSimpleEditorContainer");
		$(container).append(editorHtml);

		let editContainer = $(container).find(".s3dAppSimpleEditorInnerContainer[name='" + name + "']");
		let userDataInfo = thatS3dAppSimpleEditor.getUserData(name);
		editor.initValues({
			dataInfo: userDataInfo[name],
			pageInfo: thatS3dAppSimpleEditor.pageInfo,
			editContainer: editContainer
		});
		editor.bindEvents({
		});

		return editor;
	}

	this.showSceneEditor = function (){
		thatS3dAppSimpleEditor.showEditor("scene", thatS3dAppSimpleEditor.sceneEditor);
	}

	this.showSkyEditor = function (){
		thatS3dAppSimpleEditor.showEditor("sky", thatS3dAppSimpleEditor.skyEditor);
	}

	this.showMaterialEditor = function (){
		thatS3dAppSimpleEditor.showEditor("materials", thatS3dAppSimpleEditor.materialEditor);
	}

	this.showCameraEditor = function (){
		thatS3dAppSimpleEditor.showEditor("camera", thatS3dAppSimpleEditor.cameraEditor);
	}

	this.showAnimationEditor = function (){
		thatS3dAppSimpleEditor.showEditor("animation", thatS3dAppSimpleEditor.animationEditor);
	}

	this.showTagEditor = function (){
		thatS3dAppSimpleEditor.showEditor("tags", thatS3dAppSimpleEditor.tagEditor);
	}
}
export default S3dAppSimpleEditor