export function SkeletonBox({ className = "" }) {
  return <div className={`bg-slate-200 rounded animate-pulse ${className}`} />;
}

export function SkeletonLine({ width = "full", className = "" }) {
  const widths = { full: "w-full", "3/4": "w-3/4", "1/2": "w-1/2", "1/4": "w-1/4" };
  return (
    <div className={`h-4 bg-slate-200 rounded animate-pulse ${widths[width]} ${className}`} />
  );
}

export function SkeletonCard() {
  return (
    <div className="border border-slate-200 rounded-xl p-4 space-y-3">
      <SkeletonLine width="3/4" />
      <SkeletonLine width="1/2" />
      <div className="flex gap-2 pt-2">
        <SkeletonBox className="h-6 w-16 rounded-full" />
        <SkeletonBox className="h-6 w-20 rounded-full" />
        <SkeletonBox className="h-6 w-14 rounded-full" />
      </div>
    </div>
  );
}
