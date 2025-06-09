import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';

const CACHE_DIR = path.join(process.cwd(), 'public', 'cached-images');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getImageHash(url) {
  return createHash('md5').update(url).digest('hex');
}

function getImageExtension(url, contentType) {
  // Try to get extension from URL first
  const urlExt = path.extname(new URL(url).pathname).toLowerCase();
  if (urlExt) return urlExt;
  
  // Fallback to content type
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return '.jpg';
  if (contentType?.includes('png')) return '.png';
  if (contentType?.includes('webp')) return '.webp';
  if (contentType?.includes('gif')) return '.gif';
  
  return '.jpg'; // Default fallback
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { url } = req.query;
  
  if (!url) {
    return res.status(400).json({ error: 'URL parameter is required' });
  }

  try {
    // Validate URL
    new URL(url);
  } catch (e) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  const imageHash = getImageHash(url);
  
  try {
    // Check if image is already cached
    const existingFiles = fs.readdirSync(CACHE_DIR);
    const cachedFile = existingFiles.find(file => file.startsWith(imageHash));
    
    if (cachedFile) {
      const cachedPath = path.join(CACHE_DIR, cachedFile);
      const stats = fs.statSync(cachedPath);
      const imageBuffer = fs.readFileSync(cachedPath);
      
      // Set appropriate headers
      const ext = path.extname(cachedFile).toLowerCase();
      let contentType = 'image/jpeg';
      if (ext === '.png') contentType = 'image/png';
      else if (ext === '.webp') contentType = 'image/webp';
      else if (ext === '.gif') contentType = 'image/gif';
      
      res.setHeader('Content-Type', contentType);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
      res.setHeader('Content-Length', stats.size);
      return res.send(imageBuffer);
    }

    // Download and cache the image
    console.log(`Downloading and caching image: ${url}`);
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type');
    const imageBuffer = Buffer.from(await response.arrayBuffer());
    
    // Determine file extension
    const extension = getImageExtension(url, contentType);
    const filename = `${imageHash}${extension}`;
    const filepath = path.join(CACHE_DIR, filename);
    
    // Save to cache
    fs.writeFileSync(filepath, imageBuffer);
    
    // Send response
    res.setHeader('Content-Type', contentType || 'image/jpeg');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Content-Length', imageBuffer.length);
    res.send(imageBuffer);
    
  } catch (error) {
    console.error('Error in image proxy:', error);
    
    // Return a placeholder image or error
    res.status(500).json({ 
      error: 'Failed to load image',
      message: error.message 
    });
  }
} 