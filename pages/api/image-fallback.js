export default function handler(req, res) {
  const { width = 250, height = 350, text = 'No Image', bg = 'e5e7eb', color = '6b7280' } = req.query;

  const svgContent = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#${bg}"/>
      <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="#${color}" text-anchor="middle" dominant-baseline="middle">
        ${text}
      </text>
      <rect x="10" y="10" width="${width - 20}" height="${height - 20}" fill="none" stroke="#${color}" stroke-width="2" stroke-dasharray="5,5" opacity="0.5"/>
    </svg>
  `.trim();

  res.setHeader('Content-Type', 'image/svg+xml');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  res.status(200).send(svgContent);
} 