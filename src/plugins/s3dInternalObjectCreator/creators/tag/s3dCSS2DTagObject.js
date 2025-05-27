
import {CSS2DObject} from "three/examples/jsm/renderers/CSS2DRenderer.js";
class S3dCSS2DTagObject extends CSS2DObject{

    constructor( element = document.createElement( 'div' ) ) {

        super(element);
        this.inited2D = false;
    }

    onAfterRender(){
        super.onAfterRender();
        if(!this.inited2D){
            this.parent.initCSS2DObject();
            this.inited2D = true;
        }
    }
}
export {S3dCSS2DTagObject}