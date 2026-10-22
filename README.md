# Jetpack Chogride

An endless runner arcade game built with React, TypeScript, and HTML5 Canvas. Take control of **Chog**, a chibi hedgehog hero armed with rocket thrusters, as you dodge electric hazards, evade incoming missiles, and collect coins in an endless high-tech lab corridor.

---

## Gameplay & Features

- **One-Touch Jetpack Flight:** Hold to fly up, release to fall and sprint on the floor.
- **Dynamic Obstacles:**
  - **Electric Zappers:** Horizontal, vertical, diagonal, and rotating plasma beams with fair capsule-accurate collision detection.
  - **Homing Missiles:** Armed with tactical radar lock-on alerts and supersonic rocket flybys.
- **Endless Coin Streams:** Collect coins in undulating waves, runways, diamonds, and jackpot vaults.
- **Gadget Lab (Physics Tuner):** Real-time in-game control panel to tweak gravity, jetpack thrust, scroll speed, and hitbox forgiveness.
- **Procedural Sound Engine:** Web Audio API sound effects synthesized entirely in code without heavy audio samples.
- **Responsive & Fullscreen:** Scales to any resolution with dedicated mobile touch and desktop keyboard controls.

---

## Controls

| Action | Keyboard | Mouse / Touch |
| :--- | :--- | :--- |
| **Fly / Jetpack** | Hold `Space` or `Up Arrow` | Hold Left Click / Tap & Hold |
| **Pause / Resume** | `P` or `Esc` | Pause button in top HUD |
| **Restart Run** | `R` (on wipeout screen) | "Fly Again" button |
| **Toggle Mute** | `M` | Speaker icon in top HUD |
| **Toggle Fullscreen** | `F` | Expand icon in top HUD |
| **Toggle Hitbox Debug** | `Eye` icon | Top HUD |
| **Open Physics Lab** | `LAB` button | Top HUD |

---

## Tech Stack

- **Framework:** React 19, TypeScript, Vite
- **Renderer:** HTML5 2D Canvas API (60 FPS custom loop)
- **Physics:** Custom semi-implicit Euler integration
- **Audio:** Web Audio API (procedural synthesis for thrusters, electric arcs, radar, rockets, and coins)
- **Styling & UI:** Tailwind CSS, Lucide React icons

---

## Running Locally

1. Clone or download the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local development server:
   ```bash
   npm run dev
   ```
4. Open `http://localhost:3000` in your browser.
