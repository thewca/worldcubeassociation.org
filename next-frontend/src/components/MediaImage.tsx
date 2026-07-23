import { Image as ChakraImage, Link as ChakraLink } from "@chakra-ui/react";

import type { Media } from "@/types/payload";
import type { PolymorphicComponent } from "@/lib/types/components";
import type { ElementType } from "react";

type ImageRawProps = {
  src?: string;
  srcSet?: string;
  alt: string;
};

// Builds a width-descriptor srcSet (e.g. "/card.jpg 768w, /full.jpg 1920w")
// from the generated image sizes plus the main upload, so the browser can pick
// the smallest sufficient variant. Entries without a url or width are skipped.
const buildSrcSet = (media: Media): string | undefined => {
  const candidates = [
    media.sizes?.thumbnail,
    media.sizes?.card,
    { url: media.url, width: media.width },
  ];

  const entries = candidates
    .filter((c): c is { url: string; width: number } =>
      Boolean(c?.url && c?.width),
    )
    .map(({ url, width }) => `${url} ${width}w`);

  return entries.length > 0 ? entries.join(", ") : undefined;
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
      srcSet={buildSrcSet(media)}
      alt={media.alt ?? altFallback}
      {...imageProps}
    />
  );

  if (media.customLink) {
    return <RenderLink href={media.customLink}>{pureImage}</RenderLink>;
  }

  return pureImage;
};
