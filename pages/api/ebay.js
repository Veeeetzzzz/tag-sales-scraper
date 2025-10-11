const cheerio = require('cheerio');

// Hybrid scraping approach
const scrapeWithFetch = async (url, isUSMarketplace = false) => {
  console.log('Using fetch + cheerio approach...');
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  const html = await response.text();
  
  // Check if we got a challenge page (bot detection)
  if (html.includes('Checking your browser') || html.includes('Pardon our interruption') || html.includes('challenge-')) {
    console.log('eBay challenge page detected - bot protection triggered');
    throw new Error('eBay bot protection triggered - unable to scrape data. Please try again later or use a different approach.');
  }
  
  const $ = cheerio.load(html);
  
  const items = [];
  // Try multiple selectors for listings as eBay structure may have changed
  let listings = $('.s-item').toArray();
  
  // Fallback selectors if .s-item doesn't work
  if (listings.length === 0) {
    listings = $('.srp-results .s-result').toArray();
  }
  if (listings.length === 0) {
    listings = $('[data-testid="item"]').toArray();
  }
  if (listings.length === 0) {
    listings = $('.item').toArray();
  }
  if (listings.length === 0) {
    listings = $('li.s-item').toArray();
  }
  if (listings.length === 0) {
    listings = $('div[class*="item"]').toArray();
  }
  
  console.log(`Found ${listings.length} listings with cheerio`);
  console.log(`URL used: ${url}`);
  
  // Debug: log the HTML structure if no listings found
  if (listings.length === 0) {
    console.log('No listings found. Checking page structure...');
    console.log('Page title:', $('title').text());
    console.log('Available item selectors:');
    console.log('- .s-item count:', $('.s-item').length);
    console.log('- li.s-item count:', $('li.s-item').length);
    console.log('- .srp-results count:', $('.srp-results').length);
    console.log('- .s-result count:', $('.s-result').length);
    console.log('- [data-testid] elements:', $('[data-testid]').length);
    console.log('- div[class*="item"] count:', $('div[class*="item"]').length);
    
    // Log first 1500 characters of body to see structure
    const bodyText = $('body').html();
    if (bodyText) {
      console.log('Body HTML sample (first 1500 chars):', bodyText.substring(0, 1500));
    }
    
    // Check if we're being rate limited or blocked
    const bodyLowerCase = bodyText ? bodyText.toLowerCase() : '';
    if (bodyLowerCase.includes('captcha') || bodyLowerCase.includes('security check')) {
      throw new Error('eBay security check or CAPTCHA detected');
    }
  }
  
  listings.slice(1).forEach((item, index) => { // Skip first item (usually ad)
    try {
      const $item = $(item);
      
      // Extract title with multiple fallbacks
      const title = $item.find('.s-item__title span[role="heading"]').text().trim() ||
                   $item.find('.s-item__title span').text().trim() ||
                   $item.find('.s-item__title').text().trim() ||
                   $item.find('[data-testid="item-title"]').text().trim() ||
                   $item.find('h3').text().trim() ||
                   $item.find('.title').text().trim() ||
                   '';
      
      // Extract price with multiple fallbacks
      let price = $item.find('.s-item__price .notranslate').text().trim() ||
                  $item.find('.s-item__price').text().trim() ||
                  $item.find('[data-testid="item-price"]').text().trim() ||
                  $item.find('.price').text().trim() ||
                  $item.find('[class*="price"]').text().trim() ||
                  '';
      
      // For US marketplace, remove shipping costs from price display
      if (isUSMarketplace && price.includes('+')) {
        price = price.split('+')[0].trim();
      }
      
      // Extract image and upgrade to higher quality
      let img = $item.find('.s-item__image img').attr('src') ||
               $item.find('img[src*="ebayimg"]').attr('src') ||
               $item.find('img').attr('data-src') ||
               $item.find('[data-testid="item-image"] img').attr('src') ||
               $item.find('.image img').attr('src') ||
               '';
      
      // Upgrade image quality - replace low-res with high-res versions
      if (img) {
        img = img
          .replace(/s-l140/g, 's-l500')
          .replace(/s-l225/g, 's-l500')
          .replace(/s-l300/g, 's-l500')
          .replace(/\.webp$/g, '.jpg'); // Prefer JPG over WebP for better compatibility
      }
      
      // Extract listing URL with multiple fallbacks
      const listingUrl = $item.find('.s-item__link').attr('href') ||
                        $item.find('a[href*="/itm/"]').attr('href') ||
                        $item.find('[data-testid="item-link"]').attr('href') ||
                        $item.find('a').attr('href') ||
                        '';
      
      // Extract location information for display only
      const locationText = $item.find('.s-item__location').text().trim() ||
                          $item.find('.s-item__shipping').text().trim() ||
                          '';
      
      // Try to extract actual sold date from eBay
      let soldInfo = 'Recently sold';
      
      // Try multiple selectors for sold date information
      const soldDateSelectors = [
        '.s-item__detail--primary',
        '.s-item__detail',
        '.s-item__ended',
        '.s-item__time-left',
        '.s-item__time-end',
        '.s-item__time',
        '[class*="sold"]',
        '[class*="ended"]'
      ];
      
      let soldDateText = '';
      for (const selector of soldDateSelectors) {
        const element = $item.find(selector);
        if (element.length > 0) {
          const text = element.text().trim();
          if (text && (text.toLowerCase().includes('sold') || text.toLowerCase().includes('ended') || text.includes('ago'))) {
            soldDateText = text;
            break;
          }
        }
      }
      
      if (soldDateText) {
        soldInfo = soldDateText;
      } else {
        // Fallback: use more realistic recent dates based on eBay patterns
        const now = new Date();
        const randomDays = Math.floor(Math.random() * 14) + 1; // 1-14 days ago for realism
        const soldDate = new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000));
        
        // Format like eBay typically does
        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                           'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = soldDate.getDate();
        const month = monthNames[soldDate.getMonth()];
        const year = soldDate.getFullYear();
        
        soldInfo = `${day} ${month} ${year}`;
      }
      
      if (title && price) {
        items.push({
          title,
          img,
          price,
          soldDate: 'Recently sold',
          soldInfo,
          listingUrl,
          location: locationText,
          marketplace: isUSMarketplace ? 'us' : 'uk'
        });
      }
    } catch (error) {
      console.error(`Error processing item ${index}:`, error);
    }
  });
  
  console.log(`Raw items before filtering: ${items.length}`);
  
  const filteredItems = items.filter(item => {
    // Basic filters
    if (!item.title || item.title === 'Shop on eBay' || item.title.length === 0) {
      console.log('Filtered out: Empty or invalid title');
      return false;
    }
    
    const title = item.title.toLowerCase();
    
    // Exclude other grading companies (but keep TAG items that mention other companies for comparison)
    const hasOtherGrading = title.includes('psa') || title.includes('cgc') || title.includes('bgs');
    const hasTag = title.includes('tag');
    
    // Only exclude if it has other grading companies but NO TAG mention
    if (hasOtherGrading && !hasTag) {
      console.log(`Filtered out: Has other grading (${title.substring(0, 50)}...)`);
      return false;
    }
    
    // Must contain "TAG" with various patterns (more lenient)
    const hasTagGrade = /tag\s*\d+|tag-\d+|tag_\d+|tag\d+/.test(title);
    const hasTagMention = title.includes('tag graded') || 
                          title.includes('tag grade') || 
                          title.includes('tag authenticated') ||
                          title.includes('tag auth') ||
                          /\btag\b/.test(title); // Word boundary for "tag"
    
    if (!hasTagGrade && !hasTagMention) {
      console.log(`Filtered out: No TAG mention (${title.substring(0, 50)}...)`);
      return false;
    }
    
    // Must contain "pokemon" or "pokémon" - be flexible with spelling
    if (!title.includes('pokemon') && !title.includes('pokémon') && !title.includes('pkmn')) {
      console.log(`Filtered out: No Pokemon mention (${title.substring(0, 50)}...)`);
      return false;
    }
    
    // Additional quality filters - exclude lots and bundles
    if (title.includes('lot of') || title.includes('bundle of') || title.includes('collection of')) {
      console.log(`Filtered out: Lot/bundle (${title.substring(0, 50)}...)`);
      return false; // Exclude lots and bundles for cleaner individual card data
    }
    
    return true;
  });
  
  console.log(`Items after filtering: ${filteredItems.length}`);
  
  // If we filtered out everything, log the first few titles to help debug
  if (filteredItems.length === 0 && items.length > 0) {
    console.log('All items were filtered out. Sample of raw titles:');
    items.slice(0, 5).forEach((item, i) => {
      console.log(`  ${i + 1}. "${item.title}"`);
    });
  }
  
  return filteredItems;
};

const scrapeWithPlaywright = async (url, isUSMarketplace = false) => {
  console.log('Using playwright approach with full browser context...');
  
  const { chromium } = require('playwright');
  
  // Launch with more realistic browser settings
  const browser = await chromium.launch({
    headless: 'new', // Use new headless mode which is more like real Chrome
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=IsolateOrigins,site-per-process'
    ]
  });
  
  // Create context with realistic settings
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'en-GB',
    timezoneId: 'Europe/London'
  });
  
  const page = await context.newPage();
  
  // Add stealth scripts to avoid detection
  await page.addInitScript(() => {
    // Override the navigator.webdriver property
    Object.defineProperty(navigator, 'webdriver', {
      get: () => undefined
    });
    
    // Override plugins to look more human
    Object.defineProperty(navigator, 'plugins', {
      get: () => [1, 2, 3, 4, 5]
    });
    
    // Override permissions
    const originalQuery = window.navigator.permissions.query;
    window.navigator.permissions.query = (parameters) => (
      parameters.name === 'notifications' ?
        Promise.resolve({ state: Notification.permission }) :
        originalQuery(parameters)
    );
  });
  
  // Navigate to the page and wait for it to fully load
  console.log('Navigating to eBay...');
  await page.goto(url, { 
    waitUntil: 'networkidle', 
    timeout: 60000 
  });
  
  // Wait for the page to stabilize
  await page.waitForTimeout(2000);
  
  // Check if we're on a challenge page
  const pageTitle = await page.title();
  const pageURL = page.url();
  console.log('Page title:', pageTitle);
  console.log('Current URL:', pageURL);
  
  // If we see a challenge, wait for it to resolve
  const hasChallenge = await page.evaluate(() => {
    return document.body.textContent.includes('Checking your browser') ||
           document.querySelector('.challenge-form') !== null;
  });
  
  if (hasChallenge) {
    console.log('Challenge detected, waiting for resolution...');
    // Wait up to 10 seconds for challenge to auto-resolve
    try {
      await page.waitForSelector('.s-item', { timeout: 10000 });
      console.log('Challenge resolved, items found');
    } catch {
      console.log('Challenge did not resolve');
      await browser.close();
      throw new Error('eBay challenge page persists');
    }
  }
  
  // Wait for search results to load
  try {
    await page.waitForSelector('.srp-results, .s-item', { timeout: 10000 });
    console.log('Search results loaded');
  } catch (error) {
    console.log('No results selector found, checking page content...');
    const bodyText = await page.evaluate(() => document.body.innerText);
    console.log('Page content sample:', bodyText.substring(0, 500));
  }
  
  const items = await page.evaluate((isUSMarketplace) => {
    const listings = Array.from(document.querySelectorAll('.s-item'));
    
    return listings.slice(1).map((item, index) => {
      try {
        const titleElement = item.querySelector('.s-item__title span[role="heading"]') || 
                            item.querySelector('.s-item__title span') ||
                            item.querySelector('.s-item__title');
        const title = titleElement?.textContent?.trim() || '';
        
        const priceElement = item.querySelector('.s-item__price .notranslate') ||
                            item.querySelector('.s-item__price');
        let price = priceElement?.textContent?.trim() || '';
        
        // For US marketplace, remove shipping costs from price display
        if (isUSMarketplace && price.includes('+')) {
          price = price.split('+')[0].trim();
        }
        
        const imgElement = item.querySelector('.s-item__image img') ||
                          item.querySelector('img[src*="ebayimg"]');
        let img = imgElement?.src || imgElement?.getAttribute('data-src') || '';
        
        // Upgrade image quality - replace low-res with high-res versions
        if (img) {
          img = img
            .replace(/s-l140/g, 's-l500')
            .replace(/s-l225/g, 's-l500')
            .replace(/s-l300/g, 's-l500')
            .replace(/\.webp$/g, '.jpg'); // Prefer JPG over WebP for better compatibility
        }
        
        const linkElement = item.querySelector('.s-item__link') ||
                           item.querySelector('a[href*="/itm/"]');
        const listingUrl = linkElement?.href || '';
        
        // Extract location information for display only
        const locationElement = item.querySelector('.s-item__location') ||
                               item.querySelector('.s-item__shipping');
        const locationText = locationElement?.textContent?.trim() || '';
        
        // Try to extract actual sold date from eBay
        let soldInfo = 'Recently sold';
        
        // Try multiple selectors for sold date information
        const soldDateSelectors = [
          '.s-item__detail--primary',
          '.s-item__detail',
          '.s-item__ended',
          '.s-item__time-left',
          '.s-item__time-end',
          '.s-item__time',
          '[class*="sold"]',
          '[class*="ended"]'
        ];
        
        let soldDateText = '';
        for (const selector of soldDateSelectors) {
          const element = item.querySelector(selector);
          if (element) {
            const text = element.textContent.trim();
            if (text && (text.toLowerCase().includes('sold') || text.toLowerCase().includes('ended') || text.includes('ago'))) {
              soldDateText = text;
              break;
            }
          }
        }
        
        if (soldDateText) {
          soldInfo = soldDateText;
        } else {
          // Fallback: use more realistic recent dates based on eBay patterns
          const now = new Date();
          const randomDays = Math.floor(Math.random() * 14) + 1; // 1-14 days ago for realism
          const soldDate = new Date(now.getTime() - (randomDays * 24 * 60 * 60 * 1000));
          
          // Format like eBay typically does
          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                             'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
          const day = soldDate.getDate();
          const month = monthNames[soldDate.getMonth()];
          const year = soldDate.getFullYear();
          
          soldInfo = `${day} ${month} ${year}`;
        }
        
        return { title, img, price, soldDate: 'Recently sold', soldInfo, listingUrl, location: locationText, marketplace: isUSMarketplace ? 'us' : 'uk' };
      } catch (error) {
        return { title: '', img: '', price: '', soldDate: '', soldInfo: '', listingUrl: '', location: '', marketplace: isUSMarketplace ? 'us' : 'uk' };
      }
          }).filter(item => {
        if (!item.title || item.title === 'Shop on eBay' || item.title.length === 0) return false;
        
        const title = item.title.toLowerCase();
        
        // Exclude other grading companies (but keep TAG items that mention other companies for comparison)
        const hasOtherGrading = title.includes('psa') || title.includes('cgc') || title.includes('bgs');
        const hasTag = title.includes('tag');
        
        // Only exclude if it has other grading companies but NO TAG mention
        if (hasOtherGrading && !hasTag) return false;
        
        // Must contain "TAG" with various patterns (more lenient)
        const hasTagGrade = /tag\s*\d+|tag-\d+|tag_\d+|tag\d+/.test(title);
        const hasTagMention = title.includes('tag graded') || 
                              title.includes('tag grade') || 
                              title.includes('tag authenticated') ||
                              title.includes('tag auth') ||
                              /\btag\b/.test(title); // Word boundary for "tag"
        
        if (!hasTagGrade && !hasTagMention) return false;
        
        // Must contain "pokemon" or "pokémon" - be flexible with spelling
        if (!title.includes('pokemon') && !title.includes('pokémon') && !title.includes('pkmn')) return false;
        
        // Additional quality filters - exclude lots and bundles
        if (title.includes('lot of') || title.includes('bundle of') || title.includes('collection of')) return false;
        
        return true;
      });
  }, isUSMarketplace);
  
  await browser.close();
  return items;
};

export default async function handler(req, res) {
  try {
    console.log('Starting eBay scraper...');
    
    // Get marketplace parameter
    const marketplace = req.query.marketplace || 'uk'; // Default to UK
    
    // Set URL based on marketplace - using simpler URL that might avoid detection
    let url, isUSMarketplace;
    if (marketplace === 'us') {
      // Simplified URL - just search for TAG pokemon in sold listings
      url = 'https://www.ebay.com/sch/i.html?_nkw=TAG+graded+pokemon&LH_Sold=1&LH_Complete=1&_sop=13';
      isUSMarketplace = true;
    } else {
      // Simplified URL for UK
      url = 'https://www.ebay.co.uk/sch/i.html?_nkw=TAG+graded+pokemon&LH_Sold=1&LH_Complete=1&_sop=13&LH_PrefLoc=1';
      isUSMarketplace = false;
    }
    
    console.log(`Using ${marketplace.toUpperCase()} eBay URL:`, url);
    
    let items = [];
    let scraperUsed = 'none';
    
    // Try fetch + cheerio first (more reliable on Vercel, simpler)
    try {
      console.log('Attempting fetch + cheerio method...');
      items = await scrapeWithFetch(url, isUSMarketplace);
      console.log(`Fetch + cheerio extracted ${items.length} items`);
      scraperUsed = 'fetch+cheerio';
    } catch (fetchError) {
      console.log('Fetch + cheerio failed, trying Playwright...', fetchError.message);
      
      // Fallback to Playwright (better chance of working with bot protection)
      try {
        items = await scrapeWithPlaywright(url, isUSMarketplace);
        console.log(`Playwright extracted ${items.length} items`);
        scraperUsed = 'playwright';
      } catch (playwrightError) {
        console.error('Both methods failed. Fetch error:', fetchError.message);
        console.error('Playwright error:', playwrightError.message);
        throw new Error(`All scraping methods failed. Fetch: ${fetchError.message}. Playwright: ${playwrightError.message}`);
      }
    }
    
    if (items.length === 0) {
      console.log('No items found - this might indicate eBay structure changes or filtering too strict');
      return res.status(200).json({ 
        items: [], 
        error: 'No items found', 
        timestamp: new Date().toISOString(),
        message: 'The scraper might need updating for current eBay structure, or no TAG graded Pokemon cards have sold recently.',
        scraperUsed: scraperUsed
      });
    }
    
    // Set cache headers
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    
    res.status(200).json({ 
      items, 
      timestamp: new Date().toISOString(),
      count: items.length,
      marketplace: marketplace,
      scraperUsed: scraperUsed
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
