import Link from "next/link";

import { StudioClient } from "@/components/studio-client";

export const metadata = {
  title: "Site Studio · bbellweb.info",
  description: "AI website builder for BBellWeb subscribers.",
};

export default function StudioPage() {
  return (
    <div className="min-h-screen bg-slate-100">
      <header className="border-b border-slate-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="font-semibold text-[#0c4a6e]">
            ← bbellweb.info
          </Link>
          <Link href="/dashboard" className="text-sm text-teal-800 hover:underline">
            Dashboard
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <StudioClient />
      </main>
    </div>
  );
}
