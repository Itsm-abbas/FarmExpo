// Full-page placeholder shown until a page's saved data is in, so a form is
// never shown empty and then filled in while someone is typing.
export default function PageLoader({ label = "Loading…" }) {
  return (
    <div role="status" className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4">
      <span className="relative h-10 w-10">
        <span className="absolute inset-0 rounded-full border-4 border-primary/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary" />
      </span>
      <p className="text-sm text-text/65">{label}</p>
    </div>
  );
}
