import React, { useRef } from 'react';
import { Button, Header } from 'semantic-ui-react';
import ScrambleFileInfo from './ScrambleFileInfo';
import Loading from '../Requests/Loading';

export default function ScrambleFilesList({
  uploadedJsonFiles,
  isLoading,
  onUpload,
  isUploading,
}) {
  const inputRef = useRef();

  const clickOnInput = () => {
    inputRef.current?.click();
  };

  if (isLoading) {
    return <Loading />;
  }

  return (
    <>
      <Header>
        Uploaded JSON files:
        {' '}
        {uploadedJsonFiles.length}
        {' '}
        <Button.Group>
          <Button
            positive
            icon="plus"
            content="Upload from TNoodle"
            onClick={clickOnInput}
            loading={isUploading}
            disabled={isUploading}
          />
          <Button primary icon="refresh" content="Refresh" />
        </Button.Group>
      </Header>
      <input
        type="file"
        ref={inputRef}
        accept=".json"
        multiple
        style={{ display: 'none' }}
        onChange={onUpload}
      />
      {uploadedJsonFiles.map((s) => (
        <ScrambleFileInfo key={s.id} uploadedJSON={s} />
      ))}
    </>
  );
}
