import { Image as ChakraImage, Link as ChakraLink } from "@chakra-ui/react";

import type { Media } from "@/types/payload";
import type { PolymorphicComponent } from "@/lib/types/components";
import type { ElementType } from "react";

type ImageRawProps = {
  src?: string;
  srcSet?: string;
  alt: string;
};

type ImageVariant = { url: string; width: number };

const isImageVariant = (variant?: {
  url?: string | null;
  width?: number | null;
}): variant is ImageVariant => Boolean(variant?.url && variant?.width);

// Builds a width-descriptor srcSet (e.g. "/card.jpg 768w, /full.jpg 1920w")
// from the generated image sizes plus the main upload, so the browser can pick
// the smallest sufficient variant. Entries without a url or width are skipped.
// Without `sizes` the browser assumes 100vw and always downloads the original,
// so we declare full width up to the smallest variant and cap at the largest.
const buildImageSources = (media: Media) => {
  const generatedVariants = [media.sizes?.thumbnail, media.sizes?.card]
    .filter(isImageVariant)
    .toSorted((a, b) => a.width - b.width);

  const srcSetEntries = [
    ...generatedVariants,
    { url: media.url, width: media.width },
  ]
    .filter(isImageVariant)
    .map(({ url, width }) => `${url} ${width}w`);

  const smallestVariant = generatedVariants.at(0);
  const largestVariant = generatedVariants.at(-1);

  return {
    srcSet: srcSetEntries.length > 0 ? srcSetEntries.join(", ") : undefined,
    sizes:
      smallestVariant &&
      largestVariant &&
      `(max-width: ${smallestVariant.width}px) 100vw, ${largestVariant.width}px`,
  };
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
  const { srcSet, sizes } = buildImageSources(media);

  const pureImage = (
    <RenderImage
      src={media.url ?? srcFallback}
      srcSet={srcSet}
      sizes={sizes}
      alt={media.alt ?? altFallback}
      {...imageProps}
    />
  );

  if (media.customLink) {
    return <RenderLink href={media.customLink}>{pureImage}</RenderLink>;
  }

  return pureImage;
};
