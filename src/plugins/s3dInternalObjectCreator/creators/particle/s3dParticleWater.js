import {Water} from "three/addons/objects/Water.js";
import * as THREE from "three"

class S3dParticleWater extends Water{
    constructor(options = {} ) {
        let waterGeometry = new THREE.PlaneGeometry(100, 100);
        let waterOptions = {
            textureWidth: 512,
            textureHeight: 512,
            waterNormals: new THREE.TextureLoader().load(options.normalImageUrl, function (texture) {
                texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
            }),
            sunDirection: new THREE.Vector3(),
            sunColor: 0xffffff,
            waterColor: options.waterColor,
            distortionScale: 1
        }
        super(waterGeometry, waterOptions);
        this.clock = new THREE.Clock();
        this.clock.start();
        this.speed = options.speed;
    }

    update(){
        let delta = this.clock.getDelta();
        this.material.uniforms[ 'time' ].value = this.clock.getElapsedTime() * this.speed;
    }
}

export { S3dParticleWater };
