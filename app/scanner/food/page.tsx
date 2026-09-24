"use client";

import dynamic from "next/dynamic";

const ScannerComponent = dynamic(() => import("@/components/ScannerComponent"), {
  ssr: false,
});

export default function FoodScannerPage() {
  return (
    <ScannerComponent
      type="food"
      title="Food & Meal Counter"
      badgeLabel="Food Desk • Station 2"
      badgeColor="bg-amber-500/20 text-amber-300 border border-amber-500/30"
      apiEndpoint="/api/scan/food"
    />
  );
}
