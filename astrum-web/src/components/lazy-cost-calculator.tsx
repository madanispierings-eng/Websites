"use client";

import dynamic from "next/dynamic";

// The calculator sits below the fold on the home page; its controls load in a separate chunk.
export const LazyCostCalculator = dynamic(() => import("@/components/cost-calculator").then((m) => m.CostCalculator), {
  loading: () => <div className="min-h-[640px]" aria-hidden="true" />,
});
