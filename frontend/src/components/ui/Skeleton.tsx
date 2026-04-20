interface SkeletonProps {
  className?: string;
  height?: string;
  width?: string;
}

export function Skeleton({ className, height = "h-4", width = "w-full" }: SkeletonProps) {
  return <div className={`skeleton ${height} ${width} ${className ?? ""}`} />;
}

interface SkeletonListProps {
  count?: number;
  className?: string;
}

export function SkeletonList({ count = 3, className }: SkeletonListProps) {
  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="app-panel p-4 space-y-2">
          <Skeleton height="h-4" width="w-3/4" />
          <Skeleton height="h-3" width="w-1/2" />
          <Skeleton height="h-3" width="w-1/4" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={`app-panel p-4 space-y-3 ${className ?? ""}`}>
      <div className="flex items-center gap-3">
        <Skeleton height="h-10" width="w-10" className="rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton height="h-4" width="w-3/4" />
          <Skeleton height="h-3" width="w-1/2" />
        </div>
      </div>
      <Skeleton height="h-3" width="w-full" />
    </div>
  );
}
