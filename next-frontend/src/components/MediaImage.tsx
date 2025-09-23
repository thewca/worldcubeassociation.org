import { Image as ChakraImage, Link as ChakraLink } from "@chakra-ui/react";

import type { Media } from "@/types/payload";
import type { PolymorphicComponent } from "@/lib/types/components";
import type { ElementType } from "react";

type ImageRawProps = {
  src?: string;
  alt: string;
};

type LinkRawProps = {
  href: string;
};

type MediaImageOwnProps = {
  media: Media;
  altFallback?: string | null;
  srcFallback?: string;
  linkComponent?: ElementType<LinkRawProps>;
};

export const MediaImage: PolymorphicComponent<
  MediaImageOwnProps,
  typeof ChakraImage,
  ImageRawProps
> = ({
  media,
  as: RenderImage = ChakraImage,
  linkComponent: RenderLink = ChakraLink,
  altFallback,
  srcFallback,
  ...imageProps
}) => {
  const pureImage = (
    <RenderImage
      src={media.url ?? srcFallback}
      alt={media.alt ?? altFallback}
      {...imageProps}
    />
  );

  if (media.customLink) {
    return <RenderLink href={media.customLink}>{pureImage}</RenderLink>;
  }

  return pureImage;
};
