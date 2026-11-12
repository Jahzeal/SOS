export default function Loading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" role="status" aria-live="polite">
      <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
        <span className="h-5 w-5 rounded-full border-2 border-slate-300 border-t-teal-600 animate-spin" aria-hidden="true" />
        Loading...
      </div>
    </div>
  );
}
