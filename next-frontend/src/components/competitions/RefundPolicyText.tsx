"use client";

import { useT } from "@/lib/i18n/useI18n";
import useLocalDateTime from "@/lib/hooks/useLocalDateTime";

export default function RefundPolicyText({
  refundPolicyPercent,
  refundPolicyLimitDate,
}: {
  refundPolicyPercent: number;
  refundPolicyLimitDate: string;
}) {
  const { t } = useT();
  const limitDateAndTime = useLocalDateTime(refundPolicyLimitDate);

  if (refundPolicyPercent <= 0) {
    return t("competitions.competition_info.no_refunds");
  }

  return t("competitions.competition_info.refund_policy_html", {
    refund_policy_percent: `${refundPolicyPercent}%`,
    limit_date_and_time: limitDateAndTime,
  });
}
