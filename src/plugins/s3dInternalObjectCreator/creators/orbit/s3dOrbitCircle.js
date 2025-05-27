import * as THREE from "three"

class S3dOrbitCircle extends THREE.Object3D{
    constructor(options = {}) {
        super();

        this.options = options;

        let orbitObject  = this.createOrbitObject(options);
        this.add(orbitObject);
    }

    createOrbitObject (p){
        let pointsLine = [];
        for(let i = 0; i < p.points.length; i++){
            let start = p.points[i];
            let end = i === p.points.length - 1 ? p.points[0] : p.points[i + 1];
            pointsLine.push(new THREE.Vector3(start.x, start.y, start.z));
            pointsLine.push(new THREE.Vector3(end.x, end.y, end.z));
        }
        let geometry = new THREE.BufferGeometry().setFromPoints(pointsLine);
        return new THREE.Line(geometry, p.orbitLineMaterial)
    }
}

export { S3dOrbitCircle };
