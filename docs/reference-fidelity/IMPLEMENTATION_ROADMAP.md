# Reference Fidelity Implementation Roadmap

## Current implemented slice

- A UI toggle on the outline page enables a strict template-preservation instruction block.
- The block is stored in the existing presentation instruction field, so it travels through the existing create-presentation request instead of introducing an unsupported backend field.
- A pure helper adds/removes the block without erasing the user's own instructions.
- Node tests cover enabling, disabling, empty input and duplicate prevention.

## Next implementation phase: real visual QA

Do not mark the app as fully reference-accurate until this phase is implemented and verified.

### Backend plan

1. Trace the existing PPTX export and slide-preview/rendering code before adding dependencies.
2. Add a QA result schema with per-slide checks for slide count, missing assets, text overflow/clipping, known font substitutions and structural bounds.
3. Render the output deck using the renderer already supported by this project. Do not introduce a second incompatible renderer without reason.
4. If reference slide previews exist, align reference and output by slide index/layout family and compute a documented visual-difference metric.
5. Surface a QA report to the user with slide numbers and actionable warnings; make pass/fail rules deterministic.
6. Add regression fixtures and tests, including a reference deck with font substitutions, dense text and unsupported animations.
7. Add a per-slide retry only after the existing editing/generation flow can reliably replace one slide without damaging other slide data.

### Animation and transitions

Inspect the PPTX OOXML and the project's actual export behavior. Do not copy animation XML blindly: relationships and animation targets can change when elements are recreated. Support only mappings that have been tested. Report unsupported animation types clearly and preserve manual restoration as an option.

### Validation

- Run the existing Next.js tests (npm test in servers/nextjs) and lint/build checks.
- Run relevant FastAPI unit/integration tests for Template V2 and presentation generation.
- Open generated PPTX in PowerPoint or a compatible renderer.
- Capture actual command output in the pull request; do not claim tests passed if they were not run.
