export function Divider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-slate-200/90" />
      {label && (
        <span className="text-[0.68rem] font-medium tracking-wide text-ink-400 uppercase">
          {label}
        </span>
      )}
      <span className="h-px flex-1 bg-slate-200/90" />
    </div>
  );
}
