import React from 'react';
import {Heading} from "@chakra-ui/react";
import ResultsTable from "@/components/persons/resultsTable";

interface ResultsTabProps {
    wcaId: string; 
  }

const ResultsTab: React.FC<ResultsTabProps> = ({ wcaId }) => {
  return (
    <>
      <Heading>Results</Heading>
      <ResultsTable wcaId={wcaId} />
    </>
  );
};

export default ResultsTab;
