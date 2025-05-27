import {paramType} from "../../../commonjs/common/common.js";
export const lightComponentList = [
	{
		code: "Light-Ambient",
		name: "环境光",
		versionNum: "1.0",
		isInternal: true,
		image: "AmbientLight.png",
		icon: "AmbientIcon.png",
		position: [30, 30, 30],
		hasSystemInfo: {
			position: false,
			rotation: false,
			scale: false
		},
		parameters: {
			color: {
				name: "color",
				label: "颜色",
				description: "光照的颜色",
				isEditable: true,
				defaultValue: "FFFFFF",
				paramType: paramType.color
			},
			intensity: {
				name: "intensity",
				label: "强度",
				description: "光照的强度",
				isEditable: true,
				defaultValue: 1,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 0.1
			}
		},
		groups: [
			{
				name: "基本信息",
				parameters: [
					"color",
					"intensity"
				]
			}
		]
	}, {
		code: "Light-Hemisphere",
		name: "半球光",
		versionNum: "1.0",
		isInternal: true,
		image: "HemisphereLight.png",
		icon: "HemisphereIcon.png",
		position: [25, 25, 25],
		hasSystemInfo: {
			position: false,
			rotation: false,
			scale: false
		},
		parameters: {
			skyColor: {
				name: "skyColor",
				label: "天空色",
				description: "天空发出光线的颜色",
				isEditable: true,
				defaultValue: "FFFFFF",
				paramType: paramType.color
			},
			groundColor: {
				name: "groundColor",
				label: "地面色",
				description: "地面发出光线的颜色",
				isEditable: true,
				defaultValue: "EEEEEE",
				paramType: paramType.color
			},
			intensity: {
				name: "intensity",
				label: "强度",
				description: "光照的强度",
				isEditable: true,
				defaultValue: 1,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 0.1
			}
		},
		groups: [
			{
				name: "基本信息",
				parameters: [
					"skyColor",
					"groundColor",
					"intensity"
				]
			}
		]
	}, {
		code: "Light-Directional",
		name: "平行光",
		versionNum: "1.0",
		isInternal: true,
		image: "DirectionalLight.png",
		icon: "DirectionalIcon.png",
		position: [20, 20, 20],
		hasSystemInfo: {
			position: true,
			rotation: true,
			scale: false
		},
		parameters: {
			color: {
				name: "color",
				label: "颜色",
				description: "光照的颜色",
				isEditable: true,
				defaultValue: "FFFFFF",
				paramType: paramType.color
			},
			intensity: {
				name: "intensity",
				label: "强度",
				description: "光照的强度",
				isEditable: true,
				defaultValue: 1,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 0.1
			},
			castShadow: {
				name: "castShadow",
				label: "投射阴影",
				description: "光照是否投射阴影",
				isEditable: true,
				defaultValue: false,
				paramType: paramType.boolean,
				minValue: 0
			},
			bias: {
				name: "bias",
				label: "自遮挡偏移",
				description: "给阴影添加一个小的偏移量可以避免自遮挡问题，从而减少条纹",
				isEditable: true,
				defaultValue: -0.001,
				paramType: paramType.decimal
			},
			mapSizeHeight: {
				name: "mapSizeHeight",
				label: "贴图高度",
				description: "阴影贴图的分辨率高度",
				isEditable: true,
				defaultValue: 8092,
				paramType: paramType.decimal,
				minValue: 1024
			},
			mapSizeWidth: {
				name: "mapSizeWidth",
				label: "贴图宽度",
				description: "阴影贴图的分辨率宽度",
				isEditable: true,
				defaultValue: 8092,
				paramType: paramType.decimal,
				minValue: 1024
			},
			cameraNear: {
				name: "cameraNear",
				label: "近",
				description: "近",
				isEditable: true,
				defaultValue: 1,
				paramType: paramType.decimal,
				minValue: 0.1
			},
			cameraFar: {
				name: "cameraFar",
				label: "远",
				description: "远",
				isEditable: true,
				defaultValue: 100,
				paramType: paramType.decimal,
				minValue: 0.1
			},
			cameraLeft: {
				name: "cameraLeft",
				label: "左",
				description: "左",
				isEditable: true,
				defaultValue: -100,
				paramType: paramType.decimal
			},
			cameraRight: {
				name: "cameraRight",
				label: "右",
				description: "右",
				isEditable: true,
				defaultValue: 100,
				paramType: paramType.decimal
			},
			cameraBottom: {
				name: "cameraBottom",
				label: "下",
				description: "下",
				isEditable: true,
				defaultValue: -100,
				paramType: paramType.decimal
			},
			cameraTop: {
				name: "cameraTop",
				label: "上",
				description: "上",
				isEditable: true,
				defaultValue: 100,
				paramType: paramType.decimal
			}
		},
		groups: [
			{
				name: "基本信息",
				parameters: [
					"color",
					"intensity",
				]
			},
			{
				name: "阴影",
				parameters: [
					"castShadow",
					"mapSizeHeight",
					"mapSizeWidth",
					"bias"
				]
			},
			{
				name: "虚拟阴影相机",
				parameters: [
					"cameraNear",
					"cameraFar",
					"cameraLeft",
					"cameraRight",
					"cameraTop",
					"cameraBottom",
				]
			}
		]
	}, {
		code: "Light-Point",
		name: "点光源",
		versionNum: "1.0",
		isInternal: true,
		image: "PointLight.png",
		icon: "PointIcon.png",
		position: [0, 5, 0],
		hasSystemInfo: {
			position: true,
			rotation: false,
			scale: false
		},
		parameters: {
			color: {
				name: "color",
				label: "颜色",
				description: "光照的颜色",
				isEditable: true,
				defaultValue: "FFFFFF",
				paramType: paramType.color
			},
			intensity: {
				name: "intensity",
				label: "强度",
				description: "光照的强度",
				isEditable: true,
				defaultValue: 5,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 0.1
			},
			castShadow: {
				name: "castShadow",
				label: "投射阴影",
				description: "光照是否投射阴影",
				isEditable: true,
				defaultValue: false,
				paramType: paramType.boolean,
				minValue: 0
			},
			distance: {
				name: "distance",
				label: "照射距离",
				description: "光源照射的最大距离。默认值为 0（无限远）",
				isEditable: true,
				defaultValue: 10,
				paramType: paramType.distance,
				minValue: 0,
				stepValue: 1
			},
			decay: {
				name: "decay",
				label: "衰减因子",
				description: "控制光线随着距离的增加而衰减的程度",
				isEditable: true,
				defaultValue: 1,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 0.1
			},
			bias: {
				name: "bias",
				label: "自遮挡偏移",
				description: "给阴影添加一个小的偏移量可以避免自遮挡问题，从而减少条纹",
				isEditable: true,
				defaultValue: -0.001,
				paramType: paramType.decimal
			},
			mapSizeHeight: {
				name: "mapSizeHeight",
				label: "贴图高度",
				description: "阴影贴图的分辨率高度",
				isEditable: true,
				defaultValue: 4096,
				paramType: paramType.decimal,
				minValue: 256
			},
			mapSizeWidth: {
				name: "mapSizeWidth",
				label: "贴图宽度",
				description: "阴影贴图的分辨率宽度",
				isEditable: true,
				defaultValue: 4096,
				paramType: paramType.decimal,
				minValue: 256
			},
			cameraNear: {
				name: "cameraNear",
				label: "近",
				description: "近",
				isEditable: true,
				defaultValue: 0.1,
				paramType: paramType.decimal,
				minValue: 0.01
			},
			cameraFar: {
				name: "cameraFar",
				label: "远",
				description: "远",
				isEditable: true,
				defaultValue: 20,
				paramType: paramType.decimal,
				minValue: 0.1
			},
			cameraLeft: {
				name: "cameraLeft",
				label: "左",
				description: "左",
				isEditable: true,
				defaultValue: -10,
				paramType: paramType.decimal
			},
			cameraRight: {
				name: "cameraRight",
				label: "右",
				description: "右",
				isEditable: true,
				defaultValue: 10,
				paramType: paramType.decimal
			},
			cameraBottom: {
				name: "cameraBottom",
				label: "下",
				description: "下",
				isEditable: true,
				defaultValue: -10,
				paramType: paramType.decimal
			},
			cameraTop: {
				name: "cameraTop",
				label: "上",
				description: "上",
				isEditable: true,
				defaultValue: 10,
				paramType: paramType.decimal
			}
		},
		groups: [
			{
				name: "基本信息",
				parameters: [
					"color",
					"intensity",
					"distance",
					"decay"
				]
			},
			{
				name: "阴影",
				parameters: [
					"castShadow",
					"mapSizeHeight",
					"mapSizeWidth",
					"bias"
				]
			},
			{
				name: "虚拟阴影相机",
				parameters: [
					"cameraNear",
					"cameraFar",
					"cameraLeft",
					"cameraRight",
					"cameraTop",
					"cameraBottom",
				]
			}
		]
	}, {
		code: "Light-Spot",
		name: "聚光灯",
		versionNum: "1.0",
		image: "SpotLight.png",
		icon: "SpotIcon.png",
		position: [0, 5, 0],
		isInternal: true,
		hasSystemInfo: {
			position: true,
			rotation: true,
			scale: false
		},
		parameters: {
			color: {
				name: "color",
				label: "颜色",
				description: "光照的颜色",
				isEditable: true,
				defaultValue: "FFFFFF",
				paramType: paramType.color
			},
			intensity: {
				name: "intensity",
				label: "强度",
				description: "光照的强度",
				isEditable: true,
				defaultValue: 3,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 0.1
			},
			castShadow: {
				name: "castShadow",
				label: "投射阴影",
				description: "光照是否投射阴影",
				isEditable: true,
				defaultValue: false,
				paramType: paramType.boolean,
				minValue: 0
			},
			distance: {
				name: "distance",
				label: "照射距离",
				description: "光源照射的最大距离。默认值为 0（无限远）",
				isEditable: true,
				defaultValue: 10,
				paramType: paramType.distance,
				minValue: 0,
				stepValue: 1
			},
			angle: {
				name: "angle",
				label: "照射角度",
				description: "光线照射范围的角度",
				isEditable: true,
				defaultValue: Math.PI / 6,
				paramType: paramType.angle,
				minValue: 0,
				stepValue: 5
			},
			decay: {
				name: "decay",
				label: "衰减因子",
				description: "控制光线随着距离的增加而衰减的程度",
				isEditable: true,
				defaultValue: 0.1,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 0.1
			},
			penumbra: {
				name: "penumbra",
				label: "半影衰减",
				description: "聚光锥的半影衰减（0~1）",
				isEditable: true,
				defaultValue: 0.1,
				paramType: paramType.decimal,
				minValue: 0,
				maxValue: 1,
				stepValue: 0.1
			},
			bias: {
				name: "bias",
				label: "自遮挡偏移",
				description: "给阴影添加一个小的偏移量可以避免自遮挡问题，从而减少条纹",
				isEditable: true,
				defaultValue: -0.001,
				paramType: paramType.decimal
			},
			mapSizeHeight: {
				name: "mapSizeHeight",
				label: "贴图高度",
				description: "阴影贴图的分辨率高度",
				isEditable: true,
				defaultValue: 4096,
				paramType: paramType.decimal,
				minValue: 256
			},
			mapSizeWidth: {
				name: "mapSizeWidth",
				label: "贴图宽度",
				description: "阴影贴图的分辨率宽度",
				isEditable: true,
				defaultValue: 4096,
				paramType: paramType.decimal,
				minValue: 256
			},
			cameraNear: {
				name: "cameraNear",
				label: "近",
				description: "近",
				isEditable: true,
				defaultValue: 0.1,
				paramType: paramType.decimal,
				minValue: 0.01
			},
			cameraFar: {
				name: "cameraFar",
				label: "远",
				description: "远",
				isEditable: true,
				defaultValue: 20,
				paramType: paramType.decimal,
				minValue: 0.1
			},
			cameraLeft: {
				name: "cameraLeft",
				label: "左",
				description: "左",
				isEditable: true,
				defaultValue: -10,
				paramType: paramType.decimal
			},
			cameraRight: {
				name: "cameraRight",
				label: "右",
				description: "右",
				isEditable: true,
				defaultValue: 10,
				paramType: paramType.decimal
			},
			cameraBottom: {
				name: "cameraBottom",
				label: "下",
				description: "下",
				isEditable: true,
				defaultValue: -10,
				paramType: paramType.decimal
			},
			cameraTop: {
				name: "cameraTop",
				label: "上",
				description: "上",
				isEditable: true,
				defaultValue: 10,
				paramType: paramType.decimal
			}
		},
		groups: [
			{
				name: "基本信息",
				parameters: [
					"color",
					"intensity",
					"distance",
					"angle",
					"decay",
					"penumbra"
				]
			},
			{
				name: "阴影",
				parameters: [
					"castShadow",
					"mapSizeHeight",
					"mapSizeWidth",
					"bias"
				]
			},
			{
				name: "虚拟阴影相机",
				parameters: [
					"cameraNear",
					"cameraFar",
					"cameraLeft",
					"cameraRight",
					"cameraTop",
					"cameraBottom",
				]
			}
		]
	}, {
		code: "Light-RectArea",
		name: "面积光",
		versionNum: "1.0",
		isInternal: true,
		image: "RectAreaLight.png",
		icon: "RectAreaIcon.png",
		position: [0, 5, 0],
		hasSystemInfo: {
			position: true,
			rotation: true,
			scale: false
		},
		parameters: {
			color: {
				name: "color",
				label: "颜色",
				description: "光照的颜色",
				isEditable: true,
				defaultValue: "FFFFFF",
				paramType: paramType.color
			},
			intensity: {
				name: "intensity",
				label: "强度",
				description: "光照的强度",
				isEditable: true,
				defaultValue: 1,
				paramType: paramType.decimal,
				minValue: 0,
				stepValue: 0.1
			},
			width: {
				name: "width",
				label: "宽度",
				description: "光源宽度",
				isEditable: true,
				defaultValue: 3,
				paramType: paramType.distance,
				minValue: 0
			},
			height: {
				name: "height",
				label: "高度",
				description: "光源高度",
				isEditable: true,
				defaultValue: 3,
				paramType: paramType.distance,
				minValue: 0
			}
		},
		groups: [
			{
				name: "基本信息",
				parameters: [
					"color",
					"intensity",
					"width",
					"height"
				]
			}
		]
	}
];