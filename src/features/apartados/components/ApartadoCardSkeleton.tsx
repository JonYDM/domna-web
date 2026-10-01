import { Skeleton } from "@/components/ui";

/** Misma forma que ApartadoCard. */
export function ApartadoCardSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-surface-container-lowest p-3.5 shadow-soft">
      <div className="flex gap-3">
        <Skeleton className="aspect-[3/4] w-16 rounded-xl" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-2 w-full" />
    </div>
  );
}
