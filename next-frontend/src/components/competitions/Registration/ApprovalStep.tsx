import { PanelProps } from "@/app/(wca)/competitions/[competitionId]/register/StepPanelContents";
import { DataList } from "@chakra-ui/react";

export default function ApprovalStep({ form }: PanelProps) {
  return (
    <DataList.Root orientation="horizontal">
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
