# Deployment Checklist

## Pre-Deployment Steps

### 1. Verify Local Testing
- [ ] Run `npm run dev` and test locally
- [ ] Test UK marketplace: `http://localhost:3000/api/ebay?marketplace=uk`
- [ ] Test US marketplace: `http://localhost:3000/api/ebay?marketplace=us`
- [ ] Test card matcher: `http://localhost:3000/api/card-matcher`
- [ ] Check browser console for errors
- [ ] Verify items are displaying on home page

### 2. Review Changes
- [ ] Review `pages/api/card-matcher.js` - Fixed force reload bug
- [ ] Review `pages/api/ebay.js` - Improved scraping and filtering
- [ ] Review `vercel.json` - Increased timeouts and memory
- [ ] Review `next.config.js` - Added image domains
- [ ] Check `SCRAPER-FIXES.md` for detailed changes

### 3. Code Quality
- [x] No linting errors (verified)
- [ ] Run `npm run build` to check for build errors
- [ ] Check for TypeScript errors (if applicable)
- [ ] Review console warnings

## Deployment to Vercel

### Option 1: Deploy via Git (Recommended)
```bash
# Stage and commit changes
git add .
git commit -m "Fix scraper issues: improve filtering, fix card-matcher bug, optimize Vercel config"

# Push to main branch
git push origin main

# Vercel will auto-deploy
```

### Option 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI if not installed
npm i -g vercel

# Deploy to production
vercel --prod

# Follow prompts
```

### Option 3: Deploy via Vercel Dashboard
1. Go to Vercel Dashboard
2. Select your project
3. Click "Deployments"
4. Click "Redeploy" on latest deployment

## Post-Deployment Verification

### 1. Check Deployment Status
- [ ] Verify deployment succeeded on Vercel
- [ ] Check build logs for errors
- [ ] Verify all functions deployed correctly

### 2. Test Production Endpoints
```bash
# Replace YOUR_DOMAIN with your Vercel URL
export DOMAIN="https://tag-sales-tracker.vercel.app"

# Test UK marketplace
curl "$DOMAIN/api/ebay?marketplace=uk" | jq '.count'

# Test US marketplace
curl "$DOMAIN/api/ebay?marketplace=us" | jq '.count'

# Test card matcher
curl "$DOMAIN/api/card-matcher" | jq '.setCount'
```

### 3. Monitor Function Logs
```bash
# View real-time logs
vercel logs --follow

# Or check in Vercel Dashboard > Functions
```

### 4. Test User-Facing Pages
- [ ] Visit home page: `https://YOUR_DOMAIN/`
- [ ] Click "Refresh" button
- [ ] Wait for data to load
- [ ] Verify items display correctly
- [ ] Check UK/US marketplace switcher
- [ ] Test currency switcher
- [ ] Visit `/cards` page
- [ ] Visit `/best-offers` page
- [ ] Test search functionality
- [ ] Test grade filters

### 5. Performance Checks
- [ ] Check page load time (should be < 3s)
- [ ] Check API response time (should be < 30s)
- [ ] Verify images load correctly
- [ ] Test on mobile device
- [ ] Check browser console for errors

## Monitoring

### Key Metrics to Watch
1. **Function Success Rate**
   - Target: > 80% success rate
   - Check: Vercel Analytics > Functions

2. **Response Times**
   - Target: < 30s for eBay scraper
   - Check: Vercel Logs

3. **Error Rate**
   - Target: < 20% error rate
   - Check: Vercel Logs > Filter by "error"

4. **Memory Usage**
   - Target: < 1GB for eBay scraper
   - Check: Vercel Functions > Memory

### Set Up Alerts (Optional)
```bash
# Using Vercel integrations
# Add: Slack, Discord, or Email notifications
# For: Function errors, deployment failures
```

## Rollback Plan

If deployment fails or causes issues:

### Quick Rollback
```bash
# Via Vercel Dashboard
# 1. Go to Deployments
# 2. Find previous working deployment
# 3. Click "..." menu
# 4. Click "Promote to Production"

# Via Vercel CLI
vercel rollback
```

### Manual Rollback
```bash
# Revert git commits
git revert HEAD
git push origin main

# Wait for auto-deployment
```

## Common Issues and Solutions

### Issue: "No items found"
**Possible Causes:**
- eBay bot detection
- No recent TAG sales
- Filtering too strict
- Selector changes

**Solutions:**
1. Check Vercel logs for detailed error
2. Test other marketplace (UK/US)
3. Wait 5 minutes and retry
4. Check TEST-SCRAPER.md for debugging

### Issue: "Function timeout"
**Possible Causes:**
- Playwright taking too long
- Network issues
- eBay slow to respond

**Solutions:**
1. Increase maxDuration in vercel.json (already at 60s)
2. Check if fetch+cheerio is working (should be faster)
3. Monitor scraperUsed field in response

### Issue: "Out of memory"
**Possible Causes:**
- Playwright consuming too much memory
- Large card database

**Solutions:**
1. Check memory usage in Vercel logs
2. Already increased to 1024MB
3. Consider upgrading Vercel plan

### Issue: Images not loading
**Possible Causes:**
- Image domain not whitelisted
- eBay image URLs changed

**Solutions:**
1. Check next.config.js image domains
2. Verify image URLs in browser DevTools
3. Add missing domains to next.config.js

## Success Criteria

Deployment is successful when:
- [x] All files committed and pushed
- [ ] Vercel deployment completed
- [ ] No build errors
- [ ] API endpoints returning data
- [ ] Home page displaying items
- [ ] No console errors
- [ ] Images loading correctly
- [ ] Filters working
- [ ] Currency conversion working

## Next Steps

After successful deployment:
1. Monitor for 24 hours
2. Check analytics for traffic
3. Review error logs
4. Gather user feedback
5. Plan next improvements (see SCRAPER-FIXES.md)

## Support Resources

- **Vercel Docs:** https://vercel.com/docs
- **Next.js Docs:** https://nextjs.org/docs
- **Project README:** README.md
- **Scraper Fixes:** SCRAPER-FIXES.md
- **Testing Guide:** TEST-SCRAPER.md

## Notes

- Vercel free tier has function limits (60s max duration, 1GB memory)
- Consider upgrading to Pro if hitting limits
- Monitor usage to avoid hitting monthly quotas
- Keep an eye on eBay's terms of service
- Consider implementing official eBay API for production use

---

**Last Updated:** October 11, 2025
**Updated By:** AI Assistant
**Status:** Ready for Deployment

