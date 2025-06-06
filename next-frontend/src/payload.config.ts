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
import { fromContainerMetadata } from "@aws-sdk/credential-providers";
import { Home } from "@/globals/Home";

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

async function dbAdapter() {
  if (process.env.NODE_ENV === "production") {
    const credentialProvider = fromContainerMetadata();
    const credentials = await credentialProvider();

    return mongooseAdapter({
      url: process.env.DATABASE_URI || "",
      connectOptions: {
        auth: {
          username: credentials.accessKeyId,
          password: credentials.secretAccessKey,
        },
        authMechanismProperties: {
          AWS_SESSION_TOKEN: credentials.sessionToken,
        },
        authMechanism: "MONGODB-AWS",
        authSource: "$external",
        tls: true,
        tlsCAFile: "/app/global-bundle.pem",
      },
    });
  } else {
    return sqliteAdapter({
      client: {
        url: process.env.DATABASE_URI || "",
      },
    });
  }
}

export default createConfig();

async function createConfig() {
  return buildConfig({
    admin: {
      user: "users",
      importMap: {
        baseDir: path.resolve(dirname),
      },
    },
    collections: [Media],
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
}
