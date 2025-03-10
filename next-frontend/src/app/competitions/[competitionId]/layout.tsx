"use client";

import React from "react";
import CompetitionProvider from "@/providers/CompetitionProvider";
import { useParams } from "next/navigation";

export default function CompetitionLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode;
}>) {
  const params = useParams<{ competitionId: string }>();

  return (
    <CompetitionProvider competitionId={params.competitionId}>
      {children}
    </CompetitionProvider>
  );
}
