import type { CollectionConfig } from "payload";

// Stores the pristine, uncropped bytes of every image uploaded to `media`, so
// that a destructive crop in the Media editor can always be reverted. These
// docs are created/managed automatically by the `media` collection hooks and
// are not meant to be edited directly, hence the collection is hidden from the
// admin nav. Read is public so the revert endpoint can fetch the original via
// its URL in both local (disk) and production (S3) environments.
export const MediaOriginals: CollectionConfig = {
  slug: "media-originals",
  access: {
    read: () => true,
  },
  admin: {
    hidden: true,
  },
  upload: {
    // Deliberately no crop/focalPoint/resizeOptions/imageSizes: this collection
    // keeps the upload exactly as it was received so it can serve as the
    // source of truth for reverting.
    crop: false,
    focalPoint: false,
  },
  fields: [],
};
