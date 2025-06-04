// storage-adapter-import-placeholder
import { sqliteAdapter } from "@payloadcms/db-sqlite";
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { authjsPlugin } from "payload-authjs";
import { authConfig } from "@/auth.config";

import { Media } from "./collections/Media";
import { Nav } from "@/globals/Nav";
import { mongooseAdapter } from "@payloadcms/db-mongodb";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default function config() {
  let dbAdapter;
  if (process.env.NODE_ENV !== "production") {
    dbAdapter = sqliteAdapter({
      client: {
        url: process.env.DATABASE_URI || "",
      },
    });
  } else {
    dbAdapter = mongooseAdapter({
      url: process.env.DATABASE_URI || "",
    });
  }

  return buildConfig({
    admin: {
      user: "users",
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [Media],
    globals: [Nav],
    secret: process.env.PAYLOAD_SECRET || "",
    typescript: {
      outputFile: path.resolve(dirname, "payload-types.ts"),
    },
    db: dbAdapter,
    sharp,
    plugins: [
      authjsPlugin({
        authjsConfig: authConfig,
      }),
    ],
  });
}
