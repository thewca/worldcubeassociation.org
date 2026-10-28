import {
  Card,
  Center,
  DataList,
  HStack,
  Image,
  SimpleGrid,
  Text,
} from "@chakra-ui/react";
import RoleBadge from "@/components/RoleBadge";
import WcaFlag from "@/components/WcaFlag";
import CountryMap from "@/components/CountryMap";
import ExecutiveBioDialog from "@/components/executives/ExecutiveBioDialog";
import { getPersonInfo } from "@/lib/wca/persons/getPersonInfo";
import { getT } from "@/lib/i18n/get18n";
import { ExecutivesPage } from "@/types/payload";

type Executive = ExecutivesPage["executives"][number];

export default async function ExecutiveCard({
  executive,
  showsImage,
}: {
  executive: Executive;
  showsImage: boolean;
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
      {showsImage && (
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
        <SimpleGrid columns={2}>
          <DataList.Root variant="bold">
            <DataList.Item>
              <DataList.ItemLabel>{t("common.user.wca_id")}</DataList.ItemLabel>
              <DataList.ItemValue>{executive.wcaId}</DataList.ItemValue>
            </DataList.Item>
            <DataList.Item>
              <DataList.ItemLabel>
                {t("persons.show.completed_solves")}
              </DataList.ItemLabel>
              <DataList.ItemValue>
                {personDetails.total_solves}
              </DataList.ItemValue>
            </DataList.Item>
          </DataList.Root>
          <DataList.Root variant="bold">
            <DataList.Item>
              <DataList.ItemLabel>
                {t("results.table_elements.region")}
              </DataList.ItemLabel>
              <DataList.ItemValue>
                <CountryMap code={person.country_iso2} t={t} />
              </DataList.ItemValue>
            </DataList.Item>
            <DataList.Item>
              <DataList.ItemLabel>
                {t("layouts.navigation.competitions")}
              </DataList.ItemLabel>
              <DataList.ItemValue>
                {personDetails.competition_count}
              </DataList.ItemValue>
            </DataList.Item>
          </DataList.Root>
        </SimpleGrid>
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
