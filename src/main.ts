import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createTower, disposeTower, TowerParams } from './tower';
import { setupControls } from './controls';
import { version } from '../package.json';
import './style.css';

// Display version
const versionEl = document.getElementById('version');
if (versionEl) versionEl.textContent = `v${version}`;

// Default tower parameters
const params: TowerParams = {
  height: 300,
  baseRadius: 60,
  topRadius: 5,
  sectionCount: 6,
  strutCount: 24,
  ringCount: 4,
  strutRadius: 0.5,
  showRings: true,
  twistAngle: 50, // degrees
};

// Parse query string parameters to override defaults
function applyQueryParams(): void {
  const urlParams = new URLSearchParams(window.location.search);

  const paramMap: { key: keyof TowerParams; urlKey: string }[] = [
    { key: 'height', urlKey: 'height' },
    { key: 'baseRadius', urlKey: 'baseRadius' },
    { key: 'topRadius', urlKey: 'topRadius' },
    { key: 'sectionCount', urlKey: 'sectionCount' },
    { key: 'ringCount', urlKey: 'ringCount' },
    { key: 'twistAngle', urlKey: 'twistAngle' },
  ];

  for (const { key, urlKey } of paramMap) {
    const value = urlParams.get(urlKey);
    if (value !== null) {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        (params[key] as number) = numValue;
      }
    }
  }
}

applyQueryParams();

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x1a1a2e);

// Camera
const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(100, 200, 300);
camera.lookAt(0, params.height / 2, 0);

// Renderer
const canvas = document.getElementById('canvas') as HTMLCanvasElement;
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Orbit controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.target.set(0, params.height / 2, 0);
controls.update();

// Lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(50, 100, 50);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.width = 2048;
directionalLight.shadow.mapSize.height = 2048;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.left = -100;
directionalLight.shadow.camera.right = 100;
directionalLight.shadow.camera.top = 100;
directionalLight.shadow.camera.bottom = -100;
scene.add(directionalLight);

const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x3d3d3d, 0.3);
scene.add(hemisphereLight);

// Ground grid
const gridHelper = new THREE.GridHelper(300, 30, 0x444444, 0x333333);
scene.add(gridHelper);

// Ground plane (for shadows)
const groundGeometry = new THREE.PlaneGeometry(300, 300);
const groundMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
const ground = new THREE.Mesh(groundGeometry, groundMaterial);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Tower group
let towerGroup: THREE.Group | null = null;

function rebuildTower(): void {
  if (towerGroup) {
    disposeTower(towerGroup);
    scene.remove(towerGroup);
  }
  towerGroup = createTower(params);
  scene.add(towerGroup);
}

// Initial tower build
rebuildTower();

// Setup dat.GUI controls
setupControls(params, rebuildTower);

// Handle window resize
function onWindowResize(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// Animation loop
function animate(): void {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

animate();
