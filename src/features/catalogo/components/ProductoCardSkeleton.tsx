import { Skeleton } from "@/components/ui";

/** Skeleton con la misma forma que ProductoCard. */
export function ProductoCardSkeleton() {
  return (
    <div className="flex flex-col gap-2.5">
      <Skeleton className="aspect-[3/4] rounded-2xl" />
      <Skeleton className="h-4 w-4/5" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  );
}
