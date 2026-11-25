import assert from "node:assert/strict";
import { test } from "node:test";
import { projectToMap } from "./worldBounds";

test("projects known Temple Woods / Bramblemead world coords onto land UVs", () => {
  // Nearest creature to base-1 in world.json (Chicken)
  const a = projectToMap(47688, 176760);
  assert.ok(Math.abs(a.leftPct - 18.6) < 0.2);
  assert.ok(Math.abs(a.topPct - 66.86) < 0.2);
  assert.equal(a.onMap, true);

  // User base-1 centroid
  const b = projectToMap(47172, 175821);
  assert.ok(b.leftPct > 18 && b.leftPct < 19);
  assert.ok(b.topPct > 66 && b.topPct < 67);
});
