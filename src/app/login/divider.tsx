import { cn } from "@/lib/utils";

export function Divider({
  label = "atau",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative my-4 flex items-center justify-center", className)}>
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <span className="w-full border-t border-zinc-800" />
      </div>
      <span className="relative bg-[#111116] px-3 text-[0.72rem] font-medium text-zinc-400 lowercase">
        {label}
      </span>
    </div>
  );
}
