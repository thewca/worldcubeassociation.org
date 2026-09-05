// Sanitizes a mongodump `users.bson` file in place before it is published to S3.
//
// The Payload `users` collection is augmented by payload-authjs, which embeds
// auth state directly in each user document:
//   - `email`                — the user's real email address (PII)
//   - `accounts`             — OAuth accounts incl. access_token/refresh_token/id_token
//   - `sessions`             — active session tokens
//   - `verificationTokens`   — email verification tokens
//
// This script replaces every email with `<user_id>@worldcubeassociation.org`
// and strips the embedded credential fields, so the public dump consumed by
// next-frontend/import-dump.sh contains no real emails or secrets.
//
// Usage: node sanitize-dump.mjs path/to/users.bson

import { readFileSync, writeFileSync } from "node:fs";
import { BSON } from "bson";

const usersPath = process.argv[2];
if (!usersPath) {
  console.error("Usage: node sanitize-dump.mjs <path-to-users.bson>");
  process.exit(1);
}

// Fields that hold credentials/PII and must never leave the production VPC.
const SECRET_FIELDS = [
  "accounts",
  // These are currently not saved in payload, but still listing them if they ever are
  "sessions",
  "verificationTokens",
  // Local-strategy fields, in case auth is ever switched on:
  "hash",
  "salt",
  "resetPasswordToken",
  "resetPasswordExpiration",
];

const buf = readFileSync(usersPath);

// A .bson file is a flat concatenation of BSON documents. Each document begins
// with its own little-endian int32 byte length (which includes those 4 bytes).
const out = [];
let offset = 0;
let count = 0;
while (offset < buf.length) {
  const size = buf.readInt32LE(offset);
  const doc = BSON.deserialize(buf.subarray(offset, offset + size));
  offset += size;

  doc.email = `${doc._id.toString()}@worldcubeassociation.org`;
  for (const field of SECRET_FIELDS) {
    delete doc[field];
  }

  out.push(BSON.serialize(doc));
  count += 1;
}

writeFileSync(usersPath, Buffer.concat(out));
console.log(`Sanitized ${count} user document(s) in ${usersPath}`);
