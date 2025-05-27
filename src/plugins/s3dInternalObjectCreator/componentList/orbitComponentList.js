import {cmnPcr, paramType, s3dClockDirection, s3dTextDirections} from "../../../commonjs/common/common.js";
export const orbitComponentList = [
	{
		code: "Orbit-Circle",
		name: "圆形路径",
		versionNum: "1.0",
		isInternal: true,
		image: "CircleCameraOrbit.png",
		position: [0, 1, 0],
		rotation: [0, 0, 0],
		hasSystemInfo: {
			position: true,
			rotation: true,
			scale: true
		},
		parameters: {
			radius: {
				name: "radius",
				label: "半径",
				description: "半径",
				isEditable: false,
				defaultValue: "1",
				paramType: paramType.decimal,
				minValue: 1,
				maxValue: 1
			},
			height: {
				name: "height",
				label: "高度",
				description: "高度",
				isEditable: false,
				defaultValue: 1,
				paramType: paramType.decimal,
				minValue: 1,
				maxValue: 1
			},
			startAngle: {
				name: "startAngle",
				label: "起始角度",
				description: "起始角度",
				isEditable: false,
				defaultValue: 0,
				paramType: paramType.decimal,
				minValue: 0,
				maxValue: 0
			},
			frequency: {
				name: "frequency",
				label: "频率",
				description: "频率",
				isEditable: true,
				defaultValue: 2,
				paramType: paramType.decimal,
				minValue: 1,
				stepValue: 1
			},
			lineColor: {
				name: "lineColor",
				label: "线颜色",
				description: "文字与点之间的连接线颜色",
				isEditable: true,
				defaultValue: "888888",
				paramType: paramType.color
			},
			duration: {
				name: "duration",
				label: "持续时长",
				description: "持续时长（秒）",
				isEditable: true,
				defaultValue: 8,
				paramType: paramType.decimal,
				minValue: 0.1,
				stepValue: 1
			},
			direction: {
				name: "direction",
				label: "方向",
				description: "方向",
				isEditable: true,
				defaultValue: s3dClockDirection.clockwise,
				paramType: paramType.string,
				listValues: [
					{
						code: s3dClockDirection.clockwise,
						name: "顺时针"
					},
					{
						code: s3dClockDirection.anticlockwise,
						name: "逆时针"
					}
				]
			}
		},
		groups: [
			{
				name: "基本信息",
				parameters: [
					"radius",
					"height",
					"startAngle",
					"frequency",
					"duration",
					"direction"
				]
			}
		]
	}
];