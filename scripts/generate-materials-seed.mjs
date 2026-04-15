#!/usr/bin/env node
/**
 * Seed generator — Методический кабинет педагога
 *
 * Usage:
 *   node scripts/generate-materials-seed.mjs
 *
 * Output:
 *   db/seeds/0001_seed_categories_and_materials.sql
 *
 * Notes:
 *  - Requires no live database connection.
 *  - Requires no secrets.
 *  - Uses `npx tsx` to import TypeScript source data safely.
 *  - Idempotent: generated SQL uses INSERT ... ON CONFLICT DO UPDATE.
 */

import { execSync } from 'child_process';
import { createHash } from 'crypto';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// ── 1. Extract TypeScript data via tsx ────────────────────────────────────────

console.log('[seed-gen] Extracting data from TypeScript source files...');

let raw;
try {
  raw = execSync('npx --yes tsx scripts/_dump-data.ts', {
    cwd: ROOT,
    timeout: 60_000,
    maxBuffer: 10 * 1024 * 1024,
  }).toString('utf8');
} catch (err) {
  console.error('[seed-gen] Failed to extract data:', err.message);
  process.exit(1);
}

const data = JSON.parse(raw);
const { storeProducts, storeCategories, allMaterials, catalogDocuments, catalogCategories } = data;

// ── 2. Helpers ────────────────────────────────────────────────────────────────

/** Escape a string for SQL single-quoted literals. */
function sqlStr(v) {
  if (v == null) return 'NULL';
  return `'${String(v).replace(/'/g, "''")}'`;
}

/** Escape a string array for PostgreSQL text[] literal. */
function sqlStrArray(arr) {
  if (!arr || arr.length === 0) return "'{}'";
  const items = arr.map(s => `"${String(s).replace(/"/g, '\\"')}"`).join(',');
  return `'{${items}}'`;
}

/** Deterministic UUID v5-like: sha256 → format as UUID. */
function deterministicUUID(namespace, key) {
  const hash = createHash('sha256').update(`${namespace}:${key}`).digest('hex');
  return [
    hash.slice(0, 8),
    hash.slice(8, 12),
    '5' + hash.slice(13, 16),   // version 5
    (((parseInt(hash[16], 16) & 0x3) | 0x8)).toString(16) + hash.slice(17, 20),
    hash.slice(20, 32),
  ].join('-');
}

const NS_CAT  = 'metodcab:category';
const NS_MAT  = 'metodcab:material';

// ── 3. Build category list ─────────────────────────────────────────────────────

// Combine categories from all sources; de-duplicate by slug.
const categoryMap = new Map(); // slug → { id, slug, name, description, sort_order }

// From storeProducts STORE_CATEGORIES (skip 'Все категории')
storeCategories.forEach((name, i) => {
  if (name === 'Все категории') return;
  const slug = slugify(name);
  if (!categoryMap.has(slug)) {
    categoryMap.set(slug, {
      id: deterministicUUID(NS_CAT, slug),
      slug,
      name,
      description: '',
      sort_order: i,
    });
  }
});

// From catalog.ts categories
catalogCategories.forEach((cat, i) => {
  if (!categoryMap.has(cat.slug)) {
    categoryMap.set(cat.slug, {
      id: deterministicUUID(NS_CAT, cat.slug),
      slug: cat.slug,
      name: cat.name,
      description: cat.description || '',
      sort_order: 100 + i,
    });
  }
});

// Extra categories seen in materials.ts (subscription/free items)
const extraCats = [
  { name: 'Методички', description: 'Методические пособия и рекомендации для педагогов ДОО' },
  { name: 'Шаблоны', description: 'Готовые шаблоны документации для детского сада' },
  { name: 'Документация', description: 'Образцы и шаблоны педагогической документации' },
  { name: 'Справочники', description: 'Справочные материалы и глоссарии для педагогов' },
  { name: 'Комплекты материалов', description: 'Готовые комплекты дидактических и оформительских материалов' },
  { name: 'Посты для госпаблика / чата с родителями', description: 'Готовые посты для публикации в госпабликах и чатах с родителями' },
  { name: 'Говорящая среда ДОО', description: 'Материалы для организации развивающей говорящей среды в детском саду' },
  { name: 'Материалы для работы с детьми', description: 'Дидактические игры, карточки и наглядные пособия для занятий' },
  { name: 'Интересные прогулки', description: 'Материалы для организации познавательных и увлекательных прогулок' },
  { name: 'Рабочие листы по темам недели', description: 'Рабочие листы для закрепления тем недели с дошкольниками' },
  { name: 'Схемы поэтапного рисования', description: 'Пошаговые схемы рисования для занятий изобразительным искусством' },
  { name: 'Линейный календарь по месяцам', description: 'Линейные календари событий и тем на каждый месяц учебного года' },
  { name: 'Интерактивные презентации и викторины', description: 'Готовые интерактивные презентации и викторины для занятий' },
  { name: 'Работа с родителями', description: 'Материалы для эффективного взаимодействия с семьями воспитанников' },
  { name: 'Стенды «Читаем дома вместе»', description: 'Стенды с книжными рекомендациями для семейного чтения' },
  { name: 'Объявления для родителей', description: 'Шаблоны объявлений для информирования родителей' },
  { name: 'ФОП ДО: документы и материалы', description: 'Документы и материалы по Федеральной образовательной программе ДО' },
  { name: 'Календарь праздников и юбилеев', description: 'Ежемесячные календари праздников и юбилейных дат' },
  { name: 'Образовательные области ФОП ДО', description: 'Материалы по пяти образовательным областям ФОП ДО' },
  { name: 'Вебинары и видеоуроки', description: 'Записи вебинаров и видеоуроков для профессионального развития педагогов' },
  { name: 'Картотеки картин по ФОП ДО', description: 'Картотеки произведений живописи по перечню ФОП ДО' },
];
extraCats.forEach((cat, i) => {
  const slug = slugify(cat.name);
  if (!categoryMap.has(slug)) {
    categoryMap.set(slug, {
      id: deterministicUUID(NS_CAT, slug),
      slug,
      name: cat.name,
      description: cat.description,
      sort_order: 200 + i,
    });
  }
});

const categories = [...categoryMap.values()];

// ── 4. Build materials list ───────────────────────────────────────────────────

const materials = [];

// ── storeProducts → access_type = 'store' ────────────────────────────────────
for (const p of storeProducts) {
  const catSlug = p.categorySlug || slugify(p.category || '');
  const catId   = categoryMap.get(catSlug)?.id ?? null;
  const fileType = normalizeFileType(p.fileType);
  materials.push({
    id:                deterministicUUID(NS_MAT, p.slug),
    slug:              p.slug,
    title:             p.title,
    short_description: p.shortDescription || '',
    full_description:  p.fullDescription || '',
    access_type:       'store',
    category_id:       catId,
    age_group:         p.ageGroup || '',
    file_type:         fileType,
    price:             Math.round((p.price || 0) * 100), // roubles → kopecks
    cover_url:         '',
    preview_text:      p.shortDescription || '',
    preview_file_url:  '',
    paid_file_url:     '',
    is_published:      true,
    is_featured:       false,
    seo_title:         `${p.title} — скачать для детского сада`,
    seo_description:   (p.shortDescription || p.title).slice(0, 155),
    program:           p.program || '',
    what_is_included:  p.whatIsIncluded || [],
  });
}

// ── catalogDocuments → access_type = 'store' ─────────────────────────────────
for (const p of catalogDocuments) {
  // Skip if slug already covered by storeProducts
  if (materials.find(m => m.slug === p.slug)) continue;
  const catSlug = p.categorySlug;
  const catId   = categoryMap.get(catSlug)?.id ?? null;
  const fileType = normalizeFileType(p.fileType);
  materials.push({
    id:                deterministicUUID(NS_MAT, p.slug),
    slug:              p.slug,
    title:             p.title,
    short_description: p.description || '',
    full_description:  p.description || '',
    access_type:       'store',
    category_id:       catId,
    age_group:         p.ageGroup || '',
    file_type:         fileType,
    price:             Math.round((p.price || 0) * 100),
    cover_url:         '',
    preview_text:      p.description || '',
    preview_file_url:  '',
    paid_file_url:     '',
    is_published:      true,
    is_featured:       false,
    seo_title:         `${p.title} — скачать для детского сада`,
    seo_description:   (p.description || p.title).slice(0, 155),
    program:           p.program || '',
    what_is_included:  [],
  });
}

// ── allMaterials → free or subscription ──────────────────────────────────────
for (const p of allMaterials) {
  const catSlug = slugify(p.category || '');
  const catId   = categoryMap.get(catSlug)?.id ?? null;
  const access  = p.accessType === 'free' ? 'free' : 'subscription';
  const fileType = normalizeFileType(p.fileType);

  // Derive a deterministic slug from title if not present
  const slug = p.slug || slugify(p.title);

  // Skip duplicates
  if (materials.find(m => m.slug === slug)) continue;

  materials.push({
    id:                deterministicUUID(NS_MAT, `${access}:${slug}`),
    slug,
    title:             p.title,
    short_description: p.description || '',
    full_description:  p.description || '',
    access_type:       access,
    category_id:       catId,
    age_group:         p.ageGroup || '',
    file_type:         fileType,
    price:             0,  // free/subscription — no per-item price
    cover_url:         '',
    preview_text:      p.description || '',
    preview_file_url:  '',
    paid_file_url:     '',
    is_published:      true,
    is_featured:       false,
    seo_title:         `${p.title} — материал для педагогов`,
    seo_description:   (p.description || p.title).slice(0, 155),
    program:           p.program || '',
    what_is_included:  [],
  });
}

// ── 5. Build SQL ──────────────────────────────────────────────────────────────

const lines = [];

lines.push(`-- =============================================================================`);
lines.push(`-- Seed: categories and materials — Методический кабинет педагога`);
lines.push(`-- Generated: ${new Date().toISOString()}`);
lines.push(`-- Run against a database that has 0001_create_core_schema.sql applied.`);
lines.push(`-- Safe to re-run: uses ON CONFLICT DO UPDATE.`);
lines.push(`-- =============================================================================`);
lines.push('');
lines.push('BEGIN;');
lines.push('');

// Categories
lines.push(`-- ── categories (${categories.length}) ─────────────────────────────────────────────────────`);
lines.push('');

for (const c of categories) {
  lines.push(
    `INSERT INTO categories (id, slug, name, description, is_visible, sort_order, created_at)` +
    ` VALUES (` +
    `${sqlStr(c.id)}, ` +
    `${sqlStr(c.slug)}, ` +
    `${sqlStr(c.name)}, ` +
    `${sqlStr(c.description)}, ` +
    `true, ` +
    `${c.sort_order}, ` +
    `now()` +
    `)` +
    ` ON CONFLICT (slug) DO UPDATE SET` +
    ` name = EXCLUDED.name,` +
    ` description = EXCLUDED.description,` +
    ` sort_order = EXCLUDED.sort_order;`
  );
}

lines.push('');

// Materials
lines.push(`-- ── materials (${materials.length}) ─────────────────────────────────────────────────────`);
lines.push('');

for (const m of materials) {
  const catIdVal = m.category_id ? sqlStr(m.category_id) : 'NULL';
  lines.push(
    `INSERT INTO materials (` +
    `id, slug, title, short_description, full_description,` +
    ` access_type, category_id, age_group, file_type, price,` +
    ` cover_url, preview_text, preview_file_url, paid_file_url,` +
    ` is_published, is_featured, seo_title, seo_description,` +
    ` program, what_is_included, created_at, updated_at` +
    `) VALUES (` +
    `${sqlStr(m.id)}, ` +
    `${sqlStr(m.slug)}, ` +
    `${sqlStr(m.title)}, ` +
    `${sqlStr(m.short_description)}, ` +
    `${sqlStr(m.full_description)}, ` +
    `${sqlStr(m.access_type)}, ` +
    `${catIdVal}, ` +
    `${sqlStr(m.age_group)}, ` +
    `${sqlStr(m.file_type)}, ` +
    `${m.price}, ` +
    `${sqlStr(m.cover_url)}, ` +
    `${sqlStr(m.preview_text)}, ` +
    `${sqlStr(m.preview_file_url)}, ` +
    `${sqlStr(m.paid_file_url)}, ` +
    `${m.is_published}, ` +
    `${m.is_featured}, ` +
    `${sqlStr(m.seo_title)}, ` +
    `${sqlStr(m.seo_description)}, ` +
    `${sqlStr(m.program)}, ` +
    `${sqlStrArray(m.what_is_included)}, ` +
    `now(), now()` +
    `) ON CONFLICT (slug) DO UPDATE SET` +
    ` title = EXCLUDED.title,` +
    ` short_description = EXCLUDED.short_description,` +
    ` full_description = EXCLUDED.full_description,` +
    ` access_type = EXCLUDED.access_type,` +
    ` category_id = EXCLUDED.category_id,` +
    ` age_group = EXCLUDED.age_group,` +
    ` file_type = EXCLUDED.file_type,` +
    ` price = EXCLUDED.price,` +
    ` seo_title = EXCLUDED.seo_title,` +
    ` seo_description = EXCLUDED.seo_description,` +
    ` program = EXCLUDED.program,` +
    ` what_is_included = EXCLUDED.what_is_included,` +
    ` updated_at = now();`
  );
}

lines.push('');
lines.push('COMMIT;');
lines.push('');
lines.push(`-- Totals: ${categories.length} categories, ${materials.length} materials`);
lines.push(`-- store: ${materials.filter(m => m.access_type === 'store').length}`);
lines.push(`-- free: ${materials.filter(m => m.access_type === 'free').length}`);
lines.push(`-- subscription: ${materials.filter(m => m.access_type === 'subscription').length}`);

// ── 6. Write output ───────────────────────────────────────────────────────────

const outDir  = join(ROOT, 'db', 'seeds');
const outFile = join(outDir, '0001_seed_categories_and_materials.sql');
mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, lines.join('\n'), 'utf8');

console.log(`[seed-gen] Written: db/seeds/0001_seed_categories_and_materials.sql`);
console.log(`[seed-gen] Categories: ${categories.length}`);
console.log(`[seed-gen] Materials:  ${materials.length}`);
console.log(`[seed-gen]   store:        ${materials.filter(m => m.access_type === 'store').length}`);
console.log(`[seed-gen]   free:         ${materials.filter(m => m.access_type === 'free').length}`);
console.log(`[seed-gen]   subscription: ${materials.filter(m => m.access_type === 'subscription').length}`);

// ── Helpers ───────────────────────────────────────────────────────────────────

function slugify(title) {
  return String(title)
    .toLowerCase()
    .replace(/[ёе]/g, 'e')
    .replace(/[а]/g, 'a').replace(/[б]/g, 'b').replace(/[в]/g, 'v')
    .replace(/[г]/g, 'g').replace(/[д]/g, 'd').replace(/[ж]/g, 'zh')
    .replace(/[з]/g, 'z').replace(/[и]/g, 'i').replace(/[й]/g, 'y')
    .replace(/[к]/g, 'k').replace(/[л]/g, 'l').replace(/[м]/g, 'm')
    .replace(/[н]/g, 'n').replace(/[о]/g, 'o').replace(/[п]/g, 'p')
    .replace(/[р]/g, 'r').replace(/[с]/g, 's').replace(/[т]/g, 't')
    .replace(/[у]/g, 'u').replace(/[ф]/g, 'f').replace(/[х]/g, 'h')
    .replace(/[ц]/g, 'ts').replace(/[ч]/g, 'ch').replace(/[ш]/g, 'sh')
    .replace(/[щ]/g, 'shch').replace(/[ъ]/g, '').replace(/[ы]/g, 'y')
    .replace(/[ь]/g, '').replace(/[э]/g, 'e').replace(/[ю]/g, 'yu')
    .replace(/[я]/g, 'ya')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeFileType(ft) {
  const t = String(ft || 'PDF').toUpperCase();
  if (t === 'PPT') return 'PPTX';
  if (['PDF', 'DOCX', 'PPT', 'PPTX'].includes(t)) return t;
  return 'PDF';
}
