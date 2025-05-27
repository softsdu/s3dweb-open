import {
	cmnPcr,
	msgBox,
	s3dMaterialEditType,
	s3dNormalViewport,
	s3dOperateType,
	s3dUiStatus
} from "../../../commonjs/common/common.js"
import "../S3dAppSimpleEditor.css"
import "./S3dAppSimpleCameraEditor.css"
import {s3dAppSimpleEditorStatic} from "../s3dAppSimpleEditorStatic.js"

let S3dAppSimpleCameraEditor = function (){
	
	//当前对象
	const thatS3dAppSimpleCameraEditor = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	this.dataInfo = null;

	this.editContainer = null;

	this.pageInfo = null;

	//初始化
	this.init = function(p){
		thatS3dAppSimpleCameraEditor.containerId = p.containerId;
		thatS3dAppSimpleCameraEditor.manager = p.manager;
	}

	this.show = function (){
		thatS3dAppSimpleCameraEditor.manager.viewer.changeStatus({
			status: s3dUiStatus.normalView
		});
	}

	this.getHtml = function () {
		let html = "";

		//初始视角
		html += "<div class='s3dAppSimpleEditorGroupContainer'>";
		html += "<div class='s3dAppSimpleEditorGroupHeader'>";
		html += "<div class='s3dAppSimpleEditorGroupTitle'>初始视角</div>";
		html += "</div>";
		html += "<div class='s3dAppSimpleEditorListContainer'>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='setCenterViewport'><div class='s3dAppSimpleEditorItemValue'><div class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputBtn s3dAppSimpleEditorItemInputBtnSetCenterViewport'>居中显示</div></div></div>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='resetCamera'><div class='s3dAppSimpleEditorItemValue'><div class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputBtn s3dAppSimpleEditorItemInputBtnResetCamera'>恢复初始视角</div></div></div>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='recordCamera'><div class='s3dAppSimpleEditorItemValue'><div class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputBtn s3dAppSimpleEditorItemInputBtnRecordCamera'>设置初始视角</div></div></div>";
		html += "</div>";
		html += "</div>";

		//摄像机
		html += "<div class='s3dAppSimpleEditorGroupContainer'>";
		html += "<div class='s3dAppSimpleEditorGroupHeader'>";
		html += "<div class='s3dAppSimpleEditorGroupTitle'>摄像机</div>";
		html += "</div>";
		html += "<div class='s3dAppSimpleEditorListContainer'>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='orbitMinDistance'><div class='s3dAppSimpleEditorItemTitle'>最近距离</div><div class='s3dAppSimpleEditorItemValue'><input type='number' class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputNumber' /></div></div>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='orbitMaxDistance'><div class='s3dAppSimpleEditorItemTitle'>最远距离</div><div class='s3dAppSimpleEditorItemValue'><input type='number' class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputNumber' /></div></div>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='orbitMinPolarAngle'><div class='s3dAppSimpleEditorItemTitle'>最小角度</div><div class='s3dAppSimpleEditorItemValue'><input type='number' class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputNumber' /></div></div>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='orbitMaxPolarAngle'><div class='s3dAppSimpleEditorItemTitle'>最大角度</div><div class='s3dAppSimpleEditorItemValue'><input type='number' class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputNumber' /></div></div>";
		html += "</div>";
		html += "</div>";

		//模型旋转
		html += "<div class='s3dAppSimpleEditorGroupContainer'>";
		html += "<div class='s3dAppSimpleEditorGroupHeader'>";
		html += "<div class='s3dAppSimpleEditorGroupTitle'>模型旋转</div>";
		html += "</div>";
		html += "<div class='s3dAppSimpleEditorListContainer'>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='objectRotationX'><div class='s3dAppSimpleEditorItemTitle'>X轴</div><div class='s3dAppSimpleEditorItemValue'><input type='number' step='1' class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputNumber' /></div></div>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='objectRotationY'><div class='s3dAppSimpleEditorItemTitle'>Y轴</div><div class='s3dAppSimpleEditorItemValue'><input type='number' step='1' class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputNumber' /></div></div>";
		html += "<div class='s3dAppSimpleEditorItemContainer' name='objectRotationZ'><div class='s3dAppSimpleEditorItemTitle'>Z轴</div><div class='s3dAppSimpleEditorItemValue'><input type='number' step='1' class='s3dAppSimpleEditorItemInput s3dAppSimpleEditorItemInputNumber' /></div></div>";
		html += "</div>";
		html += "</div>";

		return html;
	}

	this.initValues = function (p) {
		thatS3dAppSimpleCameraEditor.editContainer = p.editContainer;
		thatS3dAppSimpleCameraEditor.dataInfo = p.dataInfo;
		thatS3dAppSimpleCameraEditor.pageInfo = p.pageInfo;

		let objectsObject = thatS3dAppSimpleCameraEditor.manager.viewer.getObject3DByName(s3dAppSimpleEditorStatic.name.objects);
		if(p.dataInfo.objectRotationX == null || p.dataInfo.objectRotationY == null || p.dataInfo.objectRotationZ == null) {
			p.dataInfo.objectRotationX = objectsObject.rotation.x * 360 / Math.PI;
			p.dataInfo.objectRotationY = objectsObject.rotation.y * 360 / Math.PI;
			p.dataInfo.objectRotationZ = objectsObject.rotation.z * 360 / Math.PI;
		}
		if(p.dataInfo.orbitMinDistance == null || p.dataInfo.orbitMaxDistance == null || p.dataInfo.orbitMinPolarAngle == null || p.dataInfo.orbitMaxPolarAngle == null){
			let cameraOrbit = thatS3dAppSimpleCameraEditor.manager.s3dObject.camera.orbit;
			if(cameraOrbit == null) {
				p.dataInfo.orbitMinDistance = 0.01;
				p.dataInfo.orbitMaxDistance = 1000;
				p.dataInfo.orbitMinPolarAngle = 0;
				p.dataInfo.orbitMaxPolarAngle = 180;
			}
			else{
				p.dataInfo.orbitMinDistance = cameraOrbit.minDistance;
				p.dataInfo.orbitMaxDistance = cameraOrbit.maxDistance;
				p.dataInfo.orbitMinPolarAngle = cameraOrbit.minPolarAngle * 180 / Math.PI;
				p.dataInfo.orbitMaxPolarAngle = cameraOrbit.maxPolarAngle * 180 / Math.PI;
			}
		}

		thatS3dAppSimpleCameraEditor.initValue({
			name: "objectRotationX",
			value: p.dataInfo["objectRotationX"]
		})
		thatS3dAppSimpleCameraEditor.initValue({
			name: "objectRotationY",
			value: p.dataInfo["objectRotationY"]
		})
		thatS3dAppSimpleCameraEditor.initValue({
			name: "objectRotationZ",
			value: p.dataInfo["objectRotationZ"]
		})
		thatS3dAppSimpleCameraEditor.initValue({
			name: "orbitMinDistance",
			value: p.dataInfo["orbitMinDistance"]
		})
		thatS3dAppSimpleCameraEditor.initValue({
			name: "orbitMaxDistance",
			value: p.dataInfo["orbitMaxDistance"]
		});
		thatS3dAppSimpleCameraEditor.initValue({
			name: "orbitMinPolarAngle",
			value: p.dataInfo["orbitMinPolarAngle"]
		});
		thatS3dAppSimpleCameraEditor.initValue({
			name: "orbitMaxPolarAngle",
			value: p.dataInfo["orbitMaxPolarAngle"]
		});
	}

	this.initValue = function (p){
		$(thatS3dAppSimpleCameraEditor.editContainer).find(".s3dAppSimpleEditorItemContainer[name='"  + p.name + "'] .s3dAppSimpleEditorItemInput").val(p.value);
	}

	this.bindEvents = function (p){
		$(thatS3dAppSimpleCameraEditor.editContainer).find(".s3dAppSimpleEditorItemContainer .s3dAppSimpleEditorItemInputNumber").change(function (){
			let name = $(this).parent().parent().attr("name");
			let valueStr = $(this).val();
			let value = cmnPcr.strToDecimal(valueStr);
			thatS3dAppSimpleCameraEditor.setValue(name, value);
			thatS3dAppSimpleCameraEditor.refreshToView(name, value);
			return false;
		});

		$(thatS3dAppSimpleCameraEditor.editContainer).find(".s3dAppSimpleEditorItemContainer .s3dAppSimpleEditorItemInputBtnSetCenterViewport").click(function (){
			let targetObject = thatS3dAppSimpleCameraEditor.manager.viewer.getObject3DByName(s3dAppSimpleEditorStatic.name.target);
			thatS3dAppSimpleCameraEditor.manager.viewer.setCenterObject(targetObject);
			return false;
		});

		$(thatS3dAppSimpleCameraEditor.editContainer).find(".s3dAppSimpleEditorItemContainer .s3dAppSimpleEditorItemInputBtnResetCamera").click(function (){
			thatS3dAppSimpleCameraEditor.manager.viewer.setNormalViewport(s3dNormalViewport.init);
			return false;
		});

		$(thatS3dAppSimpleCameraEditor.editContainer).find(".s3dAppSimpleEditorItemContainer .s3dAppSimpleEditorItemInputBtnRecordCamera").click(function (){
			let cameraInfo = thatS3dAppSimpleCameraEditor.manager.viewer.getCurrentCameraInfo();
			cameraInfo.type = thatS3dAppSimpleCameraEditor.manager.s3dObject.camera.type;
			thatS3dAppSimpleCameraEditor.manager.viewer.setCameraInfo(cameraInfo);
			msgBox.alert({info: "设置成功."});
			return false;
		});
	}

	this.setValue = function (name, value){
		let dataInfo = thatS3dAppSimpleCameraEditor.dataInfo;
		dataInfo[name] = value;
	}

	this.refreshToView = function (name, value){
		let dataInfo = thatS3dAppSimpleCameraEditor.dataInfo;
		switch(name){
			case "objectRotationX":
			case "objectRotationY":
			case "objectRotationZ":{
				let rotation = [
					dataInfo.objectRotationX * Math.PI / 180,
					dataInfo.objectRotationY * Math.PI / 180,
					dataInfo.objectRotationZ * Math.PI / 180,
				];
				let objectsObject = thatS3dAppSimpleCameraEditor.manager.viewer.getObject3DByName(s3dAppSimpleEditorStatic.name.objects);
				let objectsUnitInfo = objectsObject.userData.info;
				objectsUnitInfo.rotation = rotation;
				thatS3dAppSimpleCameraEditor.manager.viewer.refreshObject3DPositionRotationScale(objectsObject);
				break;
			}
			case "orbitMinDistance":
			case "orbitMaxDistance":
			case "orbitMinPolarAngle":
			case "orbitMaxPolarAngle": {
				let cameraInfo = thatS3dAppSimpleCameraEditor.manager.s3dObject.camera;
				if (cameraInfo.orbit == null) {
					cameraInfo.orbit = {};
				}
				cameraInfo.orbit.minDistance = dataInfo.orbitMinDistance;
				cameraInfo.orbit.maxDistance = dataInfo.orbitMaxDistance;
				cameraInfo.orbit.minPolarAngle = dataInfo.orbitMinPolarAngle * Math.PI / 180;
				cameraInfo.orbit.maxPolarAngle = dataInfo.orbitMaxPolarAngle * Math.PI / 180;

				let orbitControl = thatS3dAppSimpleCameraEditor.manager.viewer.orbitControl;
				orbitControl.minPolarAngle = cameraInfo.orbit.minPolarAngle;
				orbitControl.maxPolarAngle = cameraInfo.orbit.maxPolarAngle;
				orbitControl.minDistance = cameraInfo.orbit.minDistance;
				orbitControl.maxDistance = cameraInfo.orbit.maxDistance;
				break;
			}
		}
	}

	//开启添加到undo list
	this.beginAddToUndoList = function (nodeId) {
		let nodeJsons = [];
		nodeJsons.push(thatS3dAppSimpleCameraEditor.manager.viewer.cloneJsonById(nodeId));
		thatS3dAppSimpleCameraEditor.manager.statusBar.beginAddToUndoList({
			operateType: s3dOperateType.edit,
			nodeJsons: nodeJsons
		});
	};
}
export default S3dAppSimpleCameraEditor