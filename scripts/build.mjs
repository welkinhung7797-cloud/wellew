import { cp, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const output = resolve(root, 'dist');
await mkdir(output, { recursive: true });
for (const file of ['index.html', 'style.css', 'app.js', 'content.js', 'assets/logo.svg', 'assets/fonts', 'assets/pug', 'assets/source']) {
  await mkdir(dirname(resolve(output, file)), { recursive: true });
  await cp(resolve(root, file), resolve(output, file), { recursive: true });
}
await writeFile(resolve(output, '_headers'), '/assets/*\n  Cache-Control: public, max-age=86400\n  X-Content-Type-Options: nosniff\n/*\n  Referrer-Policy: strict-origin-when-cross-origin\n  X-Frame-Options: SAMEORIGIN\n');
console.log('Static website ready in dist/. Cloudflare Pages: build command npm run build; output directory dist.');
