# Reference Fidelity Mode

This folder documents the reference-fidelity enhancement for this Presenton fork.

## What this branch adds

The new `/reference-studio` page provides a single intake form for a reference PPTX, multiple raw-material files, a prompt, language, and slide count. It runs the existing Template V2 reference-template pipeline, uploads and extracts the raw materials, creates the presentation outline, applies strict design-preservation instructions, and automatically continues to final slide generation. The result opens in Presenton’s presentation editor. The outline-generation UI also has a **Reference Fidelity Mode** checkbox that can be used independently.

The instruction logic lives in:

- servers/nextjs/app/(presentation-generator)/outline/components/OutlinePromptBar.tsx
- servers/nextjs/app/(presentation-generator)/outline/utils/reference-fidelity.ts
- servers/nextjs/tests/reference-fidelity-mode.test.mjs

The checkbox is designed to work with Presenton's existing Template V2 workflow. It does not create a reference template automatically and does not change the template certification/export engine.

## Recommended workflow

1. Open **Create Custom Template** (route /custom-template).
2. Upload the **reference PPTX** whose visual design must be reused.
3. Review the rendered slide previews and font warnings. Upload only font files you are permitted to use; select mappings for fonts that cannot be embedded or found.
4. Finish creating the reusable Template V2 template.
5. Upload the raw source material separately through the normal presentation workflow (PDF, DOCX, supported PPTX or other supported input).
6. Select the custom template generated from the reference PPTX.
7. Enable **Reference Fidelity Mode** and write the content/task-specific prompt.
8. Inspect the generated presentation slide by slide before exporting.

A PPTX reference is preferred to a PDF or screenshot because it can retain editable structure, positions, font information, image references and shapes. A screenshot-only reference can help visual analysis but cannot recover original editable slide structure.

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
