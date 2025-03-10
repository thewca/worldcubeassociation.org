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

  if(!permissions || !permissions.canAdministerCompetition(competitionInfo.id)){
    return <p>
      You do not have access to this page
    </p>
  }

  return (
    <Container centerContent>
      <Heading>{competitionInfo.id}</Heading>
      <p>You are administering this competition</p>
      <p>Go back to the public page <Link href={`/competitions/${competitionInfo.id}`}>here</Link></p>
    </Container>
  )
}
