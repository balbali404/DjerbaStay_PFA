import type { HotelStatus } from "@/lib/backendApi";

type Props = {
  status: HotelStatus;
  className?: string;
};

export default function StatusBadge({ status, className = "" }: Props) {
  const isActive = status === "ACTIVE";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        isActive
          ? "bg-emerald-100 text-emerald-700"
          : "bg-red-100 text-red-700"
      } ${className}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`}
      />
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}
