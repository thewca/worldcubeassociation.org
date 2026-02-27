import {
  Alert,
  Button,
  Combobox,
  Heading,
  Portal,
  useListCollection,
} from "@chakra-ui/react";
import AttemptResultField from "@/app/(wca)/dashboard/AttemptResultField";
import _ from "lodash";
import { useResultsAdmin } from "@/providers/LiveResultAdminProvider";
import { LiveCompetitor } from "@/types/live";

interface AttemptsFormProps {
  competitors: LiveCompetitor[];
  solveCount: number;
  header: string;
  eventId: string;
}

export default function AttemptsForm({
  competitors,
  solveCount,
  header,
  eventId,
}: AttemptsFormProps) {
  const {
    error,
    success,
    handleRegistrationIdChange,
    handleSubmit,
    attempts,
    handleAttemptChange,
    isPendingUpdate,
    registrationId,
  } = useResultsAdmin();

  const { collection, filter } = useListCollection({
    initialItems: competitors,
    itemToValue: (competitor) => competitor.id.toString(),
    itemToString: (competitor) =>
      `${competitor.name} (${competitor.registrant_id})`,
    filter: (itemText, filterText, item) =>
      itemText.includes(filterText) ||
      parseInt(filterText, 10) === item.registrant_id,
  });

  const selectedCompetitor = competitors.find((c) => c.id === registrationId);
  const inputDisplayValue = selectedCompetitor
    ? `${selectedCompetitor.name} (${selectedCompetitor.registrant_id})`
    : "";

  return (
    <form>
      {error && <Alert.Root status="error" title={error} />}
      {success && <Alert.Root status="success" title={success} />}
      <Combobox.Root
        collection={collection}
        onInputValueChange={(e) => filter(e.inputValue)}
        inputValue={inputDisplayValue}
        onValueChange={(e) => {
          if (e.value.length > 0) {
            handleRegistrationIdChange(parseInt(e.value[0], 10));
          }
        }}
        value={registrationId ? [registrationId.toString()] : []}
      >
        <Combobox.Label>
          <Heading size="2xl">{header}</Heading>
        </Combobox.Label>
        <Combobox.Control>
          <Combobox.Input placeholder="Type to search" />
          <Combobox.IndicatorGroup>
            <Combobox.ClearTrigger />
            <Combobox.Trigger />
          </Combobox.IndicatorGroup>
        </Combobox.Control>
        <Portal>
          <Combobox.Positioner>
            <Combobox.Content>
              <Combobox.Empty>No items found</Combobox.Empty>
              {collection.items.map((item) => (
                <Combobox.Item item={item} key={item.id}>
                  {`${item.name} (${item.registrant_id})`}
                  <Combobox.ItemIndicator />
                </Combobox.Item>
              ))}
            </Combobox.Content>
          </Combobox.Positioner>
        </Portal>
      </Combobox.Root>
      {_.times(solveCount).map((index) => (
        <AttemptResultField
          eventId={eventId}
          key={index}
          value={attempts[index]}
          onChange={(value) => handleAttemptChange(index, value)}
          resultType="single"
        />
      ))}
      <Button onClick={handleSubmit} disabled={isPendingUpdate}>
        Submit Results
      </Button>
    </form>
  );
}
