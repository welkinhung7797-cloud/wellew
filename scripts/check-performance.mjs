#!/usr/bin/env node
/** Dependency-free, structural performance audit. It does not measure FPS or latency.
 * node scripts/check-performance.mjs --baseline reference/original.html --remote https://wellewkin.pages.dev/
 * node scripts/check-performance.mjs --baseline reference/original.html --enforce
 * node scripts/check-performance.mjs [project-directory]
 */
import { readFile } from 'node:fs/promises';
import { resolve, dirname, extname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const args = process.argv.slice(2);
const baselineIndex = args.indexOf('--baseline');
const baseline = baselineIndex !== -1;
const remoteIndex = args.indexOf('--remote');
const defaultRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const root = baseline ? defaultRoot : resolve(args[0] || defaultRoot);
const htmlPath = baseline ? resolve(args[baselineIndex + 1]) : resolve(root, 'index.html');
const html = await readFile(htmlPath, 'utf8');
const tags = name => [...html.matchAll(new RegExp(`<${name}\\b[^>]*>`, 'gi'))].map(match => match[0]);
const attr = (tag, key) => tag.match(new RegExp(`(?:^|\\s)${key}\\s*=\\s*["']([^"']*)["']`, 'i'))?.[1];
const videos = tags('video');
const images = tags('img');
const sources = tags('source');
const media = [...videos, ...images, ...sources];
const mediaPaths = [...new Set(media.flatMap(tag => [attr(tag, 'src'), attr(tag, 'poster')]).filter(Boolean))];
const videoPaths = [...new Set([...videos, ...sources].map(tag => attr(tag, 'src')).filter(Boolean))];
const scriptPaths = tags('script').map(tag => attr(tag, 'src')).filter(src => src && !/^https?:/.test(src));
const stylePaths = tags('link').filter(tag => attr(tag, 'rel') === 'stylesheet').map(tag => attr(tag, 'href')).filter(src => src && !/^https?:/.test(src));
const codeFiles = new Map();
async function collectCode(path) {
  if (codeFiles.has(path)) return;
  const source = await readFile(path, 'utf8');
  codeFiles.set(path, source);
  if (!/\.(m?js)$/i.test(extname(path))) return;
  // Follow static and literal dynamic imports. Remote/bare imports are not
  // fetched by a local byte-budget check.
  const imports = /(?:\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?|\bimport\s*\(\s*)["']([^"']+)["']/g;
  for (const match of source.matchAll(imports)) {
    const specifier = match[1];
    if (!specifier.startsWith('.') && !specifier.startsWith('/')) continue;
    const imported = specifier.startsWith('/') ? resolve(root, `.${specifier}`) : resolve(dirname(path), specifier);
    await collectCode(imported);
  }
}
for (const path of [...scriptPaths, ...stylePaths]) await collectCode(resolve(root, path.replace(/^\//, '')));
const code = [html, ...codeFiles.values()].join('\n');
const summary = {
  mode: baseline ? 'source-baseline' : 'structural-regression-check',
  htmlBytes: Buffer.byteLength(html),
  codeBytes: Buffer.byteLength(code),
  localCodeFiles: [...codeFiles.keys()].map(path => relative(root, path).replaceAll('\\', '/')),
  videoElements: videos.length,
  videoSrcInInitialHtml: videos.filter(tag => attr(tag, 'src')).length,
  metadataPreloadElements: videos.filter(tag => attr(tag, 'preload') === 'metadata').length,
  autoplayAttributes: videos.filter(tag => /\sautoplay(?:\s|=|>)/i.test(tag)).length,
  uniqueVideoUrls: videoPaths.length,
  images: images.length,
  lazyImages: images.filter(tag => attr(tag, 'loading') === 'lazy').length,
  uniqueMediaUrls: mediaPaths.length,
  requestAnimationFrameCallSites: (code.match(/\brequestAnimationFrame\s*\(/g) || []).length,
  infiniteCssAnimationDeclarations: (code.match(/animation\s*:[^;}]*\binfinite\b/g) || []).length,
};

if (remoteIndex !== -1) {
  const origin = args[remoteIndex + 1];
  const sizes = [];
  for (let i = 0; i < mediaPaths.length; i += 6) {
    sizes.push(...await Promise.all(mediaPaths.slice(i, i + 6).map(async path => {
      let response = await fetch(new URL(path, origin), { method: 'HEAD' });
      let bytes = Number(response.headers.get('content-length')) || null;
      let method = 'HEAD';
      if (bytes === null) {
        // Some CDNs omit HEAD lengths. Read GET headers and immediately cancel
        // the body; a Range request is a hint, since the CDN may return 200.
        response = await fetch(new URL(path, origin), { headers: { Range: 'bytes=0-0' } });
        bytes = Number(response.headers.get('content-range')?.split('/')[1] || response.headers.get('content-length')) || null;
        method = 'GET response headers; body cancelled';
        await response.body?.cancel();
      }
      return { path, status: response.status, bytes, method, video: videoPaths.includes(path) };
    })));
  }
  summary.assets = sizes;
  summary.uniqueMediaBytes = sizes.reduce((total, entry) => total + (entry.bytes || 0), 0);
  summary.uniqueVideoBytes = sizes.filter(entry => entry.video).reduce((total, entry) => total + (entry.bytes || 0), 0);
  summary.missingAssetLengths = sizes.filter(entry => entry.bytes === null).length;
}

if (!baseline || args.includes('--enforce')) {
  // Static policy safeguards; actual browser responsiveness is a separate check.
  const checks = [
    ['No video src attached before a viewer chooses playback', summary.videoSrcInInitialHtml === 0],
    ['No autoplay attributes', summary.autoplayAttributes === 0],
    ['No metadata/auto video preload', videos.every(tag => !['metadata', 'auto'].includes(attr(tag, 'preload')))],
    ['Native CSS horizontal scrolling', /overflow-x\s*:\s*(auto|scroll)/.test(code)],
    ['No infinitely repeating CSS animation', summary.infiniteCssAnimationDeclarations === 0],
    ['Small HTML + local script/style text (under 150 KiB)', summary.codeBytes < 150 * 1024],
  ];
  summary.checks = checks.map(([name, pass]) => ({ name, pass }));
  summary.pass = checks.every(([, pass]) => pass);
  process.exitCode = summary.pass ? 0 : 1;
}
console.log(JSON.stringify(summary, null, 2));
