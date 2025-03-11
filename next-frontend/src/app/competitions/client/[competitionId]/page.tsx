"use client";

import { useCompetitionInfo } from "@/providers/CompetitionProvider";
import { Heading } from '@chakra-ui/react'
import { Container } from '@chakra-ui/react'
import PermissionsTestMessage from "@/components/competitions/permissionsTestMessage";

export default function CompetitionOverview(){
    const competitionInfo = useCompetitionInfo();

    if(!competitionInfo){
        return <p>
            Competition does not exist
        </p>
    }

    return (
        <Container centerContent>
            <Heading>{competitionInfo.id}</Heading>
            <PermissionsTestMessage competitionInfo={competitionInfo} />
        </Container>
    )
}
