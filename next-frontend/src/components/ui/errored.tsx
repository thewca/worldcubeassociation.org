import { Accordion, Alert, CodeBlock } from "@chakra-ui/react";
import { TFunction } from "i18next";

export default function Errored({
  error,
  t,
  request,
}: {
  error: string;
  request?: Request;
  t: TFunction;
}) {
  return (
    <Alert.Root>
      <Alert.Indicator />
      <Alert.Content>
        <Alert.Title>{t("errors.next_frontend.title")}</Alert.Title>
        <Alert.Description>
          {t("errors.next_frontend.description", { error })}
          <Accordion.Root collapsible>
            <Accordion.ItemTrigger>
              <Accordion.Item value="details">
                {t("errors.next_frontend.details")}
              </Accordion.Item>
              <Accordion.ItemIndicator />
            </Accordion.ItemTrigger>
            <Accordion.ItemContent>
              <Accordion.ItemBody>
                <CodeBlock.Root code={JSON.stringify(request)} language="json">
                  <CodeBlock.Code>
                    <CodeBlock.CodeText />
                  </CodeBlock.Code>
                </CodeBlock.Root>
              </Accordion.ItemBody>
            </Accordion.ItemContent>
          </Accordion.Root>
        </Alert.Description>
      </Alert.Content>
    </Alert.Root>
  );
}
