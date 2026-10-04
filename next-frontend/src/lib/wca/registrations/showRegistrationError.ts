import type { TFunction } from "i18next";
import { toaster } from "@/components/ui/toaster";

export default function showRegistrationError(
  t: TFunction,
  { error }: { error: number },
) {
  toaster.create({
    id: "registration-error",
    type: "error",
    description: t(`competitions.registration_v2.errors.${error}`, {
      defaultValue: t("competitions.registration_v2.errors.-4"),
    }),
  });
}
