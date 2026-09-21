#!/usr/bin/env node
/** Checks real content references, asset formats and deployable output without dependencies.
 * npm run check
 * node scripts/check-site.mjs --allow-pending-poses  (art creation only)
 * A normal final check always requires all 12 canonical SVG mascot poses.
 */
import { readFile, readdir, lstat } from 'node:fs/promises';
import { resolve, dirname, relative, extname, basename } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { spawnSync } from 'node:child_process';

const args = process.argv.slice(2);
const root = resolve(args.find(arg => !arg.startsWith('--')) || resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const allowPending = args.includes('--allow-pending-poses');
const errors = [];
const pending = [];
const results = [];
const fail = message => errors.push(message);
const assert = (condition, message) => { if (!condition) fail(message); };
const slash = path => path.replaceAll('\\', '/');
const external = value => !value || value.startsWith('#') || value.startsWith('//') || /^[a-z][a-z\d+.-]*:/i.test(value);
const attributes = tag => Object.fromEntries([...tag.matchAll(/\s([\w:-]+)\s*=\s*["']([^"']*)["']/g)].map(match => [match[1], match[2]]));
const moduleImports = source => [...source.matchAll(/(?:\b(?:import|export)\s+(?:[^'";]*?\s+from\s*)?|\bimport\s*\(\s*)["']([^"']+)["']/g)].map(match => match[1]);
const expectedTopLevel = new Set(['index.html', 'style.css', 'app.js', 'content.js', '_headers', 'assets']);
const assetExtensions = new Set(['.svg', '.webp', '.jpg', '.jpeg', '.png', '.gif', '.avif', '.webm', '.mp4', '.woff', '.woff2', '.ttf', '.otf', '.txt', '.css', '.ico']);

async function exists(path) {
  try { return await lstat(path); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}

async function validateSite(siteRoot, label) {
  const checked = new Map();
  const visitedCode = new Set();
  const errorStart = errors.length;
  const local = (url, base = siteRoot) => {
    if (external(url)) return null;
    let clean;
    try { clean = decodeURIComponent(url.split(/[?#]/)[0]); } catch { fail(`${label}: invalid asset URL ${url}`); return null; }
    const target = clean.startsWith('/') ? resolve(siteRoot, `.${clean}`) : resolve(base, clean);
    const path = relative(siteRoot, target);
    if (path === '..' || path.startsWith(`..\\`) || path.startsWith('../')) { fail(`${label}: reference escapes the static site: ${url}`); return null; }
    return target;
  };
  async function file(path, context) {
    if (checked.has(path)) return checked.get(path);
    const info = await exists(path);
    if (!info?.isFile() || info.isSymbolicLink()) { fail(`${label}: missing/non-regular file ${slash(relative(siteRoot, path))} (${context})`); checked.set(path, null); return null; }
    const bytes = await readFile(path);
    checked.set(path, bytes);
    const extension = extname(path).toLowerCase();
    let valid = bytes.length > 0;
    if (['.jpg', '.jpeg'].includes(extension)) valid &&= bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
    if (extension === '.png') valid &&= bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    if (extension === '.webp') valid &&= bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
    if (extension === '.webm') valid &&= bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    if (extension === '.mp4') valid &&= bytes.toString('ascii', 4, 8) === 'ftyp';
    if (extension === '.woff2') valid &&= bytes.toString('ascii', 0, 4) === 'wOF2';
    if (extension === '.woff') valid &&= bytes.toString('ascii', 0, 4) === 'wOFF';
    if (extension === '.svg') valid &&= /<svg\b[^>]*>/i.test(bytes.toString()) && /(?:<\/svg\s*>|<svg\b[^>]*\/>)/i.test(bytes.toString());
    assert(valid, `${label}: invalid/empty ${extension || 'file'} signature: ${slash(relative(siteRoot, path))}`);
    return bytes;
  }
  async function reference(url, base, context) {
    const path = local(url, base);
    if (!path) return;
    const bytes = await file(path, context);
    if (!bytes || visitedCode.has(path)) return;
    visitedCode.add(path);
    const extension = extname(path).toLowerCase();
    const source = bytes.toString('utf8');
    if (['.js', '.mjs'].includes(extension)) {
      const syntax = spawnSync(process.execPath, ['--check', path], { encoding: 'utf8' });
      assert(syntax.status === 0, `${label}: JavaScript syntax check failed in ${slash(relative(siteRoot, path))}: ${syntax.stderr.trim() || syntax.error?.message || ''}`);
      for (const specifier of moduleImports(source)) {
        if (external(specifier)) continue;
        if (!specifier.startsWith('.') && !specifier.startsWith('/')) { fail(`${label}: unresolved bare browser import ${specifier}`); continue; }
        await reference(specifier, dirname(path), `import from ${basename(path)}`);
      }
    }
    if (extension === '.css') {
      const urls = [...source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)].map(match => match[1].trim());
      urls.push(...[...source.matchAll(/@import\s*["']([^"']+)["']/gi)].map(match => match[1]));
      for (const url of urls) await reference(url, dirname(path), `CSS in ${basename(path)}`);
    }
  }

  const htmlBytes = await file(resolve(siteRoot, 'index.html'), 'site entry');
  if (htmlBytes) {
    for (const match of htmlBytes.toString().matchAll(/<[a-z][^>]*>/gi)) {
      const attrs = attributes(match[0]);
      for (const key of ['src', 'href', 'poster', 'data-src']) if (attrs[key]) await reference(attrs[key], siteRoot, `HTML ${key}`);
    }
  }
  let data;
  try { data = await import(pathToFileURL(resolve(siteRoot, 'content.js')).href); } catch (error) { fail(`${label}: content module cannot load: ${error.message}`); }
  if (data) {
    assert(Array.isArray(data.projects) && data.projects.length === 10, `${label}: expected 10 project records`);
    assert(Array.isArray(data.editingReel) && data.editingReel.length === 7, `${label}: expected 7 editing reel records`);
    const projects = Array.isArray(data.projects) ? data.projects : [];
    assert(new Set(projects.map(project => project.id)).size === projects.length, `${label}: duplicate project IDs`);
    for (const project of projects) assert(project.id && project.title && project.description && Array.isArray(project.media), `${label}: incomplete project ${project.id || '(missing id)'}`);
    const media = [...projects.flatMap(project => project.media || []), ...(data.editingReel || [])];
    for (const item of media) {
      assert(['image', 'video'].includes(item.type) && Boolean(item.src) && Boolean(item.alt), `${label}: incomplete media record ${item.src || '(missing src)'}`);
      assert(item.type !== 'video' || Boolean(item.poster), `${label}: missing video poster ${item.src}`);
      for (const key of ['src', 'poster', 'originalPoster']) if (item[key]) {
        assert(!external(item[key]), `${label}: portfolio media should be local: ${item[key]}`);
        await reference(item[key], siteRoot, `content ${key}`);
      }
    }
  }

  let poseCount = 0;
  for (let index = 1; index <= 12; index++) {
    const name = `assets/pug/pose-${String(index).padStart(2, '0')}.svg`;
    const path = resolve(siteRoot, name);
    if (!await exists(path) && allowPending) { pending.push(`${label}: ${name}`); continue; }
    const bytes = await file(path, 'one mascot pose per reader page');
    if (!bytes) continue;
    poseCount++;
    const source = bytes.toString('utf8');
    const rootTag = source.match(/<svg\b[^>]*>/i)?.[0] || '';
    const attrs = attributes(rootTag);
    const canvas = (attrs.viewBox || '').trim().split(/[\s,]+/).map(Number);
    assert(canvas.length === 4 && canvas.every(Number.isFinite) && canvas.every((value, i) => value === [0, 0, 320, 280][i]), `${label}: ${name} must use viewBox="0 0 320 280"`);
    if (attrs.width) assert(parseFloat(attrs.width) === 320, `${label}: ${name} width must be 320`);
    if (attrs.height) assert(parseFloat(attrs.height) === 280, `${label}: ${name} height must be 280`);
    assert(!/\b(?:NaN|Infinity|undefined)\b/.test(source), `${label}: ${name} contains non-finite/generated invalid values`);
    assert(!/<(?:animate|animateTransform|animateMotion|set)\b|animation\s*:[^;}]*\binfinite\b/i.test(source), `${label}: ${name} should be a static pose`);
  }
  results.push({ site: label, filesChecked: checked.size, mascotPoses: poseCount, pass: errors.length === errorStart });
}

await validateSite(root, 'source');
const distribution = resolve(root, 'dist');
if (await exists(distribution)) {
  async function inspectOutput(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const path = resolve(directory, entry.name);
      const sitePath = slash(relative(distribution, path));
      const top = sitePath.split('/')[0];
      assert(expectedTopLevel.has(top), `dist: unexpected deploy entry ${sitePath}`);
      assert(!entry.isSymbolicLink(), `dist: symbolic links are not deployable: ${sitePath}`);
      if (entry.isDirectory()) { await inspectOutput(path); continue; }
      if (!entry.isFile()) continue;
      if (top === 'assets') {
        assert(!sitePath.split('/').some(part => part.startsWith('.')), `dist: hidden files are excluded: ${sitePath}`);
        assert(assetExtensions.has(extname(sitePath).toLowerCase()), `dist: non-web asset excluded by static whitelist: ${sitePath}`);
        if (extname(sitePath).toLowerCase() === '.txt') assert(/^(?:OFL|LICENSE|COPYING|NOTICE)(?:\.txt)?$/i.test(basename(sitePath)), `dist: only license/notice text files belong in public assets: ${sitePath}`);
      }
      if (sitePath !== '_headers') {
        const original = resolve(root, sitePath);
        if (!await exists(original)) fail(`dist: unexpected/stale file ${sitePath}`);
        else assert((await readFile(path)).equals(await readFile(original)), `dist: stale content; rebuild ${sitePath}`);
      }
    }
  }
  await inspectOutput(distribution);
  assert(Boolean(await exists(resolve(distribution, '_headers'))), 'dist: missing Cloudflare _headers');
  await validateSite(distribution, 'dist');
}

const performance = spawnSync(process.execPath, [resolve(dirname(fileURLToPath(import.meta.url)), 'check-performance.mjs'), root], { encoding: 'utf8' });
let performanceResult;
try { performanceResult = JSON.parse(performance.stdout); } catch { fail(`Performance checker could not complete: ${performance.stderr || performance.error?.message || 'invalid output'}`); }
if (performanceResult) for (const check of performanceResult.checks || []) assert(check.pass, `performance: ${check.name}`);
if (performance.status !== 0 && !errors.length) fail('Performance checker failed');

console.log(JSON.stringify({ pass: errors.length === 0, final: errors.length === 0 && pending.length === 0, results, localCodeBytes: performanceResult?.codeBytes, localCodeFiles: performanceResult?.localCodeFiles, pendingPoses: pending.length, errors }, null, 2));
if (pending.length) console.log('Pose artwork is still pending. Final delivery requires npm run check without --allow-pending-poses.');
process.exitCode = errors.length ? 1 : 0;
