export { default, metadata } from "../../page";

export function generateStaticParams() {
  // MongoDB is unavailable at build time. Generate each language on its first visit.
  return [{ locale: "prerender-placeholder" }];
}
