import React, { useEffect, useRef } from 'react';

function InvisibleIFrame({
  onResizeAction,
}) {
  const iframeRef = useRef();

  useEffect(() => {
    const iframeNode = iframeRef.current;

    iframeNode.contentWindow.addEventListener('resize', onResizeAction);

    return () => {
      iframeNode.contentWindow.removeEventListener('resize', onResizeAction);
    };
  }, [iframeRef, onResizeAction]);

  return (
    <iframe
      title="invisibleIFrame"
      src="about:blank"
      className="invisible-iframe-map"
      ref={iframeRef}
    />
  );
}

export default InvisibleIFrame;
