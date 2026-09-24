"use client";

import dynamic from "next/dynamic";

const ScannerComponent = dynamic(() => import("@/components/ScannerComponent"), {
  ssr: false,
});

export default function EntryScannerPage() {
  return (
    <ScannerComponent
      type="entry"
      title="Main Entry Scanner"
      badgeLabel="Entry Gate • Station 1"
      badgeColor="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
      apiEndpoint="/api/scan/entry"
    />
  );
}
