"use client";

import React from "react";
import { Text } from "@chakra-ui/react";
import useAPI from "@/lib/wca/useAPI";
import { useT } from "@/lib/i18n/useI18n";
import RecordsTable from "@/components/persons/RecordsTable";

interface RecordsTabProps {
  wcaId: string;
}

const RecordsTab: React.FC<RecordsTabProps> = ({ wcaId }) => {
  const api = useAPI();
  const { t } = useT();

  const { data: recordsQuery, isLoading } = api.useQuery(
    "get",
    "/v1/persons/{wca_id}/records",
    {
      params: { path: { wca_id: wcaId } },
    },
  );

  if (isLoading) {
    return (
      <Text>
        {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
        Loading...
      </Text>
    );
  }

  if (!recordsQuery) {
    return (
      <Text>
        {/* eslint-disable-line no-restricted-syntax -- Existing text added before we started enforcing translations */}
        Failed fetching records
      </Text>
    );
  }

  return <RecordsTable recordResults={recordsQuery} t={t} />;
};

export default RecordsTab;
