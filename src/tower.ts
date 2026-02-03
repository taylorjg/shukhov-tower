import * as THREE from 'three';

export interface TowerParams {
  height: number;
  baseRadius: number;
  topRadius: number;
  sectionCount: number;
  strutCount: number;
  ringCount: number; // Rings per section
  strutRadius: number;
  showRings: boolean;
  twistAngle: number; // Twist angle per section in degrees
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
    sectionCount,
    strutCount,
    ringCount,
    strutRadius,
    showRings,
    twistAngle,
  } = params;

  const twistRadians = (twistAngle * Math.PI) / 180;
  const sectionHeight = height / sectionCount;

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

  // Generate each section
  for (let section = 0; section < sectionCount; section++) {
    const sectionBottomY = section * sectionHeight;
    const sectionTopY = (section + 1) * sectionHeight;
    
    // Interpolate radii for this section
    const sectionBottomRadius = baseRadius + (topRadius - baseRadius) * (section / sectionCount);
    const sectionTopRadius = baseRadius + (topRadius - baseRadius) * ((section + 1) / sectionCount);

    // Alternate twist direction for each section (like real Shukhov tower)
    const sectionTwist = section % 2 === 0 ? twistRadians : -twistRadians;

    // Generate straight-line diagonal struts for this section
    // Two sets of struts going in opposite helical directions
    for (let strutIndex = 0; strutIndex < strutCount; strutIndex++) {
      const baseAngle = (strutIndex / strutCount) * Math.PI * 2;

      // Clockwise strut (bottom to top as single straight line)
      const cwStartAngle = baseAngle;
      const cwEndAngle = baseAngle + sectionTwist;

      const cwStart = new THREE.Vector3(
        Math.cos(cwStartAngle) * sectionBottomRadius,
        sectionBottomY,
        Math.sin(cwStartAngle) * sectionBottomRadius
      );

      const cwEnd = new THREE.Vector3(
        Math.cos(cwEndAngle) * sectionTopRadius,
        sectionTopY,
        Math.sin(cwEndAngle) * sectionTopRadius
      );

      const cwStrut = createStrut(cwStart, cwEnd, strutRadius, strutMaterial);
      group.add(cwStrut);

      // Counter-clockwise strut (bottom to top as single straight line)
      const ccwStartAngle = baseAngle;
      const ccwEndAngle = baseAngle - sectionTwist;

      const ccwStart = new THREE.Vector3(
        Math.cos(ccwStartAngle) * sectionBottomRadius,
        sectionBottomY,
        Math.sin(ccwStartAngle) * sectionBottomRadius
      );

      const ccwEnd = new THREE.Vector3(
        Math.cos(ccwEndAngle) * sectionTopRadius,
        sectionTopY,
        Math.sin(ccwEndAngle) * sectionTopRadius
      );

      const ccwStrut = createStrut(ccwStart, ccwEnd, strutRadius, strutMaterial);
      group.add(ccwStrut);
    }

    // Generate horizontal rings for this section
    if (showRings) {
      for (let i = 0; i <= ringCount; i++) {
        // Skip bottom ring for sections after the first (avoid duplicates)
        if (section > 0 && i === 0) continue;

        const normalizedH = i / ringCount;
        const ringHeight = sectionBottomY + normalizedH * sectionHeight;
        const radius = getStrutRadiusAtHeight(
          normalizedH,
          sectionBottomRadius,
          sectionTopRadius,
          Math.abs(sectionTwist)
        );
        const ring = createRing(radius, ringHeight, strutRadius * 0.8, ringMaterial);
        group.add(ring);
      }
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
