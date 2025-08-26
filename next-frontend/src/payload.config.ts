// storage-adapter-import-placeholder
import path from "path";
import { buildConfig } from "payload";
import { fileURLToPath } from "url";
import sharp from "sharp";
import { authjsPlugin } from "payload-authjs";
import { lexicalEditor } from "@payloadcms/richtext-lexical";
import { payloadAuthConfig } from "@/auth.config";
import { s3Storage } from "@payloadcms/storage-s3";
import { Media } from "@/collections/Media";
import { Testimonials } from "@/collections/Testimonials";
import { Announcements } from "@/collections/Announcements";
import {
  FaqCategories,
  FaqQuestions,
} from "@/collections/FrequentlyAskedQuestions";
import { Users } from "@/collections/Users";
import { Tools } from "@/collections/Tools";
import { RegulationsHistoryItem } from "@/collections/RegulationsHistory";
import { Documents } from "@/collections/Documents";
import { Nav } from "@/globals/Nav";
import { Home } from "@/globals/Home";
import { AboutRegulations } from "@/globals/AboutRegulations";
import { SpeedCubingHistoryPage } from "@/globals/SpeedcubingHistory";
import { Privacy } from "@/globals/Privacy";
import { Disclaimer } from "@/globals/Disclaimer";
import { AboutUsPage } from "@/globals/About";
import { languageConfig, fallbackLng } from "@/lib/i18n/settings";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

async function plugins() {
  const defaultPlugins = [
    authjsPlugin({
      authjsConfig: payloadAuthConfig,
    }),
  ];
  if (process.env.NODE_ENV === "production") {
    const { fromContainerMetadata } = await import(
      "@aws-sdk/credential-providers"
    );
    const credentials = fromContainerMetadata();
    return [
      ...defaultPlugins,
      s3Storage({
        collections: {
          media: true,
        },
        bucket: process.env.MEDIA_BUCKET!,
        config: {
          region: process.env.AWS_REGION,
          credentials,
        },
      }),
    ];
  }
  return defaultPlugins;
}

async function dbAdapter() {
  if (process.env.NODE_ENV === "production") {
    const { mongooseAdapter, compatibilityOptions } = await import(
      "@payloadcms/db-mongodb"
    );
    return mongooseAdapter({
      url: process.env.DATABASE_URI || "",
      connectOptions: {
        authMechanism: "MONGODB-AWS",
        authSource: "$external",
        tls: true,
        tlsCAFile: "/app/global-bundle.pem",
      },
      ...compatibilityOptions.documentdb,
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
  localization: {
    locales: Object.entries(languageConfig).map(([code, { name: label }]) => ({
      code,
      label,
    })),
    defaultLocale: fallbackLng,
  },
  collections: [
    Media,
    Testimonials,
    Announcements,
    FaqCategories,
    FaqQuestions,
    Users,
    Documents,
    RegulationsHistoryItem,
    Tools,
  ],
  globals: [
    Nav,
    Home,
    AboutUsPage,
    Privacy,
    Disclaimer,
    SpeedCubingHistoryPage,
    AboutRegulations,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "types/payload.ts"),
  },
  db: await dbAdapter(),
  sharp,
  plugins: await plugins(),
});
