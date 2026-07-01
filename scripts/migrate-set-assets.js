#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data', 'cards');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

function parseArgs(argv) {
  const args = {
    set: 'base-set',
    sourceTemplate: null,
    logoUrl: null,
    skipLogo: false,
    dryRun: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === '--set') {
      args.set = argv[++i];
    } else if (arg === '--source-template') {
      args.sourceTemplate = argv[++i];
    } else if (arg === '--logo-url') {
      args.logoUrl = argv[++i];
    } else if (arg === '--skip-logo') {
      args.skipLogo = true;
    } else if (arg === '--dry-run') {
      args.dryRun = true;
    } else if (arg === '--help' || arg === '-h') {
      printHelp();
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return args;
}

function printHelp() {
  console.log(`
Usage: node scripts/migrate-set-assets.js --set base-set --source-template "https://www.serebii.net/card/base/{number}.jpg"

Downloads one set's logo and card images into public/card-assets/<set>/, then
rewrites that set JSON to root-relative public paths.

Options:
  --set <slug>                 data/cards/<slug>.json to migrate
  --source-template <url>      card source URL with {number} or {paddedNumber}
  --logo-url <url>             override setInfo.logo as the logo source
  --skip-logo                  migrate cards but leave setInfo.logo unchanged
  --dry-run                    report actions without writing files or JSON
`);
}

function padCardNumber(card) {
  const rawNumber = String(card.cardNumber || card.number || '').trim();
  const numericMatch = rawNumber.match(/\d+/);

  if (!numericMatch) {
    throw new Error(`Cannot derive numeric card number for ${card.id || card.name}`);
  }

  return {
    raw: String(Number(numericMatch[0])),
    padded: numericMatch[0].padStart(3, '0'),
  };
}

function getExtensionFromUrl(url, contentType) {
  const pathname = new URL(url).pathname;
  const ext = path.extname(pathname).toLowerCase();

  if (ext) {
    return ext;
  }

  if (contentType && contentType.includes('png')) {
    return '.png';
  }

  if (contentType && contentType.includes('webp')) {
    return '.webp';
  }

  return '.jpg';
}

async function downloadFile(url, destination, dryRun) {
  if (dryRun) {
    console.log(`[dry-run] ${url} -> ${destination}`);
    return;
  }

  if (fs.existsSync(destination) && fs.statSync(destination).size > 0) {
    console.log(`exists ${path.relative(process.cwd(), destination)}`);
    return;
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': USER_AGENT,
      Referer: 'https://www.serebii.net/',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const contentType = response.headers.get('content-type') || '';

  if (!contentType.startsWith('image/')) {
    throw new Error(`Expected image content for ${url}, got ${contentType || 'unknown content type'}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, buffer);
  console.log(`saved ${path.relative(process.cwd(), destination)} (${buffer.length} bytes)`);
}

async function migrateSet({ set, sourceTemplate, logoUrl, skipLogo, dryRun }) {
  const jsonPath = path.join(DATA_DIR, `${set}.json`);

  if (!fs.existsSync(jsonPath)) {
    throw new Error(`Set JSON not found: ${jsonPath}`);
  }

  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  const assetRoot = path.join(PUBLIC_DIR, 'card-assets', set);
  const cardRoot = path.join(assetRoot, 'cards');

  if (!Array.isArray(data.cards)) {
    throw new Error(`${jsonPath} does not contain a cards array`);
  }

  if (data.setInfo && data.setInfo.logo && !skipLogo) {
    const resolvedLogoUrl = logoUrl || data.setInfo.logo;
    const logoExt = getExtensionFromUrl(resolvedLogoUrl, 'image/png');
    const logoDestination = path.join(assetRoot, `logo${logoExt}`);
    await downloadFile(resolvedLogoUrl, logoDestination, dryRun);
    data.setInfo.logo = `/card-assets/${set}/logo${logoExt}`;
  }

  for (const card of data.cards) {
    const { raw, padded } = padCardNumber(card);
    const sourceUrl = sourceTemplate
      ? sourceTemplate.replace('{number}', raw).replace('{paddedNumber}', padded)
      : card.imageUrl;

    if (!sourceUrl) {
      throw new Error(`No source image URL for ${card.id || card.name}`);
    }

    const extension = getExtensionFromUrl(sourceUrl, 'image/jpeg');
    const destination = path.join(cardRoot, `${padded}${extension}`);
    await downloadFile(sourceUrl, destination, dryRun);
    card.imageUrl = `/card-assets/${set}/cards/${padded}${extension}`;

    if (card.image_url) {
      card.image_url = card.imageUrl;
    }
  }

  if (!dryRun) {
    fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`);
  }

  console.log(`Migrated ${data.cards.length} cards for ${set}`);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  await migrateSet(args);
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
}
