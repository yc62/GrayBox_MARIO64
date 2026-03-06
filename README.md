# 🍄 Super Mario Bros — Three.js Recreation

A fully playable browser recreation of Super Mario Bros World 1-1 built with **Three.js** and vanilla JavaScript. No game engine. No canvas 2D. Pure WebGL.

> **Created by:** John Cho | February 2026

---

## 🎮 Play It

Open `index.html` in any modern browser. No install, no build step — just files and a local server.

```bash
# Quick local server (Python)
python -m http.server 8080

# Or with Node
npx serve .
```

Then visit `http://localhost:8080`.

---

## 🕹️ Controls

| Key | Action |
|-----|--------|
| `A` / `←` | Move left |
| `D` / `→` | Move right |
| `W` / `Space` | Jump (hold for higher) |
| `Shift` | Run faster |
| `X` | Shoot fireball *(requires Fire Flower)* |
| `Enter` | Confirm / Enter level |
| `Q` / `E` | Rotate overworld camera |
| `Z` | Toggle zoom on overworld map |

---

## ✨ Features

### Three Game Modes
- **Title Screen** — Spinning 3D logo, animated camera bob, blinking "Press Enter" prompt
- **Overworld Map** — Node-based world map with animated water shader, cloud drift, and Mario walking between portals
- **World 1-1 Level** — Full side-scrolling platformer with physics, enemies, power-ups, and a finish castle

### Level Mechanics
- **Variable-height jumping** — Hold the jump key longer to jump higher
- **Stomp enemies** — Land on Goombas (+100 pts) or Koopa Troopas (+200 pts) to kill them
- **Block rewards** — Head-bump yellow `?` blocks to release:
  - 🍄 **Mushroom** → Mario grows big for 10 seconds, immune to enemies
  - 🌸 **Fire Flower** → Mario can shoot bouncing fireballs (press `X`)
  - 🪙 **Coin** → +200 points, animated pop
- **Piranha Plants** — Stand guard in pipes, fire projectiles toward Mario
- **Scrolling camera** — Follows Mario with smooth lead offset and vertical tracking
- **Countdown timer** — Run out of time and you die
- **Lives system** — 3 lives, Game Over screen, full restart

### Visuals
- GLB 3D models for Mario, Goomba, Koopa Troopa, Piranha Plant, Mushroom, Fire Flower, and the title logo
- Procedural fallback geometry for every model — runs without any GLB files
- `?` blocks rendered with a canvas-generated texture stamped as a front/back decal
- Custom GLSL water shader on the overworld map with animated waves, caustic shimmer, and Fresnel specular
- PCF soft shadows, ACES filmic tone-mapping, hemisphere + directional + rim + fill lighting
- Smooth camera transitions between all three modes

### Audio
- Title BGM, Overworld BGM, "Here We Go!" voice clip
- Jump SFX and death jingle with browser-safe autoplay handling

---

## 📁 File Structure

```
/
├── index.html                          # Entry point
├── main.js                             # All game logic (~2000 lines)
├── Overworld_Theme.mp3
├── title_theme.mp3
├── Here_We_Go.mp3
├── Mario_Jump.mp3
├── mario_death.mp3
├── newlogo_mario.glb                   # Title logo model
├── mario_rig.glb                       # Mario character (animated)
├── goomba.glb
├── koopa_troopa.glb
├── plante_piranha.glb
├── mushroom.glb
├── fire_flower.glb
├── super_mario_world_map.glb           # Overworld map terrain
└── super_mario_bros__level_1_-_1.glb  # Optional level visual backdrop
```

> All `.glb` files are optional — the game will run with procedural geometry fallbacks if any are missing.

---

## 🏗️ Architecture

`main.js` is a single-file game loop structured in clear sections:

| Section | What it does |
|---------|-------------|
| Renderer / Scene / Camera | Three.js setup, resize handling |
| Audio | HTML Audio API, autoplay guard |
| Lighting | Hemisphere + sun + fill + rim |
| Title Screen | DOM overlay + GLB logo spinner |
| Overworld | Shader map, node graph, Mario walker |
| Input | `keys{}` map + mode-aware keydown dispatch |
| Level Data | `PLATFORMS`, `COIN_DEFS`, `ENEMY_DEFS` arrays |
| Physics | Raycaster-based ground / wall / ceiling probes |
| Build Level | Geometry construction, enemy/coin spawn |
| Enemy AI | Chase, wall-bounce, stomp & fireball detection |
| Power-ups | Mushroom grow, Fire Flower shoot |
| HUD / Overlays | Score bar, death screen, level clear |
| Main Loop | `animate()` — branches by MODE each frame |

---

## 🛠️ Tech Stack

- **[Three.js](https://threejs.org/)** — 3D rendering, scene graph, GLTFLoader, Raycaster
- **Vanilla JavaScript** — zero dependencies beyond Three.js
- **HTML/CSS** — DOM overlays for HUD, menus, and transitions
- **GLSL** — custom vertex + fragment shaders for the overworld water/terrain

---

## 🚀 Extending It

Want to add more? Here are natural next steps:

- Add World 1-2 underground level
- Add sound effects for coin collect and enemy stomp
- Animate the `?` block spinning after it's been hit
- Add a Flagpole slide-down animation on level clear
- Add mobile touch controls
- Save high score to `localStorage`

---

## 📄 License

This is a fan recreation made for educational purposes.  
Super Mario Bros is © Nintendo. All rights reserved.

---

*Built as a class project exploring real-time 3D graphics in the browser.*
