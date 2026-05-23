import clsx from 'clsx'

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={clsx('skeleton animate-shimmer', className)}
      {...props}
    />
  )
}

export function DetectionSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <Skeleton className="h-48 w-full rounded-2xl" />
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>
      <Skeleton className="h-32 rounded-xl" />
    </div>
  )
}

export function CardSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass rounded-2xl p-6 space-y-3">
          <Skeleton className="h-5 w-1/2 rounded-lg" />
          <Skeleton className="h-8 w-3/4 rounded-lg" />
          <Skeleton className="h-4 w-full rounded-lg" />
          <Skeleton className="h-4 w-2/3 rounded-lg" />
        </div>
      ))}
    </div>
  )
}
