export const REFERENCE_FIDELITY_START = "[PRESENTON_REFERENCE_FIDELITY_BEGIN]";
export const REFERENCE_FIDELITY_END = "[PRESENTON_REFERENCE_FIDELITY_END]";

const REFERENCE_FIDELITY_INSTRUCTIONS = [
  REFERENCE_FIDELITY_START,
  "REFERENCE FIDELITY MODE — VISUAL STYLE MATCHING, NOT BLIND TEXT REPLACEMENT",
  "- Treat the uploaded PPTX as the visual design reference, not as a request to keep unrelated old slide content. Analyze its overall visual DNA: palette, typography, hierarchy, grid, spacing, alignment, composition, backgrounds, shapes, decorative motifs, image treatment, and use of whitespace.",
  "- Build a new presentation whose content and story come from the uploaded source materials. Select the closest matching reference layout for each content purpose. Use a new layout only when none of the available reference layouts fits, and keep it consistent with the reference design system.",
  "- Preserve logos, brand marks, recurring backgrounds, and decorative elements that define the reference identity. Reuse an original photo/illustration only if it is still semantically relevant to the new slide; never paste an unrelated reference image just to fill space.",
  "- Create or source a distinct, subject-specific illustration, image, icon composition, diagram, or infographic when the slide benefits from it. Use the configured image-generation provider when available and keep a coherent art direction matching the reference palette and image style. Do not leave intended visual areas blank, repeat the same visual across slides, or rely on generic decorative placeholders.",
  "- Turn source facts into editable charts, tables, process diagrams, timelines, comparisons, and callouts when they communicate the material more clearly. Use only supplied numbers and facts; never fabricate statistics, labels, citations, or results.",
  "- Make a complete designed slide, not merely a text swap. Preserve the reference's visual hierarchy and approximate density while adapting the composition to the meaning of the new content.",
  "- Fit copy deliberately: use concise wording, meaningful headings, and balanced text-to-visual proportions. Prevent text overflow and clipping; do not shrink all text indiscriminately.",
  "- Keep content factual and traceable to the uploaded material. If information is missing, omit it or label it clearly as unavailable rather than guessing.",
  "- Retain native animations/transitions only when the actual export pipeline supports them. Do not imply an animation or transition was copied when it was not.";
  REFERENCE_FIDELITY_END,
].join("\n");

function removeReferenceFidelityInstructions(value: string): string {
  let result = value;
  while (true) {
    const startIndex = result.indexOf(REFERENCE_FIDELITY_START);
    if (startIndex < 0) break;
    const endIndex = result.indexOf(
      REFERENCE_FIDELITY_END,
      startIndex + REFERENCE_FIDELITY_START.length,
    );
    if (endIndex < 0) {
      result = result.slice(0, startIndex).trim();
      break;
    }
    result = (
      result.slice(0, startIndex) +
      result.slice(endIndex + REFERENCE_FIDELITY_END.length)
    ).trim();
  }
  return result.replace(/\n{3,}/g, "\n\n").trim();
}

export function isReferenceFidelityEnabled(
  instructions: string | null | undefined,
): boolean {
  if (!instructions) return false;
  const start = instructions.indexOf(REFERENCE_FIDELITY_START);
  return (
    start >= 0 &&
    instructions.indexOf(REFERENCE_FIDELITY_END, start) >= 0
  );
}

/**
 * Adds/removes the strict reference-layout instructions without overwriting
 * any custom instructions the user has already entered.
 */
export function setReferenceFidelityEnabled(
  instructions: string | null | undefined,
  enabled: boolean,
): string {
  const existing = removeReferenceFidelityInstructions(instructions || "");
  if (!enabled) return existing;
  return [existing, REFERENCE_FIDELITY_INSTRUCTIONS]
    .filter(Boolean)
    .join("\n\n");
}
