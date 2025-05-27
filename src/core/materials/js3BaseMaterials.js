import * as THREE from "three"
import {s3dContent2DShiftType, s3dImageSourceType} from "../../commonjs/common/common.js";

let JS3BaseMaterials =  function() {

	const thatBaseMaterials = this;

	this.manager = null;

	this.commonWidth = 256;
	this.commonHeight = 256;

	this.creators = {};

	this.typeMap = {};

	this.types = [
		{code: "Standard", name: "标准材质"},
		{code: "Physical", name: "物理材质"},
		{code: "Clay", name: "陶"},
		{code: "CeramicPolished", name: "瓷（亮光）"},
		{code: "CeramicFrosted", name: "瓷（哑光）"},
		{code: "Concrete", name: "混凝土"},
		{code: "Asphalt", name: "沥青"},
		{code: "Lawn", name: "草坪"},
		{code: "GroundLand", name: "地面"},
		{code: "Sand", name: "沙地"},
		{code: "GroundPuddle", name: "泥坑"},
		{code: "Stone", name: "石材"},
		{code: "MarbleFrosted", name: "大理石（哑光）"},
		{code: "Brick", name: "砖"},
		{code: "Fabric", name: "布料"},
		{code: "Leather", name: "皮革"},
		{code: "Water", name: "水面"},
		{code: "Ice", name: "冰面"},
		{code: "Snow", name: "雪"},
		{code: "FruitSkin", name: "果皮"},
		{code: "GlassClearly", name: "玻璃（透明）"},
		{code: "GlassFrosted", name: "玻璃（哑光）"},
		{code: "WoodNatural", name: "木材（原木）"},
		{code: "WoodPolished", name: "木材（亮光）"},
		{code: "WoodFrosted", name: "木材（哑光）"},
		{code: "PaintPolished", name: "油漆（亮光）"},
		{code: "PaintFrosted", name: "油漆（哑光）"},
		{code: "PlasticsSmoothy", name: "塑料（亮光）"},
		{code: "PlasticsFrosted", name: "塑料（哑光）"},
		{code: "MetalFrosted", name: "金属（哑光）"},
		{code: "MarblePolished", name: "大理石（亮光）"},
		{code: "MetalRusted", name: "金属（生锈）"},
		{code: "MetalPolished", name: "金属（亮光）"},
		{code: "Rubber", name: "橡胶"},
		{code: "Paper", name: "纸张"},
		{code: "SelfLuminous", name: "自发光物"},
	]

	//初始化
	this.init = function (p) {
		thatBaseMaterials.manager = p.manager;
		thatBaseMaterials.initTypeMap();
	}

	this.initTypeMap = function (){
		let typeMap = {};
		for(let i = 0; i < this.types.length; i++){
			let typeInfo= thatBaseMaterials.types[i];
			typeMap[typeInfo.code] = typeInfo;
		}
		thatBaseMaterials.typeMap = typeMap;
	}

	this.getTypeInfo = function (code){
		return thatBaseMaterials.typeMap[code];
	}

	this.defaultCreator = function (p) {
		return thatBaseMaterials.createStandardMaterial(p, {
			color: 0xCCCCCC
		});
	}

	this.getTextureByImageName = function (isServer, imageName, scaleWidth, scaleHeight, rotation, isMirror) {
		let textureLoader = new THREE.TextureLoader();
		let imageUrl = "";
		if(isServer){
			imageUrl = thatBaseMaterials.manager.service.url + "web/design/common/img/material/" + imageName;
		}
		else{
			imageUrl = thatBaseMaterials.manager.localImages.getImageUrl(imageName);
			/*
			let splitter = "://";
			let splitterIndex = imageName.indexOf(splitter);
			let imageResourceType = s3dImageSourceType.local;
			if(splitterIndex >= 0) {
				imageResourceType = imageName.substr(0, splitterIndex);
				imageName = imageName.substr(imageResourceType.length + splitter.length);
			}
			switch (imageResourceType) {
				case s3dImageSourceType.object: {
					imageUrl = thatBaseMaterials.manager.resourceLoader.getLocalFilesDirUrl() + imageName;
					break;
				}
				case s3dImageSourceType.system: {
					imageUrl = thatBaseMaterials.manager.layout.resourcesPublicFolder + "../../common/img/material/" + imageName + ".jpg";
					break;
				}
				case s3dImageSourceType.local:
				default: {
					imageUrl = thatBaseMaterials.manager.layout.resourcesUserFolder + "images/" + imageName
					break;
				}
			}
			*/
		}
		let texture = textureLoader.load(imageUrl, function (texture) {
			let repeatWidth = texture.userData.config.scale.width == null ? thatBaseMaterials.commonWidth / texture.source.data.width : texture.userData.config.scale.width;
			let repeatHeight = texture.userData.config.scale.height == null ? thatBaseMaterials.commonHeight / texture.source.data.height : texture.userData.config.scale.height;
			texture.repeat.set(repeatWidth, repeatHeight);
			let repeatType = texture.userData.config.isMirror ? THREE.MirroredRepeatWrapping : THREE.RepeatWrapping;
			texture.wrapS = repeatType;
			texture.wrapT = repeatType;
			texture.rotation = -Math.PI / 2 + (texture.userData.config.rotation == null ? 0 : Math.PI * texture.userData.config.rotation / 180);
		});
		texture.userData.config = {
			scale: {
				width: scaleWidth,
				height: scaleHeight
			},
			rotation: rotation,
			isMirror: isMirror
		};
		return texture;
	}

	//塑料（亮光）
	this.creators["PlasticsSmoothy"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.1,      // 较低的粗糙度，使表面光滑
			metalness: 0.2,        // 较高的金属度，增强金属感
			transparent: true,   // 开启透明度
			opacity: p.opacity ? p.opacity : 1,		// 透明度，可以根据需要进行调整
		}
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//塑料（哑光）
	this.creators["PlasticsFrosted"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.6,      // 较低的粗糙度，使表面光滑
			metalness: 0.0,        // 较高的金属度，增强金属感
		}
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//金属（亮光）
	this.creators["MetalPolished"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.2,      // 较低的粗糙度，使表面光滑
			metalness: 0.8,        // 较高的金属度，增强金属感
			specular: 0x111111, // 高光颜色，模拟金属光泽
			shininess: 100, // 高光强度，数值越高越亮
		}
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//金属（哑光）
	this.creators["MetalFrosted"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.6,      // 中等的粗糙度，使表面既有光滑感又有哑光效果
			metalness: 0.1,        // 一定的金属感
		}
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//金属（生锈）
	this.creators["MetalRusted"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.2,      // 较低的粗糙度，使表面光滑
			metalness: 1.0,        // 较高的金属度，增强金属感
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//大理石（亮光）
	this.creators["MarblePolished"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.2,
			metalness: 0.1,
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//大理石（哑光）
	this.creators["MarbleFrosted"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.6,
			metalness: 0.1,
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//木材（亮光）
	this.creators["WoodPolished"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.2,
			metalness: 0.1,
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//木材（原木）
	this.creators["WoodNatural"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.2,
			metalness: 0.1,
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//木材（哑光）
	this.creators["WoodFrosted"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.5,
			metalness: 0,
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//自发光
	this.creators["SelfLuminous"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			emissive: 0x000000,
			emissiveIntensity: 0.5,
			transparent: true,
			opacity: p.opacity ? p.opacity : 0.99,
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//地面
	this.creators["GroundLand"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 1.0,
			metalness: 0.0,
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//混凝土
	this.creators["Concrete"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 1.0,
			metalness: 0.0,
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//影子
	this.creators["Shadow"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 1.0,
			metalness: 0.0,
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//皮革
	this.creators["Leather"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.5,
			metalness: 0.0,
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//玻璃（透明）
	this.creators["GlassClearly"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.0,
			metalness: 0.25,
			transparent: true,
			transmission: 1.0,
			alphaTest: 0.5
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//玻璃（哑光）
	this.creators["GlassFrosted"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.5,
			metalness: 0.0,
			transparent: true,
			transmission: 0.8,
			alphaTest: 0.5
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//石材
	this.creators["Stone"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.9,
			metalness: 0.0,
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//砖
	this.creators["Brick"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 1.0,
			metalness: 0.0,
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//瓷（亮光）
	this.creators["CeramicPolished"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.1,
			metalness: 0.0,
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//瓷（哑光）
	this.creators["CeramicFrosted"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			roughness: 0.5,
			metalness: 0.0,
		};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	//漆面（亮光）
	this.creators["PaintPolished"] = function (p) {
		let defaultConfig = {
			color: 0xFFFFFF,
			clearcoat: 1.0,
			clearcoatRoughness: 0.02,
			sheen: 0.2, // 开启细微的丝绸/皮毛光泽效果，模仿车漆在某些角度下的微妙光泽
			sheenColor: 16777215, // 光泽颜色为白色，保持广泛适用性
			sheenRoughness: 0.2, // 光泽有一定扩散，但不是很粗糙
			ior: 1.52, // 可选，车漆的折射率略高于空气，增强立体感（并非所有实现都支持）
			specularIntensity: 0.7, // 减少镜面高光强度，因为车漆通常不会产生过于强烈的镜面反射
			reflectivity: 0.4, // 提高总体反射率，车漆通常具有较高的反射性能
		};
		return thatBaseMaterials.createPhysicalMaterial(p, defaultConfig);
	}

	this.creators["Standard"] = function (p) {
		let defaultConfig = {};
		return thatBaseMaterials.createStandardMaterial(p, defaultConfig);
	}

	this.creators["Physical"] = function (p) {
		let defaultConfig = {};
		return thatBaseMaterials.createPhysicalMaterial(p, defaultConfig);
	}


	this.createStandardMaterial = function (p, config) {
		//将code作为material的name
		config.name = p.code;

		if (p.imageName && p.imageName.length !== 0) {
			config.map = thatBaseMaterials.getTextureByImageName(p.isServer, p.imageName, p.scaleWidth, p.scaleHeight, p.rotation, p.isMirror);
			delete config.color;
		}
		if (p.color) {
			config.color = p.color;
		}
		if (p.isDoubleSide) {
			config.side = THREE.DoubleSide;
		}
		if (p.normalImageName && p.normalImageName.length !== 0) {
			config.normalMap = thatBaseMaterials.getTextureByImageName(p.isServer, p.normalImageName, p.scaleWidth, p.scaleHeight, p.rotation, p.isMirror);
		}
		if (p.transparent != null) {
			config.transparent = p.transparent;
		}
		if (p.opacity != null) {
			config.opacity = p.opacity;
		}
		if (p.opacityImageName && p.opacityImageName.length !== 0) {
			config.alphaMap = thatBaseMaterials.getTextureByImageName(p.isServer, p.opacityImageName, p.scaleWidth, p.scaleHeight, p.rotation, p.isMirror);
			config.opacity = p.opacity != null ? p.opacity : 1;
		}
		if (p.roughness != null) {
			config.roughness = p.roughness;
		}
		if (p.roughnessImageName && p.roughnessImageName.length !== 0) {
			config.roughnessMap = thatBaseMaterials.getTextureByImageName(p.isServer, p.roughnessImageName, p.scaleWidth, p.scaleHeight, p.rotation, p.isMirror);
			config.roughness = p.roughness != null ? p.roughness : 1;
		}
		if (p.metalness != null) {
			config.metalness = p.metalness;
		}
		if (p.metalnessImageName && p.metalnessImageName.length !== 0) {
			config.metalnessMap = thatBaseMaterials.getTextureByImageName(p.isServer, p.metalnessImageName, p.scaleWidth, p.scaleHeight, p.rotation, p.isMirror);
			config.metalness = p.metalness != null ? p.metalness : 1;
		}
		if (p.envMapIntensity != null) {
			config.envMapIntensity = p.envMapIntensity;
		}
		if (config.envMapIntensity != null && config.envMapIntensity > 0 && thatBaseMaterials.manager.viewer.scene.environment != null) {
			config.envMap = thatBaseMaterials.manager.viewer.scene.environment;
		}

		let material = new THREE.MeshStandardMaterial(config);
		material.envMapIntensity = p.envMapIntensity;
		material.isS3dMaterial = true;
		return material;
	}

	this.createPhysicalMaterial = function (p, config) {
		//将code作为material的name
		config.name = p.code;

		if (p.imageName && p.imageName.length !== 0) {
			config.map = thatBaseMaterials.getTextureByImageName(p.isServer, p.imageName, p.scaleWidth, p.scaleHeight, p.rotation, p.isMirror);
			delete config.color;
		}
		if (p.color) {
			config.color = p.color;
		}
		if (p.normalImageName && p.normalImageName.length !== 0) {
			config.normalMap = thatBaseMaterials.getTextureByImageName(p.isServer, p.normalImageName, p.scaleWidth, p.scaleHeight, p.rotation, p.isMirror);
		}
		if (p.transparent != null) {
			config.transparent = p.transparent;
		}
		if (p.opacity != null) {
			config.opacity = p.opacity;
		}
		if (p.isDoubleSide) {
			config.side = THREE.DoubleSide;
		}
		if (p.opacityImageName && p.opacityImageName.length !== 0) {
			config.alphaMap = thatBaseMaterials.getTextureByImageName(p.isServer, p.opacityImageName, p.scaleWidth, p.scaleHeight, p.rotation, p.isMirror);
			config.opacity = p.opacity != null ? p.opacity : 1;
		}
		if (p.roughness != null) {
			config.roughness = p.roughness;
		}
		if (p.roughnessImageName && p.roughnessImageName.length !== 0) {
			config.roughnessMap = thatBaseMaterials.getTextureByImageName(p.isServer, p.roughnessImageName, p.scaleWidth, p.scaleHeight, p.rotation, p.isMirror);
			config.roughness = p.roughness != null ? p.roughness : 1;
		}
		if (p.metalness != null) {
			config.metalness = p.metalness;
		}
		if (p.metalnessImageName && p.metalnessImageName.length !== 0) {
			config.metalnessMap = thatBaseMaterials.getTextureByImageName(p.isServer, p.metalnessImageName, p.scaleWidth, p.scaleHeight, p.rotation, p.isMirror);
			config.metalness = p.metalness != null ? p.metalness : 1;
		}
		if (p.envMapIntensity != null) {
			config.envMapIntensity = p.envMapIntensity;
		}
		if (config.envMapIntensity != null && config.envMapIntensity > 0 && thatBaseMaterials.manager.viewer.scene.environment != null) {
			config.envMap = thatBaseMaterials.manager.viewer.scene.environment;
		}

		let material = new THREE.MeshPhysicalMaterial(config);
		material.envMapIntensity = p.envMapIntensity;
		material.isS3dMaterial = true;
		return material;
	}

	this.createPhongMaterial = function (p, config) {
		//将code作为material的name
		config.name = p.code;

		if (p.imageName && p.imageName.length !== 0) {
			config.map = thatBaseMaterials.getTextureByImageName(p.isServer, p.imageName, p.scaleWidth, p.scaleHeight, p.rotation, p.isMirror);
			delete config.color;
		}
		if (p.color) {
			config.color = p.color;
		}
		if (p.isDoubleSide) {
			config.side = THREE.DoubleSide;
		}
		if (p.normalImageName && p.normalImageName.length !== 0) {
			config.normalMap = thatBaseMaterials.getTextureByImageName(p.isServer, p.normalImageName, p.scaleWidth, p.scaleHeight, p.rotation, p.isMirror);
		}
		if (p.transparent != null) {
			config.transparent = p.transparent;
		}
		if (p.opacity != null) {
			config.opacity = p.opacity;
		}
		if (p.opacityImageName && p.opacityImageName.length !== 0) {
			config.alphaMap = thatBaseMaterials.getTextureByImageName(p.isServer, p.opacityImageName, p.scaleWidth, p.scaleHeight, p.rotation, p.isMirror);
			config.opacity = p.opacity ? p.opacity : 1;
		}
		if (p.color != null) {
			config.specular = p.color;
		}
		if (p.roughness != null) {
			config.shininess = p.roughness * 100;
		}
		if (p.envMapIntensity != null) {
			config.reflectivity = p.envMapIntensity;
		}
		if (config.reflectivity != null && config.reflectivity > 0 && thatBaseMaterials.manager.viewer.scene.environment != null) {
			config.envMap = thatBaseMaterials.manager.viewer.scene.environment;
		}
		/*
		if (p.roughness != null) {
			config.roughness = p.roughness;
		}
		if (p.roughnessImageName && p.roughnessImageName.length !== 0) {
			config.roughnessMap = thatBaseMaterials.getTextureByImageName(p.isServer, p.roughnessImageName, p.scaleWidth, p.scaleHeight, p.rotation, p.isMirror);
			config.roughness = p.roughness ? p.roughness : 1;
		}
		if (p.metalness != null) {
			config.metalness = p.metalness;
		}
		if (p.metalnessImageName && p.metalnessImageName.length !== 0) {
			config.metalnessMap = thatBaseMaterials.getTextureByImageName(p.isServer, p.metalnessImageName, p.scaleWidth, p.scaleHeight, p.rotation, p.isMirror);
			config.metalness = p.metalness ? p.metalness : 1;
		}
		if (p.envMapIntensity != null) {
			config.envMapIntensity = p.envMapIntensity;
		}
		if (config.envMapIntensity != null && config.envMapIntensity > 0 && thatBaseMaterials.manager.viewer.scene.environment != null) {
			config.envMap = thatBaseMaterials.manager.viewer.scene.environment;
		}
		*/


		let material = new THREE.MeshPhongMaterial(config);
		material.envMapIntensity = p.envMapIntensity;
		material.isS3dMaterial = true;
		return material;
	}
}
export default JS3BaseMaterials