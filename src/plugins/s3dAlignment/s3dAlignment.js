import * as THREE from "three";
import {msgBox, s3dOperateType} from "../../commonjs/common/common.js";

//S3dWeb 模型新增
let S3dAlignment = function (){
	//当前对象
	const thatAlignment = this;
	
	//containerId
	this.containerId = null;
	
	//manager
	this.manager = null;

	//初始化
	this.init = function(p){
		thatAlignment.containerId = p.containerId;
		thatAlignment.manager = p.manager;
	}

	this.placeOnGround = function (){
		let objectIds = thatAlignment.manager.viewer.getSelectedObject3DIds();
		thatAlignment.beginAddToUndoList(s3dOperateType.transform, objectIds);
		for(let i = 0; i < objectIds.length; i++){
			let objectId = objectIds[i];
			let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
			let box = new THREE.Box3().setFromObject(object3D, true);
			let top = box.max.y;
			let bottom = box.min.y;
			let height = top - bottom;

			let parentObject3D = object3D.parent;
			object3D.updateWorldMatrix(true, false);
			parentObject3D.updateWorldMatrix(true, false);

			let oldWorldPosition = object3D.position.clone().applyMatrix4(parentObject3D.matrixWorld);
			let newWorldPosition = new THREE.Vector3(oldWorldPosition.x, height / 2, oldWorldPosition.z);
			let newParentWorldMatrix = parentObject3D.matrixWorld;
			let obj3DWorldMatrix = object3D.matrixWorld.clone();

			//逆转newParent3D的世界矩阵并应用到obj3D的世界矩阵上
			let invertNewParentWorldMatrix = newParentWorldMatrix.invert();
			let localMatrix = obj3DWorldMatrix.multiply(invertNewParentWorldMatrix);

			let localPosition = newWorldPosition.applyMatrix4(invertNewParentWorldMatrix);

			thatAlignment.setObjectPosition(objectId, {
				x: localPosition.x,
				y: localPosition.y,
				z: localPosition.z
			});
		}
		thatAlignment.endAddToUndoList(s3dOperateType.transform, objectIds);
	}

	this.alignPX = function (){
		let objectIds = thatAlignment.manager.viewer.getSelectedObject3DIds();
		if (!thatAlignment.checkSameGroup(objectIds)) {
			thatAlignment.showSameGroupAlert();
		} else {
			let maxX = -Number.MAX_VALUE;
			let id2BoxMap = {};
			for (let i = 0; i < objectIds.length; i++) {
				let objectId = objectIds[i];
				let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
				let box = new THREE.Box3().setFromObject(object3D, true);
				if (box.max.x > maxX) {
					maxX = box.max.x;
				}
				id2BoxMap[objectId] = box;
			}

			thatAlignment.beginAddToUndoList(s3dOperateType.transform, objectIds);
			for (let objectId in id2BoxMap) {
				let box = id2BoxMap[objectId];
				let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
				let size = box.max.x - box.min.x;
				thatAlignment.setObjectPosition(objectId, {
					x: maxX - size / 2,
					y: object3D.position.y,
					z: object3D.position.z
				});
			}
			thatAlignment.endAddToUndoList(s3dOperateType.transform, objectIds);
		}
	}

	this.alignNX = function (){
		let objectIds = thatAlignment.manager.viewer.getSelectedObject3DIds();
		if (!thatAlignment.checkSameGroup(objectIds)) {
			thatAlignment.showSameGroupAlert();
		} else {
			let minX = Number.MAX_VALUE;
			let id2BoxMap = {};
			for (let i = 0; i < objectIds.length; i++) {
				let objectId = objectIds[i];
				let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
				let box = new THREE.Box3().setFromObject(object3D, true);
				if (box.min.x < minX) {
					minX = box.min.x;
				}
				id2BoxMap[objectId] = box;
			}

			thatAlignment.beginAddToUndoList(s3dOperateType.transform, objectIds);
			for (let objectId in id2BoxMap) {
				let box = id2BoxMap[objectId];
				let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
				let size = box.max.x - box.min.x;
				thatAlignment.setObjectPosition(objectId, {
					x: minX + size / 2,
					y: object3D.position.y,
					z: object3D.position.z
				});
			}
			thatAlignment.endAddToUndoList(s3dOperateType.transform, objectIds);
		}
	}

	this.alignPY = function (){
		let objectIds = thatAlignment.manager.viewer.getSelectedObject3DIds();
		if (!thatAlignment.checkSameGroup(objectIds)) {
			thatAlignment.showSameGroupAlert();
		} else {
			let maxY = -Number.MAX_VALUE;
			let id2BoxMap = {};
			for (let i = 0; i < objectIds.length; i++) {
				let objectId = objectIds[i];
				let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
				let box = new THREE.Box3().setFromObject(object3D, true);
				if (box.max.y > maxY) {
					maxY = box.max.y;
				}
				id2BoxMap[objectId] = box;
			}

			thatAlignment.beginAddToUndoList(s3dOperateType.transform, objectIds);
			for (let objectId in id2BoxMap) {
				let box = id2BoxMap[objectId];
				let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
				let size = box.max.y - box.min.y;
				thatAlignment.setObjectPosition(objectId, {
					x: object3D.position.x,
					y: maxY - size / 2,
					z: object3D.position.z
				});
			}
			thatAlignment.endAddToUndoList(s3dOperateType.transform, objectIds);
		}
	}

	this.alignNY = function (){
		let objectIds = thatAlignment.manager.viewer.getSelectedObject3DIds();
		if (!thatAlignment.checkSameGroup(objectIds)) {
			thatAlignment.showSameGroupAlert();
		} else {
			let minY = Number.MAX_VALUE;
			let id2BoxMap = {};
			for (let i = 0; i < objectIds.length; i++) {
				let objectId = objectIds[i];
				let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
				let box = new THREE.Box3().setFromObject(object3D, true);
				if (box.min.y < minY) {
					minY = box.min.y;
				}
				id2BoxMap[objectId] = box;
			}

			thatAlignment.beginAddToUndoList(s3dOperateType.transform, objectIds);
			for (let objectId in id2BoxMap) {
				let box = id2BoxMap[objectId];
				let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
				let size = box.max.y - box.min.y;
				thatAlignment.setObjectPosition(objectId, {
					x: object3D.position.x,
					y: minY + size / 2,
					z: object3D.position.z
				});
			}
			thatAlignment.endAddToUndoList(s3dOperateType.transform, objectIds);
		}
	}

	this.alignPZ = function (){
		let objectIds = thatAlignment.manager.viewer.getSelectedObject3DIds();
		if (!thatAlignment.checkSameGroup(objectIds)) {
			thatAlignment.showSameGroupAlert();
		} else {
			let maxZ = -Number.MAX_VALUE;
			let id2BoxMap = {};
			for (let i = 0; i < objectIds.length; i++) {
				let objectId = objectIds[i];
				let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
				let box = new THREE.Box3().setFromObject(object3D, true);
				if (box.max.z > maxZ) {
					maxZ = box.max.z;
				}
				id2BoxMap[objectId] = box;
			}

			thatAlignment.beginAddToUndoList(s3dOperateType.transform, objectIds);
			for (let objectId in id2BoxMap) {
				let box = id2BoxMap[objectId];
				let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
				let size = box.max.z - box.min.z;
				thatAlignment.setObjectPosition(objectId, {
					x: object3D.position.x,
					y: object3D.position.y,
					z: maxZ - size / 2
				});
			}
			thatAlignment.endAddToUndoList(s3dOperateType.transform, objectIds);
		}
	}

	this.alignNZ = function (){
		let objectIds = thatAlignment.manager.viewer.getSelectedObject3DIds();
		if (!thatAlignment.checkSameGroup(objectIds)) {
			thatAlignment.showSameGroupAlert();
		} else {
			let minZ = Number.MAX_VALUE;
			let id2BoxMap = {};
			for (let i = 0; i < objectIds.length; i++) {
				let objectId = objectIds[i];
				let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
				let box = new THREE.Box3().setFromObject(object3D, true);
				if (box.min.z < minZ) {
					minZ = box.min.z;
				}
				id2BoxMap[objectId] = box;
			}

			thatAlignment.beginAddToUndoList(s3dOperateType.transform, objectIds);
			for (let objectId in id2BoxMap) {
				let box = id2BoxMap[objectId];
				let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
				let size = box.max.z - box.min.z;
				thatAlignment.setObjectPosition(objectId, {
					x: object3D.position.x,
					y: object3D.position.y,
					z: minZ + size / 2
				});
			}
			thatAlignment.endAddToUndoList(s3dOperateType.transform, objectIds);
		}
	}

	this.againstX = function (){
		let objectIds = thatAlignment.manager.viewer.getSelectedObject3DIds();
		if (!thatAlignment.checkSameGroup(objectIds)) {
			thatAlignment.showSameGroupAlert();
		} else {
			//主物体
			let mainObjectId = objectIds[0];
			let mainObject3D = thatAlignment.manager.viewer.getObject3DById(mainObjectId);
			let mainBox = new THREE.Box3().setFromObject(mainObject3D, true);
			let minX = mainBox.min.x;
			let maxX = mainBox.max.x;
			let centerX = (maxX + minX) / 2;

			thatAlignment.beginAddToUndoList(s3dOperateType.transform, objectIds);
			for (let i = 1; i < objectIds.length; i++) {
				let objectId = objectIds[i];
				let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
				let box = new THREE.Box3().setFromObject(object3D, true);
				let newX = 0;
				let size = box.max.x - box.min.x;
				if (centerX > (box.max.x + box.min.x) / 2) {
					newX = minX - size / 2;
				} else {
					newX = maxX + size / 2;
				}
				thatAlignment.setObjectPosition(objectId, {
					x: newX,
					y: object3D.position.y,
					z: object3D.position.z
				});
			}
			thatAlignment.endAddToUndoList(s3dOperateType.transform, objectIds);
		}
	}

	this.againstY = function (){
		let objectIds = thatAlignment.manager.viewer.getSelectedObject3DIds();
		if (!thatAlignment.checkSameGroup(objectIds)) {
			thatAlignment.showSameGroupAlert();
		} else {
			//主物体
			let mainObjectId = objectIds[0];
			let mainObject3D = thatAlignment.manager.viewer.getObject3DById(mainObjectId);
			let mainBox = new THREE.Box3().setFromObject(mainObject3D, true);
			let minY = mainBox.min.y;
			let maxY = mainBox.max.y;
			let centerY = (maxY + minY) / 2;

			thatAlignment.beginAddToUndoList(s3dOperateType.transform, objectIds);
			for (let i = 1; i < objectIds.length; i++) {
				let objectId = objectIds[i];
				let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
				let box = new THREE.Box3().setFromObject(object3D, true);
				let newY = 0;
				let size = box.max.y - box.min.y;
				if (centerY > (box.max.y + box.min.y) / 2) {
					newY = minY - size / 2;
				} else {
					newY = maxY + size / 2;
				}
				thatAlignment.setObjectPosition(objectId, {
					x: object3D.position.x,
					y: newY,
					z: object3D.position.z
				});
			}
			thatAlignment.endAddToUndoList(s3dOperateType.transform, objectIds);
		}
	}

	this.againstZ = function () {
		let objectIds = thatAlignment.manager.viewer.getSelectedObject3DIds();
		thatAlignment.beginAddToUndoList(s3dOperateType.transform, objectIds);
		if (!thatAlignment.checkSameGroup(objectIds)) {
			thatAlignment.showSameGroupAlert();
		} else {
			//主物体
			let mainObjectId = objectIds[0];
			let mainObject3D = thatAlignment.manager.viewer.getObject3DById(mainObjectId);
			let mainBox = new THREE.Box3().setFromObject(mainObject3D, true);
			let minZ = mainBox.min.z;
			let maxZ = mainBox.max.z;
			let centerZ = (maxZ + minZ) / 2;

			for (let i = 1; i < objectIds.length; i++) {
				let objectId = objectIds[i];
				let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
				let box = new THREE.Box3().setFromObject(object3D, true);
				let newZ = 0;
				let size = box.max.z - box.min.z;
				if (centerZ > (box.max.z + box.min.z) / 2) {
					newZ = minZ - size / 2;
				} else {
					newZ = maxZ + size / 2;
				}
				thatAlignment.setObjectPosition(objectId, {
					x: object3D.position.x,
					y: object3D.position.y,
					z: newZ
				});
			}
			thatAlignment.endAddToUndoList(s3dOperateType.transform, objectIds);
		}
	}

	this.setObjectPosition = function(objectId, position){
		let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
		let info = object3D.userData.info;
		info.position = [position.x, position.y, position.z];
		object3D.position.set(position.x, position.y, position.z);
	}

	this.checkSameGroup = function (objectIds){
		let groupId = null;
		for(let i = 0; i < objectIds.length; i++){
			let objectId = objectIds[i];
			let object3D = thatAlignment.manager.viewer.getObject3DById(objectId);
			let info = object3D.userData.info;
			if(groupId == null){
				groupId = info.parentId;
			}
			else if(groupId !== info.parentId){
				return false;
			}
		}
		return true;
	}

	this.showSameGroupAlert = function (){
		msgBox.alert({
			info: "此方法仅支持同组内物体的操作"
		});
	}

	//开启添加到undo list
	this.beginAddToUndoList = function(operateType, nodeIds){
		let nodeJsons = [];
		switch(operateType){
			case s3dOperateType.transform:{
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons.push(thatAlignment.manager.viewer.cloneJsonById(nodeId));
				}
				break;
			}
		}
		thatAlignment.manager.statusBar.beginAddToUndoList({
			operateType: operateType,
			nodeJsons: nodeJsons,
			otherInfo: {}
		});
	}

	//结束添加到undo list
	this.endAddToUndoList = function(operateType, nodeIds){
		let nodeJsons = [];
		switch(operateType){
			case s3dOperateType.transform:{
				for(let i = 0; i < nodeIds.length; i++){
					let nodeId = nodeIds[i];
					nodeJsons.push(thatAlignment.manager.viewer.cloneJsonById(nodeId));
				}
				break;
			}
		}
		thatAlignment.manager.statusBar.endAddToUndoList({
			operateType: operateType,
			nodeJsons: nodeJsons,
			otherInfo: {}
		});
	}
}
export default S3dAlignment