/**
 * seed-blob.mjs — uploads local data-store JSON files to Vercel Blob
 *
 * Run once after creating the Blob Store to seed production data:
 *   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... node seed-blob.mjs
 *
 * The token is available in: Vercel dashboard → Storage → your Blob Store → .env.local tab
 */

import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { put } from "@vercel/blob";

const TOKEN = process.env.BLOB_READ_WRITE_TOKEN;
if (!TOKEN) {
  console.error("Error: BLOB_READ_WRITE_TOKEN env var is required.");
  console.error("  BLOB_READ_WRITE_TOKEN=vercel_blob_rw_... node seed-blob.mjs");
  process.exit(1);
}

const DATA_STORE = join(process.cwd(), "data-store");

const FILES = [
  "accessories",
  "bespoke-orders",
  "collections",
  "consultations",
  "content",
  "fabric-book",
  "fabrics",
  "orders",
  "products",
  "site-settings",
  "theme",
  "options/shirt",
  "options/sport-coat",
  "options/suit-2pc",
  "options/suit-3pc",
  "options/trousers",
  "options/vest",
];

async function uploadFile(filename) {
  const localPath = join(DATA_STORE, `${filename}.json`);
  if (!existsSync(localPath)) {
    console.warn(`  SKIP  data/${filename}.json — file not found locally`);
    return;
  }

  const body = readFileSync(localPath, "utf8");
  // Must match how the app writes these (src/lib/admin-data.ts saveDataAsync)
  // and the store's configured access: PRIVATE, no random suffix.
  // (Reads authenticate with the token — see loadDataAsync.)
  await put(`data/${filename}.json`, body, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    token: TOKEN,
    contentType: "application/json",
  });
  console.log(`  OK    data/${filename}.json`);
}

console.log(`Seeding ${FILES.length} files to Vercel Blob...\n`);
for (const f of FILES) {
  await uploadFile(f);
}
console.log("\nDone. Production data-store is seeded.");
