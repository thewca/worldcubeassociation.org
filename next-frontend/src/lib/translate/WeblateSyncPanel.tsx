import type { ServerProps } from "payload";
import { isAdmin } from "@/payload.access";
import { WeblateSyncButtons } from "./WeblateSyncButtons";

export function WeblateSyncPanel({ user }: ServerProps) {
  if (!isAdmin(user)) return null;
  return <WeblateSyncButtons />;
}
