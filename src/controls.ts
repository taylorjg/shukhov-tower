import * as dat from 'dat.gui';
import type { TowerParams } from './tower';
import { calculateWaistGeometry } from './tower';

export function setupControls(
  params: TowerParams,
  onUpdate: () => void
): dat.GUI {
  const gui = new dat.GUI({ width: 320 });
  gui.domElement.id = 'gui';

  // Store controllers that need to be updated
  let waistRadiusController: dat.GUIController;
  let waistPositionController: dat.GUIController;

  // Function to update waist values when autoWaist is enabled
  const updateAutoWaist = () => {
    if (params.autoWaist) {
      const twistRadians = (params.twistAngle * Math.PI) / 180;
      const waist = calculateWaistGeometry(
        params.baseRadius,
        params.topRadius,
        twistRadians
      );
      params.waistRadius = waist.waistRadius;
      params.waistPosition = waist.waistPosition;
      waistRadiusController.updateDisplay();
      waistPositionController.updateDisplay();
    }
  };

  // Wrapper that updates auto-waist before rebuilding
  const onParamChange = () => {
    updateAutoWaist();
    onUpdate();
  };

  // Tower Dimensions folder
  const dimensionsFolder = gui.addFolder('Tower Dimensions');
  dimensionsFolder
    .add(params, 'height', 50, 300, 1)
    .name('Height')
    .onChange(onUpdate);
  dimensionsFolder
    .add(params, 'baseRadius', 10, 80, 1)
    .name('Base Radius')
    .onChange(onParamChange);
  dimensionsFolder
    .add(params, 'topRadius', 5, 60, 1)
    .name('Top Radius')
    .onChange(onParamChange);
  dimensionsFolder.open();

  // Hyperboloid Shape folder
  const shapeFolder = gui.addFolder('Hyperboloid Shape');
  shapeFolder
    .add(params, 'autoWaist')
    .name('Auto-Calculate Waist')
    .onChange(() => {
      // Enable/disable manual waist controls
      if (params.autoWaist) {
        waistRadiusController.domElement.style.pointerEvents = 'none';
        waistRadiusController.domElement.style.opacity = '0.5';
        waistPositionController.domElement.style.pointerEvents = 'none';
        waistPositionController.domElement.style.opacity = '0.5';
      } else {
        waistRadiusController.domElement.style.pointerEvents = 'auto';
        waistRadiusController.domElement.style.opacity = '1';
        waistPositionController.domElement.style.pointerEvents = 'auto';
        waistPositionController.domElement.style.opacity = '1';
      }
      onParamChange();
    });
  shapeFolder
    .add(params, 'twistAngle', 10, 180, 1)
    .name('Twist Angle (°)')
    .onChange(onParamChange);
  waistRadiusController = shapeFolder
    .add(params, 'waistRadius', 5, 50, 0.5)
    .name('Waist Radius')
    .onChange(onUpdate);
  waistPositionController = shapeFolder
    .add(params, 'waistPosition', 0.1, 0.9, 0.01)
    .name('Waist Position')
    .onChange(onUpdate);
  
  // Set initial disabled state for manual waist controls
  if (params.autoWaist) {
    waistRadiusController.domElement.style.pointerEvents = 'none';
    waistRadiusController.domElement.style.opacity = '0.5';
    waistPositionController.domElement.style.pointerEvents = 'none';
    waistPositionController.domElement.style.opacity = '0.5';
  }
  
  shapeFolder.open();

  // Structure folder
  const structureFolder = gui.addFolder('Structure');
  structureFolder
    .add(params, 'strutCount', 6, 48, 2)
    .name('Strut Count')
    .onChange(onUpdate);
  structureFolder
    .add(params, 'ringCount', 2, 20, 1)
    .name('Ring Count')
    .onChange(onUpdate);
  structureFolder
    .add(params, 'strutRadius', 0.2, 2, 0.1)
    .name('Strut Thickness')
    .onChange(onUpdate);
  structureFolder
    .add(params, 'showRings')
    .name('Show Rings')
    .onChange(onUpdate);
  structureFolder.open();

  // Calculate initial auto-waist values
  updateAutoWaist();

  return gui;
}
