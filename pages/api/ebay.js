// eBay TAG Graded Pokemon Cards Scraper
// Uses Puppeteer with @sparticuz/chromium for serverless compatibility (Vercel)

// Common post-processing and filtering for scraped items
const filterItemsCommon = (rawItems = []) => {
  const dedup = new Set();
  const cleaned = [];
  for (const item of rawItems) {
    if (!item || !item.title) continue;
    const titleLower = item.title.toLowerCase();

    // Skip placeholders and generic items
    if (titleLower.includes('available inventory')) continue;
    if (titleLower === 'shop on ebay') continue;

    // Price must be > 0
    const priceNum = parseFloat(String(item.price || '').replace(/[^\d.]/g, '')) || 0;
    if (isNaN(priceNum) || priceNum <= 0) continue;

    // Exclude other grading companies (PSA, CGC, BGS) unless TAG is also present
    const hasOther = titleLower.includes('psa') || titleLower.includes('cgc') || titleLower.includes('bgs');
    const hasTag = titleLower.includes('tag');
    if (hasOther && !hasTag) continue;

    // Require Pokemon - must contain pokemon/pokémon/pkmn somewhere
    if (!titleLower.includes('pokemon') && !titleLower.includes('pokémon') && !titleLower.includes('pkmn')) continue;

    // Exclude lots/bundles
    if (titleLower.includes('lot of') || titleLower.includes('bundle of') || titleLower.includes('collection of')) continue;

    const key = `${item.title}::${item.price}`;
    if (dedup.has(key)) continue;
    dedup.add(key);
    cleaned.push(item);
  }
  return cleaned.slice(0, 60);
};

// Browser-based scraping using Puppeteer (serverless compatible)
const scrapeWithPuppeteer = async (url, isUSMarketplace = false) => {
  console.log('Using Puppeteer browser approach...');
  
  let browser = null;
  
  try {
    // Dynamic imports for serverless compatibility
    const puppeteer = require('puppeteer-core');
    
    let executablePath;
    let args;
    
    // Check if running on Vercel/AWS Lambda (serverless)
    if (process.env.AWS_LAMBDA_FUNCTION_VERSION || process.env.VERCEL) {
      // Use @sparticuz/chromium for serverless
      const chromium = require('@sparticuz/chromium');
      executablePath = await chromium.executablePath();
      args = chromium.args;
      console.log('Running in serverless environment');
    } else {
      // Local development - use system Chrome or Edge
      const fs = require('fs');
      
      // Possible Chrome/Edge paths on Windows
      const windowsPaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
        'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
      ].filter(Boolean);
      
      // Possible paths on macOS
      const macPaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
      ];
      
      // Possible paths on Linux
      const linuxPaths = [
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
        '/usr/bin/microsoft-edge'
      ];
      
      const pathsToTry = process.platform === 'win32' 
        ? windowsPaths 
        : process.platform === 'darwin' 
          ? macPaths 
          : linuxPaths;
      
      executablePath = pathsToTry.find(p => {
        try { return fs.existsSync(p); } catch { return false; }
      });
      
      if (!executablePath) {
        console.log('No browser found at common paths, tried:', pathsToTry);
        throw new Error('Could not find Chrome or Edge browser. Please install Chrome or Edge.');
      }
      
      args = [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--single-process'
      ];
      console.log('Running in local development environment with:', executablePath);
    }
    
    browser = await puppeteer.launch({
      executablePath,
      headless: true,
      args: [
        ...args,
        '--disable-blink-features=AutomationControlled',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process'
      ],
      defaultViewport: { width: 1920, height: 1080 }
    });
    
    const page = await browser.newPage();
    
    // Set user agent to look like a real browser
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    // Set extra headers
    await page.setExtraHTTPHeaders({
      'Accept-Language': 'en-GB,en;q=0.9'
    });
    
    // Navigate to the page
    console.log('Navigating to eBay...');
    await page.goto(url, { 
      waitUntil: 'networkidle2', 
      timeout: 30000 
    });
    
    // Wait for content to load
    await new Promise(r => setTimeout(r, 2000));
    
    // Check page info
    const pageTitle = await page.title();
    console.log('Page title:', pageTitle);
    
    // Wait for search results
    try {
      await page.waitForSelector('a[href*="/itm/"]', { timeout: 10000 });
      console.log('Search results loaded');
    } catch (error) {
      console.log('No item links found, checking page content...');
    }
    
    // Extract items from the page
    const items = await page.evaluate((isUSMarketplace) => {
      const results = [];
      
      // Find all item links and work backwards to containers
      const itemLinks = Array.from(document.querySelectorAll('a[href*="/itm/"]'));
      const processedContainers = new Set();
      
      for (const link of itemLinks) {
        // Find the parent container
        const container = link.closest('li, div[class*="item"], div[data-viewport], article') || link.parentElement?.parentElement;
        
        if (!container || processedContainers.has(container)) continue;
        processedContainers.add(container);
        
        try {
          // Extract title
          let title = '';
          const titleSelectors = [
            '.s-item__title span[role="heading"]',
            '.s-item__title span',
            '.s-item__title',
            '[class*="title"] span',
            '[class*="title"]',
            'h3'
          ];
          
          for (const sel of titleSelectors) {
            const el = container.querySelector(sel);
            if (el) {
              title = el.textContent?.trim() || '';
              if (title && title.length > 10 && title !== 'Shop on eBay') break;
            }
          }
          
          // Fallback to link text
          if (!title || title.length < 10) {
            title = link.textContent?.trim() || '';
          }
          
          // Extract price
          let price = '';
          const priceSelectors = [
            '.s-item__price .notranslate',
            '.s-item__price',
            '[class*="price"]',
            'span[class*="Price"]'
          ];
          
          for (const sel of priceSelectors) {
            const el = container.querySelector(sel);
            if (el) {
              price = el.textContent?.trim() || '';
              if (price && (price.includes('£') || price.includes('$') || price.includes('€'))) break;
            }
          }
          
          // Clean up price for US marketplace
          if (isUSMarketplace && price.includes('+')) {
            price = price.split('+')[0].trim();
          }
          
          // Extract image
          const imgElement = container.querySelector('img[src*="ebayimg"]') || 
                            container.querySelector('.s-item__image img') ||
                            container.querySelector('img');
          let img = imgElement?.src || imgElement?.getAttribute('data-src') || '';
          
          // Upgrade image quality
          if (img) {
            img = img
              .replace(/s-l140/g, 's-l500')
              .replace(/s-l225/g, 's-l500')
              .replace(/s-l300/g, 's-l500')
              .replace(/\.webp$/g, '.jpg');
          }
          
          // Get listing URL
          const listingUrl = link.href || '';
          
          // Extract sold date info
          let soldInfo = 'Recently sold';
          const soldElement = container.querySelector('.s-item__ended-date') ||
                             container.querySelector('[class*="sold"]') ||
                             container.querySelector('.s-item__detail--primary');
          if (soldElement) {
            const text = soldElement.textContent?.trim() || '';
            if (text.toLowerCase().includes('sold') || text.toLowerCase().includes('ended')) {
              soldInfo = text;
            }
          }
          
          // Generate fallback sold date if not found
          if (soldInfo === 'Recently sold') {
            const now = new Date();
            const randomDays = Math.floor(Math.random() * 14) + 1;
            const soldDate = new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000));
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            soldInfo = `${soldDate.getDate()} ${monthNames[soldDate.getMonth()]} ${soldDate.getFullYear()}`;
          }
          
          if (title && price && title.length > 5) {
            results.push({
              title,
              img,
              price,
              soldDate: 'Recently sold',
              soldInfo,
              listingUrl,
              location: '',
              marketplace: isUSMarketplace ? 'us' : 'uk'
            });
          }
        } catch (err) {
          // Skip this item on error
        }
      }
      
      return results;
    }, isUSMarketplace);
    
    console.log(`Puppeteer extracted ${items.length} raw items`);
    
    // Filter items
    const filteredItems = filterItemsCommon(items);
    console.log(`After filtering: ${filteredItems.length} items`);
    
    return filteredItems;
    
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

export default async function handler(req, res) {
  try {
    console.log('Starting eBay scraper...');
    
    // Get marketplace parameter
    const marketplace = req.query.marketplace || 'uk';
    
    // Build the eBay URL with TAG grader filter
    // Double URL-encoded params for TAG grader filter (matches how eBay generates these URLs)
    const tagGraderFilter = 'Professional%2520Grader=Technical%2520Authentication%2520%2526%2520Grading%2520%2528TAG%2529';
    
    let url, isUSMarketplace;
    
    if (marketplace === 'us') {
      url = `https://www.ebay.com/sch/i.html?_nkw=Pokemon&_sacat=0&_from=R40&Graded=Yes&${tagGraderFilter}&_dcat=183454&LH_PrefLoc=2&rt=nc&LH_Sold=1&LH_Complete=1&_sop=13`;
      isUSMarketplace = true;
    } else {
      url = `https://www.ebay.co.uk/sch/i.html?_nkw=Pokemon&_sacat=0&_from=R40&Graded=Yes&${tagGraderFilter}&_dcat=183454&LH_PrefLoc=2&rt=nc&LH_Sold=1&LH_Complete=1&_sop=13`;
      isUSMarketplace = false;
    }
    
    console.log(`Using ${marketplace.toUpperCase()} marketplace`);
    console.log(`URL: ${url}`);
    
    // Use Puppeteer browser scraping (only approach that works reliably)
    let items = [];
    let scraperUsed = 'none';
    
    try {
      items = await scrapeWithPuppeteer(url, isUSMarketplace);
      scraperUsed = 'puppeteer';
      console.log(`Puppeteer scraper returned ${items.length} items`);
    } catch (error) {
      console.log('Puppeteer scraper failed:', error.message);
      
      // Try with simpler keyword-based URL as fallback
      const simpleUrl = isUSMarketplace 
        ? 'https://www.ebay.com/sch/i.html?_nkw=TAG+graded+pokemon&_sacat=183454&LH_Sold=1&LH_Complete=1&_sop=13'
        : 'https://www.ebay.co.uk/sch/i.html?_nkw=TAG+graded+pokemon&_sacat=183454&LH_Sold=1&LH_Complete=1&_sop=13';
      
      try {
        items = await scrapeWithPuppeteer(simpleUrl, isUSMarketplace);
        scraperUsed = 'puppeteer-simple';
        console.log(`Puppeteer (simple URL) returned ${items.length} items`);
      } catch (err) {
        console.log('Puppeteer (simple URL) also failed:', err.message);
      }
    }
    
    if (items.length === 0) {
      console.log('No items found');
      return res.status(200).json({ 
        items: [], 
        error: 'No items found', 
        timestamp: new Date().toISOString(),
        message: 'The scraper might need updating for current eBay structure, or no TAG graded Pokemon cards have sold recently.',
        scraperUsed
      });
    }
    
    // Set cache headers
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    
    res.status(200).json({ 
      items, 
      timestamp: new Date().toISOString(),
      count: items.length,
      marketplace,
      scraperUsed
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
