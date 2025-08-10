/*
 Updates all data/cards/*.json to ensure setInfo.logo exists and points to
 https://www.serebii.net/card/logo/{slug}.png

 Slug resolution strategy:
 1) If setInfo.logo matches /card/logo/{slug}.png → use slug
 2) Else if setInfo.logoUrl or setInfo.logo contains /card/{slug}/logo.png → use slug
 3) Else find first card imageUrl/image_url containing /card/{slug}/ → use slug
 4) Else derive from setInfo.name by lowercasing and removing non-alphanumerics

 The script keeps any other fields intact and adds/overwrites setInfo.logo.
*/

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const CARDS_DIR = path.resolve(ROOT, 'data', 'cards');

/** Extracts serebii set slug from a URL like https://www.serebii.net/card/<slug>/...
 * or https://www.serebii.net/card/logo/<slug>.png
 */
function extractSlugFromUrl(url) {
  if (typeof url !== 'string') return null;
  // logo pattern
  let m = url.match(/\/card\/logo\/([^\/]+)\.png/i);
  if (m && m[1]) return m[1].toLowerCase();
  // path pattern
  m = url.match(/\/card\/([^\/]+)\//i);
  if (m && m[1]) return m[1].toLowerCase();
  // dragon-majesty special from logoUrl style: /card/<slug>/logo.png
  m = url.match(/\/card\/([^\/]+)\/logo\.png/i);
  if (m && m[1]) return m[1].toLowerCase();
  return null;
}

function sanitizeNameToSlug(name) {
  if (!name || typeof name !== 'string') return null;
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function ensureLogo(setJson, filePath) {
  if (!setJson || typeof setJson !== 'object') return { updated: false };
  if (!setJson.setInfo || typeof setJson.setInfo !== 'object') {
    // create minimal setInfo if missing
    setJson.setInfo = {};
  }

  const setInfo = setJson.setInfo;

  // Try to get slug from existing fields
  let slug = null;

  if (setInfo.logo) slug = extractSlugFromUrl(setInfo.logo);
  if (!slug && setInfo.logoUrl) slug = extractSlugFromUrl(setInfo.logoUrl);
  if (!slug && setInfo.symbolUrl) slug = extractSlugFromUrl(setInfo.symbolUrl);

  // Try from cards
  if (!slug && Array.isArray(setJson.cards)) {
    for (const card of setJson.cards) {
      const u1 = card && card.imageUrl;
      const u2 = card && card.image_url;
      slug = extractSlugFromUrl(u1) || extractSlugFromUrl(u2);
      if (slug) break;
      // Some files store nested images
      if (card && card.images) {
        const { small, large } = card.images;
        slug = extractSlugFromUrl(small) || extractSlugFromUrl(large);
        if (slug) break;
      }
    }
  }

  // Fallback from name
  if (!slug) {
    slug = sanitizeNameToSlug(setInfo.name);
  }

  if (!slug) return { updated: false };

  const desiredLogo = `https://www.serebii.net/card/logo/${slug}.png`;
  const current = setInfo.logo;
  if (current === desiredLogo) return { updated: false };

  setInfo.logo = desiredLogo;
  return { updated: true };
}

function processAll() {
  const entries = fs.readdirSync(CARDS_DIR).filter(f => f.endsWith('.json'));
  let updatedCount = 0;
  let total = 0;
  for (const file of entries) {
    const p = path.join(CARDS_DIR, file);
    let text;
    try {
      text = fs.readFileSync(p, 'utf8');
    } catch (e) {
      continue;
    }
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      // Attempt to salvage: strip BOM, remove invalid control chars, slice to last closing brace
      let salvage = text;
      // Strip BOM
      if (salvage.charCodeAt(0) === 0xFEFF) salvage = salvage.slice(1);
      // Remove control chars except \t, \n, \r
      salvage = salvage.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');
      // Slice to last '}'
      const firstBrace = salvage.indexOf('{');
      const lastBrace = salvage.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        salvage = salvage.slice(firstBrace, lastBrace + 1);
      }
      try {
        json = JSON.parse(salvage);
        // Backup original then overwrite with normalized JSON
        const backupPath = p + '.backup';
        try { fs.writeFileSync(backupPath, text, 'utf8'); } catch {}
        fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n', 'utf8');
        console.warn(`Salvaged and normalized JSON: ${file}`);
      } catch (e2) {
        console.error(`Skipping invalid JSON: ${file}`);
        continue;
      }
    }
    total++;
    const { updated } = ensureLogo(json, p);
    if (updated) {
      fs.writeFileSync(p, JSON.stringify(json, null, 2) + '\n', 'utf8');
      updatedCount++;
      console.log(`Updated logo in ${file}`);
    }
  }
  console.log(`Done. Updated ${updatedCount} of ${total} files.`);
}

if (require.main === module) {
  processAll();
}


