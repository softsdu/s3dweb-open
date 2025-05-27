import {cmnPcr, msgBox} from "../../commonjs/common/common.js"
import "./S3dAppSimpleToolbar.css"

let S3dAppSimpleToolbar = function (){
	
	//当前对象
	const thatS3dAppSimpleToolbar = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	//初始化
	this.init = function(p){
		thatS3dAppSimpleToolbar.containerId = p.containerId;
		thatS3dAppSimpleToolbar.manager = p.manager;

		thatS3dAppSimpleToolbar.initHtml();
		thatS3dAppSimpleToolbar.initEvents();
	}

	this.initHtml = function (){
		let headerHtml = "<div class='s3dAppSimpleToolbarContainer'>";
		headerHtml += "<div class='s3dAppSimpleToolbarInnerContainer'>";
		headerHtml += "<div class='s3dAppSimpleToolbarBtn s3dAppSimpleToolbarBtnScene' name='scene'>模型</div>";
		headerHtml += "<div class='s3dAppSimpleToolbarBtn s3dAppSimpleToolbarBtnSky' name='sky'>环境</div>";
		headerHtml += "<div class='s3dAppSimpleToolbarBtn s3dAppSimpleToolbarBtnCamera' name='camera'>视角</div>";
		headerHtml += "<div class='s3dAppSimpleToolbarBtn s3dAppSimpleToolbarBtnMaterial' name='material'>材质</div>";
		headerHtml += "<div class='s3dAppSimpleToolbarBtn s3dAppSimpleToolbarBtnAnimation' name='animation'>动画</div>";
		headerHtml += "<div class='s3dAppSimpleToolbarBtn s3dAppSimpleToolbarBtnTag' name='tag'>标注</div>";
		headerHtml += "</div>";
		headerHtml += "</div>";

		let container = $("#" + thatS3dAppSimpleToolbar.containerId);
		let headerContainer = $(container).find(".s3dLayoutBlock[name='appSimpleToolbar']");
		$(headerContainer).append(headerHtml);
	}

	this.initEvents = function (){
		let container = $("#" + thatS3dAppSimpleToolbar.containerId).find(".s3dAppSimpleToolbarContainer");
		$(container).find(".s3dAppSimpleToolbarBtn").click(function () {
			let name = $(this).attr("name");
			thatS3dAppSimpleToolbar.showEditor(name);
		});
	}

	this.showEditor = function (name){
		let appSimpleEditor = thatS3dAppSimpleToolbar.manager.appSimpleEditor;
		switch (name) {
			case "scene": {
				appSimpleEditor.showSceneEditor();
				break;
			}
			case "sky": {
				appSimpleEditor.showSkyEditor();
				break;
			}
			case "material": {
				appSimpleEditor.showMaterialEditor();
				break;
			}
			case "camera": {
				appSimpleEditor.showCameraEditor();
				break;
			}
			case "animation": {
				appSimpleEditor.showAnimationEditor();
				break;
			}
			case "tag": {
				appSimpleEditor.showTagEditor();
				break;
			}
			default: {
				msgBox.alert({info: "尚未定义按钮事件."});
				break;
			}
		}
		let container = $("#" + thatS3dAppSimpleToolbar.containerId).find(".s3dAppSimpleToolbarContainer");
		$(container).find(".s3dAppSimpleToolbarBtn").removeClass("s3dAppSimpleToolbarBtnActive");
		$(container).find(".s3dAppSimpleToolbarBtn[name='" + name + "']").addClass("s3dAppSimpleToolbarBtnActive");
	}
}
export default S3dAppSimpleToolbar