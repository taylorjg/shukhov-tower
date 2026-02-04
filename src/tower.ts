/**
 * Shukhov Tower Geometry
 *
 * This module generates the geometry for a hyperboloid lattice tower, inspired by
 * Vladimir Shukhov's iconic structures, most notably the Shukhov Radio Tower in Moscow
 * (1920-1922).
 *
 * ## Hyperboloid Structure
 *
 * A hyperboloid of one sheet is a doubly ruled surface, meaning it can be constructed
 * entirely from straight lines. This property makes it ideal for lattice towers:
 * straight steel struts can be used to create a curved, structurally efficient shape.
 *
 * @see https://en.wikipedia.org/wiki/Hyperboloid_structure
 * @see https://en.wikipedia.org/wiki/Shukhov_Tower
 * @see https://en.wikipedia.org/wiki/Ruled_surface
 *
 * ## Mathematical Foundation
 *
 * The tower uses the "ruled surface" property of hyperboloids. Each strut is a
 * straight line connecting a point on the bottom circle to a point on the top circle,
 * with an angular offset (twist angle φ).
 *
 * For a strut connecting:
 *   - Bottom point: P₀ = (a·cos(θ), 0, a·sin(θ))
 *   - Top point:    P₁ = (b·cos(θ+φ), h, b·sin(θ+φ))
 *
 * Where:
 *   - a = base radius
 *   - b = top radius
 *   - h = height
 *   - θ = angular position around the circle
 *   - φ = twist angle
 *
 * The strut is parameterized as: P(t) = (1-t)·P₀ + t·P₁, where t ∈ [0,1]
 *
 * @see https://en.wikipedia.org/wiki/Hyperboloid_of_one_sheet
 */

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
 * Calculate the radius (distance from vertical axis) at a given height along a strut.
 *
 * ## Derivation
 *
 * For a point P(t) = (1-t)·P₀ + t·P₁ on the strut, the x and z coordinates are:
 *   x(t) = (1-t)·a·cos(θ) + t·b·cos(θ+φ)
 *   z(t) = (1-t)·a·sin(θ) + t·b·sin(θ+φ)
 *
 * The radius r(t) = √(x² + z²). Expanding and using trigonometric identities:
 *
 *   r²(t) = (1-t)²·a² + t²·b² + 2(1-t)·t·a·b·cos(φ)
 *
 * Note: The result is independent of θ, meaning all struts at the same height
 * have the same radius - this is what creates the circular cross-section.
 *
 * The cos(φ) term is crucial: when φ < 90°, struts bow inward creating the
 * characteristic "waist" of the hyperboloid.
 *
 * @see https://en.wikipedia.org/wiki/Hyperboloid_of_one_sheet#Properties
 *
 * @param normalizedHeight - Height as fraction t ∈ [0,1] where 0=bottom, 1=top
 * @param baseRadius - Radius a at the bottom (t=0)
 * @param topRadius - Radius b at the top (t=1)
 * @param twistAngleRadians - Twist angle φ in radians
 * @returns The radius at the given height
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

  // r²(t) = (1-t)²·a² + t²·b² + 2(1-t)·t·a·b·cos(φ)
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
 * Create the complete Shukhov tower geometry.
 *
 * ## Structure Overview
 *
 * The tower consists of multiple stacked hyperboloid sections. Each section has:
 * - Two families of straight struts (ruling lines) that twist in opposite directions
 * - Horizontal rings at regular intervals for structural bracing
 *
 * The twist direction alternates between sections, creating a visually distinctive
 * pattern and improving structural stability, as seen in the original Shukhov Tower.
 *
 * ## Doubly Ruled Surface
 *
 * A key property of the hyperboloid is that it's a "doubly ruled" surface - through
 * every point pass exactly two straight lines that lie entirely on the surface.
 * We exploit this by creating two sets of struts at each position:
 * - One set twisting clockwise (θ → θ + φ)
 * - One set twisting counter-clockwise (θ → θ - φ)
 *
 * These intersecting struts create the characteristic diamond lattice pattern.
 *
 * @see https://en.wikipedia.org/wiki/Ruled_surface#Doubly_ruled_surfaces
 *
 * ## Section Height Distribution
 *
 * Section heights decrease from bottom to top using triangular number weighting.
 * For n sections, weights are [n, n-1, n-2, ..., 1], giving the bottom section
 * the largest height. This mimics the proportions of the actual Shukhov Tower.
 *
 * The sum of weights 1+2+...+n = n(n+1)/2 (triangular number formula).
 * @see https://en.wikipedia.org/wiki/Triangular_number
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

  // Calculate decreasing section heights using triangular number distribution.
  // Weights: [n, n-1, n-2, ..., 1] where n = sectionCount
  // Total weight = n(n+1)/2 (triangular number)
  const weights: number[] = [];
  let totalWeight = 0;
  for (let i = 0; i < sectionCount; i++) {
    const weight = sectionCount - i;
    weights.push(weight);
    totalWeight += weight;
  }

  // Precompute cumulative heights at section boundaries
  const sectionBoundaries: number[] = [0];
  let cumulativeHeight = 0;
  for (let i = 0; i < sectionCount; i++) {
    cumulativeHeight += (weights[i]! / totalWeight) * height;
    sectionBoundaries.push(cumulativeHeight);
  }

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
    const sectionBottomY = sectionBoundaries[section]!;
    const sectionTopY = sectionBoundaries[section + 1]!;
    const sectionHeight = sectionTopY - sectionBottomY;

    // Linear interpolation of radii based on height position.
    // The overall tower tapers from baseRadius to topRadius.
    const sectionBottomRadius =
      baseRadius + (topRadius - baseRadius) * (sectionBottomY / height);
    const sectionTopRadius =
      baseRadius + (topRadius - baseRadius) * (sectionTopY / height);

    // Alternate twist direction between sections.
    // This creates the distinctive pattern seen in Shukhov's original design
    // and provides better structural cross-bracing.
    const sectionTwist = section % 2 === 0 ? twistRadians : -twistRadians;

    // Generate the two families of ruling lines (struts) for this section.
    // Each strut connects a point on the bottom circle to a twisted point on the top.
    for (let strutIndex = 0; strutIndex < strutCount; strutIndex++) {
      // Base angle θ: evenly distributed around the circle
      const baseAngle = (strutIndex / strutCount) * Math.PI * 2;

      // First family of ruling lines: twist in positive direction
      // Bottom: (a·cos(θ), y₀, a·sin(θ))
      // Top:    (b·cos(θ+φ), y₁, b·sin(θ+φ))
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

      // Second family of ruling lines: twist in negative direction
      // Bottom: (a·cos(θ), y₀, a·sin(θ))
      // Top:    (b·cos(θ-φ), y₁, b·sin(θ-φ))
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

    // Generate horizontal rings at the calculated hyperboloid radius.
    // Rings provide lateral bracing and mark the characteristic curved profile.
    if (showRings) {
      for (let i = 0; i <= ringCount; i++) {
        // Skip bottom ring for sections after the first (avoid duplicates)
        if (section > 0 && i === 0) continue;

        const normalizedH = i / ringCount;
        const ringHeight = sectionBottomY + normalizedH * sectionHeight;

        // Ring radius follows the hyperboloid curve using r²(t) formula
        const radius = getStrutRadiusAtHeight(
          normalizedH,
          sectionBottomRadius,
          sectionTopRadius,
          Math.abs(sectionTwist)
        );
        const ring = createRing(
          radius,
          ringHeight,
          strutRadius * 0.8,
          ringMaterial
        );
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
