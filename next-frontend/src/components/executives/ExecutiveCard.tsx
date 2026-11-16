import { Card, Center, DataList, HStack, Image, Text } from "@chakra-ui/react";
import RoleBadge from "@/components/RoleBadge";
import WcaFlag from "@/components/WcaFlag";
import ExecutiveBioDialog from "@/components/executives/ExecutiveBioDialog";
import { getPersonInfo } from "@/lib/wca/persons/getPersonInfo";
import { getT } from "@/lib/i18n/get18n";
import { ExecutivesPage } from "@/types/payload";

type Executive = ExecutivesPage["executives"][number];

export default async function ExecutiveCard({
  executive,
  showsImages,
}: {
  executive: Executive;
  showsImages: boolean;
}) {
  const { t } = await getT();
  const { data: personDetails } = await getPersonInfo(executive.wcaId);

  if (!personDetails) {
    return (
      <Text>
        {t("page.executives.person_not_found", { wca_id: executive.wcaId })}
      </Text>
    );
  }

  const { person } = personDetails;

  return (
    <Card.Root
      size="sm"
      colorPalette={executive.colorPalette}
      layerStyle={{ _light: "fill.solid", _dark: "fill.muted" }}
    >
      {showsImages && (
        <Card.Header>
          <Center>
            <Image src={person.avatar.url} rounded="md" alt={person.name} />
          </Center>
        </Card.Header>
      )}
      <Card.Body gap={2}>
        <Card.Title>
          <HStack>
            <WcaFlag code={person.country_iso2} size="2xl" />
            <Text textStyle="h2">{person.name}</Text>
          </HStack>
          <RoleBadge
            teamRole={executive.role}
            colorPalette={executive.colorPalette}
          />
        </Card.Title>
        <DataList.Root variant="bold">
          <DataList.Item>
            <DataList.ItemLabel>
              {t("page.executives.joined_wca")}
            </DataList.ItemLabel>
            <DataList.ItemValue>{executive.joinedWcaYear}</DataList.ItemValue>
          </DataList.Item>
          <DataList.Item>
            <DataList.ItemLabel>
              {t("page.executives.joined_executives")}
            </DataList.ItemLabel>
            <DataList.ItemValue>
              {executive.joinedExecutivesYear}
            </DataList.ItemValue>
          </DataList.Item>
        </DataList.Root>
        <Text>{executive.summary}</Text>
      </Card.Body>
      <Card.Footer>
        <ExecutiveBioDialog
          name={person.name}
          bioMarkdown={executive.bioMarkdown}
          colorPalette={executive.colorPalette}
        />
      </Card.Footer>
    </Card.Root>
  );
}
