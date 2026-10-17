import React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import UploadPage from "./components/UploadPage";
import GenerateHeader from "./components/GenerateHeader";
import { Metadata } from "next";
import { normalizePresentationGenerationMode } from "@/utils/presentationGenerationMode";
import { isCommunityEnabled } from "@/utils/community";

export const metadata: Metadata = {
  title: "Presenton | Open Source AI presentation generator",
  description:
    "Open-source AI presentation generator with custom layouts, multi-model support (OpenAI, Gemini, Ollama), and PDF/PPTX export. A free Gamma alternative.",
  alternates: {
    canonical: "https://presenton.ai/create",
  },
  keywords: [
    "presentation generator",
    "AI presentations",
    "data visualization",
    "automatic presentation maker",
    "professional slides",
    "data-driven presentations",
    "document to presentation",
    "presentation automation",
    "smart presentation tool",
    "business presentations",
  ],
  openGraph: {
    title: "Create Data Presentation | PresentOn",
    description:
      "Open-source AI presentation generator with custom layouts, multi-model support (OpenAI, Gemini, Ollama), and PDF/PPTX export. A free Gamma alternative.",
    type: "website",
    url: "https://presenton.ai/create",
    siteName: "PresentOn",
  },
  twitter: {
    card: "summary_large_image",
    title: "Create Data Presentation | PresentOn",
    description:
      "Open-source AI presentation generator with custom layouts, multi-model support (OpenAI, Gemini, Ollama), and PDF/PPTX export. A free Gamma alternative.",
    site: "@presenton_ai",
    creator: "@presenton_ai",
  },
};

const page = () => {
  const presentationGenerationMode = normalizePresentationGenerationMode(
    process.env.PRESENTATION_GENERATION_MODE,
  );

  return (
    <div className="relative flex min-h-dvh flex-col">
      <GenerateHeader />
      <main className="flex flex-1 flex-col pb-10 pt-[46px]">
        <div className="mb-7 flex flex-col items-center justify-center gap-1.5 px-4 text-center">
          <h1 className="font-syne text-[36px] font-medium leading-normal tracking-[-0.58px] text-[#101323] sm:text-[48px] lg:text-[58px] lg:leading-[70px]">
            Turn Ideas into Slides
          </h1>
          <p className="max-w-[609px] font-syne text-base leading-[1.4] tracking-[0.2px] text-[#101323CC] sm:text-xl">Turn prompts or documents into presentations with AI</p>
        </div>

        <div className="mb-8 flex justify-center px-4">
          <Link
            href="/reference-studio"
            className="inline-flex items-center gap-2 rounded-full border border-[#DED7FF] bg-[#F7F4FF] px-4 py-2.5 text-sm font-semibold text-[#6243C6] shadow-sm transition hover:border-[#B7A5FF] hover:bg-[#F0EAFF]"
          >
            <Sparkles className="h-4 w-4" />
            Buat PPT mengikuti file referensi
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <UploadPage
          communityEnabled={isCommunityEnabled(process.env.PRESENTON_COMMUNITY_ENABLED)}
          presentationGenerationMode={presentationGenerationMode}
        />
      </main>
    </div>
  );
};

export default page;
