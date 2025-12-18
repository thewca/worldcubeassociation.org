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
import { DocumentsPage } from "@/globals/Documents";
import { FaqPage } from "@/globals/FaqPage";
import { LogoPage } from "@/globals/LogoPage";
import {
  compatibilityOptions,
  mongooseAdapter,
  Args,
} from "@payloadcms/db-mongodb";
import { fromContainerMetadata } from "@aws-sdk/credential-providers";
import { sqliteAdapter } from "@payloadcms/db-sqlite";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

function plugins() {
  const isProduction = process.env.NODE_ENV === "production";

  return [
    authjsPlugin({
      authjsConfig: payloadAuthConfig,
    }),
    s3Storage({
      enabled: isProduction,
      collections: {
        media: {
          prefix: "media",
          generateFileURL: ({ prefix, filename }) => {
            return `${process.env.MEDIA_BUCKET_CDN!}/${prefix}/${filename}`;
          },
        },
      },
      bucket: process.env.MEDIA_BUCKET!,
      config: {
        region: process.env.AWS_REGION,
        credentials: isProduction ? fromContainerMetadata() : undefined,
      },
    }),
  ];
}

function dbOptions(): Args {
  if (process.env.NODE_ENV === "production") {
    return {
      url: process.env.DATABASE_URI || "",
      connectOptions: {
        authMechanism: "MONGODB-AWS",
        authSource: "$external",
        tls: true,
        tlsCAFile: "/app/global-bundle.pem",
      },
      ...compatibilityOptions.documentdb,
    };
  } else {
    return {
      url: process.env.DATABASE_URI || "",
      connectOptions: {
        authMechanism: "SCRAM-SHA-256",
        authSource: "admin",
        user: process.env.DATABASE_USER || "",
        pass: process.env.DATABASE_PASSWORD || "",
      },
    };
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
    DocumentsPage,
    FaqPage,
    LogoPage,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || "",
  typescript: {
    outputFile: path.resolve(dirname, "types/payload.ts"),
  },
  db: process.env.DATABASE_URI
    ? mongooseAdapter(dbOptions())
    : sqliteAdapter({ client: { url: "file:./payload.db" } }),
  sharp,
  plugins: plugins(),
});
