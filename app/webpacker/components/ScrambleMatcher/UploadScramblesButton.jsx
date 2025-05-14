import React, { useRef } from 'react';
import { Button } from 'semantic-ui-react';

export default function UploadScramblesButton({ onUpload }) {
  const inputRef = useRef(null);

  const handleClick = () => {
    inputRef.current?.click();
  };

  const handleChange = (event) => {
    onUpload(event);
  };

  return (
    <>
      <input
        type="file"
        ref={inputRef}
        accept=".json"
        multiple
        style={{ display: 'none' }}
        onChange={handleChange}
      />
      <Button
        fluid
        primary
        onClick={handleClick}
        style={{ marginTop: '1rem' }}
      >
        Upload scrambles json from TNoodle
      </Button>
    </>
  );
}
