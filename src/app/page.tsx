import { redirect } from "next/navigation";

// Root page: launches the site directly on the boutique section of the full
// site (/debs) instead of showing the former "coming soon" announcement.
// See README.md.
export default function RootPage() {
  redirect("/debs#boutique");
}
