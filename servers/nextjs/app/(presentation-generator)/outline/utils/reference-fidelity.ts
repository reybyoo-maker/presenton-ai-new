export const REFERENCE_FIDELITY_START = "[PRESENTON_REFERENCE_FIDELITY_BEGIN]";
export const REFERENCE_FIDELITY_END = "[PRESENTON_REFERENCE_FIDELITY_END]";

const REFERENCE_FIDELITY_INSTRUCTIONS = [
  REFERENCE_FIDELITY_START,
  "REFERENCE FIDELITY MODE — STRICT DESIGN PRESERVATION",
  "- The selected template is the source of truth for visual design. Keep its layout, element positions, dimensions, alignment, spacing, colors, typography, image treatment, backgrounds, logos, decorative elements, and whitespace.",
  "- Prefer the closest existing reference layout for each slide. Do not invent a new layout or redesign the slide when an existing reference layout can be reused.",
  "- Replace only editable content fields. Preserve fixed/decorative source elements and reuse existing source assets whenever appropriate.",
  "- Fit content to the available space: shorten copy or simplify wording before changing font size, position, geometry, or layout.",
  "- Use only facts supported by the uploaded material. Mark gaps as unknown instead of inventing data.",
  "- Do not claim that native PowerPoint animations or transitions are preserved unless the export path actually retains them.",
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
