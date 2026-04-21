import { Suspense } from "react";

import Planner from "@/modules/Planner";

export default function PlannerPage() {
  return (
    <Suspense fallback={<div className="px-6 py-12 text-slate-500">Loading planner...</div>}>
      <Planner />
    </Suspense>
  );
}
