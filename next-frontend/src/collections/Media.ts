import type {
  CollectionConfig,
  CollectionBeforeOperationHook,
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  PayloadHandler,
} from "payload";
import fs from "fs/promises";

// Key on `req.context` used to hand the pristine upload buffer from the
// `beforeOperation` hook (the only point the raw bytes exist) to `afterChange`
// (the only point the final filename/doc id exist).
const PENDING_ORIGINAL = "mediaPendingOriginal";
// Set on `req.context` when we re-upload during a revert, so the capture hooks
// don't treat the revert as a brand new upload and snapshot it again.
const SKIP_CAPTURE = "mediaSkipOriginalCapture";

type PendingOriginal = {
  data: Buffer;
  mimetype: string;
  name: string;
  size: number;
};

// Resolve a relationship value that may be an id or a populated doc.
const relId = (value: unknown): string | null => {
  if (!value) return null;
  if (typeof value === "object" && "id" in value) {
    return String((value as { id: string | number }).id);
  }
  return String(value);
};

// Capture the raw uploaded bytes before Payload's upload pipeline runs. This is
// the only moment the *uncropped* original exists in the request: by the time
// `beforeChange`/`afterChange` run, a crop applied on this upload has already
// overwritten `req.file`.
const stashOriginalUpload: CollectionBeforeOperationHook = async ({
  args,
  operation,
  req,
}) => {
  if (req.context[SKIP_CAPTURE]) return args;
  if (operation !== "create" && operation !== "update") return args;

  const file = req.file;
  if (!file) return args;

  let data = file.data;
  if ((!data || data.length === 0) && file.tempFilePath) {
    data = await fs.readFile(file.tempFilePath);
  }
  if (!data || data.length === 0) return args;

  req.context[PENDING_ORIGINAL] = {
    data,
    mimetype: file.mimetype,
    name: file.name,
    size: data.length,
  } satisfies PendingOriginal;

  return args;
};

// Persist the captured original as a `media-originals` doc and link it. Runs
// after the main doc is saved so the filename/id are final.
const persistOriginal: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  req,
}) => {
  // Pull and clear the flag up front so the nested `update` below (same
  // req.context) doesn't recurse back into this hook.
  const pending = req.context[PENDING_ORIGINAL] as PendingOriginal | undefined;
  if (!pending) return doc;
  delete req.context[PENDING_ORIGINAL];

  const created = await req.payload.create({
    collection: "media-originals",
    data: {},
    file: pending,
    req,
    overrideAccess: true,
  });

  // A new upload replaced the file — drop the now-orphaned previous original.
  const previousOriginalId = relId(previousDoc?.original);
  if (previousOriginalId) {
    await req.payload
      .delete({
        collection: "media-originals",
        id: previousOriginalId,
        req,
        overrideAccess: true,
      })
      .catch(() => {
        /* already gone — ignore */
      });
  }

  await req.payload.update({
    collection: "media",
    id: doc.id,
    data: { original: created.id },
    req,
    overrideAccess: true,
  });

  return { ...doc, original: created.id };
};

// Clean up the stored original when the media doc itself is deleted.
const deleteOriginal: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const originalId = relId(doc?.original);
  if (!originalId) return doc;
  await req.payload
    .delete({
      collection: "media-originals",
      id: originalId,
      req,
      overrideAccess: true,
    })
    .catch(() => {
      /* already gone — ignore */
    });
  return doc;
};

// POST /api/payload/media/:id/revert-original
// Re-uploads the stored pristine original over the (cropped) media file and
// clears the focal point, restoring the uncropped image.
const revertOriginalHandler: PayloadHandler = async (req) => {
  if (!req.user) {
    return Response.json({ message: "Forbidden" }, { status: 403 });
  }

  const id = req.routeParams?.id as string | undefined;
  if (!id) {
    return Response.json({ message: "Missing media id" }, { status: 400 });
  }

  const media = await req.payload.findByID({
    collection: "media",
    id,
    depth: 1,
    req,
    overrideAccess: false,
    user: req.user,
  });

  const original =
    media.original && typeof media.original === "object"
      ? media.original
      : null;

  if (!original?.url || !original.filename) {
    return Response.json(
      { message: "No stored original is available for this image." },
      { status: 400 },
    );
  }

  // `original.url` is absolute on S3 (CDN) and relative on local disk; resolve
  // against this request's origin so the fetch works in both environments.
  const origin = req.url
    ? new URL(req.url).origin
    : `${req.headers.get("x-forwarded-proto") ?? "http"}://${req.headers.get("host") ?? ""}`;
  const absoluteUrl = original.url.startsWith("http")
    ? original.url
    : new URL(original.url, origin).toString();

  const fileRes = await fetch(absoluteUrl);
  if (!fileRes.ok) {
    return Response.json(
      { message: "Could not load the stored original." },
      { status: 502 },
    );
  }
  const buffer = Buffer.from(await fileRes.arrayBuffer());

  await req.payload.update({
    collection: "media",
    id,
    data: { focalX: null, focalY: null },
    file: {
      data: buffer,
      mimetype: original.mimeType ?? "application/octet-stream",
      name: original.filename,
      size: buffer.length,
    },
    req,
    context: { [SKIP_CAPTURE]: true },
    overrideAccess: true,
  });

  return Response.json({ success: true });
};

export const Media: CollectionConfig = {
  admin: {
    useAsTitle: "alt",
  },
  slug: "media",
  access: {
    read: () => true,
  },
  hooks: {
    beforeOperation: [stashOriginalUpload],
    afterChange: [persistOriginal],
    afterDelete: [deleteOriginal],
  },
  endpoints: [
    {
      path: "/:id/revert-original",
      method: "post",
      handler: revertOriginalHandler,
    },
  ],
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
    {
      // Pristine, uncropped copy of the upload. Managed automatically by the
      // hooks above; hidden because editors interact with it via the revert
      // button, not directly.
      name: "original",
      type: "upload",
      relationTo: "media-originals",
      admin: { hidden: true },
    },
    {
      // Renders the "Revert to original image" button in the edit view.
      name: "revertOriginal",
      type: "ui",
      admin: {
        components: {
          Field: "@/components/payload/RevertCropButton#RevertCropButton",
        },
      },
    },
  ],
  upload: {
    // Cropping is destructive: saving a crop re-processes and overwrites the
    // stored upload file with the cropped result. To make it reversible we keep
    // the pristine original in the `media-originals` collection (see hooks
    // above) and expose a revert button. The stored crop only drives the admin
    // UI overlay.
    crop: true,
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
