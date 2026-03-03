#!/usr/bin/env node
/**
 * generate_datasets_manifest.mjs
 *
 * Scans the /data directory for sub-folders that contain a meta.json file,
 * then writes /data/datasets.json listing them in stable sorted order.
 *
 * Usage (run from repository root):
 *   node scripts/generate_datasets_manifest.mjs
 *
 * Each dataset folder must contain a meta.json with at minimum an "id" field.
 * Folders without meta.json cause a hard error so misconfigured datasets are
 * caught early rather than silently omitted.
 */

import { readdir, readFile, writeFile, stat } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = join(__dirname, '..');
const DATA_DIR  = join(ROOT, 'data');
const OUT_FILE  = join(DATA_DIR, 'datasets.json');

async function main() {
  // ── 1. Read data directory entries ──────────────────────────────────────
  let entries;
  try {
    entries = await readdir(DATA_DIR, { withFileTypes: true });
  } catch (e) {
    console.error(`ERROR: Cannot read data directory at: ${DATA_DIR}`);
    console.error(e.message);
    process.exit(1);
  }

  // Keep only sub-directories, sorted alphabetically for stable output
  const dirs = entries
    .filter(e => e.isDirectory())
    .map(e => e.name)
    .sort();

  if (dirs.length === 0) {
    console.warn('WARN: No sub-directories found in data/. Writing empty manifest.');
  }

  // ── 2. Validate each directory has meta.json ────────────────────────────
  const datasets = [];
  const errors   = [];

  for (const dir of dirs) {
    const metaPath = join(DATA_DIR, dir, 'meta.json');

    try {
      await stat(metaPath); // throws ENOENT if missing
    } catch {
      errors.push(
        `ERROR: data/${dir}/ has no meta.json — every dataset folder must contain meta.json.\n` +
        `       Create data/${dir}/meta.json with at minimum { "id": "${dir}", ... }`
      );
      continue;
    }

    let meta;
    try {
      const raw = await readFile(metaPath, 'utf8');
      meta = JSON.parse(raw);
    } catch (e) {
      errors.push(`ERROR: data/${dir}/meta.json is not valid JSON — ${e.message}`);
      continue;
    }

    if (!meta.id) {
      errors.push(`ERROR: data/${dir}/meta.json is missing the required "id" field.`);
      continue;
    }

    datasets.push({
      id:   meta.id,
      meta: `./data/${dir}/meta.json`
    });
  }

  // ── 3. Report errors ─────────────────────────────────────────────────────
  if (errors.length) {
    errors.forEach(msg => console.error(msg));
    process.exit(1);
  }

  // ── 4. Write manifest ────────────────────────────────────────────────────
  const manifest = { datasets };
  await writeFile(OUT_FILE, JSON.stringify(manifest, null, 2) + '\n', 'utf8');

  console.log(`✓ Written ${OUT_FILE}`);
  console.log(`  ${datasets.length} dataset(s) registered:`);
  datasets.forEach(d => console.log(`    • ${d.id}  →  ${d.meta}`));
}

main().catch(e => {
  console.error('Unhandled error:', e);
  process.exit(1);
});
