import { Center, Heading, Link, List, Text, VStack } from "@chakra-ui/react";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";
import TransWithLinks from "@/components/TransWithLinks";

const LATEST_VERSION = "TNoodle-WCA-1.2.3";
const LATEST_JARFILE =
  "https://github.com/thewca/tnoodle/releases/download/v1.2.3/TNoodle-WCA-1.2.3.jar";

const OFFICIAL_RELEASES = [
  { tag: "v0.7.4", name: "TNoodle-0.7.4", date: "2013-01-01" },
  { tag: "v0.7.5", name: "TNoodle-0.7.5", date: "2013-02-26" },
  { tag: "v0.7.8", name: "TNoodle-0.7.8", date: "2013-04-26" },
  { tag: "v0.7.12", name: "TNoodle-0.7.12", date: "2013-10-01" },
  { tag: "v0.8.0", name: "TNoodle-WCA-0.8.0", date: "2014-01-13" },
  { tag: "v0.8.1", name: "TNoodle-WCA-0.8.1", date: "2014-01-14" },
  { tag: "v0.8.2", name: "TNoodle-WCA-0.8.2", date: "2014-01-28" },
  { tag: "v0.8.4", name: "TNoodle-WCA-0.8.4", date: "2014-02-10" },
  { tag: "v0.9.0", name: "TNoodle-WCA-0.9.0", date: "2015-03-30" },
  { tag: "v0.10.0", name: "TNoodle-WCA-0.10.0", date: "2015-06-30" },
  { tag: "v0.11.1", name: "TNoodle-WCA-0.11.1", date: "2016-04-04" },
  { tag: "v0.11.3", name: "TNoodle-WCA-0.11.3", date: "2016-10-17" },
  { tag: "v0.11.5", name: "TNoodle-WCA-0.11.5", date: "2016-12-12" },
  { tag: "v0.12.0", name: "TNoodle-WCA-0.12.0", date: "2017-09-25" },
  { tag: "v0.13.1", name: "TNoodle-WCA-0.13.1", date: "2018-01-29" },
  { tag: "v0.13.2", name: "TNoodle-WCA-0.13.2", date: "2018-02-03" },
  { tag: "v0.13.3", name: "TNoodle-WCA-0.13.3", date: "2018-02-05" },
  { tag: "v0.13.4", name: "TNoodle-WCA-0.13.4", date: "2018-07-02" },
  { tag: "v0.13.5", name: "TNoodle-WCA-0.13.5", date: "2018-10-08" },
  { tag: "v0.14.0", name: "TNoodle-WCA-0.14.0", date: "2018-12-03" },
  { tag: "v0.15.0", name: "TNoodle-WCA-0.15.0", date: "2019-07-14" },
  { tag: "v0.15.1", name: "TNoodle-WCA-0.15.1", date: "2020-01-01" },
  { tag: "v1.0.1", name: "TNoodle-WCA-1.0.1", date: "2020-08-17" },
  { tag: "v1.1.0", name: "TNoodle-WCA-1.1.0", date: "2021-04-19" },
  { tag: "v1.1.1", name: "TNoodle-WCA-1.1.1", date: "2021-07-07" },
  { tag: "v1.1.2", name: "TNoodle-WCA-1.1.2", date: "2021-07-07" },
  { tag: "v1.1.3.1", name: "TNoodle-WCA-1.1.3.1", date: "2024-01-22" },
  { tag: "v1.2.0", name: "TNoodle-WCA-1.2.0", date: "2023-12-31" },
  { tag: "v1.2.1", name: "TNoodle-WCA-1.2.1", date: "2024-01-02" },
  { tag: "v1.2.2", name: "TNoodle-WCA-1.2.2", date: "2024-01-22" },
  { tag: "v1.2.3", name: "TNoodle-WCA-1.2.3", date: "2025-12-17" },
];

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    title: t("layouts.navigation.scrambles"),
  };
}

export default async function ScramblesPage() {
  const { t } = await getT();

  return (
    <VStack align="left" gap="16px">
      <Heading size="5xl">{t("regulations_scrambles.title")}</Heading>
      <Text>
        <TransWithLinks
          i18nKey="regulations_scrambles.current_program_html"
          values={{ version: LATEST_VERSION }}
        />
      </Text>
      <Center>
        <VStack>
          <Text>{t("regulations_scrambles.download")}</Text>
          <Link href={LATEST_JARFILE}>{LATEST_VERSION}</Link>
          <Text>{t("regulations_scrambles.last_change")}</Text>
        </VStack>
      </Center>
      <Heading size="2xl">{t("regulations_scrambles.delegates.title")}</Heading>
      <List.Root indented>
        <List.Item>
          <TransWithLinks i18nKey="regulations_scrambles.delegates.current_version_html" />
        </List.Item>
        <List.Item>
          {t("regulations_scrambles.delegates.no_public_server")}
        </List.Item>
        <List.Item>
          <TransWithLinks i18nKey="regulations_scrambles.delegates.save_scrambles_html" />
        </List.Item>
      </List.Root>
      <Heading size="2xl">{t("regulations_scrambles.secrecy.title")}</Heading>
      <List.Root indented>
        <List.Item>
          <TransWithLinks i18nKey="regulations_scrambles.secrecy.encrypt_html" />
        </List.Item>
        <List.Item>
          <TransWithLinks i18nKey="regulations_scrambles.secrecy.digital_display_html" />
        </List.Item>
        <List.Root indented>
          <List.Item>
            {t("regulations_scrambles.secrecy.delegates_only")}
          </List.Item>
          <List.Item>
            {t("regulations_scrambles.secrecy.guest_account")}
          </List.Item>
          <List.Item>
            <TransWithLinks i18nKey="regulations_scrambles.secrecy.passcode_timing_html" />
          </List.Item>
          <List.Item>
            {t("regulations_scrambles.secrecy.passcode_delegation")}
          </List.Item>
        </List.Root>
        <List.Item>
          <TransWithLinks i18nKey="regulations_scrambles.secrecy.accountability_html" />
        </List.Item>
      </List.Root>
      <Heading size="2xl">
        {t("regulations_scrambles.instructions.title")}
      </Heading>
      <Text>
        <TransWithLinks i18nKey="regulations_scrambles.instructions.java_html" />
      </Text>
      <List.Root indented>
        <List.Item>
          <TransWithLinks
            i18nKey="regulations_scrambles.instructions.run_html"
            values={{ jarfile: LATEST_JARFILE }}
          />
          <br />
          <TransWithLinks i18nKey="regulations_scrambles.instructions.open_page_html" />
        </List.Item>
        <List.Item>
          {t("regulations_scrambles.instructions.enter_details")}
          <br />
          {t("regulations_scrambles.instructions.password")}
        </List.Item>
        <List.Item>
          {t("regulations_scrambles.instructions.wait")}
          <br />
          <TransWithLinks i18nKey="regulations_scrambles.instructions.zip_html" />
        </List.Item>
      </List.Root>
      <Heading size="2xl">{t("regulations_scrambles.notes.title")}</Heading>
      <List.Root indented>
        <List.Item>
          <TransWithLinks i18nKey="regulations_scrambles.notes.four_by_four_html" />
        </List.Item>
        <List.Item>
          <TransWithLinks i18nKey="regulations_scrambles.notes.resources_html" />
          <br />
          {t("regulations_scrambles.notes.resources_keep")}
        </List.Item>
        <List.Item>
          <TransWithLinks i18nKey="regulations_scrambles.notes.filtering_html" />
        </List.Item>
      </List.Root>
      <Heading size="2xl">{t("regulations_scrambles.about.title")}</Heading>
      <Text>
        <TransWithLinks i18nKey="regulations_scrambles.about.description_html" />
      </Text>
      <Heading size="2xl">{t("regulations_scrambles.history.title")}</Heading>
      <Text>{t("regulations_scrambles.history.description")}</Text>
      <List.Root indented>
        {OFFICIAL_RELEASES.map(({ tag, name, date }) => (
          <List.Item key={name}>
            <Link
              href={`https://github.com/thewca/tnoodle/releases/download/${tag}/${name}.jar`}
            >
              {name}
            </Link>{" "}
            ({date})
          </List.Item>
        ))}
      </List.Root>
    </VStack>
  );
}
