# D10 Rebuild Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the D10 geometry with a mathematically exact pentagonal trapezohedron built as the dual of a pentagonal antiprism.

**Architecture:** Build a regular pentagonal antiprism (two rings of 5 vertices), compute its dual (face centroids become vertices), assemble 10 congruent kite faces. Each kite is 2 triangles, routed through the generic UV mapping path. Delete all old D10-specific geometry and UV code.

**Tech Stack:** Three.js BufferGeometry, TypeScript, Vitest

---

### Task 1: Delete Old D10 Geometry Code

**Files:**
- Modify: `src/dice/DiceGeometry.ts:17-20` (switch case)
- Delete: `src/dice/DiceGeometry.ts:127-252` (addD10FaceGroupsAndUVs + createD10Geometry)
- Modify: `src/dice/DiceGeometry.test.ts:70-125` (D10-specific tests)

**Step 1: Remove old D10 functions from DiceGeometry.ts**

Delete the `addD10FaceGroupsAndUVs` function (lines 127-196) and the `createD10Geometry` function (lines 198-252) entirely.

Update the switch case (lines 17-20) to a temporary stub:

```typescript
    case 'd10':
    case 'd100':
      throw new Error('D10 geometry not yet implemented');
```

**Step 2: Remove old D10-specific tests from DiceGeometry.test.ts**

Delete these three tests (lines 70-125):
- `d10 mid-ring vertices have symmetric V coordinates across each kite face` (lines 70-89)
- `d10 kite faces are subdivided into 4 triangles for better texture mapping` (lines 91-96)
- `d10 UV mapping gives all triangles of each kite face meaningful area` (lines 98-125)

Keep all parametric tests that include d10/d100 — they'll fail but that's expected.

**Step 3: Run tests to confirm expected failures**

Run: `npx vitest run src/dice/DiceGeometry.test.ts`
Expected: Several failures for d10/d100 tests (the parametric ones that still reference d10). The deleted tests should no longer appear.

**Step 4: Commit**

```bash
git add src/dice/DiceGeometry.ts src/dice/DiceGeometry.test.ts
git commit -m "refactor: delete old D10 geometry and D10-specific tests"
```

---

### Task 2: Write New D10 Geometry Tests

**Files:**
- Modify: `src/dice/DiceGeometry.test.ts`

**Step 1: Write test for correct vertex count**

Add inside the `createDiceGeometry` describe block:

```typescript
  it('d10 has 60 vertices (10 kite faces × 2 triangles × 3 vertices)', () => {
    const geo = createDiceGeometry('d10');
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    expect(pos.count).toBe(60);
  });
```

**Step 2: Write test for congruent kite faces**

All 10 kite faces must have the same set of edge lengths (within floating-point tolerance). Each kite has 4 edges. We extract the 4 unique corner positions per face from the 6 triangle vertices, then compare sorted edge lengths.

```typescript
  it('d10 has 10 congruent kite faces (same edge lengths)', () => {
    const geo = createDiceGeometry('d10');
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const verticesPerFace = 6; // 2 triangles × 3 vertices

    function getEdgeLengths(face: number): number[] {
      const start = face * verticesPerFace;
      // Extract unique corners: from the two triangles (pole, wing1, mid) and (pole, mid, wing2)
      // Vertices: [pole, wing1, mid, pole, mid, wing2]
      const pole = new THREE.Vector3().fromBufferAttribute(pos, start);
      const wing1 = new THREE.Vector3().fromBufferAttribute(pos, start + 1);
      const mid = new THREE.Vector3().fromBufferAttribute(pos, start + 2);
      const wing2 = new THREE.Vector3().fromBufferAttribute(pos, start + 5);
      // Kite edges: pole→wing1, wing1→mid, mid→wing2, wing2→pole
      return [
        pole.distanceTo(wing1),
        wing1.distanceTo(mid),
        mid.distanceTo(wing2),
        wing2.distanceTo(pole),
      ].sort((a, b) => a - b);
    }

    const refEdges = getEdgeLengths(0);
    for (let face = 1; face < 10; face++) {
      const edges = getEdgeLengths(face);
      for (let e = 0; e < 4; e++) {
        expect(edges[e]).toBeCloseTo(refEdges[e], 5);
      }
    }
  });
```

**Step 3: Write test for opposite face normals being antiparallel**

Faces i and (i+5)%10 must have antiparallel normals (dot product ≈ -1).

```typescript
  it('d10 opposite faces (i and i+5) have antiparallel normals', () => {
    const geo = createDiceGeometry('d10');
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const verticesPerFace = 6;

    function faceNormal(face: number): THREE.Vector3 {
      const start = face * verticesPerFace;
      const v0 = new THREE.Vector3().fromBufferAttribute(pos, start);
      const v1 = new THREE.Vector3().fromBufferAttribute(pos, start + 1);
      const v2 = new THREE.Vector3().fromBufferAttribute(pos, start + 2);
      const e1 = new THREE.Vector3().subVectors(v1, v0);
      const e2 = new THREE.Vector3().subVectors(v2, v0);
      return new THREE.Vector3().crossVectors(e1, e2).normalize();
    }

    for (let i = 0; i < 5; i++) {
      const n1 = faceNormal(i);
      const n2 = faceNormal(i + 5);
      expect(n1.dot(n2)).toBeCloseTo(-1, 1);
    }
  });
```

**Step 4: Run tests to verify they fail**

Run: `npx vitest run src/dice/DiceGeometry.test.ts`
Expected: All new D10 tests FAIL (geometry throws "not yet implemented").

**Step 5: Commit**

```bash
git add src/dice/DiceGeometry.test.ts
git commit -m "test: add new D10 geometry tests (red phase)"
```

---

### Task 3: Implement New D10 Geometry

**Files:**
- Modify: `src/dice/DiceGeometry.ts`

**Step 1: Write the new createD10Geometry function**

Add this function at the bottom of `DiceGeometry.ts` (replacing the deleted one):

```typescript
function createD10Geometry(radius: number): THREE.BufferGeometry {
  // Pentagonal trapezohedron as dual of regular pentagonal antiprism.
  // Antiprism: two rings of 5 vertices, offset by π/5, at ±h.
  // Dual: face centroids of antiprism become equatorial vertices,
  //       cap centroids become polar vertices.
  const R = 1; // unit ring radius
  const h = R / 2; // half-height for regular antiprism

  // Antiprism vertices
  const topRing: [number, number, number][] = [];
  const bottomRing: [number, number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const topAngle = (2 * Math.PI * i) / 5;
    topRing.push([R * Math.cos(topAngle), h, R * Math.sin(topAngle)]);
    const botAngle = topAngle + Math.PI / 5;
    bottomRing.push([R * Math.cos(botAngle), -h, R * Math.sin(botAngle)]);
  }

  // Dual vertices
  const topPole: [number, number, number] = [0, h, 0];
  const bottomPole: [number, number, number] = [0, -h, 0];

  // 10 equatorial vertices from triangle centroids
  // eq[2i] = centroid of upper triangle (T_i, B_i, T_{i+1})
  // eq[2i+1] = centroid of lower triangle (B_i, T_{i+1}, B_{i+1})
  const eq: [number, number, number][] = [];
  for (let i = 0; i < 5; i++) {
    const next = (i + 1) % 5;
    eq.push([
      (topRing[i][0] + bottomRing[i][0] + topRing[next][0]) / 3,
      (topRing[i][1] + bottomRing[i][1] + topRing[next][1]) / 3,
      (topRing[i][2] + bottomRing[i][2] + topRing[next][2]) / 3,
    ]);
    eq.push([
      (bottomRing[i][0] + topRing[next][0] + bottomRing[next][0]) / 3,
      (bottomRing[i][1] + topRing[next][1] + bottomRing[next][1]) / 3,
      (bottomRing[i][2] + topRing[next][2] + bottomRing[next][2]) / 3,
    ]);
  }

  // Scale all vertices so circumradius matches the desired radius
  const allVerts = [topPole, bottomPole, ...eq];
  let maxDist = 0;
  for (const v of allVerts) {
    maxDist = Math.max(maxDist, Math.sqrt(v[0] ** 2 + v[1] ** 2 + v[2] ** 2));
  }
  const scale = radius / maxDist;
  for (const v of allVerts) {
    v[0] *= scale;
    v[1] *= scale;
    v[2] *= scale;
  }

  // Build 10 kite faces, each split into 2 triangles.
  // Face 2k (top-pole kite): topPole, eq[2k], eq[2k-1], eq[2k-2]
  // Face 2k+1 (bottom-pole kite): bottomPole, eq[2k-1], eq[2k], eq[2k+1]
  // Split along the kite's axis of symmetry (pole ↔ middle equatorial vertex).
  // Winding: outward-facing normals (verified by right-hand rule).
  const vertices: number[] = [];
  const e = (j: number) => eq[((j % 10) + 10) % 10];

  for (let f = 0; f < 10; f++) {
    const isTop = f % 2 === 0;
    const pole = isTop ? topPole : bottomPole;
    const mid = e(f - 1);  // axis vertex opposite the pole
    const wing1 = isTop ? e(f) : e(f - 2);
    const wing2 = isTop ? e(f - 2) : e(f);

    // Triangle 1: pole, wing1, mid
    vertices.push(...pole, ...wing1, ...mid);
    // Triangle 2: pole, mid, wing2
    vertices.push(...pole, ...mid, ...wing2);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
}
```

**Step 2: Update the switch case to use new geometry + generic UV path**

Replace the temporary stub (lines 17-20) with:

```typescript
    case 'd10':
    case 'd100':
      return addFaceGroupsAndUVs(createD10Geometry(r), config.faceCount);
```

**Step 3: Run geometry tests**

Run: `npx vitest run src/dice/DiceGeometry.test.ts`
Expected: All tests PASS, including the new D10 tests and existing parametric tests (UV centroid, outward normals).

**Step 4: Commit**

```bash
git add src/dice/DiceGeometry.ts
git commit -m "feat: implement D10 as dual of pentagonal antiprism"
```

---

### Task 4: Update DiceConfig faceValues for New Geometry

**Files:**
- Modify: `src/dice/DiceConfig.ts:79-86` (d10 faceValues)
- Modify: `src/dice/DiceConfig.ts:103-111` (d100 faceValues)
- Modify: `src/dice/DiceConfig.test.ts:47-58` (d10 faceValues test)

The new geometry has a deterministic face ordering: even faces (0,2,4,6,8) touch the top pole, odd faces (1,3,5,7,9) touch the bottom pole. Opposite faces are (i, i+5).

The faceValues array must satisfy:
1. All values 0-9 present exactly once
2. Opposite faces sum to 9: `faceValues[i] + faceValues[(i+5) % 10] === 9`
3. Odd values on even face indices (top pole), even values on odd face indices (bottom pole)
4. Standard Chessex clockwise order around the odd pole: 7, 1, 9, 5, 3

**Step 1: Determine the correct faceValues array**

Write a temporary test (or use the debugger) to examine the face normals of the new geometry and determine which direction the faces go around the top pole. The expected result based on the construction (faces built in counterclockwise equatorial order when viewed from above) is:

```
faceValues: [7, 4, 1, 6, 9, 2, 5, 8, 3, 0]
```

This means:
- Face 0 (T0, ~0°) = 7, opposite Face 5 (B2, ~180°) = 2 → 7+2=9 ✓
- Face 2 (T1, ~72°) = 1, opposite Face 7 (B3, ~252°) = 8 → 1+8=9 ✓
- Face 4 (T2, ~144°) = 9, opposite Face 9 (B4, ~324°) = 0 → 9+0=9 ✓
- Face 6 (T3, ~216°) = 5, opposite Face 1 (B0, ~36°) = 4 → 5+4=9 ✓
- Face 8 (T4, ~288°) = 3, opposite Face 3 (B1, ~108°) = 6 → 3+6=9 ✓

If the clockwise direction is reversed (geometry builds CCW), the odd values would be in reverse order: [3, 6, 5, 8, 9, 0, 7, 2, 1, 4]. Determine the correct array empirically by checking which direction face indices go around the pole.

**Step 2: Update DiceConfig.ts**

Update the d10 entry (line 84):
```typescript
    faceValues: [7, 4, 1, 6, 9, 2, 5, 8, 3, 0],
```

Update the d100 entry (line 108) to match (d10 × 10):
```typescript
    faceValues: [70, 40, 10, 60, 90, 20, 50, 80, 30, 0],
```

**Step 3: Update the DiceConfig test**

Update the test at DiceConfig.test.ts:47-58 to match the new faceValues:

```typescript
  it('d10 faceValues match standard D10 arrangement (opposite faces sum to 9)', () => {
    const values = DICE_CONFIGS.d10.faceValues;
    expect(values).toHaveLength(10);
    // Every value 0-9 must appear exactly once
    expect([...values].sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);
    // Opposite faces (i and i+5) must sum to 9
    for (let i = 0; i < 5; i++) {
      expect(values[i] + values[(i + 5) % 10]).toBe(9);
    }
    // Odd values on even indices (top pole), even values on odd indices (bottom pole)
    for (let i = 0; i < 10; i++) {
      if (i % 2 === 0) expect(values[i] % 2).toBe(1);
      else expect(values[i] % 2).toBe(0);
    }
  });
```

Note: The exact array assertion (`expect(values).toEqual([...])`) is removed in favor of structural checks, since the specific rotation around the pole depends on the geometry's winding direction.

**Step 4: Run all config tests**

Run: `npx vitest run src/dice/DiceConfig.test.ts`
Expected: All PASS.

**Step 5: Commit**

```bash
git add src/dice/DiceConfig.ts src/dice/DiceConfig.test.ts
git commit -m "feat: update D10/D100 faceValues for new geometry"
```

---

### Task 5: Run Full Test Suite and Verify

**Files:** None (verification only)

**Step 1: Run all tests**

Run: `npx vitest run`
Expected: All tests PASS.

**Step 2: Run type checking**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Build**

Run: `npm run build`
Expected: Clean build with no errors.

**Step 4: Commit any remaining fixes**

If any tests fail, fix them and commit. Then re-run the full suite.

---

### Task 6: Visual Verification

**Files:** None (manual check)

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Verify D10 appearance**

- Select D10 in the dice selector
- Check that the die has the correct shape (two sharp poles, 10 kite faces)
- Verify face numbers are readable and centered
- Roll the D10 and confirm results appear correctly (0-9)

**Step 3: Verify D100 appearance**

- Select D100
- Confirm two dice appear: one with 00-90 labels, one with 0-9
- Roll and confirm combined result is 1-100

**Step 4: Check UV mapping quality**

If face numbers appear off-center on the kite faces, note this for a follow-up task. The generic UV path may need a D10-specific adjustment (this is a known potential issue documented in the design).
