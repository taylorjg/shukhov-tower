# Shukhov Tower

An interactive 3D visualization of the Shukhov Tower, built with Three.js and TypeScript.

The [Shukhov Tower](https://en.wikipedia.org/wiki/Shukhov_Tower) is a 160-meter hyperboloid structure in Moscow, designed by Vladimir Shukhov and built in 1920-1922. Its innovative design uses straight steel struts arranged in a lattice pattern to create a curved hyperboloid shape.

## Features

- True hyperboloid geometry with straight-line struts
- Multiple stacked sections with alternating twist directions
- Interactive controls for real-time parameter adjustment:
  - Tower dimensions (height, base radius, top radius)
  - Hyperboloid shape (twist angle)
  - Structure (section count, strut count, rings per section, strut thickness)
- Orbit camera controls for 3D navigation

## Getting Started

### Prerequisites

- Node.js (see `.nvmrc` for version)

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open the local URL shown in the terminal to view the visualization.

### Build

```bash
npm run build
```

The built files will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Tech Stack

- [Three.js](https://threejs.org/) - 3D graphics library
- [dat.GUI](https://github.com/dataarts/dat.gui) - Lightweight controller library
- [TypeScript](https://www.typescriptlang.org/) - Type-safe JavaScript
- [Vite](https://vitejs.dev/) - Build tool and dev server
