import { Container, Heading, Text } from "@chakra-ui/react";

export default async function CompetitionOverView({
    params,
  }: {
    params: Promise<{ personId: string }>;
  }) {
    const { personId } = await params;

    return (
        <Heading>{personId}</Heading>
    )
}