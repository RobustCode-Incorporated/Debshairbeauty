import { redirect } from "@/i18n/navigation";

// Root page: launches the site directly on the full site (/debs) instead of
// showing the former "coming soon" announcement. See README.md.
export default async function RootPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect({ href: "/debs", locale });
}
