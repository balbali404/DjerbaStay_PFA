type Props = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  accent?: "blue" | "emerald" | "amber" | "violet";
  description?: string;
};

const accentMap = {
  blue: {
    bg: "bg-blue-50",
    icon: "bg-blue-100 text-blue-600",
    value: "text-blue-700",
  },
  emerald: {
    bg: "bg-emerald-50",
    icon: "bg-emerald-100 text-emerald-600",
    value: "text-emerald-700",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "bg-amber-100 text-amber-600",
    value: "text-amber-700",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "bg-violet-100 text-violet-600",
    value: "text-violet-700",
  },
};

export default function StatCard({
  label,
  value,
  icon,
  accent = "blue",
  description,
}: Props) {
  const colors = accentMap[accent];

  return (
    <div className={`rounded-2xl border border-slate-200 bg-white p-5 shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className={`mt-1 text-3xl font-extrabold ${colors.value}`}>{value}</p>
          {description ? (
            <p className="mt-1 text-xs text-slate-400">{description}</p>
          ) : null}
        </div>
        <div className={`rounded-xl p-2.5 ${colors.icon}`}>{icon}</div>
      </div>
    </div>
  );
}
