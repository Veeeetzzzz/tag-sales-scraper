const cheerio = require('cheerio');

const MAX_ITEMS = 60;
const FETCH_TIMEOUT_MS = 10000;
const PUPPETEER_TIMEOUT_MS = 30000;
const TAG_GRADER_FILTER =
  'Professional%2520Grader=Technical%2520Authentication%2520%2526%2520Grading%2520%2528TAG%2529';

const MARKETPLACES = {
  uk: {
    origin: 'https://www.ebay.co.uk',
    locale: 'en-GB',
    timezoneId: 'Europe/London',
    language: 'en-GB,en;q=0.9',
    marketplace: 'uk'
  },
  us: {
    origin: 'https://www.ebay.com',
    locale: 'en-US',
    timezoneId: 'America/New_York',
    language: 'en-US,en;q=0.9',
    marketplace: 'us'
  }
};

const normalizeText = (value = '') =>
  String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const cleanText = (value = '') =>
  String(value)
    .replace(/\s+/g, ' ')
    .replace(/^new listing\s*/i, '')
    .trim();

const dedupeRepeatedTitle = (title) => {
  const cleaned = cleanText(title);
  const words = cleaned.split(' ');
  if (words.length % 2 !== 0) return cleaned;

  const midpoint = words.length / 2;
  const first = words.slice(0, midpoint).join(' ');
  const second = words.slice(midpoint).join(' ');
  return normalizeText(first) === normalizeText(second) ? first : cleaned;
};

const extractPrice = (value = '') => {
  const text = cleanText(value);
  const match = text.match(/(?:US\s*)?[£$€]\s?[\d,]+(?:\.\d{2})?/i);
  return match ? cleanText(match[0]) : '';
};

const parsePriceNumber = (price = '') => {
  const match = extractPrice(price).match(/[\d,]+(?:\.\d{2})?/);
  return match ? parseFloat(match[0].replace(/,/g, '')) : 0;
};

const upgradeImageUrl = (url = '') => {
  if (!url) return '';
  return url
    .replace(/s-l(?:50|64|96|140|225|300)(?=[./?])/g, 's-l500')
    .replace(/\.webp(?:\?.*)?$/i, '.jpg');
};

const listingIdFromUrl = (url = '') => {
  const match = String(url).match(/\/itm\/(?:[^/?#]+\/)?(\d{9,})/i);
  return match ? match[1] : '';
};

const hasPokemonSignal = (text) => {
  const normalized = normalizeText(text);
  return normalized.includes('pokemon') || normalized.includes('pkmn');
};

const hasTagGradeSignal = (text) => {
  const normalized = normalizeText(text);

  return (
    /\btag\s*[-_:]?\s*(?:10|9(?:\.5)?|8(?:\.5)?|7(?:\.5)?|6(?:\.5)?|5(?:\.5)?|4|3|2|1)\b/.test(normalized) ||
    /\bgraded\s*[-_:]?\s*tag\b/.test(normalized) ||
    /\btag\s*[-_:]?\s*(?:graded|grade|authenticated|auth)\b/.test(normalized) ||
    normalized.includes('technical authentication')
  );
};

const isLotOrBundle = (text) => {
  const normalized = normalizeText(text);
  return /\b(lot of|bundle of|collection of|job lot|bulk lot)\b/.test(normalized);
};

const filterItemsCommon = (rawItems = []) => {
  const dedup = new Set();
  const cleaned = [];

  for (const item of rawItems) {
    if (!item || !item.title) continue;

    const title = dedupeRepeatedTitle(item.title);
    const haystack = `${title} ${item.searchText || ''}`;
    const normalizedTitle = normalizeText(title);

    if (!title || normalizedTitle === 'shop on ebay') continue;
    if (normalizedTitle.includes('available inventory')) continue;

    const price = extractPrice(item.price);
    const priceNum = parsePriceNumber(price);
    if (!price || Number.isNaN(priceNum) || priceNum <= 0) continue;

    if (!hasPokemonSignal(haystack)) continue;
    if (!hasTagGradeSignal(haystack)) continue;
    if (isLotOrBundle(haystack)) continue;

    const listingId = listingIdFromUrl(item.listingUrl);
    const key = listingId || `${normalizeText(title)}::${priceNum}`;
    if (dedup.has(key)) continue;
    dedup.add(key);

    cleaned.push({
      title,
      img: upgradeImageUrl(item.img || ''),
      price,
      soldDate: item.soldDate || 'Recently sold',
      soldInfo: cleanText(item.soldInfo || 'Recently sold'),
      listingUrl: item.listingUrl || '',
      location: cleanText(item.location || ''),
      marketplace: item.marketplace || 'uk'
    });
  }

  return cleaned.slice(0, MAX_ITEMS);
};

const buildUrls = (marketplaceConfig) => {
  const { origin } = marketplaceConfig;
  const keywordBase = `${origin}/sch/i.html?_nkw=TAG+Pokemon&_sacat=183454&LH_Sold=1&LH_Complete=1&_sop=13&_ipg=120`;
  const gradedKeywordBase = `${origin}/sch/i.html?_nkw=TAG+graded+Pokemon&_sacat=183454&LH_Sold=1&LH_Complete=1&_sop=13&_ipg=120`;
  const graderFilter = `${origin}/sch/i.html?_nkw=Pokemon&_sacat=0&_from=R40&Graded=Yes&${TAG_GRADER_FILTER}&_dcat=183454&LH_PrefLoc=2&rt=nc&LH_Sold=1&LH_Complete=1&_sop=13&_ipg=120`;

  return {
    keyword: keywordBase,
    gradedKeyword: gradedKeywordBase,
    graderFilter,
    rssKeyword: `${keywordBase}&_rss=1`
  };
};

const fetchText = async (url, headers = {}, timeoutMs = FETCH_TIMEOUT_MS) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers
    });
    const text = await response.text();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${cleanText(text).slice(0, 160)}`);
    }

    if (/access denied|pardon our interruption|checking your browser|captcha|security check|challenge-/i.test(text)) {
      throw new Error('eBay bot protection or access-denied page returned');
    }

    return text;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeoutMs / 1000}s`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
};

const getFirstText = ($item, selectors) => {
  for (const selector of selectors) {
    const text = cleanText($item.find(selector).first().text());
    if (text && normalizeText(text) !== 'shop on ebay') return text;
  }
  return '';
};

const getFirstAttr = ($item, selectors, attrs) => {
  for (const selector of selectors) {
    const element = $item.find(selector).first();
    if (!element.length) continue;

    for (const attr of attrs) {
      const value = element.attr(attr);
      if (value) return value;
    }
  }
  return '';
};

const collectCheerioListingNodes = ($) => {
  const nodes = new Set();

  $('a[href*="/itm/"]').each((_, link) => {
    const container = $(link)
      .closest('li.s-item, li, article, div[data-viewport], div[class*="s-card"], div[class*="item-card"], div[class*="listing"]')
      .get(0);
    if (container) nodes.add(container);
  });

  if (nodes.size === 0) {
    $('span.s-card__price, .s-item__price, [data-testid="item-price"], [class*="price"]').each((_, priceElement) => {
      const container = $(priceElement)
        .closest('li.s-item, li, article, div[data-viewport], div[class*="s-card"], div[class*="item-card"], div[class*="listing"]')
        .get(0);
      if (container) nodes.add(container);
    });
  }

  if (nodes.size === 0) {
    $('.srp-results .s-item, ul.srp-results li.s-item, [data-testid="item"]').each((_, item) => {
      nodes.add(item);
    });
  }

  return Array.from(nodes);
};

const extractSoldInfoFromText = (text = '') => {
  const cleaned = cleanText(text);
  const soldMatch = cleaned.match(
    /(?:this listing sold on|item sold on|sold|ended)[:\s]*(?:on\s*)?([A-Z][a-z]{2},?\s*)?\d{1,2}\s+[A-Z][a-z]{2,8},?\s*(?:at\s*)?\d{0,2}:?\d{0,2}\s*(?:AM|PM)?|(?:sold|ended)[:\s]*(?:on\s*)?\d{1,2}\s+[A-Z][a-z]{2,8}\s+\d{4}/i
  );
  return soldMatch ? cleanText(soldMatch[0]) : '';
};

const extractItemsFromCheerio = ($, marketplaceConfig) => {
  const nodes = collectCheerioListingNodes($);
  const items = [];

  console.log(`Found ${nodes.length} potential eBay listing containers`);

  nodes.forEach((node, index) => {
    const $item = $(node);
    const searchText = cleanText($item.text());

    const title =
      getFirstText($item, [
        '.s-item__title span[role="heading"]',
        '.s-item__title > span',
        '.s-item__title',
        'h3.s-item__title',
        '[data-testid="item-title"]',
        '.su-styled-text.primary.default',
        '[class*="title"] span',
        '[class*="title"]',
        'h3',
        'a[href*="/itm/"]'
      ]) || '';

    const price =
      extractPrice(
        getFirstText($item, [
          'span.s-card__price',
          '.s-item__price .notranslate',
          '.s-item__price',
          'span.s-item__price',
          '[data-testid="item-price"]',
          '.notranslate',
          '[class*="price"]'
        ])
      ) || extractPrice(searchText);

    const img = getFirstAttr(
      $item,
      [
        'img.s-card__image',
        '.s-item__image img',
        'img[src*="ebayimg"]',
        '[data-testid="item-image"] img',
        'img'
      ],
      ['src', 'data-src', 'data-originalsrc']
    );

    const listingUrl = getFirstAttr(
      $item,
      ['.s-item__link', 'a[href*="/itm/"]', '[data-testid="item-link"]', 'a'],
      ['href']
    );

    const soldInfo =
      getFirstText($item, [
        '.s-item__title--tag .POSITIVE',
        '.s-item__title--tagblock .POSITIVE',
        '.s-item__caption--signal .POSITIVE',
        'span.su-styled-text.positive.default',
        '.s-item__detail--primary',
        '.s-item__ended-date',
        '.s-item__ended',
        '[class*="sold"]',
        '[class*="ended"]'
      ]) ||
      extractSoldInfoFromText(searchText) ||
      'Recently sold';

    const location =
      getFirstText($item, ['.s-item__location', '.s-item__shipping', '[class*="location"]']) || '';

    if (title && price) {
      items.push({
        title,
        price,
        img,
        soldDate: 'Recently sold',
        soldInfo,
        listingUrl,
        location,
        searchText,
        marketplace: marketplaceConfig.marketplace
      });
    } else if (index < 5) {
      console.log(
        `Skipped candidate ${index}: title="${title.slice(0, 80) || 'NONE'}", price="${price || 'NONE'}"`
      );
    }
  });

  const filtered = filterItemsCommon(items);
  console.log(`Extracted ${items.length} raw items, ${filtered.length} after TAG/Pokemon filtering`);
  return filtered;
};

const scrapeRSSFeed = async (rssUrl, marketplaceConfig) => {
  console.log('Attempting RSS feed scrape...');

  const xml = await fetchText(rssUrl, {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    Accept: 'application/rss+xml, application/xml, text/xml, */*',
    'Accept-Language': marketplaceConfig.language
  });

  const $ = cheerio.load(xml, { xmlMode: true });
  const items = [];

  $('item').each((_, item) => {
    const $item = $(item);
    const title = $item.find('title').text().trim();
    const link = $item.find('link').text().trim();
    const description = $item.find('description').text().trim();
    const descriptionHtml = cheerio.load(description);

    const price = extractPrice(descriptionHtml.text()) || extractPrice(description);
    const img =
      descriptionHtml('img').first().attr('src') ||
      $item.find('media\\:content, content').attr('url') ||
      '';
    const soldInfo = cleanText($item.find('pubDate').text()) || 'Recently sold';

    items.push({
      title,
      listingUrl: link,
      price,
      img,
      soldDate: 'Recently sold',
      soldInfo,
      searchText: `${title} ${description}`,
      marketplace: marketplaceConfig.marketplace
    });
  });

  const filtered = filterItemsCommon(items);
  console.log(`RSS feed found ${items.length} raw items, ${filtered.length} after filtering`);
  return filtered;
};

const scrapeWithHtmlFetch = async (url, marketplaceConfig, mode) => {
  console.log(`Attempting ${mode} HTML scrape...`);

  const headers =
    mode === 'mobile'
      ? {
          'User-Agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': marketplaceConfig.language,
          'Cache-Control': 'no-cache'
        }
      : {
          'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
          Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': marketplaceConfig.language,
          'Cache-Control': 'no-cache'
        };

  const html = await fetchText(url, headers);
  const $ = cheerio.load(html);
  return extractItemsFromCheerio($, marketplaceConfig);
};

const scrapeWithJinaProxy = async (url, marketplaceConfig) => {
  console.log('Attempting Jina text-proxy scrape...');

  const httpUrl = url.replace('https://', 'http://');
  const text = await fetchText(`https://r.jina.ai/${httpUrl}`, {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    Accept: 'text/plain,*/*',
    'Accept-Language': marketplaceConfig.language
  });

  if (/target url returned error 403|securitycompromiseerror|access denied/i.test(text)) {
    throw new Error('Jina returned an eBay access-denied response');
  }

  const lines = text
    .split(/\r?\n/)
    .map((line) => cleanText(line))
    .filter(Boolean);

  const items = [];
  const priceLine = /(?:US\s*)?[£$€]\s?[\d,]+(?:\.\d{2})?/i;
  const urlLine = /(https?:\/\/(?:www\.)?ebay\.(?:co\.uk|com)\/[^\s)]+)/i;
  const imageLine = /(https?:\/\/i\.ebayimg\.com\/[^\s)]+)/i;

  for (let i = 0; i < lines.length; i++) {
    const price = extractPrice(lines[i]);
    if (!price || !priceLine.test(price)) continue;

    let title = '';
    for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
      const candidate = lines[j].replace(/^\*+\s*/, '');
      if (
        candidate.length > 8 &&
        !priceLine.test(candidate) &&
        !/^(image|sold|ended|shipping|postage|available inventory|shop on ebay)/i.test(candidate)
      ) {
        title = candidate;
        break;
      }
    }

    if (!title) continue;

    const nearby = lines.slice(Math.max(0, i - 10), Math.min(lines.length, i + 10)).join(' ');
    const listingUrl = nearby.match(urlLine)?.[1] || '';
    const img = nearby.match(imageLine)?.[1] || '';
    const soldInfo = extractSoldInfoFromText(nearby) || 'Recently sold';

    items.push({
      title,
      price,
      img,
      soldDate: 'Recently sold',
      soldInfo,
      listingUrl,
      searchText: `${title} ${nearby}`,
      marketplace: marketplaceConfig.marketplace
    });
  }

  const filtered = filterItemsCommon(items);
  console.log(`Jina extracted ${items.length} raw items, ${filtered.length} after filtering`);
  return filtered;
};

const findLocalBrowserPath = () => {
  const fs = require('fs');
  const paths =
    process.platform === 'win32'
      ? [
          process.env.PUPPETEER_EXECUTABLE_PATH,
          'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
          'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
          process.env.LOCALAPPDATA && `${process.env.LOCALAPPDATA}\\Google\\Chrome\\Application\\chrome.exe`,
          'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
          'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
        ]
      : process.platform === 'darwin'
        ? [
            process.env.PUPPETEER_EXECUTABLE_PATH,
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
            '/Applications/Chromium.app/Contents/MacOS/Chromium'
          ]
        : [
            process.env.PUPPETEER_EXECUTABLE_PATH,
            '/usr/bin/google-chrome',
            '/usr/bin/chromium-browser',
            '/usr/bin/chromium',
            '/usr/bin/microsoft-edge'
          ];

  return paths.filter(Boolean).find((path) => {
    try {
      return fs.existsSync(path);
    } catch {
      return false;
    }
  });
};

const getPuppeteerLaunchOptions = async () => {
  const isServerless = process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.VERCEL;

  if (isServerless) {
    const chromium = require('@sparticuz/chromium');
    return {
      executablePath: await chromium.executablePath(),
      args: chromium.args,
      headless: chromium.headless
    };
  }

  const executablePath = findLocalBrowserPath();
  if (!executablePath) {
    throw new Error('Could not find a local Chrome or Edge browser for Puppeteer');
  }

  return {
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu']
  };
};

const scrapeWithPuppeteer = async (url, marketplaceConfig) => {
  console.log('Attempting Puppeteer browser scrape...');

  const puppeteer = require('puppeteer-core');
  const launchOptions = await getPuppeteerLaunchOptions();
  let browser = null;

  try {
    browser = await puppeteer.launch({
      ...launchOptions,
      args: [
        ...(launchOptions.args || []),
        '--disable-blink-features=AutomationControlled',
        '--disable-features=IsolateOrigins,site-per-process',
        `--lang=${marketplaceConfig.locale}`,
        '--no-first-run',
        '--no-default-browser-check'
      ],
      defaultViewport: { width: 1440, height: 1100 }
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
    );
    await page.setExtraHTTPHeaders({
      'Accept-Language': marketplaceConfig.language
    });
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: PUPPETEER_TIMEOUT_MS
    });

    await page
      .waitForSelector('a[href*="/itm/"], .srp-results, [data-testid="item"], span.s-card__price', {
        timeout: 12000
      })
      .catch(() => {});

    await new Promise((resolve) => setTimeout(resolve, 1500));

    const pageInfo = await page.evaluate(() => ({
      title: document.title,
      bodySample: document.body?.innerText?.slice(0, 700) || ''
    }));

    console.log('Puppeteer page title:', pageInfo.title);

    if (/access denied|pardon our interruption|checking your browser|captcha|security check/i.test(pageInfo.bodySample)) {
      throw new Error('eBay bot protection or access-denied page returned in browser');
    }

    const rawItems = await page.evaluate((marketplace) => {
      const clean = (value = '') => String(value).replace(/\s+/g, ' ').trim();
      const priceFrom = (value = '') => {
        const match = clean(value).match(/(?:US\s*)?[£$€]\s?[\d,]+(?:\.\d{2})?/i);
        return match ? clean(match[0]) : '';
      };
      const attr = (element, names) => {
        for (const name of names) {
          const value = element?.getAttribute?.(name);
          if (value) return value;
        }
        return '';
      };
      const firstText = (container, selectors) => {
        for (const selector of selectors) {
          const element = container.querySelector(selector);
          const text = clean(element?.textContent || '');
          if (text && text.toLowerCase() !== 'shop on ebay') return text;
        }
        return '';
      };
      const firstAttr = (container, selectors, attrs) => {
        for (const selector of selectors) {
          const element = container.querySelector(selector);
          const value = attr(element, attrs);
          if (value) return value;
        }
        return '';
      };

      const containers = new Set();
      document.querySelectorAll('a[href*="/itm/"]').forEach((link) => {
        const container = link.closest(
          'li.s-item, li, article, div[data-viewport], div[class*="s-card"], div[class*="item-card"], div[class*="listing"]'
        );
        if (container) containers.add(container);
      });

      if (containers.size === 0) {
        document
          .querySelectorAll('span.s-card__price, .s-item__price, [data-testid="item-price"], [class*="price"]')
          .forEach((priceElement) => {
            const container = priceElement.closest(
              'li.s-item, li, article, div[data-viewport], div[class*="s-card"], div[class*="item-card"], div[class*="listing"]'
            );
            if (container) containers.add(container);
          });
      }

      return Array.from(containers).map((container) => {
        const searchText = clean(container.textContent || '');
        const title = firstText(container, [
          '.s-item__title span[role="heading"]',
          '.s-item__title > span',
          '.s-item__title',
          'h3.s-item__title',
          '[data-testid="item-title"]',
          '.su-styled-text.primary.default',
          '[class*="title"] span',
          '[class*="title"]',
          'h3',
          'a[href*="/itm/"]'
        ]);
        const price =
          priceFrom(
            firstText(container, [
              'span.s-card__price',
              '.s-item__price .notranslate',
              '.s-item__price',
              'span.s-item__price',
              '[data-testid="item-price"]',
              '.notranslate',
              '[class*="price"]'
            ])
          ) || priceFrom(searchText);
        const img = firstAttr(
          container,
          [
            'img.s-card__image',
            '.s-item__image img',
            'img[src*="ebayimg"]',
            '[data-testid="item-image"] img',
            'img'
          ],
          ['src', 'data-src', 'data-originalsrc']
        );
        const listingUrl = firstAttr(
          container,
          ['.s-item__link', 'a[href*="/itm/"]', '[data-testid="item-link"]', 'a'],
          ['href']
        );
        const soldInfo =
          firstText(container, [
            '.s-item__title--tag .POSITIVE',
            '.s-item__title--tagblock .POSITIVE',
            '.s-item__caption--signal .POSITIVE',
            'span.su-styled-text.positive.default',
            '.s-item__detail--primary',
            '.s-item__ended-date',
            '.s-item__ended',
            '[class*="sold"]',
            '[class*="ended"]'
          ]) || 'Recently sold';
        const location = firstText(container, [
          '.s-item__location',
          '.s-item__shipping',
          '[class*="location"]'
        ]);

        return {
          title,
          price,
          img,
          soldDate: 'Recently sold',
          soldInfo,
          listingUrl,
          location,
          searchText,
          marketplace
        };
      });
    }, marketplaceConfig.marketplace);

    const filtered = filterItemsCommon(rawItems);
    console.log(`Puppeteer extracted ${rawItems.length} raw items, ${filtered.length} after filtering`);
    return filtered;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const runAttempt = async (source, attempt, attempts) => {
  try {
    const data = await attempt();
    attempts.push({ source, count: data.length });
    return { source, data };
  } catch (error) {
    attempts.push({ source, error: error.message });
    console.log(`${source} failed:`, error.message);
    return { source, data: [] };
  }
};

const mergeItems = (results) => filterItemsCommon(results.flatMap((result) => result.data || []));

export default async function handler(req, res) {
  try {
    console.log('Starting eBay scraper...');

    const marketplaceKey = req.query.marketplace === 'us' ? 'us' : 'uk';
    const debug = req.query.debug === '1' || req.query.debug === 'true';
    const marketplaceConfig = MARKETPLACES[marketplaceKey];
    const urls = buildUrls(marketplaceConfig);
    const attempts = [];

    console.log(`Using ${marketplaceKey.toUpperCase()} marketplace`);
    console.log(`Keyword URL: ${urls.keyword}`);
    console.log(`Grader-filter URL: ${urls.graderFilter}`);

    let items = [];
    let scraperUsed = 'none';

    const lightweightAttempts = [
      ['mobile-keyword', () => scrapeWithHtmlFetch(urls.keyword, marketplaceConfig, 'mobile')],
      ['mobile-graded-keyword', () => scrapeWithHtmlFetch(urls.gradedKeyword, marketplaceConfig, 'mobile')],
      ['desktop-keyword', () => scrapeWithHtmlFetch(urls.keyword, marketplaceConfig, 'desktop')],
      ['rss-keyword', () => scrapeRSSFeed(urls.rssKeyword, marketplaceConfig)],
      ['jina-keyword', () => scrapeWithJinaProxy(urls.keyword, marketplaceConfig)]
    ];

    for (const [source, attempt] of lightweightAttempts) {
      const result = await runAttempt(source, attempt, attempts);
      if (result.data.length > 0) {
        items = mergeItems([result]);
        scraperUsed = source;
        break;
      }
    }

    if (items.length === 0) {
      const browserKeyword = await runAttempt(
        'puppeteer-keyword',
        () => scrapeWithPuppeteer(urls.keyword, marketplaceConfig),
        attempts
      );
      items = mergeItems([browserKeyword]);
      scraperUsed = browserKeyword.data.length > 0 ? browserKeyword.source : scraperUsed;
    }

    if (items.length === 0) {
      const browserGrader = await runAttempt(
        'puppeteer-grader-filter',
        () => scrapeWithPuppeteer(urls.graderFilter, marketplaceConfig),
        attempts
      );
      items = mergeItems([browserGrader]);
      scraperUsed = browserGrader.data.length > 0 ? browserGrader.source : scraperUsed;
    }

    if (items.length === 0 && req.query.includeDesktop === '1') {
      const desktopGrader = await runAttempt(
        'desktop-grader-filter',
        () => scrapeWithHtmlFetch(urls.graderFilter, marketplaceConfig, 'desktop'),
        attempts
      );
      items = mergeItems([desktopGrader]);
      scraperUsed = desktopGrader.data.length > 0 ? desktopGrader.source : scraperUsed;
    }

    if (items.length === 0) {
      console.log('No items found after all scraper attempts');
      return res.status(200).json({
        items: [],
        error: 'No items found',
        timestamp: new Date().toISOString(),
        message:
          'No current TAG graded Pokemon sold listings could be parsed from eBay. Recent sold listings do exist, so check scraper attempt logs for eBay access-denied or structure changes.',
        scraperUsed,
        ...(debug ? { attempts } : {})
      });
    }

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    res.status(200).json({
      items,
      timestamp: new Date().toISOString(),
      count: items.length,
      marketplace: marketplaceKey,
      scraperUsed,
      ...(debug ? { attempts } : {})
    });
  } catch (error) {
    console.error('Error scraping eBay:', error);
    res.status(500).json({
      error: 'Failed to scrape eBay data',
      message: error.message,
      timestamp: new Date().toISOString(),
      items: []
    });
  }
}
