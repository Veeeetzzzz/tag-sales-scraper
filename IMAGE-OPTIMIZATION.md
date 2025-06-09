# Image Optimization Guide

This project includes several image optimization features to improve loading times without requiring a CDN or external image database.

## How It Works

### 1. Image Proxy with Local Caching
- **API Endpoint**: `/api/image-proxy`
- **Function**: Downloads external images on first request and caches them locally
- **Benefits**: Faster subsequent loads, reduced external dependencies
- **Storage**: Images are cached in `public/cached-images/` using MD5 hashes

### 2. Automatic Image Quality Upgrades
- Automatically upgrades low-resolution eBay images (s-l140 → s-l500)
- Prefers JPG over WebP for better compatibility
- Handles multiple image sources (Serebii, Pokemon TCG API, eBay, etc.)

### 3. Lazy Loading & Error Handling
- Uses Intersection Observer for efficient lazy loading
- Graceful fallbacks for failed image loads
- Loading indicators and error states

## Usage

### Using the Optimized Image Component
```jsx
import OptimizedImage from '../components/OptimizedImage';

<OptimizedImage 
  src={card.imageUrl}
  alt={card.name}
  width={250}
  height={350}
  lazy={true}
  className="rounded-lg shadow-lg"
/>
```

### Using Utility Functions
```javascript
import { getOptimizedImageUrl, getCardImageUrl } from '../utils/imageUtils';

// Get proxied and optimized URL
const optimizedUrl = getOptimizedImageUrl(originalUrl);

// Get card image with fallbacks
const cardImageUrl = getCardImageUrl(card, { 
  useProxy: true,
  placeholderText: 'Loading...' 
});
```

## Batch Download Script

Pre-download all card images for faster loading:

```bash
# Download all missing images
npm run download-images

# Or run directly
node scripts/download-images.js
```

### Script Features:
- Scans all card JSON files for image URLs
- Only downloads images not already cached
- Includes retry logic and rate limiting
- Provides detailed progress and summary

## Cache Management

### Directory Structure:
```
public/
  cached-images/
    .gitkeep              # Keeps directory in git
    abc123def456.jpg      # Cached image (MD5 hash filename)
    789ghi012jkl.png      # Another cached image
```

### Cache Properties:
- **Filename**: MD5 hash of original URL + file extension
- **Deduplication**: Same image from different URLs cached once
- **Persistence**: Images persist between deployments
- **Git Ignored**: Cached images excluded from version control

## Performance Benefits

1. **First Load**: Image downloads via proxy (slight delay)
2. **Subsequent Loads**: Instant loading from local cache
3. **Lazy Loading**: Only loads images when they come into view
4. **Quality Upgrade**: Better image quality from external sources
5. **Error Resilience**: Graceful fallbacks for broken links

## Configuration

### Environment Considerations:
- **Development**: Images cached locally via proxy
- **Vercel/Netlify**: Uses direct URLs with quality upgrades (no caching)
- **Self-hosted**: Works out of the box with full caching
- **Serverless**: Automatically detects and uses direct URLs

### Customization Options:
- Cache directory location
- Image quality settings
- Lazy loading thresholds
- Error fallback images
- Download retry attempts

## Deployment Environments

### Vercel Deployment
The system automatically detects Vercel deployment and:
- Disables image proxy (not compatible with serverless)
- Uses direct external URLs with quality upgrades
- Falls back to local SVG placeholders for missing images
- Maintains lazy loading and error handling

### Local Development
- Full image proxy with persistent caching
- Downloads and caches images in `public/cached-images/`
- Faster subsequent loads

## Troubleshooting

### Common Issues:

1. **Images not loading**
   - Check if external URLs are accessible
   - Verify proxy API is running
   - Check browser network tab for errors

2. **Slow first loads**
   - Run batch download script to pre-cache
   - Consider using lazy loading
   - Check external server response times

3. **Disk space concerns**
   - Monitor `public/cached-images/` size
   - Implement cache cleanup if needed
   - Consider image compression

### Cache Cleanup:
```bash
# Remove all cached images
rm -rf public/cached-images/*

# Keep .gitkeep file
touch public/cached-images/.gitkeep
```

## Alternative Solutions

If the proxy approach doesn't work for your setup:

1. **Direct External URLs**: Disable proxy in utility functions
2. **CDN Integration**: Modify proxy to upload to CDN
3. **Build-time Download**: Move download script to build process
4. **External Image Service**: Use services like Cloudinary or ImageKit

## Technical Details

### Image Formats Supported:
- JPG/JPEG
- PNG  
- WebP
- GIF

### Browser Compatibility:
- Modern browsers with Intersection Observer support
- Fallback for older browsers (all images load immediately)

### Security Considerations:
- URL validation in proxy API
- User-Agent headers for external requests
- Rate limiting to prevent abuse
- No sensitive data in image URLs