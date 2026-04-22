import dynamic from "next/dynamic";

const Planner = dynamic(() => import("@/modules/Planner"), {
  loading: () => (
    <div className="px-6 py-14 text-slate-500">
      <div className="mx-auto h-56 w-full max-w-6xl animate-pulse rounded-3xl bg-slate-200/80" />
    </div>
  ),
});

export default function PlannerPage() {
  return <Planner />;
}
