# Reference Fidelity QA Checklist

Use a small reference deck (3–5 slides) first, then test a longer deck.

## Before generation

- [ ] The uploaded reference is the intended PPTX, not the raw content deck.
- [ ] Every reference slide has a rendered preview.
- [ ] The Template V2 template creation completes without missing slide layouts.
- [ ] The font report has been reviewed; unavailable fonts have an explicit mapping or warning.
- [ ] Original logos, images and brand assets are usable and appropriately licensed.
- [ ] The raw-content files are separate from the reference deck.
- [ ] The intended template generated from the reference is selected for generation.
- [ ] Reference Fidelity Mode is enabled.

## After generation

- [ ] The output slide count and ordering are correct.
- [ ] The selected layouts resemble the corresponding reference slides.
- [ ] Colors, text hierarchy, typography, spacing and alignment remain consistent.
- [ ] Original logos and reusable assets have not been unintentionally replaced.
- [ ] Text has not overflowed, clipped, or been shrunk unreasonably.
- [ ] No image is missing, broken, or placed in an obviously incorrect region.
- [ ] Facts and numbers can be traced to the source material or are explicitly marked unknown.
- [ ] Exported PPTX opens and its elements remain editable.
- [ ] Animations and transitions are checked independently and are not assumed to be preserved.

## Edge-case deck set

1. Title slide, body text, photos and simple shapes.
2. Non-standard font and explicit font mapping.
3. Tables, charts, multi-column blocks and small text.
4. Source image that must be reused, plus a decorative logo/background.
5. Dense content that exceeds the reference text capacity.
6. Common entrance animations and slide transitions.
7. Corrupted or oversized PPTX and an interrupted generation.

## Reporting

Record actual outcomes per slide. Do not invent a similarity percentage. If image-based difference metrics are added later, label them as visual diagnostics and pair them with manual review.
