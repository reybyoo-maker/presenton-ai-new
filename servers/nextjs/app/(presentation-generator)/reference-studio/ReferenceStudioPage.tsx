"use client";

import React, { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FileCheck2,
  FileText,
  FileUp,
  Loader2,
  Presentation,
  ShieldCheck,
  Sparkles,
  UploadCloud,
  X,
} from "lucide-react";

import GenerateHeader from "../upload/components/GenerateHeader";
import { LanguageType, PresentationConfig, ToneType, VerbosityType } from "../upload/type";
import { useTemplateCreation } from "../custom-template/hooks/useTemplateCreation";
import { PresentationGenerationApi } from "../services/api/presentation-generation";
import TemplateService from "../services/api/template";
import { clearOutlines, setPresentationId } from "@/store/slices/presentationGeneration";
import { setPptGenUploadState } from "@/store/slices/presentationGenUpload";
import { setReferenceFidelityEnabled } from "../outline/utils/reference-fidelity";
import { parseLimitedSlideCount } from "@/utils/presentationLimits";

const MAX_FILE_BYTES = 100 * 1024 * 1024;
const DEFAULT_REFERENCE_PROMPT = "Buat presentasi baru berdasarkan seluruh materi mentah yang diunggah. Gunakan PPTX contoh sebagai acuan gaya visual, bukan sekadar template untuk ditempeli teks. Pertahankan identitas desainnya: palet warna, karakter font, hierarki judul, grid, spasi, bentuk, latar, dekorasi, perlakuan gambar, dan gaya komposisi. Susun isi dengan alur yang logis dan sesuai fakta sumber. Buat ilustrasi atau visual baru yang relevan untuk setiap bagian yang membutuhkan visual, dengan arah seni yang konsisten dengan referensi; jangan gunakan ulang gambar lama bila tidak relevan, jangan mengulang gambar yang sama di semua slide, dan jangan tinggalkan area visual sebagai placeholder kosong. Ubah data sumber menjadi grafik, diagram proses, timeline, perbandingan, atau infografik jika sesuai; angka hanya boleh berasal dari file sumber. Pilih layout referensi yang paling cocok untuk isi masing-masing slide dan buat variasi yang seimbang. Hasil harus terlihat seperti presentasi yang didesain dengan utuh, bukan hanya mengganti teks. Pastikan teks ringkas, terbaca, tidak terpotong, dan komposisi visual seimbang. Jangan mengarang fakta. Pertahankan logo dan elemen identitas merek. Animasi/transisi hanya dipertahankan jika jalur ekspor mendukungnya.";
const ACCEPTED_MATERIALS = ".pdf,.doc,.docx,.docm,.odt,.rtf,.ppt,.pptx,.pptm,.odp,.xls,.xlsx,.xlsm,.ods,.csv,.tsv,.txt,.md,.jpg,.jpeg,.png,.gif,.bmp,.tif,.tiff,.webp,.svg";

type StudioStage = "idle" | "font-check" | "render-reference" | "analyze-reference" | "upload-materials" | "prepare-presentation";

const STAGE_LABELS: Record<StudioStage, string> = {
  idle: "Siap dimulai",
  "font-check": "Memeriksa font referensi",
  "render-reference": "Menyiapkan preview setiap slide",
  "analyze-reference": "Menganalisis dan membangun template referensi",
  "upload-materials": "Membaca materi mentah",
  "prepare-presentation": "Menyiapkan presentasi dan outline",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return Math.max(1, Math.round(bytes / 1024)) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function getDocumentPaths(files: unknown): string[] {
  if (!Array.isArray(files)) return [];
  return files
    .flat()
    .map((file) => file && typeof file === "object" && "file_path" in file
      ? (file as { file_path?: unknown }).file_path
      : null)
    .filter((filePath): filePath is string => typeof filePath === "string");
}

function FileRow({ file, onRemove, kind }: { file: File; onRemove?: () => void; kind: "reference" | "material" }) {
  return (
    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#E8E8F0] bg-white px-3 py-3">
      <div className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-lg " + (kind === "reference" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-700")}>
        {kind === "reference" ? <Presentation className="h-5 w-5" /> : <FileText className="h-5 w-5" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-[#191927]" title={file.name}>{file.name}</p>
        <p className="mt-0.5 text-xs text-[#77788A]">{formatFileSize(file.size)}</p>
      </div>
      {onRemove && (
        <button type="button" onClick={onRemove} aria-label={"Hapus " + file.name} className="rounded-lg p-2 text-[#77788A] transition hover:bg-slate-100 hover:text-[#191927]">
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function UploadCard({
  title,
  subtitle,
  icon,
  accept,
  multiple,
  files,
  onFiles,
  reference = false,
  disabled = false,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  accept: string;
  multiple?: boolean;
  files: File[];
  onFiles: (files: File[]) => void;
  reference?: boolean;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const chooseFile = () => inputRef.current?.click();

  const acceptFiles = (incoming: File[]) => {
    if (!incoming.length) return;
    const selected = reference ? incoming.slice(0, 1) : incoming;
    const tooLarge = selected.find((file) => file.size > MAX_FILE_BYTES);
    if (tooLarge) {
      window.alert('File "' + tooLarge.name + '" melebihi batas 100 MB.');
      return;
    }
    if (reference) {
      const ref = selected[0];
      if (!ref.name.toLowerCase().endsWith(".pptx")) {
        window.alert("File referensi harus berupa PowerPoint .pptx agar struktur slide, font, dan elemen dapat dianalisis.");
        return;
      }
      onFiles([ref]);
      return;
    }
    const next = [...files];
    for (const file of selected) {
      if (!next.some((existing) => existing.name === file.name && existing.size === file.size)) next.push(file);
    }
    onFiles(next);
  };

  return (
    <section className="rounded-2xl border border-[#E7E7F0] bg-white p-5 shadow-[0_8px_30px_rgba(28,27,56,0.035)]">
      <div className="mb-4 flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EEFF] text-[#6941C6]">{icon}</div>
        <div className="min-w-0">
          <h2 className="text-base font-semibold tracking-[-0.2px] text-[#18182A]">{title}</h2>
          <p className="mt-1 text-sm leading-5 text-[#727386]">{subtitle}</p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="hidden"
        onChange={(event) => {
          acceptFiles(Array.from(event.target.files ?? []));
          event.target.value = "";
        }}
      />

      {files.length === 0 ? (
        <button
          type="button"
          disabled={disabled}
          onClick={chooseFile}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            acceptFiles(Array.from(event.dataTransfer.files));
          }}
          className={"flex min-h-[154px] w-full flex-col items-center justify-center rounded-xl border border-dashed px-4 py-6 text-center transition " + (dragging ? "border-[#7A5AF8] bg-[#F6F3FF]" : "border-[#D6D5E4] bg-[#FBFBFE] hover:border-[#9E8CFA] hover:bg-[#FAF8FF]") + " disabled:cursor-not-allowed disabled:opacity-60"}
        >
          <UploadCloud className="mb-3 h-7 w-7 text-[#7A5AF8]" />
          <span className="text-sm font-semibold text-[#25253B]">Klik untuk upload{multiple ? " atau pilih beberapa file" : ""}</span>
          <span className="mt-1 max-w-[320px] text-xs leading-5 text-[#85869A]">{reference ? "PPTX asli · maksimal 100 MB" : "PDF, Word, PPTX, Excel, teks, atau gambar · maks. 100 MB per file"}</span>
        </button>
      ) : (
        <div className="space-y-2">
          {files.map((file, index) => (
            <FileRow
              key={file.name + "-" + file.size + "-" + index}
              file={file}
              kind={reference ? "reference" : "material"}
              onRemove={disabled ? undefined : () => onFiles(files.filter((_, fileIndex) => fileIndex !== index))}
            />
          ))}
          {!reference && (
            <button type="button" disabled={disabled} onClick={chooseFile} className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#D6D5E4] px-3 py-3 text-sm font-medium text-[#55566D] transition hover:border-[#9E8CFA] hover:bg-[#FAF8FF] disabled:opacity-60">
              <FileUp className="h-4 w-4" /> Tambah materi
            </button>
          )}
          <p className="text-xs text-[#85869A]">{files.length} file · total {formatFileSize(totalBytes)}</p>
        </div>
      )}
    </section>
  );
}

export default function ReferenceStudioPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const templateFlow = useTemplateCreation();
  const createdTemplateIdRef = useRef<string | null>(null);

  const [referenceFiles, setReferenceFiles] = useState<File[]>([]);
  const [materialFiles, setMaterialFiles] = useState<File[]>([]);
  const [prompt, setPrompt] = useState(DEFAULT_REFERENCE_PROMPT);
  const [slideCount, setSlideCount] = useState("10");
  const [language, setLanguage] = useState<LanguageType>(LanguageType.Indonesian);
  const [stage, setStage] = useState<StudioStage>("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fontWarning, setFontWarning] = useState<string[]>([]);
  const [statusNote, setStatusNote] = useState("");
  const referenceFile = referenceFiles[0] ?? null;

  const generatedLayoutCount = useMemo(
    () => templateFlow.slides.filter((slide) => slide.processed && !slide.error).length,
    [templateFlow.slides],
  );
  const failedLayoutCount = useMemo(
    () => templateFlow.slides.filter((slide) => Boolean(slide.error)).length,
    [templateFlow.slides],
  );

  const handleCreate = async () => {
    if (busy) return;
    if (!referenceFile) {
      setError("Upload dulu file PPTX referensi yang ingin ditiru.");
      return;
    }
    if (materialFiles.length === 0) {
      setError("Upload minimal satu file materi mentah agar AI punya sumber konten.");
      return;
    }
if (materialFiles.reduce((sum, file) => sum + file.size, referenceFile.size) > 300 * 1024 * 1024) {
      setError("Total file melebihi batas kerja 300 MB. Kurangi jumlah atau ukuran file.");
      return;
    }

    const effectivePrompt = prompt.trim() || DEFAULT_REFERENCE_PROMPT;

    setBusy(true);
    setError(null);
    setStatusNote("");
    setFontWarning([]);

    try {
      let templateId = createdTemplateIdRef.current;
      if (!templateId) {
        setStage("font-check");
        setStatusNote("Menganalisis font referensi. Jika ada font yang tidak tersedia, hasil akan diberi peringatan.");
        const checkedFonts = await templateFlow.checkFonts(referenceFile);
        if (checkedFonts?.unavailable_fonts?.length) {
          setFontWarning(checkedFonts.unavailable_fonts.map((font) => font.name));
        } else if (!checkedFonts) {
          setStatusNote("Pemeriksaan font tidak berhasil. Sistem akan mencoba meneruskan, tetapi font mungkin menggunakan fallback.");
        }

        setStage("render-reference");
        setStatusNote("Merender setiap slide referensi dan menyiapkan aset untuk Template V2.");
        const preview = await templateFlow.fontUploadAndPreview(referenceFile);
        if (!preview || !preview.slide_image_urls?.length) {
          throw new Error("Tidak berhasil menyiapkan preview slide referensi. Periksa file PPTX dan konfigurasi backend, lalu coba lagi.");
        }

        setStage("analyze-reference");
        setStatusNote("AI sedang menganalisis " + preview.slide_image_urls.length + " slide agar layout, warna, font, dan elemen sumber dapat digunakan ulang.");
        templateId = await templateFlow.initTemplateCreation({
          name: referenceFile.name.replace(/\.pptx$/i, "") + " · Reference Template",
          description: "Template V2 generated from a user-provided reference deck for reference-fidelity generation.",
        }, preview);

        if (!templateId) {
          throw new Error(templateFlow.state.error || "Template referensi tidak berhasil dibuat.");
        }

        const details = await TemplateService.getTemplateDetails(templateId);
        const expectedLayoutCount = preview.slide_image_urls.length;
        if (typeof details.layout_count === "number" && details.layout_count < expectedLayoutCount) {
          throw new Error("Template belum lengkap: " + details.layout_count + " dari " + expectedLayoutCount + " layout tersedia. Untuk menjaga akurasi, presentasi belum dilanjutkan. Perbaiki slide yang gagal di Template Builder sebelum mencoba lagi.");
        }
        createdTemplateIdRef.current = templateId;
      }

      setStage("upload-materials");
      setStatusNote("Mengunggah materi mentah dan mengekstrak teks/data dari dokumen.");
      const uploadedFilePaths = await PresentationGenerationApi.uploadDoc(materialFiles);
      const decomposed = await PresentationGenerationApi.decomposeDocuments(uploadedFilePaths, language);
      const documentPaths = getDocumentPaths(decomposed);
      if (documentPaths.length === 0) {
        throw new Error("Materi terunggah, tetapi tidak ada konten dokumen yang berhasil diekstrak.");
      }

      setStage("prepare-presentation");
      setStatusNote("Membuat outline menggunakan materi sumber dan mengarahkan generator ke template referensi.");
      const instructions = setReferenceFidelityEnabled(
        "REFERENCE VISUAL MODE: treat the reference-derived template as the source of design language, not as a command to blindly replace existing text. Build a new story from the uploaded material. Match the reference palette, typography, hierarchy, spacing, composition, backgrounds, decorative motifs, and image treatment. Preserve logos and brand-specific assets, but do not reuse an old illustration or photo when it does not fit the new subject. Create relevant new illustrations, diagrams, charts, icons, and infographics for the new content using the configured visual/image provider where available. Choose the best matching reference layout for each slide and vary layouts appropriately. Never make up facts or data. Keep slides visually complete, balanced, readable, and free of overflow; shorten copy where needed. Do not claim unsupported PowerPoint animations or transitions are preserved.",
        true,
      );

      const config: PresentationConfig = {
        slides: slideCount,
        language,
        prompt: effectivePrompt,
        tone: ToneType.Professional,
        verbosity: VerbosityType.Standard,
        instructions,
        includeTableOfContents: false,
        includeTitleSlide: true,
        webSearch: false,
      };

      const created = await PresentationGenerationApi.createPresentation({
        content: effectivePrompt,
        version: "v2-standard",
        n_slides: parseLimitedSlideCount(slideCount),
        file_paths: documentPaths,
        language,
        tone: ToneType.Professional,
        verbosity: VerbosityType.Standard,
        instructions,
        include_table_of_contents: false,
        include_title_slide: true,
        web_search: false,
        generation_mode: "standard",
      });

      dispatch(setPptGenUploadState({ config, files: decomposed }));
      dispatch(clearOutlines());
      dispatch(setPresentationId(created.id));

      setStatusNote("Template siap dan materi sudah dikirim ke generator. Membuka halaman outline untuk pemeriksaan akhir.");
      router.push("/outline?id=" + encodeURIComponent(created.id) + "&template=" + encodeURIComponent(templateId) + "&autoGenerate=1");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Terjadi kesalahan saat membuat presentasi.";
      setError(message);
      setStatusNote("");
    } finally {
      setBusy(false);
      setStage("idle");
    }
  };

  const stepItems: { stage: StudioStage; title: string; detail: string }[] = [
    { stage: "font-check", title: "Font & referensi", detail: "Memeriksa file sumber" },
    { stage: "render-reference", title: "Preview slide", detail: "Merender semua slide" },
    { stage: "analyze-reference", title: "Analisis template", detail: "Membaca layout dan elemen" },
    { stage: "upload-materials", title: "Materi mentah", detail: "Upload dan ekstraksi dokumen" },
    { stage: "prepare-presentation", title: "Generate outline", detail: "Menghubungkan template ke generator" },
  ];
  const currentStepIndex = stepItems.findIndex((item) => item.stage === stage);

  return (
    <div className="min-h-dvh bg-[#F7F7FC] text-[#18182A]">
      <GenerateHeader />
      <main className="mx-auto w-full max-w-[1180px] px-4 pb-20 pt-10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-[800px] text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#E5DFFF] bg-white px-3.5 py-1.5 text-xs font-semibold tracking-[0.08em] text-[#6941C6] shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> PRESENTON · REFERENCE STUDIO
          </div>
          <h1 className="text-balance font-syne text-3xl font-semibold tracking-[-1.1px] text-[#17172B] sm:text-5xl">
            PPT baru, dengan gaya visual referensimu.
          </h1>
          <p className="mx-auto mt-4 max-w-[650px] text-base leading-7 text-[#707186] sm:text-lg">
            Upload PPTX contoh dan materi mentah. Studio akan membaca desain referensi, menyusun cerita baru dari materi, membuat visual yang relevan, lalu mengirim hasil ke editor untuk diperiksa. Prompt bawaan sudah disiapkan dan bisa kamu ubah.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-[1080px] gap-5 lg:grid-cols-2">
          <UploadCard
            title="1. PPTX referensi"
            subtitle="Pilih deck yang desainnya harus ditiru. File PPTX asli memberikan informasi layout dan elemen yang lebih baik daripada screenshot."
            icon={<Presentation className="h-5 w-5" />}
            accept=".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation"
            files={referenceFiles}
            onFiles={setReferenceFiles}
            reference
            disabled={busy}
          />
          <UploadCard
            title="2. Materi mentah"
            subtitle="Pilih dokumen yang berisi fakta dan isi yang harus dibuat menjadi presentasi. Kamu bisa mengunggah beberapa file."
            icon={<FileText className="h-5 w-5" />}
            accept={ACCEPTED_MATERIALS}
            multiple
            files={materialFiles}
            onFiles={setMaterialFiles}
            disabled={busy}
          />
        </div>

        <section className="mx-auto mt-5 max-w-[1080px] rounded-2xl border border-[#E7E7F0] bg-white p-5 shadow-[0_8px_30px_rgba(28,27,56,0.035)] sm:p-7">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F1EEFF] text-[#6941C6]"><Sparkles className="h-5 w-5" /></div>
            <div>
              <h2 className="text-base font-semibold text-[#18182A]">3. Prompt pekerjaan</h2>
              <p className="mt-1 text-sm leading-5 text-[#727386]">Instruksi bawaan sudah aktif: menyesuaikan desain referensi, membuat ilustrasi yang relevan, dan memakai data hanya dari materi. Kamu boleh menambahkan arahan khusus.</p>
            </div>
          </div>

          <textarea
            value={prompt}
            disabled={busy}
            onChange={(event) => setPrompt(event.target.value)}
            placeholder="Tambahkan target audiens, tujuan presentasi, atau catatan khusus. Instruksi visual dan ilustrasi bawaan sudah aktif."
            rows={5}
            className="mt-4 w-full resize-y rounded-xl border border-[#DCDCE8] bg-[#FCFCFF] px-4 py-3.5 text-sm leading-6 text-[#25253A] outline-none transition placeholder:text-[#9A9BAD] focus:border-[#9784F7] focus:ring-4 focus:ring-[#7A5AF8]/10 disabled:opacity-60"
          />

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#36364B]">Bahasa presentasi</span>
              <select value={language} disabled={busy} onChange={(event) => setLanguage(event.target.value as LanguageType)} className="h-11 w-full rounded-xl border border-[#DCDCE8] bg-white px-3 text-sm outline-none focus:border-[#9784F7]">
                <option value={LanguageType.Indonesian}>Bahasa Indonesia</option>
                <option value={LanguageType.English}>English</option>
                <option value={LanguageType.German}>Deutsch</option>
                <option value={LanguageType.Malay}>Bahasa Melayu</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#36364B]">Jumlah slide target</span>
              <select value={slideCount} disabled={busy} onChange={(event) => setSlideCount(event.target.value)} className="h-11 w-full rounded-xl border border-[#DCDCE8] bg-white px-3 text-sm outline-none focus:border-[#9784F7]">
                {[5, 8, 10, 12, 15, 18, 20].map((count) => <option key={count} value={String(count)}>{count} slide</option>)}
              </select>
            </label>
          </div>

          <div className="mt-5 flex flex-col gap-3 rounded-xl border border-[#E8E3FF] bg-[#FAF9FF] p-4 sm:flex-row sm:items-start">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-[#6941C6]" />
            <div>
              <p className="text-sm font-semibold text-[#383052]">Reference Fidelity Mode aktif otomatis</p>
              <p className="mt-1 text-sm leading-5 text-[#706A83]">Instruksi tambahan akan memprioritaskan layout template, posisi elemen, warna, font, ruang kosong, dan aset referensi. Hasil tetap perlu ditinjau; animasi PowerPoint kompleks belum dijamin bisa disalin sempurna.</p>
            </div>
          </div>

          {fontWarning.length > 0 && (
            <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Font referensi tidak tersedia di server</p>
                <p className="mt-1 text-sm leading-5">Font berikut perlu dipetakan atau diunggah untuk kemiripan terbaik: {fontWarning.join(", ")}. Proses otomatis tetap berjalan dengan kemungkinan fallback font.</p>
              </div>
            </div>
          )}

          {error && (
            <div role="alert" className="mt-4 flex gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">Pembuatan belum selesai</p>
                <p className="mt-1 break-words text-sm leading-5">{error}</p>
              </div>
            </div>
          )}

          {busy && (
            <div aria-live="polite" className="mt-5 rounded-xl border border-[#E4E2F2] bg-[#FCFBFF] p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <Loader2 className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-[#7A5AF8]" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#25253B]">{STAGE_LABELS[stage]}</p>
                  <p className="mt-1 text-sm leading-5 text-[#727386]">{statusNote}</p>
                  {stage === "analyze-reference" && templateFlow.state.totalSlides > 0 && (
                    <p className="mt-2 text-xs font-medium text-[#6941C6]">
                      Layout selesai: {generatedLayoutCount}/{templateFlow.state.totalSlides}
                      {failedLayoutCount > 0 ? " · gagal: " + failedLayoutCount : ""}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-4 grid gap-2 sm:grid-cols-5">
                {stepItems.map((item, index) => {
                  const isActive = item.stage === stage;
                  const isComplete = currentStepIndex >= 0 && index < currentStepIndex;
                  return (
                    <div key={item.stage} className={"rounded-lg border px-3 py-2 " + (isActive ? "border-[#B9AAFF] bg-[#F1EDFF]" : isComplete ? "border-emerald-200 bg-emerald-50" : "border-[#E9E8F1] bg-white")}>
                      <div className="flex items-center gap-1.5">
                        {isComplete ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : isActive ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#7A5AF8]" /> : <span className="h-3.5 w-3.5 rounded-full border border-[#C9C8D7]" />}
                        <span className="text-[11px] font-semibold text-[#47475D]">{item.title}</span>
                      </div>
                      <p className="mt-1 pl-5 text-[10px] leading-4 text-[#89899A]">{item.detail}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-[590px] text-xs leading-5 text-[#85869A]">File referensi dan materi diproses oleh backend Presenton yang sudah dikonfigurasi untuk aplikasi ini. Jangan unggah dokumen rahasia ke instance yang tidak kamu kendalikan.</p>
            <button
              type="button"
              onClick={handleCreate}
              disabled={busy}
              className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-[#6E52E5] px-6 py-3 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(110,82,229,0.22)] transition hover:bg-[#5E43D1] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {busy ? "Sedang memproses..." : "Buat PPT dari referensi"}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </button>
          </div>
        </section>

        <div className="mx-auto mt-6 flex max-w-[1080px] flex-col gap-2 text-center text-sm text-[#797A8D] sm:flex-row sm:items-center sm:justify-between sm:text-left">
          <p><FileCheck2 className="mr-1.5 inline h-4 w-4 align-[-3px]" /> Output akan dilanjutkan ke editor outline Presenton sebelum ekspor akhir.</p>
          <Link href="/upload" className="inline-flex items-center justify-center gap-1 font-medium text-[#6941C6] hover:underline">Kembali ke generator biasa <ArrowRight className="h-3.5 w-3.5" /></Link>
        </div>
      </main>
    </div>
  );
}
