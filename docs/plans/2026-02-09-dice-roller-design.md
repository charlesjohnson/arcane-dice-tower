# Arcane Dice Tower — Design Document

A over-the-top magical 3D dice roller PWA for tabletop RPGs. Physics-driven rolls through a full 3D ivory dice tower with arcane visual effects.

## Tech Stack

- **Three.js** — 3D rendering (dice, tower, lighting, particles)
- **Cannon-es** — Physics simulation (dice tumbling, baffle collisions, tray settling)
- **Vite** — Build tool, dev server
- **vite-plugin-pwa** — Service worker, installability
- **Vanilla TypeScript** — No framework. Single-screen 3D app with a thin UI overlay.

## Project Structure

```
src/
  main.ts              — App entry, scene setup
  dice/                — Dice geometry, materials, physics bodies
  tower/               — Tower model, baffles, tray
  physics/             — Physics world setup, simulation loop
  effects/             — Particles, glows, crit animations
  ui/                  — Controls panel, preset manager
  audio/               — Sound effects
  assets/              — Textures, fonts
public/
  manifest.json        — PWA manifest
  icons/               — App icons
```

## Supported Dice

Standard D&D 7-dice set only:

| Die  | Geometry                    | Three.js Approach       |
|------|-----------------------------|-------------------------|
| D4   | Tetrahedron                 | Built-in                |
| D6   | Cube                        | Built-in BoxGeometry    |
| D8   | Octahedron                  | Built-in                |
| D10  | Pentagonal trapezohedron    | Custom vertex data      |
| D12  | Dodecahedron                | Built-in                |
| D20  | Icosahedron                 | Built-in                |
| D100 | Two D10s (tens + units)     | Reuses D10 geometry     |

## Dice Modeling

### Materials

Dark obsidian/crystal semi-translucent material. Numbers rendered onto per-face textures via canvas-based texture generation using a runic-style font. Each number has a subtle emissive glow outline in arcane blue/purple.

### Physics Bodies

Each die gets a matching Cannon-es convex hull collider. Random initial angular velocity and slight position offset on each roll. Mass, friction, and restitution tuned per die type (D4 feels chunkier than D20).

### Reading Results

After dice settle (angular + linear velocity below threshold), determine the result by dot product of each face normal against the world up vector. The most upward-facing face is the result.

## The Dice Tower

### Structure

Tall hexagonal column carved from shiny ivory with a pearlescent sheen (environment map reflections). Rune engravings along edges glow gold/soft violet against the cream-white surface. Dragon-bone artifact aesthetic.

Cutaway front wall so the interior is visible. Funnel-shaped opening at the top. Curved catch tray at the base.

Built entirely from Three.js primitives (cylinders, planes, boxes) — no external model files.

### Internal Baffles

3-4 angled ivory shelves staggered left-right inside the tower. Each baffle has a Cannon-es static collider. Runes on baffles pulse with a flash of arcane energy on die impact.

### Tray

Curved catch tray, walled on three sides. Deep purple/midnight blue velvet lining contrasting against ivory walls. Slight give on the floor surface (tuned restitution) for realistic bouncing before settling. Physics colliders on floor and walls.

### Camera Work

Scripted cinematic camera per roll:
1. Wide shot showing the full tower
2. Tracks dice down through the interior past baffles
3. Pulls back as dice spill into the tray
4. Gentle zoom to settled dice for result reading

## Visual Effects

### Drop Sequence

Dice conjure into existence above the tower funnel with a swirl of arcane particles. Pulse of light from tower runes signals roll start. Then physics takes over.

### Baffle Impacts

- Burst of glowing particles at each contact point
- Nearest runes flash brightly and fade
- Subtle screen shake (camera jitter) scaled to die size
- Heavier dice produce more intense effects

### Settling & Results

- Soft spotlight fades in above each settled die
- Result number glows brighter
- Floating text label rises above each die showing the value
- Each number slams into the results display with a flash and trailing particle streak
- Total sum ignites at the end with a flourish
- Chime per die as result is read

### Critical Hits & Fumbles (D20 only)

- **Nat 20:** Golden particle fireworks. All tower runes flare. Tray bathed in warm golden light. Fanfare audio.
- **Nat 1:** Dark energy tendrils crack from the die. Tower runes flicker and dim. Low rumble. Ominous but fun.

### Ambient / Idle State

- Tower runes pulse gently at all times
- Particles drift lazily upward like embers
- Lighting breathes slowly
- Faint arcane geometry (circles, triangles, pentagrams) slowly rotates in deep background behind tower
- Subtle ambient particle field across the whole screen
- The scene is never static

## UI & Controls

All UI overlays the 3D scene as semi-transparent panels.

### Dice Selector (bottom of screen)

- Horizontal row of **miniature 3D spinning dice** — one per die type
- Each hovers and bobs gently
- Tapping adds one to the current roll — die icon flares with light, rune circle pulses outward
- Quantity badge burns into existence like a brand
- Tap again to add more, long-press/swipe down to remove
- Summary text above selector: "2d6 + 1d20"

### Roll Button

- Large, centered below the dice selector
- Contains a persistent swirling energy vortex (contained portal effect)
- On press, vortex expands briefly across the screen before dice conjure
- Disabled during active roll animation

### Results Display (top of screen)

- Individual values slam into place with flash and particle trails
- Total sum ignites with a flourish at the end
- Stays visible until next roll

### Presets Panel (slide-out side drawer)

- Ancient scroll/tome aesthetic — unrolls or pages open on access
- Entries in glowing runic script that resolves into readable text
- Each preset: name ("Attack roll," "Fireball damage") + dice formula
- Tap to load, then hit Roll
- Add/delete from this panel
- Persisted in localStorage

### Responsive Design

- Desktop: controls at bottom, comfortable spacing
- Mobile portrait: same layout, larger tap targets
- Camera framing adjusts to keep tower and tray visible at any aspect ratio
- Optional "shake to roll" via device accelerometer (nice-to-have)

## Audio

- Dice clatter on baffle impacts
- Rolling/tumbling sounds during tower descent
- Felt thud on tray landing
- Chime per die result
- Nat 20 fanfare
- Nat 1 ominous rumble
- Ambient low magical hum during idle
- UI interaction sounds (tap, select, preset open)

## Out of Scope for v1

- Multiplayer / shared rolls
- Custom dice colors or skins
- Dice roll history / logging
- Roll modifiers (e.g., +4 to attack)
- Non-standard dice (D2, D3, etc.)
- User accounts or cloud sync
