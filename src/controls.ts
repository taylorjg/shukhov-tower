import * as dat from 'dat.gui';
import type { TowerParams } from './tower';

export function setupControls(
  params: TowerParams,
  onUpdate: () => void
): dat.GUI {
  const gui = new dat.GUI({ width: 320 });
  gui.domElement.id = 'gui';

  // Tower Dimensions folder
  const dimensionsFolder = gui.addFolder('Tower Dimensions');
  dimensionsFolder
    .add(params, 'height', 50, 300, 1)
    .name('Height')
    .onChange(onUpdate);
  dimensionsFolder
    .add(params, 'baseRadius', 10, 80, 1)
    .name('Base Radius')
    .onChange(onUpdate);
  dimensionsFolder
    .add(params, 'topRadius', 5, 60, 1)
    .name('Top Radius')
    .onChange(onUpdate);
  dimensionsFolder.open();

  // Hyperboloid Shape folder
  const shapeFolder = gui.addFolder('Hyperboloid Shape');
  shapeFolder
    .add(params, 'twistAngle', 10, 180, 1)
    .name('Twist Angle (°)')
    .onChange(onUpdate);
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

  return gui;
}
