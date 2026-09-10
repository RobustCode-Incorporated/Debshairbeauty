import type { Metadata } from "next";
import DebsAdminPageClient from "./DebsAdminPageClient";

// Déborah's own cancel-appointment tool — single named user, gated by
// DEBS_ADMIN_TOKEN, never meant to be found or indexed.
export function generateMetadata(): Metadata {
  return { robots: { index: false, follow: false } };
}

export default function DebsAdminPage() {
  return <DebsAdminPageClient />;
}
