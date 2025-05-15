import React from 'react';
import { Header } from 'semantic-ui-react';
import ScrambleFileInfo from './ScrambleFileInfo';

export default function JSONList({ uploadedJsonFiles }) {
  return (
    <>
      <Header>
        Uploaded JSON files:
        {' '}
        {uploadedJsonFiles.length}
      </Header>
      {uploadedJsonFiles.map((s) => (
        <ScrambleFileInfo key={s.id} uploadedJSON={s} />
      ))}
    </>
  );
}
