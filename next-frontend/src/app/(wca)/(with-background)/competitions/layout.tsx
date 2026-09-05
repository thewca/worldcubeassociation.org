import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getT } from "@/lib/i18n/get18n";

// TODO: Cache Components adoption. Refactor this route so this opt-out can be removed.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("layouts.navigation.competitions") };
}

export default function Layout({ children }: { children: ReactNode }) {
  // Required by Next.js; this layout exists only to attach metadata to this route segment
  return children;
}
