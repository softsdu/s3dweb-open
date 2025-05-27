import {paramType} from "../../../commonjs/common/common.js";
export const cameraComponentList = [
	{
		code: "Camera-Perspective",
		name: "透视相机",
		versionNum: "1.0",
		isInternal: true,
		image: "PerspectiveCamera.png",
		icon: "PerspectiveIcon.png",
		position: [0, 10, 10],
		hasSystemInfo: {
			position: false,
			rotation: false,
			scale: false
		},
		parameters: {
			fov: {
				name: "fov",
				label: "视野角度",
				description: "摄像机视锥体垂直视野角度，从视图的底部到顶部，以角度来表示",
				isEditable: true,
				defaultValue: 60,
				paramType: paramType.decimal,
				minValue: 0.0001,
				maxValue: 179.9999,
				stepValue: 5
			},
			aspect: {
				name: "aspect",
				label: "长宽比",
				description: "摄像机视锥体长宽比",
				isEditable: true,
				defaultValue: "16:9",
				paramType: paramType.string,
				listValues: [
					{
						code: "auto",
						name: "auto"
					},
					{
						code: "1:1",
						name: "1:1"
					},
					{
						code: "3:4",
						name: "3:4"
					},
					{
						code: "4:3",
						name: "4:3"
					},
					{
						code: "9:16",
						name: "9:16"
					},
					{
						code: "16:9",
						name: "16:9"
					},
					{
						code: "16:10",
						name: "16:10"
					},
					{
						code: "21:9",
						name: "21:9"
					},
					{
						code: "32:9",
						name: "32:9"
					}
				]
			},
			near: {
				name: "near",
				label: "近端面",
				description: "摄像机的近端面",
				isEditable: true,
				defaultValue: 0.1,
				paramType: paramType.decimal,
				minValue: 0.01,
				stepValue: 0.01
			},
			far: {
				name: "far",
				label: "远端面",
				description: "摄像机的远端面",
				isEditable: true,
				defaultValue: 1000,
				paramType: paramType.decimal,
				minValue: 0.1,
				stepValue: 1
			},
			distance: {
				name: "distance",
				label: "焦点距离",
				description: "与焦点的距离",
				isEditable: true,
				defaultValue: 1,
				paramType: paramType.decimal,
				minValue: 0.01,
				stepValue: 100
			}
		},
		groups: [
			{
				name: "基本信息",
				parameters: [
					"fov",
					"aspect",
					"near",
					"far",
					"distance"
				]
			}
		]
	}
];