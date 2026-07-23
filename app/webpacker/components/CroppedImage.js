import React, { useMemo, useState } from 'react';
import { Image } from 'semantic-ui-react';
import { convertToPercentCrop } from 'react-image-crop';

function CroppedImage({
  crop,
  ...imgProps
}) {
  const [naturalWidth, setNaturalWidth] = useState();
  const [naturalHeight, setNaturalHeight] = useState();

  const onImageLoad = (evt) => {
    const { naturalWidth: width, naturalHeight: height } = evt.currentTarget;

    setNaturalWidth(width);
    setNaturalHeight(height);
  };

  const relCrop = useMemo(() => {
    if (!crop) return undefined;

    if (!naturalWidth || !naturalHeight) return undefined;

    return convertToPercentCrop(crop, naturalWidth, naturalHeight);
  }, [crop, naturalHeight, naturalWidth]);

  const relWidth = useMemo(() => {
    if (!relCrop) return 'inherit';

    return `${(100 / relCrop.width) * 100}%`;
  }, [relCrop]);

  const relHeight = useMemo(() => {
    if (!relCrop) return 'inherit';

    return `${(100 / relCrop.height) * 100}%`;
  }, [relCrop]);

  const marginTop = useMemo(() => {
    if (!relCrop) return '0px';

    return `-${(100 / relCrop.height) * relCrop.y}%`;
  }, [relCrop]);

  const marginLeft = useMemo(() => {
    if (!relCrop) return '0px';

    return `-${(100 / relCrop.width) * relCrop.x}%`;
  }, [relCrop]);

  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <Image
      {...imgProps}
      style={{
        width: relWidth,
        height: relHeight,
        maxWidth: 'initial',
        objectFit: 'cover',
        marginTop,
        marginLeft,
      }}
      onLoad={onImageLoad}
    />
  );
}

export default CroppedImage;
