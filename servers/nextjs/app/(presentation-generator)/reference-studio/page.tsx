import type { Metadata } from "next";
import ReferenceStudioPage from "./ReferenceStudioPage";

export const metadata: Metadata = {
  title: "Reference Studio | Presenton",
  description: "Buat presentasi dari materi mentah dengan mengikuti desain PPTX referensi.",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ReferenceStudioPage />;
}
