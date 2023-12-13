import React, { useEffect, useState } from 'react';
import { Image } from 'semantic-ui-react';
import { convertToPercentCrop } from 'react-image-crop';

function CroppedImage({
  crop,
  ...imgProps
}) {
  const [naturalWidth, setNaturalWidth] = useState();
  const [naturalHeight, setNaturalHeight] = useState();

  const [relCrop, setRelCrop] = useState();

  const onImageLoad = (evt) => {
    const { naturalWidth: width, naturalHeight: height } = evt.currentTarget;

    setNaturalWidth(width);
    setNaturalHeight(height);
  };

  useEffect(() => {
    if (!crop) return;

    if (!naturalWidth || !naturalHeight) return;

    const calculatedRelCrop = convertToPercentCrop(crop, naturalWidth, naturalHeight);
    setRelCrop(calculatedRelCrop);
  }, [crop, naturalWidth, naturalHeight]);

  const getRelWidth = () => {
    if (!relCrop) return 'inherit';

    return `${(100 / relCrop.width) * 100}%`;
  };

  const getRelHeight = () => {
    if (!relCrop) return 'inherit';

    return `${(100 / relCrop.height) * 100}%`;
  };

  const getMarginTop = () => {
    if (!relCrop) return '0px';

    return `-${(100 / relCrop.height) * relCrop.y}%`;
  };

  const getMarginLeft = () => {
    if (!relCrop) return '0px';

    return `-${(100 / relCrop.width) * relCrop.x}%`;
  };

  /* eslint-disable react/jsx-props-no-spreading */
  return (
    <Image
      {...imgProps}
      style={{
        width: getRelWidth(),
        height: getRelHeight(),
        maxWidth: 'initial',
        objectFit: 'cover',
        marginTop: getMarginTop(),
        marginLeft: getMarginLeft(),
      }}
      onLoad={onImageLoad}
    />
  );
}

export default CroppedImage;
