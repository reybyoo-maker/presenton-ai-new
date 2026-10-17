"use client";

import React from "react";
import { Loader2, RotateCcw, ShieldCheck } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

import { ConfigurationSelects } from "../../upload/components/ConfigurationSelects";
import { PresentationConfig } from "../../upload/type";

interface OutlinePromptBarProps {
  config: PresentationConfig;
  disabled?: boolean;
  isBusy: boolean;
  regenerateDisabled?: boolean;
  onConfigChange: (key: keyof PresentationConfig, value: unknown) => void;
  onRegenerate: () => void;
}

const OutlinePromptBar: React.FC<OutlinePromptBarProps> = ({
  config,
  disabled = false,
  isBusy,
  regenerateDisabled = false,
  onConfigChange,
  onRegenerate,
}) => {
  const isRegenerateDisabled = disabled || isBusy || regenerateDisabled;

  return (
    <section className="w-full font-syne">
      <div className="mb-[10px] flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold tracking-[-0.12px] text-[#191919]">
            Prompt
          </span>
          <ConfigurationSelects
            config={config}
            onConfigChange={onConfigChange}
            compact
          />
        </div>
      </div>

      <div className="relative h-[69px] overflow-hidden rounded-[12px] border border-[#DBDBDB]/60 bg-white shadow-[0_4px_7px_rgba(0,0,0,0.05)]">
        <Textarea
          value={config.prompt}
          disabled={disabled}
          rows={1}
          onChange={(event) => onConfigChange("prompt", event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.preventDefault();
              if (isRegenerateDisabled) {
                return;
              }
              onRegenerate();
            }
          }}
          placeholder="Describe the presentation you want to generate"
          className="h-[69px] min-h-[69px] resize-none border-0 bg-transparent px-6 py-[23px] pr-16 text-base font-normal leading-[22px] text-[#191919] shadow-none outline-none placeholder:text-[#8C8C8C] focus-visible:ring-0 focus-visible:ring-offset-0 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={onRegenerate}
          disabled={isRegenerateDisabled}
          aria-label="Regenerate outline"
          title="Regenerate outline"
          className={cn(
            "absolute right-6 top-1/2 flex h-[21px] w-[26px] -translate-y-1/2 items-center justify-center rounded-full bg-white text-[#191919] transition hover:bg-[#F7F7FA] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7A00FF]/25",
            isRegenerateDisabled && "cursor-not-allowed opacity-70"
          )}
        >
          {isBusy ? (
            <Loader2 className="h-[18px] w-[18px] animate-spin text-[#7A5AF8]" />
          ) : (
            <RotateCcw
              aria-hidden="true"
              className="h-[18px] w-[18px]"
            />
          )}
        </button>
      </div>

      <ReferenceFidelityControl
        config={config}
        disabled={disabled}
        onConfigChange={onConfigChange}
      />
    </section>
  );
};

const REFERENCE_FIDELITY_START = "[PRESENTON_REFERENCE_FIDELITY_BEGIN]";
const REFERENCE_FIDELITY_END = "[PRESENTON_REFERENCE_FIDELITY_END]";
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

function ReferenceFidelityControl({
  config,
  disabled,
  onConfigChange,
}: {
  config: PresentationConfig;
  disabled: boolean;
  onConfigChange: (key: keyof PresentationConfig, value: unknown) => void;
}) {
  const instructions = config.instructions || "";
  const enabled = instructions.includes(REFERENCE_FIDELITY_START);

  const setEnabled = (nextEnabled: boolean) => {
    let nextInstructions = instructions;
    const startIndex = nextInstructions.indexOf(REFERENCE_FIDELITY_START);
    if (startIndex >= 0) {
      const endIndex = nextInstructions.indexOf(REFERENCE_FIDELITY_END, startIndex);
      if (endIndex >= 0) {
        nextInstructions = (
          nextInstructions.slice(0, startIndex) +
          nextInstructions.slice(endIndex + REFERENCE_FIDELITY_END.length)
        ).trim();
      }
    }

    if (nextEnabled) {
      nextInstructions = [nextInstructions, REFERENCE_FIDELITY_INSTRUCTIONS]
        .filter(Boolean)
        .join("\n\n");
    }
    onConfigChange("instructions", nextInstructions);
  };

  return (
    <div className="mt-3 rounded-[12px] border border-[#E4DFFC] bg-[#FAF9FF] px-4 py-3">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          disabled={disabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[#7A5AF8]"
          aria-label="Enable reference fidelity mode"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-semibold text-[#27233A]">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-[#7A5AF8]" />
            Reference Fidelity Mode
          </span>
          <span className="mt-1 block text-xs leading-5 text-[#67627A]">
            Prioritizes the selected template&apos;s layout, typography, colors, and original assets. For best results, create a custom template from your reference PPTX first, then select it here.
          </span>
        </span>
      </label>
    </div>
  );
}

export default OutlinePromptBar;");
    const escapedEnd = REFERENCE_FIDELITY_END.replace(/[.*+?^${}()|[\]\\]/g, "\\export default OutlinePromptBar;");
    const blockPattern = new RegExp(`${escapedStart}[\\s\\S]*?${escapedEnd}`, "g");
    nextInstructions = nextInstructions.replace(blockPattern, "").trim();

    if (nextEnabled) {
      nextInstructions = [nextInstructions, REFERENCE_FIDELITY_INSTRUCTIONS]
        .filter(Boolean)
        .join("\\n\\n");
    }
    onConfigChange("instructions", nextInstructions);
  };

  return (
    <div className="mt-3 rounded-[12px] border border-[#E4DFFC] bg-[#FAF9FF] px-4 py-3">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={enabled}
          disabled={disabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="mt-1 h-4 w-4 shrink-0 accent-[#7A5AF8]"
          aria-label="Enable reference fidelity mode"
        />
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2 text-sm font-semibold text-[#27233A]">
            <ShieldCheck aria-hidden="true" className="h-4 w-4 text-[#7A5AF8]" />
            Reference Fidelity Mode
          </span>
          <span className="mt-1 block text-xs leading-5 text-[#67627A]">
            Prioritizes the selected template's layout, typography, colors, and original assets. For best results, create a custom template from your reference PPTX first, then select it here.
          </span>
        </span>
      </label>
    </div>
  );
}

export default OutlinePromptBar;
