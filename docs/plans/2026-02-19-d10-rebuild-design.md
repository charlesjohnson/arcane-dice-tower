# D10 Rebuild Design

## Goal

Replace the existing D10 geometry (ad-hoc zigzag ring construction) with a mathematically exact pentagonal trapezohedron built as the dual of a pentagonal antiprism. Wipe existing D10 geometry, UV mapping, config, and tests; rebuild from scratch.

## Scope

**Rebuild:** DiceGeometry (D10 creation + UV path), DiceConfig (D10/D100 faceValues), all D10-related tests.

**Keep unchanged:** DiceBody (sphere physics), DiceResult (upward face reading), RollOrchestrator (D100 pairing), DiceMaterial (generic material path).

## Geometry: Antiprism Dual

1. Build a pentagonal antiprism: two rings of 5 vertices offset by 36 degrees, at heights +h and -h.
2. Compute the dual: place a vertex at each of the 10 triangular face centroids.
3. The 10 centroids plus the 2 polar vertices (top/bottom center of the antiprism) form the 12 vertices of the pentagonal trapezohedron.
4. Build 10 kite faces, each connecting: pole -> ring vertex -> opposite pole -> ring vertex.
5. Subdivide each kite into 2 triangles (split along pole-to-pole diagonal).
6. Output: 10 faces x 2 triangles x 3 vertices = 60 non-indexed vertices.

The dual construction guarantees all kite faces are planar and congruent.

## UV Mapping

Use the existing generic `addFaceGroupsAndUVs` function. Planar kite faces produce correct UVs via planar projection, eliminating the need for the special `addD10FaceGroupsAndUVs` workaround.

## Face Numbering

Standard Chessex D10 arrangement:
- Odd numbers (1, 3, 5, 7, 9) converge at one pole
- Even numbers (0, 2, 4, 6, 8) converge at the other pole
- Opposite faces sum to 9: 0<->9, 1<->8, 2<->7, 3<->6, 4<->5

D100: faceValues = D10 values x 10, with `isPercentile: true`.

## Materials

No changes. Generic path handles D10/D100 already.

## Deleted Code

- `createD10Geometry()` in DiceGeometry.ts
- `addD10FaceGroupsAndUVs()` in DiceGeometry.ts
- D10-specific tests: symmetric UV test, 4-triangle subdivision test

## Test Plan

1. Vertex count: 12 (2 poles + 10 dual centroids)
2. Face/triangle count: 60 non-indexed vertices (10 x 2 x 3)
3. All kite faces are planar (4 corner positions lie in a plane)
4. All 10 kites are congruent (same edge lengths)
5. Opposite faces (i, i+5) have antiparallel normals
6. faceValues: all 0-9 present, opposites sum to 9
7. D100 faceValues: D10 x 10
8. UV centroid at (0.5, 0.5) — existing parametric test
9. Outward normals — existing parametric test
