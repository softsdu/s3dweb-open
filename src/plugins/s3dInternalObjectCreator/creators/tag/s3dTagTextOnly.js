import * as THREE from "three"
import S3dTagText3DCreator from "./s3dTagText3DCreator.js";

class S3dTagTextOnly extends THREE.Object3D {
    constructor(options = {}) {
        super();
        let text3DCreator = new S3dTagText3DCreator();
        let textSprite = text3DCreator.createTextSprite(options);
        this.add(textSprite);
    }
}

export { S3dTagTextOnly };
