# CLAUDE.md — Arcane Dice Tower

## Project

A 3D physics-driven dice tower built with Three.js and cannon-es. Users select polyhedral dice (d4–d100), roll them through an animated tower with baffles, and see results with effects and sound. Runs as a Vite-powered PWA.

## Development Philosophy

This project uses **Claude Superpowers** — a skill-driven development workflow. Every phase of work has a corresponding skill. Use them. The core principles:

1. **Think before you code.** Use `/brainstorming` before any creative work — new features, UI changes, behavior modifications. Explore intent and requirements first.
2. **Plan before you build.** Use `/writing-plans` to break multi-step work into a concrete plan. Use `/executing-plans` to carry it out with review checkpoints.
3. **Test before you implement.** TDD is mandatory (see below). Use `/test-driven-development` to drive all feature and bugfix work.
4. **Debug systematically.** Use `/systematic-debugging` when hitting bugs or test failures — no guessing, no shotgun fixes.
5. **Verify before you claim done.** Use `/verification-before-completion` before committing or announcing success. Evidence before assertions.
6. **Review your work.** Use `/requesting-code-review` when a feature is complete. Use `/receiving-code-review` when processing feedback — with technical rigor, not blind agreement.
7. **Finish cleanly.** Use `/finishing-a-development-branch` to decide how to integrate completed work (merge, PR, or cleanup). Always prefer creating a PR over direct merge or cleanup.

### Parallel Work

Use `/dispatching-parallel-agents` or `/subagent-driven-development` when facing independent tasks that don't share state. Use `/using-git-worktrees` for isolated feature work.

## TDD (Mandatory)

All development MUST follow the red-green-refactor cycle:

1. **Red** — Write a failing test that defines the desired behavior.
2. **Green** — Write the minimum code to make it pass.
3. **Refactor** — Clean up while keeping tests green.

No production code without a failing test driving it. This applies to features, fixes, and refactors alike.

## Commands

| Task | Command |
|---|---|
| Dev server | `npm run dev` |
| Build | `npm run build` |
| Run all tests | `npx vitest run` |
| Watch mode | `npx vitest` |
| Single test file | `npx vitest run src/path/to/File.test.ts` |

## Tech Stack

- **Rendering**: Three.js (0.182) — scene, camera, materials, lighting
- **Physics**: cannon-es (0.20) — rigid bodies, collision, settlement detection
- **Language**: TypeScript (5.9, strict mode)
- **Build**: Vite 7.3 with PWA plugin
- **Tests**: Vitest 4.0 — Node env by default, jsdom for `src/ui/` tests

## Architecture

```
src/
├── audio/        Sound (lazy-init on first interaction)
├── dice/         Geometry, materials, physics bodies, result detection
├── effects/      Particles, rune glow, critical hit/fail effects
├── physics/      cannon-es world wrapper, settlement detection
├── roll/         RollOrchestrator state machine (idle → rolling → settled)
├── scene/        Three.js scene + camera setup
├── tower/        Tower geometry + physics (walls, baffles, ramp, tray)
├── ui/           Dynamically generated UI (selector, button, results, presets)
└── main.ts       Wires everything together
```

## Conventions

- Tests live alongside source: `Foo.ts` / `Foo.test.ts`
- UI tests use `@vitest-environment jsdom` directive per file
- No complex mocking — direct class instantiation preferred
- D100 is two paired D10 dice (tens + units), combined result
- All UI is dynamically generated, no static HTML markup
- TypeScript strict mode with all lint flags enabled
