# Reference Fidelity Mode

This folder documents the reference-fidelity enhancement for this Presenton fork.

## What this branch adds

- The `/reference-studio` page accepts one reference PPTX and multiple raw-material files in one workflow.
- It renders the reference slides, checks fonts, analyzes layouts through Template V2, extracts the uploaded source materials, creates the presentation outline, and continues to final slide generation.
- The default prompt and reference-fidelity instructions tell the generator to create a new content story, match the reference's design language, preserve brand identity, and create relevant illustrations, images, charts, diagrams, and infographics rather than blindly replacing text.
- Before generation, the Studio checks that an image provider is configured so it can warn instead of silently producing placeholder-only visuals.
- The outline-generation page also has a **Reference Fidelity Mode** toggle for use independently.
- The instruction logic lives in:
  - `servers/nextjs/app/(presentation-generator)/outline/components/OutlinePromptBar.tsx`
  - `servers/nextjs/app/(presentation-generator)/outline/utils/reference-fidelity.ts`
  - `servers/nextjs/tests/reference-fidelity-mode.test.mjs`

## Recommended workflow

1. Open `/reference-studio`, upload the reference PPTX, and upload the raw-material documents.
2. Configure a text provider in Settings. For generated illustrations, also open **Settings → Image Provider**, enable generation, and configure a provider such as Gemini Flash with a Google API key. Stock-image providers require their own credentials.
3. Keep the built-in prompt or add audience-specific instructions, then generate the deck.
4. Inspect the resulting slides in the editor for content accuracy, layout fit, visual relevance, and font substitutions before exporting.
5. Check native PowerPoint animations and transitions separately; do not assume they were copied unless verified in the export.

## What this enhancement does not guarantee

- It does **not** promise that every output slide will be pixel-identical to the reference.
- The mode is a prompt-level constraint layered over the existing Template V2 generation flow; it is not yet an automated rendered-slide visual-diff gate.
- Exact animation and transition preservation must be validated against the PPTX export implementation. The instruction explicitly says not to claim animations were preserved unless that is verified.
- The chosen LLM must support both image input and structured JSON output when creating templates from reference slides. A text-only local model is not sufficient for reference-template analysis.
- Local/Ollama inference can avoid per-token API billing, but model quality, speed and image support depend on the selected model and local hardware.

## Planned next fidelity milestones

1. Add a per-slide pre-export QA report: slide count, failed/missing elements, font substitutions, invalid asset URLs and text overflow/clipping.
2. Render output slides and show reference/output pairs side by side.
3. Where renderers and matching slide pairs are available, compute a clearly labeled visual-difference diagnostic. Such a score is not proof of semantic correctness.
4. Add per-slide retry for failed slides without regenerating the full deck.
5. Investigate OOXML animation/transition retention separately, with tests for specific supported animation types.

## Upstream architecture

Read the upstream [Template V2 architecture](https://github.com/presenton/presenton/blob/main/docs/template-v2.md) and [generation modes guide](https://github.com/presenton/presenton/blob/main/docs/presentation-generation-modes.md).
