import { PanelProps } from "@/app/(wca)/competitions/[competitionId]/register/StepPanel";
import { Alert, DataList, Stack } from "@chakra-ui/react";
import EventIcon from "@/components/EventIcon";

export default function ApprovalStep({ form }: PanelProps) {
  return (
    <Stack>
      <Alert.Root status="info">
        <Alert.Indicator />
        <Alert.Title>Please check the below details and hit "Submit" when you are ready</Alert.Title>
      </Alert.Root>
      <DataList.Root orientation="horizontal">
        <DataList.Item>
          <DataList.ItemLabel>Events</DataList.ItemLabel>
          <form.Subscribe selector={(state) => state.values.eventIds}>
            {(eventIds) => (
              <DataList.ItemValue>
                {eventIds.map((eventId) => <EventIcon key={eventId} eventId={eventId} />)}
              </DataList.ItemValue>
            )}
          </form.Subscribe>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>Comment</DataList.ItemLabel>
          <form.Subscribe selector={(state) => state.values.comment}>
            {(comment) => <DataList.ItemValue>{comment}</DataList.ItemValue>}
          </form.Subscribe>
        </DataList.Item>
        <DataList.Item>
          <DataList.ItemLabel>Guests</DataList.ItemLabel>
          <form.Subscribe selector={(state) => state.values.numberOfGuests}>
            {(guests) => <DataList.ItemValue>{guests}</DataList.ItemValue>}
          </form.Subscribe>
        </DataList.Item>
      </DataList.Root>
    </Stack>
  );
}
