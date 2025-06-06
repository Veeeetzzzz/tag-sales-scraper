import Head from 'next/head'

const SEOHead = ({ 
  title = "TAG Sales Tracker - Pokemon Card Market Data & Pricing",
  description = "Track TAG (Technical Authentication & Grading) Pokemon card sales from eBay UK and US marketplaces. Get real-time pricing data, market analytics, and sales history for graded Pokemon cards.",
  keywords = "TAG graded Pokemon cards, Pokemon card prices, eBay Pokemon sales, graded card market, Pokemon card values, TAG authentication, Pokemon TCG prices, card grading, Pokemon investments",
  canonicalUrl = "https://tag-sales-tracker.vercel.app",
  ogImage = "https://tag-sales-tracker.vercel.app/og-image.jpg",
  structuredData = null,
  noIndex = false
}) => {
  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow" />
      )}
      
      {/* Open Graph / Facebook */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:site_name" content="TAG Sales Tracker" />
      
      {/* Twitter Card */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={ogImage} />
      
      {/* Additional Meta Tags */}
      <meta name="author" content="TAG Sales Tracker" />
      <meta name="language" content="English" />
      <meta name="revisit-after" content="1 days" />
      <meta name="distribution" content="global" />
      <meta name="rating" content="general" />
      
      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
    </Head>
  )
}

export default SEOHead 