import { PageSkeleton } from "@components/Loader/Skeleton";

// Shown while a page's code loads: the outline of a page, not a spinner.
export default function Loading() {
  return <PageSkeleton />;
}
