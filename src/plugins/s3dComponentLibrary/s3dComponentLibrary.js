//本地3D组件
let S3dComponentLibrary = function (){
	//当前对象
	const thatComponentLibrary = this;

	this.init = function (p){
		thatComponentLibrary.categories = p.config.categories;
	}

	this.getAllLocalComponentJsons = function(){
		let componentList = [];
		thatComponentLibrary.getLocalComponentJsons(thatComponentLibrary.categories, componentList);
		return componentList;
	}

	this.getLocalComponentJson = function (componentInfo){
		let componentJson = {
			code: componentInfo.code,
			name: componentInfo.name,
			versionNum: componentInfo.versionNum,
			scale: componentInfo.scale,
			parameters: {}
		};
		componentJson.parameters["类型"] = {
			name: "类型",
			defaultValue: componentInfo.fileInfo.type,
			paramType: "string",
			isNullable: false,
			isEditable: false,
			isGeo: true,
			groupName: "文件"
		};
		componentJson.parameters["文件夹"] = {
			name: "文件夹",
			defaultValue: componentInfo.fileInfo.directory,
			paramType: "string",
			isNullable: false,
			isEditable: false,
			isGeo: true,
			groupName: "文件"
		};
		componentJson.parameters["文件名"] = {
			name: "文件名",
			defaultValue: componentInfo.fileInfo.fileName,
			paramType: "string",
			isNullable: false,
			isEditable: false,
			isGeo: true,
			groupName: "文件"
		};
		componentJson.parameters["处理方式"] = {
			name: "处理方式",
			defaultValue: componentInfo.fileInfo.processType,
			paramType: "string",
			isNullable: false,
			isEditable: true,
			isGeo: true,
			groupName: "文件",
			listValues:[
				{
					code: "default",
					name: "默认"
				},
				{
					code: "smooth",
					name: "平滑"
				}
			]
		};
		componentJson.parameters["组成部分"] = {
			name: "组成部分",
			defaultValue: "",
			paramType: "string",
			isNullable: true,
			isEditable: false,
			isGeo: true,
			groupName: "文件"
		};
		return componentJson;
	}

	this.getLocalComponentJsons = function (categories, list){
		if(categories != null){
			for(let i = 0; i < categories.length; i++){
				let category = categories[i];
				if(category.components != null){
					for(let i = 0; i < category.components.length; i++) {
						let componentInfo = category.components[i];
						if (componentInfo.isLocal) {
							let localComponentJson = thatComponentLibrary.getLocalComponentJson(componentInfo);
							list.push(localComponentJson);
						}
					}
				}
				thatComponentLibrary.getLocalComponentJsons(category.children, list);
			}
		}
	}

	this.getComponents = function(categoryCode, keyword, pageIndex, onePageItemCount){
		let category = this.getCategory(categoryCode, thatComponentLibrary.categories);
		let allComponents = [];
		thatComponentLibrary.getAllComponents(category, allComponents);
		let componentList = [];
		let pageBeginIndex = pageIndex * onePageItemCount;
		let pageEndIndex = (pageIndex + 1) * onePageItemCount - 1;
		let index = 0;
		keyword = keyword.toLowerCase();
		for(let i = 0; i < allComponents.length; i++){
			let componentInfo = allComponents[i];
			if(componentInfo.name.toLowerCase().indexOf(keyword) >= 0) {
				if (index >= pageBeginIndex) {
					if (i <= pageEndIndex) {
						componentList.push(componentInfo);
					} else {
						break;
					}
				}
				index++;
			}
		}
		return {
			components: componentList,
			pageIndex: pageIndex
		};
	}

	this.getAllComponents = function (category, list) {
		if (category.children != null) {
			for (let i = 0; i < category.children.length; i++) {
				thatComponentLibrary.getAllComponents(category.children[i], list);
			}
		}
		if (category.components != null) {
			for (let i = 0; i < category.components.length; i++) {
				let componentInfo = category.components[i];
				if (componentInfo.isLocal) {
					list.push({
						code: componentInfo.code,
						name: componentInfo.name,
						versionNum: componentInfo.versionNum,
						imgUrl: componentInfo.fileInfo.imgName != null && componentInfo.fileInfo.imgName.length > 0 ? (componentInfo.fileInfo.directory + "\\" + componentInfo.fileInfo.imgName) : null,
						parameters: componentInfo.parameters,
						isLocal: true,
						isPublic: componentInfo.isPublic
					});
				}
				if (componentInfo.isServer) {
					list.push({
						code: componentInfo.code,
						name: componentInfo.name,
						versionNum: componentInfo.versionNum,
						imgId: componentInfo.imgId,
						isServer: true,
						isPublic: componentInfo.isPublic
					});
				}
			}
		}
	}

	this.getCategory = function (categoryCode, categories){
		if(categories != null)
		for(let i = 0; i < categories.length; i++){
			let category = categories[i];
			if(category.code === categoryCode){
				return category;
			}
			else{
				let c = thatComponentLibrary.getCategory(categoryCode, category.children);
				if(c !== null){
					return c;
				}
			}
		}
		return null;
	}
}
export default S3dComponentLibrary