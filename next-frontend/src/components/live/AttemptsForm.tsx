import { components } from "@/types/openapi";
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

interface AttemptsFormProps {
  registrationId: number | null;
  handleRegistrationIdChange: (value: number) => void;
  competitors: components["schemas"]["LiveCompetitor"][];
  solveCount: number;
  eventId: string;
  attempts: number[];
  handleAttemptChange: (index: number, value: number) => void;
  handleSubmit: () => void;
  error?: string;
  success?: string;
  header: string;
  isPending: boolean;
}

export default function AttemptsForm({
  registrationId,
  handleRegistrationIdChange,
  competitors,
  solveCount,
  eventId,
  attempts,
  handleAttemptChange,
  handleSubmit,
  error,
  success,
  header,
  isPending,
}: AttemptsFormProps) {
  const { collection, filter } = useListCollection({
    initialItems: competitors.map((c) => ({
      ...c,
      label: `${c.user.name} (${c.registrant_id})`,
      value: c.id,
    })),
    filter: (itemText, filterText, item) =>
      itemText.includes(filterText) ||
      parseInt(filterText, 10) === item.registrant_id,
  });

  return (
    <form>
      {error && <Alert.Root status="error" title={error} />}
      {success && <Alert.Root status="success" title={success} />}
      <Combobox.Root
        collection={collection}
        onInputValueChange={(e) => filter(e.inputValue)}
        onValueChange={(e) =>
          handleRegistrationIdChange(parseInt(e.value[0], 10))
        }
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
                <Combobox.Item item={item} key={item.value}>
                  {item.label}
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
          value={attempts[index] ?? 0}
          onChange={(value) => handleAttemptChange(index, value)}
          resultType="single"
        />
      ))}
      <Button onClick={handleSubmit} disabled={isPending}>
        Submit Results
      </Button>
    </form>
  );
}
