// storage-adapter-import-placeholder
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { authjsPlugin } from "payload-authjs";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { authConfig } from "@/auth.config";

import { Media } from "@/collections/Media";
import { Testimonials } from "@/collections/Testimonials";
import { Announcements } from "@/collections/Announcements";
import {
  FaqCategories,
  FaqQuestions,
} from "@/collections/FrequentlyAskedQuestions";
import { Users } from "@/collections/Users";
import { Nav } from "@/globals/Nav";
import { Home } from "@/globals/Home";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

async function dbAdapter() {
  if (process.env.NODE_ENV === "production") {
    const { mongooseAdapter } = await import("@payloadcms/db-mongodb");
    return mongooseAdapter({
      url: process.env.DATABASE_URI || "",
      disableIndexHints: true,
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
  routes: {
    admin: "/payload",
    api: "/api/payload",
  },
  collections: [
    Media,
    Testimonials,
    Announcements,
    FaqCategories,
    FaqQuestions,
    Users,
  ],
  globals: [Nav, Home],
  editor: lexicalEditor(),
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
