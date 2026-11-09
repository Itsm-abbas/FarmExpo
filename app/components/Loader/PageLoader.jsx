import { PageSkeleton } from "./Skeleton";

// Full-page placeholder shown until a page's saved data is in, so a form is
// never shown empty and then filled in while someone is typing. Shows the
// page's outline (see Skeleton.jsx); `variant` picks which.
export default function PageLoader({ label = "Loading…", variant = "list" }) {
  return <PageSkeleton label={label} variant={variant} />;
}
