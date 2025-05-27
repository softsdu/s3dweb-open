import {cmnPcr, msgBox, s3dUiStatus} from "../../../commonjs/common/common.js"
import "../S3dAppSimpleEditor.css"
import "./S3dAppSimpleSceneEditor.css"
import {s3dAppSimpleEditorStatic} from "../s3dAppSimpleEditorStatic.js"
import * as THREE from "three";

let S3dAppSimpleSceneEditor = function (){
	
	//当前对象
	const thatS3dAppSimpleSceneEditor = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	//dataInfo
	this.dataInfo = null;

	this.editContainer = null;

	this.pageInfo = null;

	this.textureMaxLoadingTime = 10000;

	this.textureCheckSpan = 200;

	//初始化
	this.init = function(p){
		thatS3dAppSimpleSceneEditor.containerId = p.containerId;
		thatS3dAppSimpleSceneEditor.manager = p.manager;

		thatS3dAppSimpleSceneEditor.manager.viewer.addEventFunction("afterAddNewObject", thatS3dAppSimpleSceneEditor.afterAddNewObject);
	}

	this.show = function (){
		thatS3dAppSimpleSceneEditor.manager.viewer.changeStatus({
			status: s3dUiStatus.normalView
		});
	}

	this.getHtml = function () {
		let html = "";

		//展品基本信息
		html += "<div class='s3dAppSimpleEditorGroupContainer'>";
		html += "<div class='s3dAppSimpleEditorGroupHeader'>";
		html += "<div class='s3dAppSimpleEditorGroupTitle'>项目</div>";
		html += "</div>";
		html += "<div class='s3dAppSimpleEditorListContainer'>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='name'><div class='s3dAppSimpleEditorItemTitle'>名称</div><div class='s3dAppSimpleEditorItemValue'><input type='text' class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputString' /></div></div>";
		html += "</div>";
		html += "</div>";

		//模型
		html += "<div class='s3dAppSimpleEditorGroupContainer'>";
		html += "<div class='s3dAppSimpleEditorGroupHeader'>";
		html += "<div class='s3dAppSimpleEditorGroupTitle'>模型</div>";
		html += "</div>";
		html += "<div class='s3dAppSimpleEditorListContainer'>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='changeModel'><div class='s3dAppSimpleEditorItemValue'><div class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputBtn s3dAppSimpleEditorItemInputBtnModel'>更换模型...</div></div></div>";
		html += "</div>";
		html += "</div>";

		//展品基本信息
		html += "<div class='s3dAppSimpleEditorGroupContainer'>";
		html += "<div class='s3dAppSimpleEditorGroupHeader'>";
		html += "<div class='s3dAppSimpleEditorGroupTitle'>文案</div>";
		html += "</div>";
		html += "<div class='s3dAppSimpleEditorListContainer'>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='title'><div class='s3dAppSimpleEditorItemTitle'>标题</div><div class='s3dAppSimpleEditorItemValue'><input type='text' class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputString' /></div></div>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='subTitle'><div class='s3dAppSimpleEditorItemTitle'>副标题</div><div class='s3dAppSimpleEditorItemValue'><input type='text' class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputString' /></div></div>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='description'><div class='s3dAppSimpleEditorItemTitle'>简介</div><div class='s3dAppSimpleEditorItemValue'><textarea class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputTextarea' style='height: 300px;'></textarea></div></div>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='homePageUrl'><div class='s3dAppSimpleEditorItemTitle'>主页地址</div><div class='s3dAppSimpleEditorItemValue'><textarea class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputTextarea' style='height: 60px;'></textarea></div></div>";
		html += "</div>";
		html += "</div>";

		return html;
	}

	this.initValues = function (p) {
		thatS3dAppSimpleSceneEditor.editContainer = p.editContainer;
		thatS3dAppSimpleSceneEditor.dataInfo = p.dataInfo;
		thatS3dAppSimpleSceneEditor.pageInfo = p.pageInfo;

		thatS3dAppSimpleSceneEditor.initValue({
			name: "title",
			value: p.dataInfo["title"]
		})
		thatS3dAppSimpleSceneEditor.initValue({
			name: "name",
			value: p.dataInfo["name"]
		})
		thatS3dAppSimpleSceneEditor.initValue({
			name: "subTitle",
			value: p.dataInfo["subTitle"]
		})
		thatS3dAppSimpleSceneEditor.initValue({
			name: "description",
			value: p.dataInfo["description"]
		})
		thatS3dAppSimpleSceneEditor.initValue({
			name: "homePageUrl",
			value: p.dataInfo["homePageUrl"]
		});
	}

	this.initValue = function (p){
		let value = p.value;
		if(value == null || value.length === 0) {
			switch (p.name) {
				case "name": {
					value = thatS3dAppSimpleSceneEditor.manager.s3dObject.name;
					break;
				}
				default:{
					value = thatS3dAppSimpleSceneEditor.manager.screen2D.getContent2DItemValue(p.name);
					break;
				}
			}
		}
		$(thatS3dAppSimpleSceneEditor.editContainer).find(".s3dAppSimpleEditorItemContainer[name='"  + p.name + "'] .s3dAppSimpleEditorItemInput").val(value);
	}

	this.bindEvents = function (p){
		$(thatS3dAppSimpleSceneEditor.editContainer).find(".s3dAppSimpleEditorItemContainer .s3dAppSimpleEditorItemInputString").change(function (){
			let name = $(this).parent().parent().attr("name");
			let valueStr = $(this).val();
			thatS3dAppSimpleSceneEditor.setValue(name, valueStr);
			thatS3dAppSimpleSceneEditor.refreshToView(name, valueStr);
		});
		$(thatS3dAppSimpleSceneEditor.editContainer).find(".s3dAppSimpleEditorItemContainer .s3dAppSimpleEditorItemInputTextarea").change(function (){
			let name = $(this).parent().parent().attr("name");
			let valueStr = $(this).val();
			thatS3dAppSimpleSceneEditor.setValue(name, valueStr);
			thatS3dAppSimpleSceneEditor.refreshToView(name, valueStr);
		});

		$(thatS3dAppSimpleSceneEditor.editContainer).find(".s3dAppSimpleEditorItemContainer .s3dAppSimpleEditorItemInputBtnModel").click(function (){
			let parentObject = thatS3dAppSimpleSceneEditor.manager.viewer.getObject3DByName(s3dAppSimpleEditorStatic.name.objects);
			let parentUnitInfo = parentObject.userData.info;
			thatS3dAppSimpleSceneEditor.manager.adder.show({
				beforeAddComponent: thatS3dAppSimpleSceneEditor.beforeAddComponent,
				groupId: parentUnitInfo.id
			});
			return false;
		});
	}

	this.afterAddNewObject = function (p){
		switch (p.nodeJson.name){
			case s3dAppSimpleEditorStatic.name.target:{
				let targetObject = thatS3dAppSimpleSceneEditor.manager.viewer.getObject3DById(p.nodeJson.id);

				targetObject.disableSelect = true;

				let box = new THREE.Box3().setFromObject(targetObject, true);
				let xSize = box.max.x - box.min.x;
				let ySize = box.max.y - box.min.y;
				let zSize = box.max.z - box.min.z;
				let maxSize = -Number.MAX_VALUE;
				if(xSize > maxSize){
					maxSize = xSize;
				}
				if(ySize > maxSize){
					maxSize = ySize;
				}
				if(zSize > maxSize){
					maxSize = zSize;
				}
				let scaleValue = 1 / maxSize;
				targetObject.userData.info.scale = [scaleValue, scaleValue, scaleValue];
				thatS3dAppSimpleSceneEditor.manager.viewer.refreshObject3DPositionRotationScale(targetObject);

				//重新设置阴影
				let shadowObject = thatS3dAppSimpleSceneEditor.manager.viewer.getObject3DByName(s3dAppSimpleEditorStatic.name.shadow);
				shadowObject.userData.info.scale = [xSize * scaleValue * s3dAppSimpleEditorStatic.value.shadowDefaultScale, 1, zSize *scaleValue * s3dAppSimpleEditorStatic.value.shadowDefaultScale];
				shadowObject.userData.info.position = [0, targetObject.position.y - ySize * scaleValue / 2, 0];
				thatS3dAppSimpleSceneEditor.manager.viewer.refreshObject3DPositionRotationScale(shadowObject);

				//重新生成material
				thatS3dAppSimpleSceneEditor.removeTargetMaterials();
				thatS3dAppSimpleSceneEditor.generateTargetMaterials(targetObject);

				break;
			}
		}
	}

	this.removeTargetMaterials = function (){
		let userDataName = s3dAppSimpleEditorStatic.name.userDataName;
		let userDataInfo = thatS3dAppSimpleSceneEditor.manager.getUserData(userDataName);
		let materialCodes = userDataInfo.materials;
		for(let i = 0; i < materialCodes.length; i++) {
			let materialCode = materialCodes[i];
			thatS3dAppSimpleSceneEditor.manager.localMaterials.removeUserMaterial(materialCode);
		}
	}

	this.generateTargetMaterials = function (targetObject){
		let userDataName = s3dAppSimpleEditorStatic.name.userDataName;
		let userDataInfo = thatS3dAppSimpleSceneEditor.manager.getUserData(userDataName);
		userDataInfo.materials = [];
		let targetUnitInfo = targetObject.userData.info;
		targetUnitInfo.materials = {};

		let nodeJson = thatS3dAppSimpleSceneEditor.manager.viewer.getNodeJson(targetUnitInfo.id);
		let resourceObjectInfo = thatS3dAppSimpleSceneEditor.manager.viewer.getResourceObjectInfo(nodeJson);
		let objectMaterialHash = resourceObjectInfo.materialInfo.materialHash;
		const refreshTextureImageInfo = function (materialCode, sourceMaterial, mapTextureName, attributeName, checkCount){
			let materialInfo = thatS3dAppSimpleSceneEditor.manager.localMaterials.getUserMaterialInfo(materialCode)
			let texture = sourceMaterial[mapTextureName];
			if(texture.source.data == null && checkCount * thatS3dAppSimpleSceneEditor.textureCheckSpan < thatS3dAppSimpleSceneEditor.textureMaxLoadingTime){
				setTimeout(function (){
					refreshTextureImageInfo(materialCode, sourceMaterial, mapTextureName, attributeName, checkCount + 1);
				}, thatS3dAppSimpleSceneEditor.textureCheckSpan);
			}
			else{
				materialInfo[attributeName] = thatS3dAppSimpleSceneEditor.manager.localMaterials.getObjectImageUrl(texture);
				thatS3dAppSimpleSceneEditor.manager.localMaterials.updateUserMaterial(materialInfo);
			}
		}

		for(let sourceMatName in objectMaterialHash) {
			let materialObject = objectMaterialHash[sourceMatName].material;
			let newMaterialInfo = thatS3dAppSimpleSceneEditor.manager.localMaterials.createMaterialBySourceMaterial(materialObject);
			thatS3dAppSimpleSceneEditor.manager.localMaterials.addUserMaterial(newMaterialInfo);

			if(materialObject.map != null){
				refreshTextureImageInfo(newMaterialInfo.code, materialObject, "map", "imageName", 0);
			}
			if(materialObject.normalMap != null){
				refreshTextureImageInfo(newMaterialInfo.code, materialObject, "normalMap", "normalImageName", 0);
			}
			if(materialObject.alphaMap != null){
				refreshTextureImageInfo(newMaterialInfo.code, materialObject, "alphaMap", "opacityImageName", 0);
			}
			if(materialObject.roughnessMap != null){
				refreshTextureImageInfo(newMaterialInfo.code, materialObject, "roughnessMap", "roughnessImageName", 0);
			}
			if(materialObject.metalnessMap != null){
				refreshTextureImageInfo(newMaterialInfo.code, materialObject, "metalnessMap", "metalnessImageName", 0);
			}

			let newMaterialCode = newMaterialInfo.code;
			userDataInfo.materials.push(newMaterialCode);
			targetUnitInfo.materials[sourceMatName] = {
				code: newMaterialCode
			};
			thatS3dAppSimpleSceneEditor.manager.localObjectCreator.setLocalObject3DMaterial(targetObject, targetUnitInfo, sourceMatName, newMaterialCode);
		}

		thatS3dAppSimpleSceneEditor.manager.appSimpleEditor.materialEditor.refreshList(userDataInfo.materials);
	}

	this.beforeAddComponent = function (p){
		let targetObject = thatS3dAppSimpleSceneEditor.manager.viewer.getObject3DByName(s3dAppSimpleEditorStatic.name.target);
		let targetUnitInfo = targetObject.userData.info;
		let position = [targetObject.position.x, targetObject.position.y, targetObject.position.z];
		let rotation = [targetObject.rotation.x, targetObject.rotation.y, targetObject.rotation.z];
		let unitJson = p.unitJson;
		unitJson.position = position;
		unitJson.rotation = rotation;
		unitJson.name = s3dAppSimpleEditorStatic.name.target;
		unitJson.isOnGround = false;

		thatS3dAppSimpleSceneEditor.manager.viewer.removeObjectByIdInSilence(targetUnitInfo.id);
	}

	this.setValue = function (name, value){
		let dataInfo = thatS3dAppSimpleSceneEditor.dataInfo;
		switch(name){
			case "title":{
				dataInfo[name] = value;
				break;
			}
			case "subTitle":{
				dataInfo[name] = value;
				break;
			}
			case "description":{
				dataInfo[name] = value;
				break;
			}
			case "homePageUrl":{
				dataInfo[name] = value;
				break;
			}
		}
	}

	this.refreshToView = function (name, valueStr){
		switch(name) {
			case "name": {
				thatS3dAppSimpleSceneEditor.manager.viewer.setModelName(valueStr);
				thatS3dAppSimpleSceneEditor.manager.appSimpleHeader.refreshSubTitle({
					subTitle: valueStr
				});
				break;
			}
			default: {
				thatS3dAppSimpleSceneEditor.pageInfo.itemMap[name] = {
					code: name,
					value: valueStr
				};
				thatS3dAppSimpleSceneEditor.manager.screen2D.updateContent2DItem({
					code: name,
					value: valueStr
				});
				break;
			}
		}
	}
}
export default S3dAppSimpleSceneEditor