# Scraper Fixes - Summary

## Issues Found and Fixed

### 1. Critical Bug in `pages/api/card-matcher.js`
**Issue:** Lines 48-62 had a logic error where the code attempted to clear `cards` and `sets` arrays AFTER the try-catch block that populates them. This would cause data to be unexpectedly cleared during force reload operations.

**Fix:**
- Moved the force reload logic to the beginning of the `loadCards()` function
- Now properly clears data BEFORE attempting to reload
- Added filter to exclude `.backup` files from loading
- Improved error handling to reset `initialized` flag on failure

### 2. Scraper Method Order in `pages/api/ebay.js`
**Issue:** The code tried Playwright first, then fell back to fetch+cheerio. However, Playwright is heavier and may not work well on Vercel's serverless environment.

**Fix:**
- Reversed the order: now tries fetch+cheerio first (more reliable on Vercel)
- Falls back to Playwright only if fetch+cheerio fails
- Added `scraperUsed` field to response to track which method succeeded
- Improved error messages to show both failure reasons

### 3. Improved Selector Fallbacks
**Issue:** Limited fallback selectors for finding eBay listings, which could fail if eBay changes their HTML structure.

**Fix:**
- Added more selector variations:
  - `$('li.s-item')` - explicit li element
  - `$('div[class*="item"]')` - wildcard class matching
- Enhanced debugging output with more selector counts
- Added detection for CAPTCHA/security checks

### 4. Overly Strict Filtering
**Issue:** Filtering logic was too strict and could exclude valid TAG graded Pokemon cards.

**Fix:**
- More lenient TAG detection patterns:
  - Added support for "tag authenticated", "tag auth"
  - Added word boundary regex `/\btag\b/` to catch standalone "TAG"
  - Support for various formats: `tag10`, `tag-10`, `tag_10`, `tag 10`
- Flexible Pokemon spelling:
  - Now accepts "pokemon", "pokémon", "pkmn"
- Improved grading company filtering:
  - Only excludes items with PSA/CGC/BGS if they DON'T mention TAG
  - Allows comparisons like "TAG vs PSA" in titles
- Better lot/bundle detection:
  - Changed from simple word match to phrase match ("lot of", "bundle of", "collection of")
- Enhanced debugging:
  - Logs which items are filtered and why
  - Shows sample titles when all items are filtered out

### 5. Better Error Messages
**Issue:** Generic error messages made it hard to diagnose scraping failures.

**Fix:**
- More descriptive error messages
- Combined error messages when both methods fail
- Added context about potential causes (structure changes, no recent sales, etc.)

## Testing Recommendations

1. **Test UK Marketplace:**
   ```bash
   curl http://localhost:3000/api/ebay?marketplace=uk
   ```

2. **Test US Marketplace:**
   ```bash
   curl http://localhost:3000/api/ebay?marketplace=us
   ```

3. **Check Card Matcher:**
   ```bash
   curl http://localhost:3000/api/card-matcher?action=reload
   ```

4. **Monitor Logs:**
   - Check Vercel logs for scraper output
   - Look for "scraperUsed" field in responses
   - Monitor which filtering rules are being triggered

## Deployment Notes

- These fixes maintain backward compatibility
- No database schema changes required
- No new dependencies added
- Should work immediately after deployment

## Potential Future Improvements

1. **Rate Limiting:** Add exponential backoff for failed requests
2. **Caching:** Implement Redis caching for scraped data
3. **Proxy Support:** Add proxy rotation for more reliable scraping
4. **Webhooks:** Add webhook notifications for scraping failures
5. **Alternative Data Sources:** Consider eBay's official API as backup
6. **Health Checks:** Add endpoint to test scraper health
7. **Metrics:** Track success/failure rates of each scraping method

## Known Limitations

- eBay may still block requests due to bot detection
- Playwright may not work on all Vercel plans (requires specific runtime)
- No real-time updates (relies on client refresh or scheduled jobs)
- Limited by eBay's rate limiting and anti-scraping measures

## Support

If scraping continues to fail:
1. Check Vercel function logs for detailed error messages
2. Verify eBay URLs are still valid
3. Test selectors manually using browser DevTools
4. Consider implementing eBay's official API for more reliable data access

