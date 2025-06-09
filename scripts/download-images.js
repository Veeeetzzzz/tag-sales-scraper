#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createHash } = require('crypto');

const CACHE_DIR = path.join(__dirname, '..', 'public', 'cached-images');
const DATA_DIR = path.join(__dirname, '..', 'data', 'cards');

// Ensure cache directory exists
if (!fs.existsSync(CACHE_DIR)) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
}

function getImageHash(url) {
  return createHash('md5').update(url).digest('hex');
}

function getImageExtension(url, contentType) {
  const urlExt = path.extname(new URL(url).pathname).toLowerCase();
  if (urlExt) return urlExt;
  
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return '.jpg';
  if (contentType?.includes('png')) return '.png';
  if (contentType?.includes('webp')) return '.webp';
  if (contentType?.includes('gif')) return '.gif';
  
  return '.jpg';
}

async function downloadImage(url, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Downloading: ${url} (attempt ${attempt}/${maxRetries})`);
      
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        timeout: 10000 // 10 second timeout
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type');
      const imageBuffer = Buffer.from(await response.arrayBuffer());
      
      const imageHash = getImageHash(url);
      const extension = getImageExtension(url, contentType);
      const filename = `${imageHash}${extension}`;
      const filepath = path.join(CACHE_DIR, filename);
      
      fs.writeFileSync(filepath, imageBuffer);
      console.log(`✓ Saved: ${filename}`);
      
      return true;
    } catch (error) {
      console.error(`✗ Attempt ${attempt} failed for ${url}: ${error.message}`);
      
      if (attempt === maxRetries) {
        console.error(`✗ Final failure for ${url}`);
        return false;
      }
      
      // Wait before retry
      await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
    }
  }
  
  return false;
}

async function getAllImageUrls() {
  const imageUrls = new Set();
  
  try {
    const cardFiles = fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));
    
    for (const file of cardFiles) {
      try {
        const filePath = path.join(DATA_DIR, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const data = JSON.parse(content);
        
        if (data.cards && Array.isArray(data.cards)) {
          data.cards.forEach(card => {
            if (card.imageUrl && !card.imageUrl.startsWith('/')) {
              imageUrls.add(card.imageUrl);
            }
          });
        }
        
        console.log(`Processed ${file}: found ${data.cards?.length || 0} cards`);
      } catch (error) {
        console.error(`Error processing ${file}: ${error.message}`);
      }
    }
  } catch (error) {
    console.error(`Error reading card files: ${error.message}`);
  }
  
  return Array.from(imageUrls);
}

async function main() {
  console.log('🖼️  Pokemon Card Image Downloader');
  console.log('==================================');
  
  const imageUrls = await getAllImageUrls();
  console.log(`Found ${imageUrls.length} unique image URLs`);
  
  if (imageUrls.length === 0) {
    console.log('No images to download. Exiting.');
    return;
  }
  
  // Check which images are already cached
  const existingFiles = fs.readdirSync(CACHE_DIR);
  const existingHashes = new Set(existingFiles.map(file => file.split('.')[0]));
  
  const urlsToDownload = imageUrls.filter(url => {
    const hash = getImageHash(url);
    return !existingHashes.has(hash);
  });
  
  console.log(`${imageUrls.length - urlsToDownload.length} images already cached`);
  console.log(`${urlsToDownload.length} images to download`);
  
  if (urlsToDownload.length === 0) {
    console.log('All images are already cached! 🎉');
    return;
  }
  
  let successCount = 0;
  let failureCount = 0;
  
  for (let i = 0; i < urlsToDownload.length; i++) {
    const url = urlsToDownload[i];
    console.log(`\n[${i + 1}/${urlsToDownload.length}]`);
    
    const success = await downloadImage(url);
    if (success) {
      successCount++;
    } else {
      failureCount++;
    }
    
    // Small delay between downloads to be respectful
    if (i < urlsToDownload.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  
  console.log('\n📊 Download Summary');
  console.log('==================');
  console.log(`✓ Successful: ${successCount}`);
  console.log(`✗ Failed: ${failureCount}`);
  console.log(`📁 Total cached: ${fs.readdirSync(CACHE_DIR).length}`);
  
  if (failureCount > 0) {
    console.log('\n⚠️  Some downloads failed. You can run this script again to retry failed downloads.');
  } else {
    console.log('\n🎉 All images downloaded successfully!');
  }
}

// Handle command line arguments
const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Pokemon Card Image Downloader

Usage: node scripts/download-images.js [options]

Options:
  --help, -h     Show this help message
  
This script will:
1. Scan all card JSON files in data/cards/
2. Extract all imageUrl values
3. Download images that aren't already cached
4. Save images to public/cached-images/

Images are cached using MD5 hashes of their URLs to avoid duplicates.
`);
  process.exit(0);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { downloadImage, getAllImageUrls }; 