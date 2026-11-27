import { ClientOnly } from "@chakra-ui/react";
import { cookies } from "next/headers";
import DisclaimerDialog from "@/components/DisclaimerDialog";
import TransWithLinks from "@/components/TransWithLinks";
import { getT } from "@/lib/i18n/get18n";
import { fallbackLng, storageKey } from "@/lib/i18n/settings";
import { getCachedGlobal } from "@/lib/payload/globals";

const TRANSLATION_DISCLAIMER_COOKIE = "translation_disclaimer_accepted";

export default async function TranslationDisclaimer() {
  const { t, lng } = await getT();
  const cookieList = await cookies();

  // Only the language selector writes this cookie, so a locale that was merely
  //   picked from Accept-Language doesn't count as the user changing it.
  const hasChosenLocale = cookieList.has(storageKey);

  if (!hasChosenLocale || lng === fallbackLng) return null;

  const { hiddenLocales } = await getCachedGlobal(
    "translation-disclaimer",
    lng,
  );

  const isHiddenForLocale = hiddenLocales?.includes(lng);

  if (isHiddenForLocale) return null;

  return (
    <ClientOnly>
      <DisclaimerDialog
        cookieName={TRANSLATION_DISCLAIMER_COOKIE}
        title={t("translation_disclaimer.title")}
        acceptLabel={t("translation_disclaimer.accept")}
      >
        <TransWithLinks i18nKey="translation_disclaimer.description_html" />
      </DisclaimerDialog>
    </ClientOnly>
  );
}
