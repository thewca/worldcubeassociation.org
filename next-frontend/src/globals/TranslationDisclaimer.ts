import type { GlobalConfig } from "payload";
import { revalidateGlobal } from "@/globals/revalidateGlobal";
import { languageConfig } from "@/lib/i18n/settings";
import { isAdmin } from "@/payload.access";

const localeOptions = Object.entries(languageConfig).map(
  ([value, { name: label }]) => ({ value, label }),
);

export const TranslationDisclaimer: GlobalConfig = {
  slug: "translation-disclaimer",
  label: "Translation Disclaimer",
  access: {
    update: ({ req: { user } }) => isAdmin(user),
  },
  fields: [
    {
      name: "hiddenLocales",
      type: "select",
      hasMany: true,
      options: localeOptions,
      admin: {
        description:
          "Languages whose translations are complete enough that the disclaimer is not shown. It is never shown for English.",
      },
    },
  ],
  hooks: {
    afterChange: [revalidateGlobal],
  },
};
