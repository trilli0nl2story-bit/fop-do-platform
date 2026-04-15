/**
 * Internal helper — run via `npx tsx scripts/_dump-data.ts`
 * Imports all source data and writes JSON to stdout.
 * Used by generate-materials-seed.mjs; not meant to be imported.
 */

import { storeProducts, STORE_CATEGORIES } from '../src/data/storeProducts';
import { allMaterials } from '../src/data/materials';
import { catalogDocuments, categories as catalogCategories } from '../src/data/catalog';

const output = {
  storeProducts,
  storeCategories: STORE_CATEGORIES,
  allMaterials,
  catalogDocuments,
  catalogCategories,
};

process.stdout.write(JSON.stringify(output));
