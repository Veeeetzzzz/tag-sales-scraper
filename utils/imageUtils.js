/**
 * Check if running on Vercel or other serverless environment
 */
function isServerlessEnvironment() {
  return !!(
    process.env.VERCEL || 
    process.env.NETLIFY || 
    process.env.AWS_LAMBDA_FUNCTION_NAME ||
    (typeof window === 'undefined' && process.env.NODE_ENV === 'production')
  );
}

/**
 * Check if running in browser
 */
function isBrowser() {
  return typeof window !== 'undefined';
}

/**
 * Generate a proxied image URL that will cache the image locally
 * @param {string} originalUrl - The original external image URL
 * @returns {string} - The proxied URL or original URL if in serverless environment
 */
export function getProxiedImageUrl(originalUrl) {
  if (!originalUrl) return null;
  
  // If it's already a local URL, return as is
  if (originalUrl.startsWith('/') || (isBrowser() && originalUrl.includes(window.location.hostname))) {
    return originalUrl;
  }
  
  // In serverless environments (like Vercel), use direct URLs
  if (isBrowser()) {
    // Check if we're on a known serverless platform domain
    const hostname = window.location.hostname;
    if (hostname.includes('vercel.app') || hostname.includes('netlify.app') || hostname.includes('amazonaws.com')) {
      return originalUrl; // Use direct URL
    }
  } else if (isServerlessEnvironment()) {
    return originalUrl; // Use direct URL
  }
  
  // For local development, use proxy
  return `/api/image-proxy?url=${encodeURIComponent(originalUrl)}`;
}

/**
 * Get high-quality image URL (existing function from cards.js)
 * @param {string} originalUrl - The original image URL
 * @returns {string} - The upgraded URL
 */
export function getHighQualityImageUrl(originalUrl) {
  if (!originalUrl) return originalUrl;
  
  // Replace s-l140 with s-l500 for higher quality
  // Also handle other low-res formats
  return originalUrl
    .replace(/s-l140/g, 's-l500')
    .replace(/s-l225/g, 's-l500')
    .replace(/s-l300/g, 's-l500')
    .replace(/\.webp$/g, '.jpg'); // Prefer JPG over WebP for better compatibility
}

/**
 * Get optimized image URL with proxy and quality upgrades
 * @param {string} originalUrl - The original image URL
 * @returns {string} - The optimized and proxied URL (or direct URL in serverless)
 */
export function getOptimizedImageUrl(originalUrl) {
  if (!originalUrl) return null;
  
  const highQualityUrl = getHighQualityImageUrl(originalUrl);
  return getProxiedImageUrl(highQualityUrl);
}

/**
 * Generate a placeholder image URL
 * @param {number} width - Image width
 * @param {number} height - Image height
 * @param {string} text - Placeholder text
 * @returns {string} - Placeholder image URL
 */
export function getPlaceholderImageUrl(width = 250, height = 350, text = 'No Image') {
  // Use local fallback API in serverless environments for better reliability
  if (isBrowser()) {
    const hostname = window.location.hostname;
    if (hostname.includes('vercel.app') || hostname.includes('netlify.app') || hostname.includes('amazonaws.com')) {
      return `/api/image-fallback?width=${width}&height=${height}&text=${encodeURIComponent(text)}`;
    }
  } else if (isServerlessEnvironment()) {
    return `/api/image-fallback?width=${width}&height=${height}&text=${encodeURIComponent(text)}`;
  }
  
  // Fallback to external service for local development
  return `https://via.placeholder.com/${width}x${height}/e5e7eb/9ca3af?text=${encodeURIComponent(text)}`;
}

/**
 * Get card image with fallback logic
 * @param {object} card - Card object
 * @param {object} fallbackOptions - Fallback options
 * @returns {string} - Image URL
 */
export function getCardImageUrl(card, fallbackOptions = {}) {
  const { 
    width = 250, 
    height = 350, 
    useProxy = true,
    placeholderText = 'No Image'
  } = fallbackOptions;
  
  if (card?.imageUrl) {
    return useProxy ? getOptimizedImageUrl(card.imageUrl) : getHighQualityImageUrl(card.imageUrl);
  }
  
  // Fallback to placeholder
  return getPlaceholderImageUrl(width, height, placeholderText);
} 