# NWP Closed Loop Control 3D Simulator

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen.svg)](https://rapidrawrich.github.io/Closed-Loop-Control/)

An interactive 3D process control simulator and quiz prep tool tailored for NWP Instrument Technicians (ILM 310305cA). The application provides real-time physics simulation, dynamic WebGL 3D visualizations, multi-channel strip chart recording, and comprehensive theory and exam practice questions.

🔗 **Live Application:** [https://rapidrawrich.github.io/Closed-Loop-Control/](https://rapidrawrich.github.io/Closed-Loop-Control/)

---

## 🌟 Key Features

- **4 Core Industrial Process Dynamics:**
  - **First-Order Lag (Heat Exchanger):** First-order response with sensor dead time and process gain.
  - **Integrating Process (Liquid Level Vessel):** Ramp response characteristics with inflow manipulation and variable outflow/load disturbance.
  - **Pure Dead Time (Conveyor Scale):** Pure transport delay with dynamic ring-buffer delay simulation.
  - **Multicapacity Process (4-Tray Distillation Tower):** Cascaded series capacities demonstrating S-curve reaction curves.
- **Interactive SCADA Tuning & Controls:**
  - Proportional Gain ($K_c$) / Proportional Band ($PB\%$).
  - Integral Reset Rate ($1/T_i$ repeats/min) with anti-windup clamping.
  - Dead Time ($\tau_D$) and Process Time Constant ($\tau_1$).
  - Setpoint (SP) step adjustments and instant load disturbance injection.
- **Real-Time 3-Channel Strip Chart Recorder:**
  - Synchronous visualization of Setpoint (SP), Process Variable (PV), and Controller Output (CO).
  - Pause/resume inspection controls and transient stability monitoring.
- **Real-Time 3D WebGL Visualization:**
  - Interactive 3D visual models built in Three.js illustrating valve movements, liquid levels, thermal heat maps, and conveyor belt material flow.
- **Instrument Technician Quiz Prep:**
  - 10 comprehensive questions covering closed loop characteristics, transfer functions, stability criteria (quarter decay ratio), and troubleshooting.
  - One-click "Load into Simulator" presets for hands-on verification of quiz scenarios.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher)
- [npm](https://www.npmjs.com/)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/RapidRawRich/Closed-Loop-Control.git
   cd Closed-Loop-Control
   ```

2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

3. Launch the development server:
   ```bash
   npm run dev
   ```
   Open your browser to `http://localhost:3000`.

### Building for Production

```bash
npm run build
```
The output will be placed in the `dist/` directory.

---

## 🛠️ Technology Stack

- **Framework:** [React 19](https://react.dev/)
- **Build Tool:** [Vite](https://vitejs.dev/)
- **3D Graphics:** [Three.js](https://threejs.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Deployment:** GitHub Pages & GitHub Actions

---

## 📄 License

This project is open source and available under the standard MIT license or NWP training curriculum guidelines.
