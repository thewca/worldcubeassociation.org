// Sanitizes a mongodump `users.bson` file in place before it is published to S3.
//
// Better Auth stores sessions, accounts and verification tokens in their own collections,
// which export-dump.sh deletes from the dump outright. What is left in `users` is:
//   - `email`    — the user's real email address (PII)
//   - `accounts` / `sessions` — embedded auth state on rows written by the old
//                  payload-authjs setup, which survive until their owner next signs in
//
// This script replaces every email with `<user_id>@worldcubeassociation.org` and strips
// those legacy embedded fields, so the public dump consumed by next-frontend/import-dump.sh
// contains no real emails or secrets.
//
// Usage: node sanitize-dump.mjs path/to/users.bson

import { readFileSync, writeFileSync } from "node:fs";
import { BSON } from "bson";

const usersPath = process.argv[2];
if (!usersPath) {
  console.error("Usage: node sanitize-dump.mjs <path-to-users.bson>");
  process.exit(1);
}

// Legacy payload-authjs fields that hold credentials and must never leave the production VPC.
const SECRET_FIELDS = ["accounts", "sessions", "verificationTokens"];

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
