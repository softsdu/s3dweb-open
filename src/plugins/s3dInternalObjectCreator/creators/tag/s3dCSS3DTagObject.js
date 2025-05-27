
import {CSS3DObject} from "three/examples/jsm/renderers/CSS3DRenderer.js";
class S3dCSS3DTagObject extends CSS3DObject{

    constructor( element = document.createElement( 'div' ) ) {

        super(element);
        this.inited3D = false;
    }

    onAfterRender(){
        super.onAfterRender();
        if(!this.inited3D){
            this.parent.initCSS3DObject();
            this.inited3D = true;
        }
    }
}
export {S3dCSS3DTagObject}