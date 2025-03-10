"use client";

import { useCompetitionInfo } from "@/providers/CompetitionProvider";
import { usePermissions } from "@/providers/PermissionProvider";
import { Heading } from '@chakra-ui/react'
import { Container } from '@chakra-ui/react'
import Link from "next/link";

export default function CompetitionOverview(){
    const competitionInfo = useCompetitionInfo();
    const permissions = usePermissions();

    if(!competitionInfo){
        return <p>
            Competition does not exist
        </p>
    }

    return (
        <Container centerContent>
            <Heading>{competitionInfo.id}</Heading>
            {permissions?.canAdministerCompetition(competitionInfo.id) ?
                <p> You can administer this competition <Link href={`/competitions/${competitionInfo.id}/admin`}>here</Link></p> :
            <p> This is the public page, you cannot administer this competition</p>}
        </Container>
    )
}
