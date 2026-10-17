import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { pathToFileURL } from "node:url";

import { build } from "esbuild";

let fidelity;
let temporaryDirectory;

test.before(async () => {
  temporaryDirectory = await mkdtemp(
    path.join(tmpdir(), "presenton-reference-fidelity-"),
  );
  const outputFile = path.join(temporaryDirectory, "reference-fidelity.mjs");

  await build({
    entryPoints: [
      path.resolve("app/(presentation-generator)/outline/utils/reference-fidelity.ts"),
    ],
    outfile: outputFile,
    bundle: true,
    platform: "node",
    format: "esm",
    tsconfig: path.resolve("tsconfig.json"),
    logLevel: "silent",
  });

  fidelity = await import(
    pathToFileURL(outputFile).href + "?cache=" + Date.now()
  );
});

test.after(async () => {
  if (temporaryDirectory) {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});

test("enables reference fidelity without deleting existing user instructions", () => {
  const original = "Use Bahasa Indonesia. Keep the presentation concise.";
  const result = fidelity.setReferenceFidelityEnabled(original, true);

  assert.ok(result.includes(original));
  assert.ok(result.includes("STRICT DESIGN PRESERVATION"));
  assert.ok(result.includes("element positions"));
  assert.ok(fidelity.isReferenceFidelityEnabled(result));
});

test("enabling reference fidelity repeatedly does not duplicate the instruction block", () => {
  const once = fidelity.setReferenceFidelityEnabled("Keep the charts.", true);
  const twice = fidelity.setReferenceFidelityEnabled(once, true);

  assert.equal(
    twice.split(fidelity.REFERENCE_FIDELITY_START).length - 1,
    1,
  );
  assert.equal(twice.split("STRICT DESIGN PRESERVATION").length - 1, 1);
});

test("disabling reference fidelity removes only its block", () => {
  const enabled = fidelity.setReferenceFidelityEnabled(
    "Use the provided facts only.",
    true,
  );
  const disabled = fidelity.setReferenceFidelityEnabled(enabled, false);

  assert.equal(disabled, "Use the provided facts only.");
  assert.equal(fidelity.isReferenceFidelityEnabled(disabled), false);
});

test("works when the user has no other instructions", () => {
  const enabled = fidelity.setReferenceFidelityEnabled(null, true);
  const disabled = fidelity.setReferenceFidelityEnabled(enabled, false);

  assert.ok(fidelity.isReferenceFidelityEnabled(enabled));
  assert.equal(disabled, "");
});
