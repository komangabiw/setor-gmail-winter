export function Divider({ label = "atau" }: { label?: string }) {
  return (
    <div className="relative my-4 flex items-center justify-center">
      <div className="absolute inset-0 flex items-center" aria-hidden="true">
        <span className="w-full border-t border-slate-200/80" />
      </div>
      <span className="relative bg-white px-3 text-[0.75rem] font-medium text-slate-400 lowercase">
        {label}
      </span>
    </div>
  );
}

