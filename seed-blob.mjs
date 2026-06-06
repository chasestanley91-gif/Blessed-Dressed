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
  "image-overrides",
  "products",
  "site-settings",
  "theme",
  "options/shirt",
  "options/sport-coat",
  "options/suit-2pc",
  "options/suit-3pc",
];

async function uploadFile(filename) {
  const localPath = join(DATA_STORE, `${filename}.json`);
  if (!existsSync(localPath)) {
    console.warn(`  SKIP  data/${filename}.json — file not found locally`);
    return;
  }

  const body = readFileSync(localPath, "utf8");
  await put(`data/${filename}.json`, body, {
    access: "private",
    addRandomSuffix: false,
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
