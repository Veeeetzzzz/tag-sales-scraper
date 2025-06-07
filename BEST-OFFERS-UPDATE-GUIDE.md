# Best Offers Accepted Data Update Guide

## Overview
The "Best Offers Accepted" feature shows exclusive eBay data for accepted best offers on TAG graded Pokemon cards. This data is not publicly available and must be manually updated.

## Data File Location
- **File**: `public/data/best-offers-accepted.json`
- **Format**: JSON with structured offer data

## How to Update the Dataset

### 1. Open the Data File
Edit the file `public/data/best-offers-accepted.json`

### 2. Update the Metadata
Always update the `lastUpdated` field in the `dataInfo` section:
```json
{
  "dataInfo": {
    "lastUpdated": "2024-12-19",  // ← Update this date
    // ... other fields
  }
}
```

### 3. Adding New Offers
Add new entries to the `offers` array. Each entry should follow this structure:

```json
{
  "id": "bo-016",  // ← Increment the number
  "listingTitle": "Full title from the listing",
  "avgSold": "123.45",  // ← Price as string, no currency symbol
  "currency": "GBP",
  "postage": "2.50",  // ← Postage as string, no currency symbol
  "quantity": 1,
  "dateLastSold": "15 Dec 2024"  // ← Date format should be consistent
}
```

### 4. Consistent Data Format

#### ID Numbers
- Always increment: `bo-001`, `bo-002`, `bo-003`, etc.
- Never reuse or skip numbers

#### Prices
- No currency symbols in `avgSold` or `postage` fields
- Use decimal format: `"123.45"` not `"£123.45"`
- The currency is specified separately in the `currency` field

#### Titles
- Copy the full listing title as provided
- Keep truncation indicators like "..." if present

#### Dates
- Try to maintain consistent format
- Acceptable formats: "15 Dec 2024", "15 December 2024", "Dec 15 2024"
- Include asterisks (*) if the date is uncertain: "15 Dec 2024*"

### 5. Adding Bulk Data
When adding multiple new entries from your dataset:

1. Find the last ID number in the existing data
2. Continue numbering from there (e.g., if last is `bo-015`, start with `bo-016`)
3. Copy each row from your table into the JSON format
4. Update the `lastUpdated` date
5. Save the file

### 6. Example of Adding New Data
If your table has this data:
```
| 16 | New Pokemon Card Listing | 150.25 | £3.50 | 1 | 15 Dec 2024 |
```

Add this to the JSON:
```json
{
  "id": "bo-016",
  "listingTitle": "New Pokemon Card Listing",
  "avgSold": "150.25",
  "currency": "GBP",
  "postage": "3.50",
  "quantity": 1,
  "dateLastSold": "15 Dec 2024"
}
```

### 7. Data Validation
After updating:
- Ensure all JSON syntax is correct (commas, brackets, quotes)
- Check that all required fields are present
- Verify ID numbers are sequential
- Confirm the `lastUpdated` date is current

## Page Updates
The data will automatically appear on the **Best Offers Accepted** page at `/best-offers` after the file is updated. No additional code changes are needed for data updates.

## Troubleshooting
- **JSON Errors**: Use a JSON validator to check syntax
- **Page Not Loading**: Check browser console for errors
- **Data Not Appearing**: Verify the JSON structure matches existing entries

## Future Enhancements
Consider these potential improvements:
- Add image URLs to entries if available
- Include original listing prices for comparison
- Add seller information (if permitted)
- Include condition details beyond the grade 