import type { CollectionConfig } from "payload";

export const Media: CollectionConfig = {
  admin: {
    useAsTitle: "alt",
  },
  slug: "media",
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "alt",
      type: "text",
      required: true,
    },
    {
      name: "customLink",
      label: "Custom Link",
      type: "text",
    },
  ],
  upload: {
    // Cropping is destructive so we are disabling it for now
    crop: false,
    // Enables the focal-point picker. The focal point is applied when
    // generating any imageSizes that define both width and height.
    focalPoint: true,
    // Resize on upload so enormous originals never get published. `fit:
    // "inside"` preserves aspect ratio and `withoutEnlargement` never upscales.
    resizeOptions: {
      width: 1920,
      height: 1920,
      fit: "inside",
      withoutEnlargement: true,
    },
    // Cropped, sized variants. These give the focal point a visible effect and
    // are available via `media.sizes.*` when needed.
    imageSizes: [
      {
        name: "thumbnail",
        width: 400,
        height: 300,
      },
      {
        name: "card",
        width: 768,
        height: 512,
      },
    ],
  },
};
