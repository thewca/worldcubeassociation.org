import { getT } from "@/lib/i18n/get18n";
import { getRecords } from "@/lib/wca/results/records";
import { Alert, Container, Heading, VStack } from "@chakra-ui/react";
import events, { WCA_EVENT_IDS } from "@/lib/wca/data/events";
import RecordsTable from "@/components/results/RecordsTable";
import { CurrentEventId } from "@wca/helpers";
import React from "react";
import EventIcon from "@/components/EventIcon";

export default async function RecordsPage() {
  const { t } = await getT();

  const { data: records, error } = await getRecords();

  if (error) {
    return (
      <Alert.Root status={"error"}>
        <Alert.Title>Error fetching Records</Alert.Title>
      </Alert.Root>
    );
  }

  return (
    <Container bg={"bg"}>
      <VStack align={"left"} gap={4}>
        <Heading size={"5xl"}>{t("results.records.title")}</Heading>
        {t("results.last_updated_html", { timestamp: records.timestamp })}
        {WCA_EVENT_IDS.map((event) => {
          return (
            records.world_records[event as CurrentEventId] && (
              <React.Fragment key={event}>
                <Heading size={"2xl"} key={event}>
                  <EventIcon eventId={event} /> {events.byId[event].name}
                </Heading>
                <RecordsTable
                  records={records.world_records[event as CurrentEventId]!}
                />
              </React.Fragment>
            )
          );
        })}
      </VStack>
    </Container>
  );
}
