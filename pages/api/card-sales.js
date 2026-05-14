import { getCardMatcher } from './card-matcher';
import { getEbaySales } from './ebay';

const normalizeMarketplaceItems = (data, marketplace) =>
  (data.items || []).map(item => ({
    ...item,
    marketplace: item.marketplace || marketplace
  }));

const flattenMatchedSales = (cardSales, unmatchedSales) => {
  const allSalesWithMatches = [];

  Object.values(cardSales).forEach(cardData => {
    cardData.sales.forEach(sale => {
      allSalesWithMatches.push({
        ...sale,
        matched: true,
        matchedCard: cardData.card,
        matchConfidence: sale.matchConfidence
      });
    });
  });

  unmatchedSales.forEach(sale => {
    allSalesWithMatches.push({
      ...sale,
      matched: false,
      matchedCard: null,
      matchConfidence: 0
    });
  });

  return allSalesWithMatches;
};

const fetchMarketplace = async (marketplace, debug) => {
  const data = await getEbaySales({
    marketplace,
    debug,
    includeBrowser: false,
    includeDesktop: false
  });
  return {
    marketplace,
    ok: !data.error,
    count: data.items?.length || 0,
    error: data.error || null,
    message: data.message || null,
    scraperUsed: data.scraperUsed || 'none',
    timestamp: data.timestamp,
    items: normalizeMarketplaceItems(data, marketplace)
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const debug = req.query.debug === '1' || req.query.debug === 'true';

  try {
    const [ukData, usData] = await Promise.all([
      fetchMarketplace('uk', debug),
      fetchMarketplace('us', debug)
    ]);
    const allItems = [...ukData.items, ...usData.items];
    const timestamp = new Date().toISOString();
    const sources = [
      {
        marketplace: ukData.marketplace,
        count: ukData.count,
        error: ukData.error,
        scraperUsed: ukData.scraperUsed,
        timestamp: ukData.timestamp
      },
      {
        marketplace: usData.marketplace,
        count: usData.count,
        error: usData.error,
        scraperUsed: usData.scraperUsed,
        timestamp: usData.timestamp
      }
    ];

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    if (allItems.length === 0) {
      return res.status(200).json({
        success: false,
        error: 'No sales data available from either marketplace',
        message: ukData.message || usData.message || 'No sales data available from either marketplace',
        allSales: [],
        cardSales: {},
        unmatchedSales: [],
        totalMatched: 0,
        totalUnmatched: 0,
        totalSales: 0,
        timestamp,
        sources,
        ...(debug ? { marketplaces: { uk: ukData, us: usData } } : {})
      });
    }

    const matcher = getCardMatcher();
    const matchData = await matcher.groupSalesByCard(allItems);
    const allSales = flattenMatchedSales(matchData.cardSales, matchData.unmatchedSales);

    return res.status(200).json({
      success: true,
      allSales,
      cardSales: matchData.cardSales,
      unmatchedSales: matchData.unmatchedSales,
      totalMatched: matchData.totalMatched,
      totalUnmatched: matchData.totalUnmatched,
      totalSales: allSales.length,
      timestamp,
      sources,
      ...(debug ? { marketplaces: { uk: ukData, us: usData } } : {})
    });
  } catch (error) {
    console.error('Error building card sales data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to load card sales data',
      message: error.message,
      allSales: [],
      cardSales: {},
      unmatchedSales: [],
      timestamp: new Date().toISOString()
    });
  }
}
