import {cmnPcr, msgBox, s3dMaterialEditType, s3dOperateType, s3dUiStatus} from "../../../commonjs/common/common.js"
import "../S3dAppSimpleEditor.css"
import "./S3dAppSimpleAnimationEditor.css"
import {s3dAppSimpleEditorStatic} from "../s3dAppSimpleEditorStatic.js"

let S3dAppSimpleAnimationEditor = function (){
	
	//当前对象
	const thatS3dAppSimpleAnimationEditor = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	this.dataInfo = null;

	this.editContainer = null;

	this.pageInfo = null;

	//初始化
	this.init = function(p){
		thatS3dAppSimpleAnimationEditor.containerId = p.containerId;
		thatS3dAppSimpleAnimationEditor.manager = p.manager;
	}

	this.show = function (){
		thatS3dAppSimpleAnimationEditor.manager.viewer.changeStatus({
			status: s3dUiStatus.normalView
		});
	}

	this.getHtml = function () {
		let html = "";

		//动画
		html += "<div class='s3dAppSimpleEditorGroupContainer'>";
		html += "<div class='s3dAppSimpleEditorGroupHeader'>";
		html += "<div class='s3dAppSimpleEditorGroupTitle'>动画</div>";
		html += "</div>";
		html += "<div class='s3dAppSimpleEditorListContainer'>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='oneRoundSecond'><div class='s3dAppSimpleEditorItemTitle'>时长（秒）</div><div class='s3dAppSimpleEditorItemValue'><input type='number' step='0.1' class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputNumber' /></div></div>";
		html += "</div>";
		html += "</div>";

		return html;
	}

	this.initValues = function (p) {
		thatS3dAppSimpleAnimationEditor.editContainer = p.editContainer;
		thatS3dAppSimpleAnimationEditor.dataInfo = p.dataInfo;
		thatS3dAppSimpleAnimationEditor.pageInfo = p.pageInfo;

		if(p.dataInfo.oneRoundSecond == null) {
			let animationCode = thatS3dAppSimpleAnimationEditor.pageInfo.animations[0].code;
			let animationInfo = thatS3dAppSimpleAnimationEditor.manager.userAnimations.getAnimationInfo(animationCode);
			p.dataInfo.oneRoundSecond = animationInfo.frameCount / thatS3dAppSimpleAnimationEditor.manager.userAnimations.defaultFPS;
		}

		thatS3dAppSimpleAnimationEditor.initValue({
			name: "oneRoundSecond",
			value: p.dataInfo["oneRoundSecond"]
		})
	}

	this.initValue = function (p){
		$(thatS3dAppSimpleAnimationEditor.editContainer).find(".s3dAppSimpleEditorItemContainer[name='"  + p.name + "'] .s3dAppSimpleEditorItemInput").val(p.value);
	}

	this.bindEvents = function (p){
		$(thatS3dAppSimpleAnimationEditor.editContainer).find(".s3dAppSimpleEditorItemContainer .s3dAppSimpleEditorItemInputNumber").change(function (){
			let name = $(this).parent().parent().attr("name");
			let valueStr = $(this).val();
			let value = cmnPcr.strToDecimal(valueStr);
			thatS3dAppSimpleAnimationEditor.setValue(name, value);
			thatS3dAppSimpleAnimationEditor.refreshToView(name, value);
		});
	}

	this.setValue = function (name, value){
		let dataInfo = thatS3dAppSimpleAnimationEditor.dataInfo;
		dataInfo[name] = value;
	}

	this.refreshToView = function (name, value){
		switch(name){
			case "oneRoundSecond":{
				let animationCode = thatS3dAppSimpleAnimationEditor.pageInfo.animations[0].code;
				let animationInfo = thatS3dAppSimpleAnimationEditor.manager.userAnimations.getAnimationInfo(animationCode);
				let frameCount = Math.round(value * thatS3dAppSimpleAnimationEditor.manager.userAnimations.defaultFPS);
				animationInfo.frameCount = frameCount;
				for(let i = 0; i < animationInfo.groups.length; i++){
					let groupInfo = animationInfo.groups[i];
					for(let j = 0; j < groupInfo.tracks.length; j++) {
						let trackInfo = groupInfo.tracks[j];
						let keyFrameInfo = trackInfo.keyFrames[trackInfo.keyFrames.length - 1];
						keyFrameInfo.frameIndex = frameCount;
					}
				}
				break;
			}
		}
	}

	//开启添加到undo list
	this.beginAddToUndoList = function (nodeId) {
		let nodeJsons = [];
		nodeJsons.push(thatS3dAppSimpleAnimationEditor.manager.viewer.cloneJsonById(nodeId));
		thatS3dAppSimpleAnimationEditor.manager.statusBar.beginAddToUndoList({
			operateType: s3dOperateType.edit,
			nodeJsons: nodeJsons
		});
	};
}
export default S3dAppSimpleAnimationEditor