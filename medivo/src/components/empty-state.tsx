import { cn } from "@/lib/utils";

export function EmptyState({ title, children, className, icon: Icon }: {
  title: string;
  children?: React.ReactNode;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className={cn("rounded-xl border border-dashed border-[#cdd8e6] bg-white px-6 py-12 text-center", className)}>
      {Icon ? <Icon className="mx-auto mb-3 size-8 text-blue/70" /> : null}
      <p className="font-semibold text-navy">{title}</p>
      {children ? <div className="mx-auto mt-1.5 max-w-md text-sm leading-relaxed text-muted-ink">{children}</div> : null}
    </div>
  );
}
