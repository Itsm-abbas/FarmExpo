import { SkeletonTable } from "./Skeleton";

// Placeholder rows while a table's data loads.
const DataLoader = ({ rows = 6, cols = 5 }) => (
  <div role="status" aria-live="polite" className="w-full">
    <span className="sr-only">Loading…</span>
    <SkeletonTable rows={rows} cols={cols} />
  </div>
);

export default DataLoader;
