"use server";

import {
  Container,
  Heading,
  VStack,
  Center,
  Text,
  Link,
  List,
  Code,
} from "@chakra-ui/react";
import { Metadata } from "next";
import { getT } from "@/lib/i18n/get18n";

const LATEST_VERSION = "TNoodle-WCA-1.2.2";
const LATEST_JARFILE =
  "https://github.com/thewca/tnoodle/releases/download/v1.2.2/TNoodle-WCA-1.2.2.jar";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();

  return {
    // This is currently hardcoded in Rails
    title: t("WCA Scrambles"),
  };
}

export default async function ScramblesPage() {
  return (
    <Container bg="bg">
      <VStack align="left" gap="16px">
        <Heading size="5xl">WCA Scrambles</Heading>
        <Text>
          The current official scramble programs is <em>{LATEST_VERSION}</em>.
          It generates high-quality scramble sequences for all the events of a
          competition at once.
        </Text>
        <Center>
          <VStack>
            <Text>Download the official scramble program:</Text>
            <Link href={LATEST_JARFILE}>{LATEST_VERSION}</Link>
            <Text>Last official change: January 22nd, 2024</Text>
          </VStack>
        </Center>
        <Heading size="2xl">Important Notes for Delegates</Heading>
        <List.Root>
          <List.Item>
            Official competitions must always use a current version of the
            official scramble program (see{" "}
            <Link href="/regulations#4b">Regulation 4b</Link>).
          </List.Item>
          <List.Item>
            Delegates should download TNoodle to run it on a computer. They
            should not use TNoodle running on a public server (for security
            reasons).
          </List.Item>
          <List.Item>
            Delegates must save all scramble sequences generated for an official
            competition, and send them with the results (see the{" "}
            <Link href="https://documents.worldcubeassociation.org/documents/policies/external/Competition%20Requirements.pdf">
              WCA Competition Requirements Policy
            </Link>
            ).
          </List.Item>
        </List.Root>
        <Heading size="2xl">Scramble Secrecy</Heading>
        <List.Root>
          <List.Item>
            <b>Always</b> encrypt your scrambles in TNoodle with an unguessable
            password. The password must have nothing to do with the competition
            or personal data (name, birthdate) of any of the Delegates.
          </List.Item>
          <List.Item>
            If you are displaying scrambles on a digital device, only share{" "}
            <Code>[Competition Name] - Computer Display PDFs.zip</Code>.
          </List.Item>
          <List.Root>
            <List.Item>
              Make sure that only Delegates have access to any other files.
            </List.Item>
            <List.Item>
              If you are using a Delegate&#39;s computer, use the operating
              system to create a guest user account and share only the
              passcode-protected computer display PDFs with it.
            </List.Item>
            <List.Item>
              Give passcodes to scramblers when the corresponding groups begin
              but <b>not any earlier</b>. (In particular, do not give the
              passcodes for all the scramble sets in a round to scramblers at
              the beginning of that round.)
            </List.Item>
            <List.Item>
              Don&#39;t put someone else in charge of the passcodes unless
              absolutely necessary, and only give them the minimum amount of
              passcodes needed.
            </List.Item>
          </List.Root>
          <List.Item>
            Additional precautions are outlined in the{" "}
            <Link href="https://documents.worldcubeassociation.org/documents/policies/external/Scramble%20Accountability.pdf">
              Scramble Accountability Policy
            </Link>
            .
          </List.Item>
        </List.Root>
        <Heading size="2xl">Detailed Instructions for TNoodle</Heading>
        <Text>
          TNoodle requires <Link href="https://www.java.com/en/">Java</Link> to
          be installed on your computer.
        </Text>
        <List.Root>
          <List.Item>
            Run the <Code>{LATEST_JARFILE}</Code> file on your computer.
            <br />
            It will open the page{" "}
            <Link href="http://localhost:2014/scramble">
              http://localhost:2014/scramble
            </Link>{" "}
            in your browser.
          </List.Item>
          <List.Item>
            Enter the details for your competition (competition name, number of
            rounds for each event, details for each round).
            <br />
            If you would like to password protect the file, enter a password.
          </List.Item>
          <List.Item>
            Wait for the loading bar to finish and click the &#34;Scramble!&#34;
            button that appears.
            <br />A <Code>.zip</Code> file will download in your browser.
          </List.Item>
        </List.Root>
        <Heading size="2xl">Notes</Heading>
        <List.Root>
          <List.Item>
            4x4x4 scramble sequences <strong>may take a few minutes</strong> to
            initialize and generate. If you are generating 4x4x4 scramble
            sequences, be patient while the loading bar may appear to be stuck.
          </List.Item>
          <List.Item>
            TNoodle creates a <Code>tnoodle_resources</Code> folder with a few
            MB of files (mostly cached tables) in the same folder it is run.
            <br />
            Keep this folder if you want to generate more 4x4x4 scramble
            sequences more quickly in the future, but feel free to delete it if
            you need to reclaim disk space.
          </List.Item>
          <List.Item>
            TNoodle performs scramble filtering according to{" "}
            <Link href="https://www.worldcubeassociation.org/regulations/#4b3">
              Regulation 4b3
            </Link>
            .
          </List.Item>
        </List.Root>
        <Heading size="2xl">About TNoodle</Heading>
        <Text>
          TNoodle uses code developed or adapted by Jeremy Fleischman, Ryan
          Zheng, Cl&#233;ment Gallet, Shuang Chen, Bruce Norskog, and Lucas
          Garron. View the{" "}
          <Link href="https://github.com/thewca/tnoodle">
            TNoodle project on GitHub
          </Link>{" "}
          to view the source, report an issue, or contribute to its development.
        </Text>
        <Heading size="2xl">History of Official Releases</Heading>
        <Text>
          Old versions must not be used. These are provided in case you want to
          check the behaviour of an older version.
        </Text>
        <List.Root>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.7.4/TNoodle-0.7.4.jar">
              TNoodle-0.7.4
            </Link>{" "}
            (2013-01-01)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.7.5/TNoodle-0.7.5.jar">
              TNoodle-0.7.5
            </Link>{" "}
            (2013-02-26)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.7.8/TNoodle-0.7.8.jar">
              TNoodle-0.7.8
            </Link>{" "}
            (2013-04-26)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.7.12/TNoodle-0.7.12.jar">
              TNoodle-0.7.12
            </Link>{" "}
            (2013-10-01)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.8.0/TNoodle-WCA-0.8.0.jar">
              TNoodle-WCA-0.8.0
            </Link>{" "}
            (2014-01-13)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.8.1/TNoodle-WCA-0.8.1.jar">
              TNoodle-WCA-0.8.1
            </Link>{" "}
            (2014-01-14)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.8.2/TNoodle-WCA-0.8.2.jar">
              TNoodle-WCA-0.8.2
            </Link>{" "}
            (2014-01-28)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.8.4/TNoodle-WCA-0.8.4.jar">
              TNoodle-WCA-0.8.4
            </Link>{" "}
            (2014-02-10)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.9.0/TNoodle-WCA-0.9.0.jar">
              TNoodle-WCA-0.9.0
            </Link>{" "}
            (2015-03-30)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.10.0/TNoodle-WCA-0.10.0.jar">
              TNoodle-WCA-0.10.0
            </Link>{" "}
            (2015-06-30)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.11.1/TNoodle-WCA-0.11.1.jar">
              TNoodle-WCA-0.11.1
            </Link>{" "}
            (2016-04-04)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.11.3/TNoodle-WCA-0.11.3.jar">
              TNoodle-WCA-0.11.3
            </Link>{" "}
            (2016-10-17)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.11.5/TNoodle-WCA-0.11.5.jar">
              TNoodle-WCA-0.11.5
            </Link>{" "}
            (2016-12-12)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.12.0/TNoodle-WCA-0.12.0.jar">
              TNoodle-WCA-0.12.0
            </Link>{" "}
            (2017-09-25)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.13.1/TNoodle-WCA-0.13.1.jar">
              TNoodle-WCA-0.13.1
            </Link>{" "}
            (2018-01-29)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.13.2/TNoodle-WCA-0.13.2.jar">
              TNoodle-WCA-0.13.2
            </Link>{" "}
            (2018-02-03)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.13.3/TNoodle-WCA-0.13.3.jar">
              TNoodle-WCA-0.13.3
            </Link>{" "}
            (2018-02-05)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.13.4/TNoodle-WCA-0.13.4.jar">
              TNoodle-WCA-0.13.4
            </Link>{" "}
            (2018-07-02)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.13.5/TNoodle-WCA-0.13.5.jar">
              TNoodle-WCA-0.13.5
            </Link>{" "}
            (2018-10-08)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.14.0/TNoodle-WCA-0.14.0.jar">
              TNoodle-WCA-0.14.0
            </Link>{" "}
            (2018-12-03)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.15.0/TNoodle-WCA-0.15.0.jar">
              TNoodle-WCA-0.15.0
            </Link>{" "}
            (2019-07-14)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v0.15.1/TNoodle-WCA-0.15.1.jar">
              TNoodle-WCA-0.15.1
            </Link>{" "}
            (2020-01-01)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v1.0.1/TNoodle-WCA-1.0.1.jar">
              TNoodle-WCA-1.0.1
            </Link>{" "}
            (2020-08-17)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v1.1.0/TNoodle-WCA-1.1.0.jar">
              TNoodle-WCA-1.1.0
            </Link>{" "}
            (2021-04-19)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v1.1.1/TNoodle-WCA-1.1.1.jar">
              TNoodle-WCA-1.1.1
            </Link>{" "}
            (2021-07-07)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v1.1.2/TNoodle-WCA-1.1.2.jar">
              TNoodle-WCA-1.1.2
            </Link>{" "}
            (2021-07-07)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v1.1.3.1/TNoodle-WCA-1.1.3.1.jar">
              TNoodle-WCA-1.1.3.1
            </Link>{" "}
            (2024-01-22)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v1.2.0/TNoodle-WCA-1.2.0.jar">
              TNoodle-WCA-1.2.0
            </Link>{" "}
            (2023-12-31)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v1.2.1/TNoodle-WCA-1.2.1.jar">
              TNoodle-WCA-1.2.1
            </Link>{" "}
            (2024-01-02)
          </List.Item>
          <List.Item>
            <Link href="https://github.com/thewca/tnoodle/releases/download/v1.2.2/TNoodle-WCA-1.2.2.jar">
              TNoodle-WCA-1.2.2
            </Link>{" "}
            (2024-01-22)
          </List.Item>
        </List.Root>
      </VStack>
    </Container>
  );
}
