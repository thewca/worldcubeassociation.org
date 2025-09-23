import { Image as ChakraImage, Link as ChakraLink } from "@chakra-ui/react";

import type { Media } from "@/types/payload";
import type {
  ComponentPropsWithoutRef,
  ElementType,
  ReactElement,
} from "react";

type ImageRawProps = {
  src?: string;
  alt: string;
}

type LinkRawProps = {
  href: string;
}

type MediaImageOwnProps = {
  media: Media;
  altFallback?: string | null;
  srcFallback?: string;
  linkComponent?: ElementType<LinkRawProps>;
};

type ImageElementType = ElementType<ImageRawProps>

type PolymorphicMediaImageProps<T extends ImageElementType> =
  MediaImageOwnProps & {
  as?: T;
} & Omit<ComponentPropsWithoutRef<T>, keyof MediaImageOwnProps | "as">;

type MediaImageComponent = <T extends ImageElementType = typeof ChakraImage>(
  props: PolymorphicMediaImageProps<T>,
) => ReactElement | null;

export const MediaImage: MediaImageComponent = ({
  media,
  as: RenderAs = ChakraImage,
  linkComponent: RenderLink = ChakraLink,
  altFallback,
  srcFallback,
  ...imageProps
}) => {
  const pureImage = (
    <RenderAs
      src={media.url ?? srcFallback}
      alt={media.alt ?? altFallback}
      {...imageProps}
    />
  );

  if (media.customLink) {
    return <RenderLink href={media.customLink}>{pureImage}</RenderLink>;
  }

  return pureImage;
}
