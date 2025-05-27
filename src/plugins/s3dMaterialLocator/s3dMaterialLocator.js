import "./s3dMaterialLocator.css"

//S3dCopier 复制粘贴
let S3dMaterialLocator = function (){
	//当前对象
	const thatS3dMaterialLocator = this; 

	this.manager = null;
	
	//containerId
	this.containerId = null;

	//事件
	this.eventFunctions = {};
	this.addEventFunction = function(eventName, func){
		let allFuncs = thatS3dMaterialLocator.eventFunctions[eventName];
		if(allFuncs == null){
			allFuncs = [];
			thatS3dMaterialLocator.eventFunctions[eventName] = allFuncs;
		}
		allFuncs.push(func);
	}
	this.doEventFunction = function(eventName, p){
		let allFuncs = thatS3dMaterialLocator.eventFunctions[eventName];
		if(allFuncs != null){
			for(let i = 0; i < allFuncs.length; i++){
				let func = allFuncs[i];
				func(p);
			}
		}
	}

	//初始化
	this.init = function(p){
		thatS3dMaterialLocator.manager = p.manager; 
		thatS3dMaterialLocator.containerId = p.containerId;

		if(p.config.afterLocateMaterial){
			thatS3dMaterialLocator.addEventFunction("afterLocateMaterial", p.config.afterLocateMaterial);
		}
	}

	this.beginLocate = function(){
		let container = $("#" + thatS3dMaterialLocator.containerId).find(".s3dViewerContainer");
		$(container).addClass("s3dMaterialLocateCursor");
	}

	this.cancelLocate = function(){
		let container = $("#" + thatS3dMaterialLocator.containerId).find(".s3dViewerContainer");
		$(container).removeClass("s3dMaterialLocateCursor");
	}

	this.getMaterialInfo = function (unitInfo) {
		let resourceDirectory = unitInfo.parameters["文件夹"].value;
		let resourceFileName = unitInfo.parameters["文件名"].value
		let resourceType = unitInfo.parameters["类型"].value;
		let resourceKey = thatS3dMaterialLocator.manager.object3DCache.getResourceObject3DKey(resourceDirectory + "\\" + resourceFileName, resourceType);
		let resourceObjectInfo = thatS3dMaterialLocator.manager.object3DCache.getResourceObject3D(resourceKey);
		return resourceObjectInfo.materialInfo;
	}

	this.locate = function (p) {
		let unitInfo = p.object3D.userData.info;
		if(unitInfo.isLocal) {
			let materialInfo = thatS3dMaterialLocator.getMaterialInfo(unitInfo);
			let intersectInfo = thatS3dMaterialLocator.getIntersect(p.intersects, p.object3D);
			let meshPath = thatS3dMaterialLocator.getMeshPath(intersectInfo.object);
			let materialNames = materialInfo.pathHash[meshPath];
			let materialName = materialNames[intersectInfo.face.materialIndex];
			if(thatS3dMaterialLocator.manager.propertyEditor != null) {
				thatS3dMaterialLocator.manager.propertyEditor.scrollToMaterialItem(materialName);
			}
			thatS3dMaterialLocator.afterLocateMaterial(materialName);
		}
	}

	this.afterLocateMaterial = function (materialName){
		thatS3dMaterialLocator.doEventFunction("afterLocateMaterial", {
			materialName: materialName
		});
	}

	this.getMeshPath = function (object) {
		let meshPath = "";
		while(!object.isResourceObject){
			let parent = object.parent;
			if(parent != null) {
				for (let i = 0; i < parent.children.length; i++) {
					let child = parent.children[i];
					if (child === object) {
						meshPath = "###" + i + "_" + object.name + meshPath;
						object = parent;
						break;
					}
				}
			}
			else{
				break;
			}
		}
		return meshPath;
	}

	this.getIntersect = function (intersects, object3D){
		if (intersects.length > 0) {
			let index = 0;
			while(index < intersects.length){
				let intersect = intersects[index];
				if(!intersect.object.isLine) {
					let obj3D = thatS3dMaterialLocator.manager.viewer.getS3dObject3D(intersect.object);
					if (object3D === obj3D) {
						return intersect;
					}
				}
				index++;
			}
		}
		return null;
	}
}
export default S3dMaterialLocator