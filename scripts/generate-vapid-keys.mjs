/**
 * Generates a VAPID key pair for Web Push notifications.
 * Run once: node scripts/generate-vapid-keys.mjs
 *
 * Then:
 *  1. Add VITE_VAPID_PUBLIC_KEY=<public> to your .env (and GitHub Pages env secret)
 *  2. Set VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY as Supabase Edge Function secrets:
 *       supabase secrets set VAPID_PUBLIC_KEY=<public> VAPID_PRIVATE_KEY=<private>
 */

import { webcrypto } from 'crypto';

const { publicKey, privateKey } = await webcrypto.subtle.generateKey(
  { name: 'ECDH', namedCurve: 'P-256' },
  true,
  ['deriveKey'],
);

const rawPub = await webcrypto.subtle.exportKey('raw', publicKey);
const pkcs8Priv = await webcrypto.subtle.exportKey('pkcs8', privateKey);

function b64url(buf) {
  return Buffer.from(buf).toString('base64url');
}

// Web Push expects the raw private key scalar (last 32 bytes of PKCS#8)
const privBytes = new Uint8Array(pkcs8Priv).slice(-32);

console.log('\n=== VAPID Keys (save these securely) ===\n');
console.log(`VITE_VAPID_PUBLIC_KEY=${b64url(rawPub)}`);
console.log(`VAPID_PUBLIC_KEY=${b64url(rawPub)}`);
console.log(`VAPID_PRIVATE_KEY=${b64url(privBytes)}`);
console.log('\n1. Add VITE_VAPID_PUBLIC_KEY to .env and GitHub Pages secrets');
console.log('2. Run: supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=...');
console.log('3. Set SITE_URL secret: supabase secrets set SITE_URL=https://rastarooster808.github.io/LOCAL-GRINDZ-APP-\n');
