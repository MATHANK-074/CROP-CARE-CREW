const CropPrice = require('../models/CropPrice');
// Use dynamic import for fetch
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

class GovAPIService {
  constructor() {
    this.baseURL = 'https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070';
    // Use environment variable for API key, fallback to test mode
    this.apiKey = process.env.GOV_API_KEY || null;

    if (!this.apiKey) {
      console.warn('⚠️ No GOV_API_KEY found in environment. API calls may fail.');
      console.log('💡 Add GOV_API_KEY to your .env file for real government data');
    }
  }

  async fetchCropPrices(crops = ['Rice', 'Wheat', 'Maize', 'Cotton']) {
    try {
      console.log('Fetching crop prices from government API...');

      if (!this.apiKey) {
        console.log('⚠️ No API key available, returning sample data for testing');
        // Return sample data when no API key is available
        return [
          {
            commodity: 'Rice',
            state: 'Punjab',
            district: 'Amritsar',
            market: 'Amritsar APMC',
            modal_price: '2200',
            arrival_date: new Date().toISOString().split('T')[0]
          },
          {
            commodity: 'Wheat',
            state: 'Haryana',
            district: 'Karnal',
            market: 'Karnal Mandi',
            modal_price: '2500',
            arrival_date: new Date().toISOString().split('T')[0]
          }
        ];
      }

      const results = [];

      for (const crop of crops) {
        const url = `${this.baseURL}?api-key=${this.apiKey}&format=json&filters[commodity]=${crop}&limit=100`;

        try {
          console.log(`Fetching ${crop} from: ${url}`);
          const response = await fetch(url);

          if (!response.ok) {
            console.error(`API request failed for ${crop}: ${response.status} ${response.statusText}`);
            continue;
          }

          const data = await response.json();
          console.log(`API Response for ${crop}:`, data);

          if (data.records && Array.isArray(data.records)) {
            console.log(`Fetched ${data.records.length} records for ${crop}`);
            results.push(...data.records);
          } else {
            console.log(`No records found for ${crop}. Response structure:`, Object.keys(data));
          }
        } catch (error) {
          console.error(`Error fetching data for ${crop}:`, error.message);
          // Continue with other crops even if one fails
        }
      }

      return results;
    } catch (error) {
      console.error('Error in fetchCropPrices:', error);
      throw error;
    }
  }

  async storePriceData(apiData) {
    try {
      console.log(`Processing ${apiData.length} records for storage...`);
      const savedPrices = [];
      const skippedPrices = [];

      for (const record of apiData) {
        try {
          console.log(`Processing record:`, record);

          // Parse the date from the API response
          const recordDate = record.arrival_date || record.date ? new Date(record.arrival_date || record.date) : new Date();

          // Create price object
          const priceData = {
            crop_name: record.commodity?.toLowerCase() || 'unknown',
            city: record.district || record.market || 'unknown',
            state: record.state || 'unknown',
            price: parseFloat(record.modal_price || record.price || 0),
            market: record.market || 'unknown',
            date: recordDate
          };

          console.log(`Created price data:`, priceData);

          // Check if this price record already exists
          const dateOnly = new Date(recordDate);
          const startOfDay = new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate());
          const endOfDay = new Date(dateOnly.getFullYear(), dateOnly.getMonth(), dateOnly.getDate(), 23, 59, 59);

          const existingPrice = await CropPrice.findOne({
            crop_name: priceData.crop_name,
            city: priceData.city,
            date: {
              $gte: startOfDay,
              $lte: endOfDay
            }
          });

          if (existingPrice) {
            console.log(`Skipping duplicate:`, { crop: priceData.crop_name, city: priceData.city });
            skippedPrices.push({
              crop: priceData.crop_name,
              city: priceData.city,
              reason: 'already exists'
            });
            continue;
          }

          // Save new price record
          console.log(`Saving new price record...`);
          const newPrice = new CropPrice(priceData);
          const savedPrice = await newPrice.save();
          console.log(`✅ Saved:`, { crop: savedPrice.crop_name, city: savedPrice.city, price: savedPrice.price });
          savedPrices.push(savedPrice);

        } catch (error) {
          console.error('Error saving individual price record:', error);
          skippedPrices.push({
            crop: record.commodity,
            city: record.district,
            reason: error.message
          });
        }
      }

      console.log(`Storage completed: ${savedPrices.length} saved, ${skippedPrices.length} skipped`);

      return {
        success: true,
        saved: savedPrices.length,
        skipped: skippedPrices.length,
        details: {
          savedPrices: savedPrices.map(p => ({
            crop: p.crop_name,
            city: p.city,
            price: p.price,
            date: p.date
          })),
          skippedPrices
        }
      };
    } catch (error) {
      console.error('Error in storePriceData:', error);
      throw error;
    }
  }

  async fetchAndStorePrices(crops) {
    try {
      console.log('Starting price fetch and store operation...');
      console.log('Crops to fetch:', crops);

      // Fetch data from government API
      const apiData = await this.fetchCropPrices(crops);
      console.log(`Fetched ${apiData?.length || 0} total records from API`);

      if (!apiData || apiData.length === 0) {
        console.log('No data received from government API');
        return {
          success: false,
          message: 'No data received from government API',
          saved: 0,
          skipped: 0
        };
      }

      console.log('Sample API data:', apiData[0]);

      // Store the fetched data
      const result = await this.storePriceData(apiData);

      console.log(`Price operation completed: ${result.saved} saved, ${result.skipped} skipped`);
      return result;

    } catch (error) {
      console.error('Error in fetchAndStorePrices:', error);
      return {
        success: false,
        message: error.message,
        saved: 0,
        skipped: 0
      };
    }
  }
}

module.exports = new GovAPIService();