// storage-adapter-import-placeholder
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { authjsPlugin } from "payload-authjs";
import { authConfig } from "@/auth.config";

import { Media } from "@/collections/Media";
import { Testimonials } from "@/collections/Testimonials";
import { Announcements } from "@/collections/Announcements";
import { Nav } from "@/globals/Nav";
import { Home } from "@/globals/Home";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

// async function getPayloadSecret() {
//   if (process.env.IS_COMPILING_ASSETS) {
//     return "";
//   }
//
//   const { getSecret } = await import("@/vault");
//   return getSecret("PAYLOAD_SECRET");
// }

async function dbAdapter() {
  if (process.env.NODE_ENV === "production") {
    const { mongooseAdapter } = await import("@payloadcms/db-mongodb");
    return mongooseAdapter({
      url: process.env.DATABASE_URI || "",
      connectOptions: {
        authMechanism: "MONGODB-AWS",
        authSource: "$external",
        tls: true,
        tlsCAFile: "/app/global-bundle.pem",
      },
    });
  } else {
    const { sqliteAdapter } = await import("@payloadcms/db-sqlite");
    return sqliteAdapter({
      client: {
        url: process.env.DATABASE_URI || "",
      },
    });
  }
}

export default buildConfig({
  admin: {
    user: "users",
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Media, Testimonials, Announcements],
  globals: [Nav, Home],
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "payload-types.ts"),
  },
  db: await dbAdapter(),
  sharp,
  plugins: [
    authjsPlugin({
      authjsConfig: authConfig,
    }),
  ],
});
