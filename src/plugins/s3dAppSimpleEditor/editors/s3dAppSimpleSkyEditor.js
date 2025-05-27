import {cmnPcr, msgBox, s3dMaterialEditType, s3dOperateType, s3dUiStatus} from "../../../commonjs/common/common.js"
import "../S3dAppSimpleEditor.css"
import "./S3dAppSimpleSkyEditor.css"
import {s3dAppSimpleEditorStatic} from "../s3dAppSimpleEditorStatic.js"

let S3dAppSimpleSkyEditor = function (){
	
	//当前对象
	const thatS3dAppSimpleSkyEditor = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	this.dataInfo = null;

	this.editContainer = null;

	this.pageInfo = null;

	//初始化
	this.init = function(p){
		thatS3dAppSimpleSkyEditor.containerId = p.containerId;
		thatS3dAppSimpleSkyEditor.manager = p.manager;
	}

	this.show = function (){
		thatS3dAppSimpleSkyEditor.manager.viewer.changeStatus({
			status: s3dUiStatus.normalView
		});
	}

	this.getHtml = function () {
		let html = "";

		//模型
		html += "<div class='s3dAppSimpleEditorGroupContainer'>";
		html += "<div class='s3dAppSimpleEditorGroupHeader'>";
		html += "<div class='s3dAppSimpleEditorGroupTitle'>背景</div>";
		html += "</div>";
		html += "<div class='s3dAppSimpleEditorListContainer'>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='backgroundImage'><div class='s3dAppSimpleEditorItemTitle'>背景图</div><div class='s3dAppSimpleEditorItemValue'><input type='text' readonly class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputImage' /><div class=\"s3dAppSimpleEditorItemPop s3dAppSimpleEditorItemImagePicker\"></div></div></div>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='backgroundColor'><div class='s3dAppSimpleEditorItemTitle'>背景色</div><div class='s3dAppSimpleEditorItemValue'><input type='color' class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputColor' /></div></div>";
		html += "</div>";
		html += "</div>";
		//展品基本信息
		html += "<div class='s3dAppSimpleEditorGroupContainer'>";
		html += "<div class='s3dAppSimpleEditorGroupHeader'>";
		html += "<div class='s3dAppSimpleEditorGroupTitle'>环境</div>";
		html += "</div>";
		html += "<div class='s3dAppSimpleEditorListContainer'>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='ambientLight'><div class='s3dAppSimpleEditorItemTitle'>环境光亮度</div><div class='s3dAppSimpleEditorItemValue'><input type='number' step='0.1' class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputNumber' /></div></div>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='directionalLight'><div class='s3dAppSimpleEditorItemTitle'>平行光亮度</div><div class='s3dAppSimpleEditorItemValue'><input type='number' step='0.1' class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputNumber' /></div></div>";
		html += "</div>";
		html += "</div>";

		return html;
	}

	this.initValues = function (p) {
		thatS3dAppSimpleSkyEditor.editContainer = p.editContainer;
		thatS3dAppSimpleSkyEditor.dataInfo = p.dataInfo;
		thatS3dAppSimpleSkyEditor.pageInfo = p.pageInfo;

		let skyInfo = p.pageInfo.sky;
		if(p.dataInfo.backgroundImage == null || p.dataInfo.backgroundImage.length === 0){
			p.dataInfo.backgroundImage = skyInfo.backgroundImage;
		}
		if(p.dataInfo.backgroundColor == null){
			p.dataInfo.backgroundColor = skyInfo.backgroundColor;
		}
		if(p.dataInfo.ambientLight == null){
			let ambientLightObject = thatS3dAppSimpleSkyEditor.manager.viewer.getObject3DByName("ambientLight");
			let unitInfo = ambientLightObject.userData.info;
			p.dataInfo.ambientLight = unitInfo.parameters["intensity"].value;
		}
		if(p.dataInfo.directionalLight == null){
			let directionalLightObject = thatS3dAppSimpleSkyEditor.manager.viewer.getObject3DByName("directionalLight");
			let unitInfo = directionalLightObject.userData.info;
			p.dataInfo.directionalLight = unitInfo.parameters["intensity"].value;
		}

		thatS3dAppSimpleSkyEditor.initValue({
			name: "backgroundImage",
			value: p.dataInfo["backgroundImage"]
		});

		let backgroundColorStr = cmnPcr.getColorStr(p.dataInfo.backgroundColor);
		thatS3dAppSimpleSkyEditor.initValue({
			name: "backgroundColor",
			value: backgroundColorStr
		});

		thatS3dAppSimpleSkyEditor.initValue({
			name: "ambientLight",
			value: p.dataInfo["ambientLight"]
		});
		thatS3dAppSimpleSkyEditor.initValue({
			name: "directionalLight",
			value: p.dataInfo["directionalLight"]
		});
	}

	this.initValue = function (p){
		$(thatS3dAppSimpleSkyEditor.editContainer).find(".s3dAppSimpleEditorItemContainer[name='"  + p.name + "'] .s3dAppSimpleEditorItemInput").val(p.value);
	}

	this.bindEvents = function (p){
		$(thatS3dAppSimpleSkyEditor.editContainer).find(".s3dAppSimpleEditorItemContainer .s3dAppSimpleEditorItemInputColor").change(function (){
			let name = $(this).parent().parent().attr("name");
			let backgroundColorStr = $(this).val();
			let backgroundColor = common3DFunction.stringToRGBInt(backgroundColorStr.substr(1));
			thatS3dAppSimpleSkyEditor.setValue(name, backgroundColor);
			thatS3dAppSimpleSkyEditor.refreshToView(name, backgroundColor);
		});
		$(thatS3dAppSimpleSkyEditor.editContainer).find(".s3dAppSimpleEditorItemContainer .s3dAppSimpleEditorItemImagePicker").click(function (){
			let name = $(this).parent().parent().attr("name");
			let valueStr = $(this).val();

			thatS3dAppSimpleSkyEditor.manager.localImagePicker.showPicker({
				paramInfo: {
					propertyName: name,
					imageUrl: valueStr,
					afterPickImage: thatS3dAppSimpleSkyEditor.afterPickImage
				}
			});
		});
		$(thatS3dAppSimpleSkyEditor.editContainer).find(".s3dAppSimpleEditorItemContainer .s3dAppSimpleEditorItemInputNumber").change(function (){
			let name = $(this).parent().parent().attr("name");
			let valueStr = $(this).val();
			let value = cmnPcr.strToDecimal(valueStr);
			thatS3dAppSimpleSkyEditor.setValue(name, value);
			thatS3dAppSimpleSkyEditor.refreshToView(name, value);
		});
	}

	this.afterPickImage = function (p){
		let newImageUrl = p.imageUrl;
		let propertyName  = p.paramInfo.propertyName;
		let input = $(thatS3dAppSimpleSkyEditor.editContainer).find(".s3dAppSimpleEditorItemContainer[name='" + propertyName + "'] .s3dAppSimpleEditorItemInput")[0];
		let oldImageUrl = $(input).val();
		$(input).val(newImageUrl);
		if(oldImageUrl !== newImageUrl){
			thatS3dAppSimpleSkyEditor.setValue(propertyName, newImageUrl);
			thatS3dAppSimpleSkyEditor.refreshToView(propertyName, newImageUrl);
		}
	}

	this.setValue = function (name, value){
		let dataInfo = thatS3dAppSimpleSkyEditor.dataInfo;
		switch(name){
			case "backgroundImage":{
				dataInfo[name] = value;
				break;
			}
			case "backgroundColor":{
				dataInfo[name] = value;
				break;
			}
			case "ambientLight":{
				dataInfo[name] = value;
				break;
			}
			case "directionalLight":{
				dataInfo[name] = value;
				break;
			}
		}
	}

	this.refreshToView = function (name, value){
		switch(name){
			case "backgroundImage":{
				let skyInfo = thatS3dAppSimpleSkyEditor.pageInfo.sky;
				skyInfo.backgroundImage = value;
				thatS3dAppSimpleSkyEditor.pageInfo.sky = skyInfo;
				thatS3dAppSimpleSkyEditor.manager.skyBox.setSkyInfo(skyInfo, true);
				break;
			}
			case "backgroundColor":{
				let skyInfo = thatS3dAppSimpleSkyEditor.pageInfo.sky;
				skyInfo.backgroundColor = value;
				thatS3dAppSimpleSkyEditor.pageInfo.sky = skyInfo;
				thatS3dAppSimpleSkyEditor.manager.skyBox.setSkyInfo(skyInfo, true);
				break;
			}
			case "ambientLight":{
				let ambientLightObject = thatS3dAppSimpleSkyEditor.manager.viewer.getObject3DByName(s3dAppSimpleEditorStatic.name.ambientLight);
				let unitInfo = ambientLightObject.userData.info;
				thatS3dAppSimpleSkyEditor.beginAddToUndoList(unitInfo.id);
				unitInfo.parameters["intensity"].value = value;
				thatS3dAppSimpleSkyEditor.manager.viewer.rebuildInternalObject({
					id: unitInfo.id,
					code: unitInfo.code,
					versionNum: unitInfo.versionNum,
					name: unitInfo.name,
					parentId: unitInfo.parentId,
					position: [ambientLightObject.position.x, ambientLightObject.position.y, ambientLightObject.position.z],
					rotation: [ambientLightObject.rotation.x, ambientLightObject.rotation.y, ambientLightObject.rotation.z],
					scale: [ambientLightObject.scale.x, ambientLightObject.scale.y, ambientLightObject.scale.z],
					useWorldPosition: unitInfo.useWorldPosition,
					parameters: unitInfo.parameters,
					needSelectAfterAdd:false,
					isTemp: false,
					type: unitInfo.type,
					userData: unitInfo.userData
				});
				break;
			}
			case "directionalLight":{
				let directionalLightObject = thatS3dAppSimpleSkyEditor.manager.viewer.getObject3DByName(s3dAppSimpleEditorStatic.name.directionalLight);
				let unitInfo = directionalLightObject.userData.info;
				thatS3dAppSimpleSkyEditor.beginAddToUndoList(unitInfo.id);
				unitInfo.parameters["intensity"].value = value;
				thatS3dAppSimpleSkyEditor.manager.viewer.rebuildInternalObject({
					id: unitInfo.id,
					code: unitInfo.code,
					versionNum: unitInfo.versionNum,
					name: unitInfo.name,
					parentId: unitInfo.parentId,
					position: [directionalLightObject.position.x, directionalLightObject.position.y, directionalLightObject.position.z],
					rotation: [directionalLightObject.rotation.x, directionalLightObject.rotation.y, directionalLightObject.rotation.z],
					scale: [directionalLightObject.scale.x, directionalLightObject.scale.y, directionalLightObject.scale.z],
					useWorldPosition: unitInfo.useWorldPosition,
					parameters: unitInfo.parameters,
					needSelectAfterAdd:false,
					isTemp: false,
					type: unitInfo.type,
					userData: unitInfo.userData
				});
				break;
			}
		}
	}

	//开启添加到undo list
	this.beginAddToUndoList = function (nodeId) {
		let nodeJsons = [];
		nodeJsons.push(thatS3dAppSimpleSkyEditor.manager.viewer.cloneJsonById(nodeId));
		thatS3dAppSimpleSkyEditor.manager.statusBar.beginAddToUndoList({
			operateType: s3dOperateType.edit,
			nodeJsons: nodeJsons
		});
	};
}
export default S3dAppSimpleSkyEditor