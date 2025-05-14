import React from 'react';
import { Header } from 'semantic-ui-react';
import ScrambleFileInfo from './ScrambleFileInfo';

export default function JSONList({ uploadedJSON }) {
  return (
    <>
      <Header>
        Uploaded JSON files:
        {' '}
        {uploadedJSON.length}
      </Header>
      {uploadedJSON.map((s) => (
        <ScrambleFileInfo uploadedJSON={s} key={s.competitionName} />
      ))}
    </>
  );
}
