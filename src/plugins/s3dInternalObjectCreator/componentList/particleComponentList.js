import {paramType} from "../../../commonjs/common/common.js";
export const particleComponentList = [
	{
		code: "Particle-Water",
		name: "水面",
		versionNum: "1.0",
		isInternal: true,
		image: "WaterParticle.png",
		textureMap: {
			normal: "WaterNormal.jpg"
		},
		position: [0, 1, 0],
		rotation: [0, 0, 0],
		hasSystemInfo: {
			position: true,
			rotation: false,
			scale: true
		},
		parameters: {
			speed: {
				name: "speed",
				label: "速度",
				description: "Speed",
				isEditable: true,
				defaultValue: 0.1,
				paramType: paramType.decimal,
				minValue: 0,
				maxValue: 10,
				stepValue: 0.1
			},
			waterColor: {
				name: "waterColor",
				label: "水的颜色",
				description: "水的颜色",
				isEditable: true,
				defaultValue: "001E0F",
				paramType: paramType.color
			}
		},
		groups: [
			{
				name: "基本信息",
				parameters: [
					"speed",
					"waterColor"
				]
			}
		]
	}
];