import React, { useCallback, useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';

export default function ResizeMapIFrame() {
  const map = useMap();
  const iframeRef = useRef();

  const onResizeAction = useCallback(() => map.invalidateSize(false), [map]);

  useEffect(() => {
    const iframeNode = iframeRef.current;

    iframeNode.contentWindow.addEventListener('resize', onResizeAction);

    return () => {
      iframeNode.contentWindow?.removeEventListener('resize', onResizeAction);
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
