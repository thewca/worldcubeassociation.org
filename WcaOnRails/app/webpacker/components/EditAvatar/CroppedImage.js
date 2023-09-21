import React, { useState } from 'react';
import { Image } from 'semantic-ui-react';

function CroppedImage({
  imgSrc,
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

  const makeClippingPolygon = () => {
    if (!crop) return null;

    const coords = [
      [crop.x, crop.y],
      [crop.x + crop.width, crop.y],
      [crop.x + crop.width, crop.y + crop.height],
      [crop.x, crop.y + crop.height],
    ];

    const cssCoords = coords.map((point) => point.map((coord) => `${Math.round(coord)}${crop.unit}`).join(' ')).join(', ');
    return `polygon(${cssCoords})`;
  };

  return (
    <Image
      {...imgProps}
      src={imgSrc}
      style={{ width: '20%', height: 'auto', clipPath: makeClippingPolygon() }}
      onLoad={onImageLoad}
    />
  );
}

export default CroppedImage;
