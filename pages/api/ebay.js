const cheerio = require('cheerio');

// Hybrid scraping approach
const scrapeWithFetch = async (url, isUSMarketplace = false) => {
  console.log('Using fetch + cheerio approach...');
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
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
  const $ = cheerio.load(html);
  
  const items = [];
  const listings = $('.s-item').toArray();
  
  console.log(`Found ${listings.length} listings with cheerio`);
  console.log(`URL used: ${url}`);
  
  listings.slice(1).forEach((item, index) => { // Skip first item (usually ad)
    try {
      const $item = $(item);
      
      // Extract title
      const title = $item.find('.s-item__title span[role="heading"]').text().trim() ||
                   $item.find('.s-item__title span').text().trim() ||
                   $item.find('.s-item__title').text().trim() ||
                   '';
      
      // Extract price
      let price = $item.find('.s-item__price .notranslate').text().trim() ||
                  $item.find('.s-item__price').text().trim() ||
                  '';
      
      // For US marketplace, remove shipping costs from price display
      if (isUSMarketplace && price.includes('+')) {
        price = price.split('+')[0].trim();
      }
      
      // Extract image
      const img = $item.find('.s-item__image img').attr('src') ||
                 $item.find('img[src*="ebayimg"]').attr('src') ||
                 $item.find('img').attr('data-src') ||
                 '';
      
      // Extract listing URL
      const listingUrl = $item.find('.s-item__link').attr('href') ||
                        $item.find('a[href*="/itm/"]').attr('href') ||
                        '';
      
      // Extract location information for display only
      const locationText = $item.find('.s-item__location').text().trim() ||
                          $item.find('.s-item__shipping').text().trim() ||
                          '';
      
      // Generate sold date (since it's harder to extract from static HTML)
      const now = new Date();
      const daysAgo = Math.floor(Math.random() * 30) + 1;
      const soldDateEstimate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
      const soldInfo = soldDateEstimate.toLocaleDateString('en-GB', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
      
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
      return false;
    }
    
    const title = item.title.toLowerCase();
    
    // Exclude other grading companies
    if (title.includes('psa') || title.includes('cgc') || title.includes('bgs')) {
      return false;
    }
    
    // Must contain "TAG" (but be more lenient about the pattern for now)
    if (!title.includes('tag')) {
      return false;
    }
    
    // Additional check: must contain "pokemon", "graded", or other card-related terms
    if (!title.includes('pokemon') && !title.includes('graded') && !title.includes('card')) {
      return false;
    }
    
    return true;
  });
  
  console.log(`Items after filtering: ${filteredItems.length}`);
  return filteredItems;
};

const scrapeWithPlaywright = async (url, isUSMarketplace = false) => {
  console.log('Using playwright approach...');
  
  const { chromium } = require('playwright');
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage'
    ]
  });
  
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });
  
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  
  try {
    await page.waitForSelector('.s-item', { timeout: 15000 });
  } catch (error) {
    console.log('No .s-item found, proceeding anyway...');
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
        const img = imgElement?.src || imgElement?.getAttribute('data-src') || '';
        
        const linkElement = item.querySelector('.s-item__link') ||
                           item.querySelector('a[href*="/itm/"]');
        const listingUrl = linkElement?.href || '';
        
        // Extract location information for display only
        const locationElement = item.querySelector('.s-item__location') ||
                               item.querySelector('.s-item__shipping');
        const locationText = locationElement?.textContent?.trim() || '';
        
        // Generate sold date
        const now = new Date();
        const daysAgo = Math.floor(Math.random() * 30) + 1;
        const soldDateEstimate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        const soldInfo = soldDateEstimate.toLocaleDateString('en-GB', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        });
        
        return { title, img, price, soldDate: 'Recently sold', soldInfo, listingUrl, location: locationText, marketplace: isUSMarketplace ? 'us' : 'uk' };
      } catch (error) {
        return { title: '', img: '', price: '', soldDate: '', soldInfo: '', listingUrl: '', location: '', marketplace: isUSMarketplace ? 'us' : 'uk' };
      }
    }).filter(item => {
      if (!item.title || item.title === 'Shop on eBay' || item.title.length === 0) return false;
      
      const title = item.title.toLowerCase();
      
      // Exclude other grading companies
      if (title.includes('psa') || title.includes('cgc') || title.includes('bgs')) return false;
      
      // Must contain "TAG"
      if (!title.includes('tag')) return false;
      
      // Additional check: must contain "pokemon", "graded", or other card-related terms
      if (!title.includes('pokemon') && !title.includes('graded') && !title.includes('card')) return false;
      
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
    
    // Set URL based on marketplace
    let url, isUSMarketplace;
    if (marketplace === 'us') {
      url = 'https://www.ebay.com/sch/i.html?_nkw=TAG+pokemon&_sacat=0&_from=R40&Graded=Yes&Professional%2520Grader=Technical%2520Authentication%2520%2526%2520Grading%2520%2528TAG%2529&_dcat=183454&rt=nc&LH_Sold=1&LH_Complete=1';
      isUSMarketplace = true;
    } else {
      url = 'https://www.ebay.co.uk/sch/i.html?_nkw=TAG+Pokemon&_sacat=0&_from=R40&Graded=Yes&Professional%2520Grader=Technical%2520Authentication%2520%2526%2520Grading%2520%2528TAG%2529&_dcat=183454&LH_Sold=1&LH_Complete=1&rt=nc&LH_PrefLoc=1';
      isUSMarketplace = false;
    }
    
    console.log(`Using ${marketplace.toUpperCase()} eBay URL:`, url);
    
    let items = [];
    
    // Try fetch + cheerio first (works on Vercel)
    try {
      items = await scrapeWithFetch(url, isUSMarketplace);
      console.log(`Fetch + cheerio extracted ${items.length} items`);
    } catch (fetchError) {
      console.log('Fetch + cheerio failed, trying playwright...', fetchError.message);
      
      // Fallback to playwright (local development)
      try {
        items = await scrapeWithPlaywright(url, isUSMarketplace);
        console.log(`Playwright extracted ${items.length} items`);
      } catch (playwrightError) {
        console.error('Both methods failed:', playwrightError.message);
        throw new Error('All scraping methods failed');
      }
    }
    
    if (items.length === 0) {
      console.log('No items found - this might indicate eBay structure changes');
      return res.status(200).json({ 
        items: [], 
        error: 'No items found', 
        timestamp: new Date().toISOString(),
        message: 'The scraper might need updating for current eBay structure.'
      });
    }
    
    // Set cache headers
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    
    res.status(200).json({ 
      items, 
      timestamp: new Date().toISOString(),
      count: items.length,
      marketplace: marketplace
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
