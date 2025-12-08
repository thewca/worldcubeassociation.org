import { PanelProps } from "@/app/(wca)/competitions/[competitionId]/register/StepPanel";
import { Link, Text } from "@chakra-ui/react";

export default function StepSummary({ competitionInfo }: PanelProps) {
  return (
    <>
      <Text>
        Thank you for trying out this panel.
        {" "}
        <Text as="span" fontWeight="bold">Your registration has NOT been processed!!</Text>
      </Text>
      <Text>
        If you actually want to register for real, please click
        {" "}
        <Link href={`https://worldcubeassociation.org/competitions/${competitionInfo.id}/register`} variant="underline" target="_blank">here</Link>
      </Text>
    </>
  );
}
