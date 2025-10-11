# Scraper Testing Guide

## Quick Test Commands

### 1. Test eBay Scraper (UK)
```bash
# Using curl
curl "http://localhost:3000/api/ebay?marketplace=uk" | jq

# Or in browser
http://localhost:3000/api/ebay?marketplace=uk
```

### 2. Test eBay Scraper (US)
```bash
curl "http://localhost:3000/api/ebay?marketplace=us" | jq

# Or in browser
http://localhost:3000/api/ebay?marketplace=us
```

### 3. Test Card Matcher
```bash
# Get all sets
curl "http://localhost:3000/api/card-matcher" | jq

# Reload card database
curl "http://localhost:3000/api/card-matcher?action=reload" | jq
```

### 4. Test Card Matcher with Sample Data
```bash
curl -X POST "http://localhost:3000/api/card-matcher" \
  -H "Content-Type: application/json" \
  -d '{
    "sales": [
      {
        "title": "Pokemon TAG 10 Pikachu VMAX White Flare",
        "price": "£25.00",
        "soldDate": "Recently sold"
      }
    ]
  }' | jq
```

## Expected Responses

### Successful eBay Scrape
```json
{
  "items": [
    {
      "title": "Pokemon TAG 9 Charizard...",
      "img": "https://i.ebayimg.com/...",
      "price": "£45.00",
      "soldDate": "Recently sold",
      "soldInfo": "7 Jun 2025",
      "listingUrl": "https://www.ebay.co.uk/itm/...",
      "location": "United Kingdom",
      "marketplace": "uk"
    }
  ],
  "timestamp": "2025-10-11T12:00:00.000Z",
  "count": 50,
  "marketplace": "uk",
  "scraperUsed": "fetch+cheerio"
}
```

### Failed Scrape (No Items)
```json
{
  "items": [],
  "error": "No items found",
  "timestamp": "2025-10-11T12:00:00.000Z",
  "message": "The scraper might need updating for current eBay structure, or no TAG graded Pokemon cards have sold recently.",
  "scraperUsed": "fetch+cheerio"
}
```

### Error Response
```json
{
  "error": "Failed to scrape eBay data",
  "message": "All scraping methods failed. Fetch: eBay bot protection triggered. Playwright: ...",
  "timestamp": "2025-10-11T12:00:00.000Z",
  "items": []
}
```

## Troubleshooting

### No Items Returned
1. **Check Vercel Logs:**
   ```bash
   vercel logs
   ```
   Look for:
   - "Found X listings with cheerio"
   - "Raw items before filtering: X"
   - "Items after filtering: X"
   - "Filtered out: [reason]"

2. **Common Issues:**
   - **eBay Structure Changed:** Selectors may need updating
   - **Bot Detection:** eBay blocking requests
   - **Filtering Too Strict:** Items being filtered out
   - **No Recent Sales:** No TAG cards sold recently

### Bot Protection Triggered
If you see "eBay bot protection triggered":
1. Wait a few minutes before retrying
2. Try the other marketplace (UK/US)
3. Check if Playwright is working (may need Vercel Pro plan)

### Playwright Fails on Vercel
Playwright requires additional setup on Vercel:
1. Install playwright: `npm install playwright`
2. May need Vercel Pro for extended function duration
3. Fallback to fetch+cheerio will still work

### All Items Filtered Out
Check logs for "Filtered out: [reason]" messages:
- "No TAG mention" - Title doesn't contain TAG
- "No Pokemon mention" - Title doesn't mention Pokemon
- "Has other grading" - Has PSA/CGC/BGS but not TAG
- "Lot/bundle" - Item is a lot or bundle

## Manual Testing in Browser

### 1. Test on Local Dev Server
```bash
npm run dev
# Open http://localhost:3000
# Click "Refresh" button
# Check browser console for logs
```

### 2. Test on Vercel Deployment
```bash
# Deploy to Vercel
vercel --prod

# Visit your Vercel URL
# Click "Refresh" button
# Check Vercel function logs
```

## Verifying Fixes

### 1. Card Matcher Bug Fix
```bash
# Should not clear data after loading
curl "http://localhost:3000/api/card-matcher?action=reload"
# Check response has cards: {"success": true, "message": "Card database reloaded successfully"}
```

### 2. Scraper Method Order
```bash
# Check which scraper was used
curl "http://localhost:3000/api/ebay?marketplace=uk" | jq '.scraperUsed'
# Should show "fetch+cheerio" or "playwright"
```

### 3. Improved Filtering
```bash
# Check filtered items count in logs
# Should see more items passing through filters
```

## Performance Metrics

Monitor these metrics:
- **Response Time:** Should be < 10s for fetch+cheerio, < 30s for Playwright
- **Success Rate:** Should be > 80%
- **Items Returned:** Should be 20-60 items per marketplace
- **Filter Pass Rate:** Should be > 70% of raw items passing filters

## Automated Testing (Future)

Consider adding:
```javascript
// tests/scraper.test.js
describe('eBay Scraper', () => {
  it('should scrape UK marketplace', async () => {
    const response = await fetch('/api/ebay?marketplace=uk');
    const data = await response.json();
    expect(data.items).toBeDefined();
    expect(data.count).toBeGreaterThan(0);
  });
  
  it('should filter TAG items correctly', () => {
    const testTitle = 'Pokemon TAG 10 Pikachu VMAX';
    // Test filtering logic
  });
});
```

## Contact

If issues persist after testing:
1. Check GitHub issues
2. Review Vercel function logs
3. Test eBay URLs manually in browser
4. Consider eBay API as alternative

