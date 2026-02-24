import { Button, ButtonGroup, Link } from "@chakra-ui/react";

export default function AdminButtons({
  competitionId,
  roundId,
}: {
  competitionId: string;
  roundId: string;
}) {
  return (
    <ButtonGroup>
      <Button asChild>
        <Link href={`/competitions/${competitionId}/live/rounds/${roundId}`}>
          Results
        </Link>
      </Button>
      <Button asChild>
        <Link href={`/competitions/${competitionId}/edit/registrations`}>
          Add Competitor
        </Link>
      </Button>
      <Button asChild>
        <Link
          href={`/competitions/${competitionId}/live/rounds/${roundId}/pdf`}
        >
          PDF
        </Link>
      </Button>
      <Button asChild>
        <Link
          href={`/competitions/${competitionId}/live/rounds/${roundId}/double-check`}
        >
          Double Check
        </Link>
      </Button>
    </ButtonGroup>
  );
}
