#!/usr/bin/env node
const required = [
  'NEXT_PUBLIC_SITE_URL',
  'BLOB_READ_WRITE_TOKEN',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'ADMIN_PASSWORD',
  'ADMIN_TOKEN_SECRET'
];

const present = {};
for (const name of required) {
  present[name] = !!process.env[name];
}

console.log('\nEnvironment verification for blessed-dressed (production)\n');
for (const name of required) {
  console.log(`${present[name] ? '✅' : '❌'} ${name}`);
}

const missing = required.filter(n => !present[n]);
if (missing.length === 0) {
  console.log('\nAll required env vars are present.');
  process.exit(0);
}

console.log('\nMissing environment variables detected:');
for (const name of missing) {
  console.log(` - ${name}`);
}

console.log('\nSuggested next steps:');
console.log(' 1) Open the Vercel dashboard for the project `blessed-dressed` and add the missing variables under Settings → Environment Variables.');
console.log(' 2) Or use the Vercel CLI to add them interactively (requires VERCEL_TOKEN or interactive login):');
console.log('\n   npx vercel env add <NAME> production');
console.log('\nExamples:');
for (const name of missing) {
  console.log(`   npx vercel env add ${name} production`);
}

console.log('\nIf you prefer to set them locally for testing, create/update `.env.production.local` in the `blessed-dressed/` folder with the values. Example:');
console.log('\n  NEXT_PUBLIC_SITE_URL=https://your-domain.example');
console.log('  BLOB_READ_WRITE_TOKEN=vercel_blob_rw_...');
console.log('  STRIPE_SECRET_KEY=sk_test_...');

console.log('\nRun `npm run check-env` from inside the blessed-dressed folder to re-check.');
process.exit(1);
