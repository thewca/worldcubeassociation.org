import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getStaticT } from "@/lib/i18n/getStaticT";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getStaticT();
  return { title: t("layouts.navigation.competitions") };
}

export default function Layout({ children }: { children: ReactNode }) {
  // Required by Next.js; this layout exists only to attach metadata to this route segment
  return children;
}
