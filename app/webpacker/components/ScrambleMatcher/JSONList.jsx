import React from 'react';
import { Header } from 'semantic-ui-react';
import ScrambleFileInfo from './ScrambleFileInfo';

export default function JSONList({ uploadedScrambles }) {
  return (
    <>
      <Header>
        Uploaded JSON files:
        {' '}
        {uploadedScrambles.length}
      </Header>
      {uploadedScrambles.map((s) => (
        <ScrambleFileInfo uploadedJSON={s} key={s.competitionName} />
      ))}
    </>
  );
}
