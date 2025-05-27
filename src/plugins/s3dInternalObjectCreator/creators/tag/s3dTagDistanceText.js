import * as THREE from "three"
import {S3dCSS3DTagObject} from "./s3dCSS3DTagObject.js";
import {cmnPcr} from "../../../../commonjs/common/common.js";
import S3dTagText3DCreator from "./s3dTagText3DCreator.js";

class S3dTagDistanceText extends THREE.Object3D {
    constructor(options = {}) {
        super();

        this.defaultFontSize = 200;

        this.options = options;

        this.inited3D = false;

        this.addLineObjects(options);

        this.createTextObject(options);
    }

    createTextObject(p) {
        let text3DCreator = new S3dTagText3DCreator();
        let canvas = text3DCreator.createHTextCanvas(p);
        let texture = new THREE.CanvasTexture(canvas);
        let material = new THREE.MeshStandardMaterial({
            map: texture,
            transparent: true,
            opacity: 1.0,
            color: p.textColor,
            alphaTest: 0.5,
            side: THREE.DoubleSide
        });
        let textSize = text3DCreator.getText3DHSize(p.text, p.fontSize, p.letterSpacing);
        let geometry = new THREE.PlaneGeometry(1, 1);
        let plane = new THREE.Mesh(geometry, material);
        plane.scale.set(textSize.x, textSize.y, textSize.z);
        plane.position.set(0, textSize.y / 2 + p.terminalLineLength / 4, 0);
        this.add(plane);
    }

    addLineObjects(p) {
        let lineMaterial = new THREE.LineBasicMaterial({color: p.lineColor});
        let lineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-0.5, 0, 0),
            new THREE.Vector3(0.5, 0, 0)
        ]);
        let lineObject = new THREE.Line(lineGeometry, lineMaterial);
        lineObject.scale.set(p.lineLength, 1, 1);
        lineObject.position.set(0, 0, 0);
        this.add(lineObject);

        let terminalMaterial = new THREE.LineBasicMaterial({color: p.terminalLineColor});
        let terminalAGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -0.5, 0),
            new THREE.Vector3(0, 0.5, 0)
        ]);
        let terminalAObject = new THREE.Line(terminalAGeometry, terminalMaterial);
        terminalAObject.scale.set(1, p.terminalLineLength, 1);
        terminalAObject.position.set(-p.lineLength / 2, 0, 0);
        this.add(terminalAObject);

        let terminalBGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(0, -0.5, 0),
            new THREE.Vector3(0,  0.5, 0)
        ]);
        let terminalBObject = new THREE.Line(terminalBGeometry, terminalMaterial);
        terminalBObject.scale.set(1, p.terminalLineLength, 1);
        terminalBObject.position.set(p.lineLength / 2, 0, 0);
        this.add(terminalBObject);
    }
}

export { S3dTagDistanceText };
