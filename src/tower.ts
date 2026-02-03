import * as THREE from 'three';

export interface TowerParams {
  height: number;
  baseRadius: number;
  topRadius: number;
  strutCount: number;
  ringCount: number;
  strutRadius: number;
  showRings: boolean;
  twistAngle: number; // Total twist in degrees from bottom to top
}

/**
 * Calculate the radius of a straight-line strut at a given height.
 * This is the true hyperboloid radius for straight struts.
 */
function getStrutRadiusAtHeight(
  normalizedHeight: number,
  baseRadius: number,
  topRadius: number,
  twistAngleRadians: number
): number {
  const a = baseRadius;
  const b = topRadius;
  const t = normalizedHeight;
  const cosφ = Math.cos(twistAngleRadians);

  const rSquared =
    (1 - t) * (1 - t) * a * a +
    t * t * b * b +
    2 * (1 - t) * t * a * b * cosφ;

  return Math.sqrt(Math.max(0, rSquared));
}

/**
 * Create a strut (cylinder) between two 3D points
 */
function createStrut(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  material: THREE.Material
): THREE.Mesh {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();

  const geometry = new THREE.CylinderGeometry(radius, radius, length, 8);
  const mesh = new THREE.Mesh(geometry, material);

  // Position at midpoint
  mesh.position.copy(start).add(end).multiplyScalar(0.5);

  // Orient cylinder to point from start to end
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

/**
 * Create a horizontal ring at a given height
 */
function createRing(
  radius: number,
  height: number,
  tubeRadius: number,
  material: THREE.Material
): THREE.Mesh {
  const geometry = new THREE.TorusGeometry(radius, tubeRadius, 8, 64);
  const mesh = new THREE.Mesh(geometry, material);

  mesh.position.y = height;
  mesh.rotation.x = Math.PI / 2;

  mesh.castShadow = true;
  mesh.receiveShadow = true;

  return mesh;
}

/**
 * Create the complete Shukhov tower geometry with true straight-line struts
 */
export function createTower(params: TowerParams): THREE.Group {
  const group = new THREE.Group();

  const {
    height,
    baseRadius,
    topRadius,
    strutCount,
    ringCount,
    strutRadius,
    showRings,
    twistAngle,
  } = params;

  const twistRadians = (twistAngle * Math.PI) / 180;

  // Materials
  const strutMaterial = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0,
    metalness: 0.7,
    roughness: 0.3,
  });

  const ringMaterial = new THREE.MeshStandardMaterial({
    color: 0xa0a0a0,
    metalness: 0.6,
    roughness: 0.4,
  });

  // Generate straight-line diagonal struts
  // Two sets of struts going in opposite helical directions
  for (let strutIndex = 0; strutIndex < strutCount; strutIndex++) {
    const baseAngle = (strutIndex / strutCount) * Math.PI * 2;

    // Clockwise strut (bottom to top as single straight line)
    const cwStartAngle = baseAngle;
    const cwEndAngle = baseAngle + twistRadians;
    
    const cwStart = new THREE.Vector3(
      Math.cos(cwStartAngle) * baseRadius,
      0,
      Math.sin(cwStartAngle) * baseRadius
    );

    const cwEnd = new THREE.Vector3(
      Math.cos(cwEndAngle) * topRadius,
      height,
      Math.sin(cwEndAngle) * topRadius
    );

    const cwStrut = createStrut(cwStart, cwEnd, strutRadius, strutMaterial);
    group.add(cwStrut);

    // Counter-clockwise strut (bottom to top as single straight line)
    const ccwStartAngle = baseAngle;
    const ccwEndAngle = baseAngle - twistRadians;

    const ccwStart = new THREE.Vector3(
      Math.cos(ccwStartAngle) * baseRadius,
      0,
      Math.sin(ccwStartAngle) * baseRadius
    );

    const ccwEnd = new THREE.Vector3(
      Math.cos(ccwEndAngle) * topRadius,
      height,
      Math.sin(ccwEndAngle) * topRadius
    );

    const ccwStrut = createStrut(ccwStart, ccwEnd, strutRadius, strutMaterial);
    group.add(ccwStrut);
  }

  // Generate horizontal rings at the true hyperboloid radius
  if (showRings) {
    for (let i = 0; i <= ringCount; i++) {
      const normalizedH = i / ringCount;
      const ringHeight = normalizedH * height;
      const radius = getStrutRadiusAtHeight(
        normalizedH,
        baseRadius,
        topRadius,
        twistRadians
      );
      const ring = createRing(radius, ringHeight, strutRadius * 0.8, ringMaterial);
      group.add(ring);
    }
  }

  return group;
}

/**
 * Dispose of tower geometry and materials to prevent memory leaks
 */
export function disposeTower(group: THREE.Group): void {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      if (Array.isArray(object.material)) {
        object.material.forEach((mat) => mat.dispose());
      } else {
        object.material.dispose();
      }
    }
  });
}
