"use client";

import { useT } from "@/lib/i18n/useI18n";
import useLocalDateTime from "@/lib/hooks/useLocalDateTime";

export default function RefundPolicyText({
  refundPolicyPercent,
  refundPolicyLimitDate,
}: {
  refundPolicyPercent: number | null;
  refundPolicyLimitDate: string | null;
}) {
  const { t } = useT();
  const limitDateAndTime = useLocalDateTime(refundPolicyLimitDate);

  if (!refundPolicyPercent) {
    return t("competitions.competition_info.no_refunds");
  }

  return t("competitions.competition_info.refund_policy_html", {
    refund_policy_percent: `${refundPolicyPercent}%`,
    limit_date_and_time: limitDateAndTime,
  });
}
