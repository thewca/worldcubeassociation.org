import { PanelProps } from "@/app/(wca)/competitions/[competitionId]/register/StepPanel";
import { DataList } from "@chakra-ui/react";
import EventIcon from "@/components/EventIcon";

export default function StepSummary({ form }: PanelProps) {
  return (
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
  );
}
