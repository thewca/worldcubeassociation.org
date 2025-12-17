import {
  Accordion,
  Alert,
  CodeBlock,
  Container,
  Float,
  IconButton,
} from "@chakra-ui/react";
import { TFunction } from "i18next";

export default function Errored({
  t,
  response,
}: {
  response: Response;
  t: TFunction;
}) {
  return (
    <Container>
      <Alert.Root status="error">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{t("errors.next_frontend.title")}</Alert.Title>
          <Alert.Description>
            {t("errors.next_frontend.description")}
            <Accordion.Root collapsible>
              <Accordion.Item value="details">
                <Accordion.ItemTrigger>
                  {t("errors.next_frontend.details")}

                  <Accordion.ItemIndicator />
                </Accordion.ItemTrigger>
                <Accordion.ItemContent>
                  <Accordion.ItemBody>
                    <CodeBlock.Root
                      meta={{ wordWrap: true }}
                      code={JSON.stringify({
                        error_code: response.status,
                        url: response.url,
                        errorText: response.statusText,
                        requestId: response.headers.get("x-request-id"),
                      })}
                      language="json"
                    >
                      <CodeBlock.Code>
                        <Float placement="middle-end" offsetX="6" zIndex="1">
                          <CodeBlock.CopyTrigger asChild>
                            <IconButton variant="ghost" size="2xs">
                              <CodeBlock.CopyIndicator />
                            </IconButton>
                          </CodeBlock.CopyTrigger>
                        </Float>
                        <CodeBlock.CodeText />
                      </CodeBlock.Code>
                    </CodeBlock.Root>
                  </Accordion.ItemBody>
                </Accordion.ItemContent>
              </Accordion.Item>
            </Accordion.Root>
          </Alert.Description>
        </Alert.Content>
      </Alert.Root>
    </Container>
  );
}
