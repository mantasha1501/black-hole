# 🌌 GARGANTUA // Cinematic Relativistic Raymarcher

A high-performance, real-time 3D simulation of a spinning singularity and its surrounding accretion disk, modeled on the principles of general relativity and cinematic astrophysics representations. 

## 🚀 Live Simulation Link
👉 [Interact with the Live Deployment Engine Here] https://mantasha1501.github.io/black-hole/

## 🧠 Core Engineering Architectures

### 1. Volumetric Raymarching Math Matrix
Unlike traditional polygon/triangle engines, this system uses low-level **GLSL fragment shaders** to map coordinates. For every single pixel on screen, the camera shoots a vector path into a mathematical coordinate field, executing a localized **Numerical Euler Integration loop** to step rays forward 140+ frames in real-time.

### 2. Relativistic Physics Deflection Tensor
Light vectors crossing near the event horizon are dynamically manipulated using an optimized approximation profile of the **Schwarzschild metric**. Rather than moving in straight lines, ray coordinates are pulled and bent toward the absolute center coordinates based on variable gravitational mass ($M$). This creates realistic Einstein Rings and gravitational lensing artifacts.

### 3. Doppler Boosting Asymmetry Profiles
To mirror the realistic physics showcased in modern cinema, the accretion disk calculation includes a vector tangent velocity calculation layer. Gas coordinates moving towards the observer are blue-shifted and significantly brightened, while retreating gas on the opposite horizontal axis is red-shifted and dim, capturing authentic relativistic Doppler warping.

## 🛠️ Performance Optimization & Input Handlers
* **Bypassing CORS:** Shader matrices are packed entirely as custom JavaScript inline string templates inside a single execution payload, preventing cross-origin security compilation locks during raw file preview setups.
* **GPU Pipelining:** Offloads complex three-dimensional noise generation maps and floating-point transform uniform updates entirely onto the WebGL GPU rendering context, securing a fluid 60 FPS output on both desktop viewports and mobile phone viewports.
* **Double-Tap Lock States:** Integrates touch and cursor velocity damping checks to smoothly interpolate and lock observer angles upon user gesture inputs.

## 🎛️ Architecture Tech Stack
* HTML5 / Canvas Vector Quad
* Modern CSS Custom Styling Properties (HUD Frame Overlays)
* Three.js (Utilized cleanly as a lightweight canvas WebGL program wrapper context)
* Pure GLSL Fragment Shaders
