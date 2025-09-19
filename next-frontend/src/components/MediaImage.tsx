import { Media } from "@/types/payload";
import { Image as ChakraImage, ImageProps, Link } from "@chakra-ui/react";
import React from "react";

export function MediaImage({
  media,
  altFallback,
  srcFallback,
  imageProps,
}: {
  media: Media;
  altFallback?: string | null;
  srcFallback?: string;
  imageProps: ImageProps;
}) {
  const Image = (
    <ChakraImage
      src={media.url ?? srcFallback ?? undefined}
      alt={media.alt ?? altFallback ?? undefined}
      {...imageProps}
    />
  );

  if (media.customLink) {
    return <Link href={media.customLink}>{Image}</Link>;
  }
  return Image;
}
