const puppeteer = require('puppeteer');

module.exports = async (req, res) => {
  const url = 'https://www.ebay.co.uk/sch/i.html?_nkw=TAG+10&_sacat=0&_from=R40&LH_PrefLoc=2&rt=nc&LH_Sold=1&LH_Complete=1';

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    headless: 'new'
  });
  const page = await browser.newPage();
  await page.goto(url, { waitUntil: 'domcontentloaded' });

  const items = await page.evaluate(() => {
    const listings = Array.from(document.querySelectorAll('.s-item'));
    return listings.map(item => {
      const title = item.querySelector('.s-item__title')?.textContent || '';
      const img = item.querySelector('.s-item__image-img')?.src || '';
      const price = item.querySelector('.s-item__price')?.textContent || '';
      const date = item.querySelector('.s-item__title--tagblock')?.textContent || ''; // often includes "Sold" info

      return { title, img, price, soldDate: date };
    }).filter(item => item.title && item.img && item.price);
  });

  await browser.close();
  res.setHeader('Cache-Control', 's-maxage=60'); // optional caching
  res.status(200).json({ items });
};
