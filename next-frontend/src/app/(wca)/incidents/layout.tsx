import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getT } from "@/lib/i18n/get18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("layouts.navigation.incidents") };
}

export default function Layout({ children }: { children: ReactNode }) {
  return children;
}
