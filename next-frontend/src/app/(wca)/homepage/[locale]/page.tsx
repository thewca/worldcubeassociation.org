import { languages } from "@/lib/i18n/settings";

export { default, metadata } from "../../page";

export function generateStaticParams() {
  return languages.map((locale) => ({ locale }));
}
