import * as THREE from "three"
import {cmnPcr, msgBox, s3dElement3DType, s3dOperateType} from "../../commonjs/common/common.js"

//S3dWeb splitter将大模型分解成小模型
let S3dSplitter = function (){
	//当前对象
	const thatS3dSplitter = this;

	this.manager = null;

	this.init= function (p){
		thatS3dSplitter.manager = p.manager;
	}

	this.do = function (p) {
		thatS3dSplitter.split();
	}

	this.split = function (){
		let object3Ds = thatS3dSplitter.manager.viewer.selectedObject3Ds;
		if(object3Ds == null || object3Ds.length !== 1){
			msgBox.alert({info: "请选中一个构件."});
		}
		else{
			let object3D = object3Ds[0];
			let info = object3D.userData.info;
			if(info.isServer || info.type !== s3dElement3DType.unit){
				msgBox.alert({info: "仅支持对本地组件模型进行分解."});
			}
			else if(msgBox.confirm({info: "确定执行分解吗?"})){
				thatS3dSplitter.manager.viewer.unSelectObject3D(object3D);
				let info = object3D.userData.info;
				thatS3dSplitter.splitObject3D(object3D, info);
			}
		}
    }

	this.splitObject3D = function (object3D, info){
		let partName = info.parameters["组成部分"].value;

		let childInfo = thatS3dSplitter.getChildInfo(object3D, info, partName);
		if(childInfo.count === 0){
			msgBox.alert({info: "不包含子构件，无法分解."});
		}
		else {
			let allNewObjectIds = [];
			let newGroupId = cmnPcr.createGuid();
			let groupJson = {
				id: newGroupId,
				name: info.name,
				parentId: info.parentId,
				position: info.position,
				rotation: info.rotation,
				scale: info.scale,
				isGroup: true
			};
			allNewObjectIds.push(newGroupId);

			let objectJsons = [];
			for (let childName in childInfo.infoMap) {
				let subChildInfo = childInfo.infoMap[childName];
				let objectJson = {
					id: cmnPcr.createGuid(),
					name: subChildInfo.name, //info.name + "_" + childName,
					code: info.code,
					versionNum: info.versionNum,
					position: subChildInfo.position,
					rotation: subChildInfo.rotation,
					scale: subChildInfo.scale,
					castShadow: info.castShadow,
					receiveShadow: info.receiveShadow,
					materials: {},
					parameters: {},
					parentId: newGroupId,
					isOnGround: false,
					needSelectAfterAdd: false,
					isLocal: true,
					isServer: false,
					isInternal: false
				};
				for (let paramName in info.parameters) {
					let parameter = info.parameters[paramName];
					objectJson.parameters[paramName] = {
						value: parameter.value
					};
				}
				//组成部分
				objectJson.parameters["组成部分"].value = childName;

				//处理materials
				let resourceDirectory = objectJson.parameters["文件夹"].value;
				let resourceFileName = objectJson.parameters["文件名"].value;
				let resourcePartName = objectJson.parameters["组成部分"].value;
				let resourceType = objectJson.parameters["类型"].value;
				let objectMaterialHash = objectJson.materials;
				let resourceKey = thatS3dSplitter.manager.object3DCache.getResourceObject3DKey(resourceDirectory + "\\" + resourceFileName, resourceType);
				let resourceObjectInfo = thatS3dSplitter.manager.object3DCache.getResourceObject3D(resourceKey);
				let materialInfo = resourceObjectInfo.materialInfo;
				let html = "";
				if (materialInfo != null) {
					let partMaterialNameHash = {};
					let pathHash = materialInfo.pathHash;
					for (let path in pathHash) {
						if (resourcePartName == null || resourcePartName.length === 0 || path.startWith(resourcePartName)) {
							let pathMaterials = pathHash[path];
							for (let i = 0; i < pathMaterials.length; i++) {
								let materialName = pathMaterials[i];
								if (!partMaterialNameHash[materialName]) {
									partMaterialNameHash[materialName] = true;
								}
							}
						}
					}
					let childMaterials = {};
					for(let materialName in partMaterialNameHash){
						if(info.materials[materialName]){
							childMaterials[materialName] = {
								code: info.materials[materialName].code
							};
						}
					}
					objectJson.materials = childMaterials;
				}

				objectJsons.push(objectJson);
				allNewObjectIds.push(objectJson.id);
			}

			//开始记录到undo list
			thatS3dSplitter.manager.viewer.beginAddToUndoList(s3dOperateType.splitLocal, allNewObjectIds.reverse(), {sourceNodeId: info.id});

			thatS3dSplitter.manager.viewer.addNewGroupInSilence(groupJson);

			thatS3dSplitter.manager.treeEditor.addGroupNodeInSilence(groupJson);

			thatS3dSplitter.manager.viewer.addNewObjectsInSilence(objectJsons);

			thatS3dSplitter.manager.treeEditor.addLeafNodesInSilence(objectJsons, newGroupId);

			thatS3dSplitter.manager.viewer.removeObjectByIdInSilence(info.id);

			thatS3dSplitter.manager.treeEditor.removeNodeInSilence(info.id);

			//结束添加到undo list
			thatS3dSplitter.manager.viewer.endAddToUndoList(s3dOperateType.splitLocal, allNewObjectIds, {sourceNodeId: info.id});
		}
	}

	this.getChildInfo = function (object3D, info, parentPath) {
		let cloneObject3D = object3D.clone();
		cloneObject3D.position.set(0, 0, 0);
		cloneObject3D.rotation.set(0, 0, 0);

		let outerObject3D = cloneObject3D.children[0];
		let innerObject3D = outerObject3D.children[0];
		if(parentPath == null || parentPath.length === 0){
			parentPath = "";
		}

		let children = innerObject3D.children;
		cloneObject3D.updateWorldMatrix(true, false);
		innerObject3D.updateWorldMatrix(true, false);
		let innerObjWorldMatrix = innerObject3D.matrixWorld.clone();
		let invertInnerObjWorldMatrix = innerObjWorldMatrix.clone().invert();
		let allInfoMap = {};
		for (let i = 0; i < children.length; i++) {
			let child = children[i];
			let path = parentPath + "###" + i + "_" + child.name;
			let wBox = new THREE.Box3().setFromObject(child, true);
			let wCenter = new THREE.Vector3((wBox.min.x + wBox.max.x) / 2, (wBox.min.y + wBox.max.y) / 2, (wBox.min.z + wBox.max.z) / 2);

			let oldWPos = child.position.clone().applyMatrix4(innerObjWorldMatrix);
			let newWPos = new THREE.Vector3(oldWPos.x - wCenter.x, oldWPos.y - wCenter.y, oldWPos.z - wCenter.z);
			let newPosition = newWPos.clone().applyMatrix4(invertInnerObjWorldMatrix);``

			let childPosition = {
				x: child.position.x - newPosition.x,
				y: child.position.y - newPosition.y,
				z: child.position.z - newPosition.z,
			};

			let childScale = {
				x: child.scale.x,
				y: child.scale.y,
				z: child.scale.z
			};
			//如果没有子了，那么scale无效（不确定这个对不对）
			if(child.children.length === 0){
				childScale = {
					x: 1,
					y: 1,
					z: 1
				};
			}

			let childRotation = {
				x: child.rotation.x,
				y: child.rotation.y,
				z: child.rotation.z
			};

			let childName = child.name;
			if(childName.length === 0){
				childName = info.name + "_" + (i + 1);
			}

			allInfoMap[path] = {
				path: path,
				name: childName,
				position: [childPosition.x, childPosition.y, childPosition.z],
				rotation: [childRotation.x, childRotation.y, childRotation.z],
				scale: [childScale.x, childScale.y, childScale.z]
			};
		}
		return {
			count: children.length,
			infoMap: allInfoMap
		};
	}
}
export default S3dSplitter