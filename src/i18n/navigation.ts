import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

// Locale-aware wrappers around Next.js' navigation APIs — use these instead
// of `next/link` / `next/navigation` anywhere a link should keep (or switch)
// the current locale prefix.
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
