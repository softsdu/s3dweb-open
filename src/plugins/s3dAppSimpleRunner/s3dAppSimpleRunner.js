import {cmnPcr, msgBox, s3dElement3DType} from "../../commonjs/common/common.js"

let S3dAppSimpleRunner = function (){
	
	//当前对象
	const thatS3dAppSimpleRunner = this;
	
	//containerId
	this.containerId = null;
	
	//s3d manager
	this.manager = null;

	//初始化
	this.init = function(p){
		thatS3dAppSimpleRunner.containerId = p.containerId;
		thatS3dAppSimpleRunner.manager = p.manager;
	}


	this.playCurrentPageAnimations = function (){
		let pageIndex = thatS3dAppSimpleRunner.manager.screen2D.currentPageIndex;
		let pageList = thatS3dAppSimpleRunner.manager.userContent2D.getSortedPageList();
		let pageInfo = pageList[pageIndex];
		let animations = pageInfo.animations;
		thatS3dAppSimpleRunner.manager.userAnimations.playAnimations(animations);
	}

	this.stopAnimations = function (){
		thatS3dAppSimpleRunner.manager.userAnimations.stopAnimations();
	}

	this.setAllTagsVisible = function (visible){
		for(let objectId in thatS3dAppSimpleRunner.manager.viewer.allObject3DMap){
			let object3D = thatS3dAppSimpleRunner.manager.viewer.getObject3DById(objectId);
			let unitInfo = object3D.userData.info;
			if(unitInfo.type === s3dElement3DType.tag){
				object3D.visible = visible;
			}
		}
	}

	this.setAllObjectsVisible = function (visible){
		for(let objectId in thatS3dAppSimpleRunner.manager.viewer.allObject3DMap){
			let object3D = thatS3dAppSimpleRunner.manager.viewer.getObject3DById(objectId);
			object3D.visible = visible;
		}
	}

	this.getTagCount = function (){
		let tagCount = 0;
		for(let objectId in thatS3dAppSimpleRunner.manager.viewer.allObject3DMap){
			let object3D = thatS3dAppSimpleRunner.manager.viewer.getObject3DById(objectId);
			let unitInfo = object3D.userData.info;
			if(unitInfo.type === s3dElement3DType.tag){
				tagCount++;
			}
		}
		return tagCount;
	}
}
export default S3dAppSimpleRunner