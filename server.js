require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const GROWATT_TOKEN = process.env.GROWATT_API_TOKEN;

// Cache to store API responses and respect rate limits
const cache = {
  plants: { data: null, timestamp: 0 },
  devices: { data: null, timestamp: 0 }
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

// Middleware
app.use(express.json());
app.use(express.static('public'));

// Helper function to check if cache is valid
function isCacheValid(cacheEntry) {
  return cacheEntry.data && (Date.now() - cacheEntry.timestamp < CACHE_DURATION);
}

// API endpoint to get plant list
app.get('/api/plants', async (req, res) => {
  try {
    // Check cache first
    if (isCacheValid(cache.plants)) {
      console.log('Returning cached plant data');
      return res.json({
        ...cache.plants.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - cache.plants.timestamp) / 1000)
      });
    }

    console.log('Fetching fresh plant data from Growatt API');

    // Note: The curl command shows GET but with -d data.
    // In reality, this should likely be a POST request with body data.
    // However, I'll implement it as shown in the curl command structure.
    const response = await fetch('https://openapi.growatt.com/v1/plant/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'token': GROWATT_TOKEN
      }
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Cache the response
    cache.plants.data = data;
    cache.plants.timestamp = Date.now();

    res.json({ ...data, cached: false });
  } catch (error) {
    console.error('Error fetching plant data:', error);
    res.status(500).json({
      error: 'Failed to fetch plant data',
      message: error.message
    });
  }
});

// API endpoint to get device list
app.get('/api/devices', async (req, res) => {
  try {
    // Check cache first
    if (isCacheValid(cache.devices)) {
      console.log('Returning cached device data');
      return res.json({
        ...cache.devices.data,
        cached: true,
        cacheAge: Math.floor((Date.now() - cache.devices.timestamp) / 1000)
      });
    }

    console.log('Fetching fresh device data from Growatt API');

    const response = await fetch('https://openapi.growatt.com/v4/new-api/queryDeviceList', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'token': GROWATT_TOKEN
      },
      body: JSON.stringify({
        page: "1"
      })
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // Cache the response
    cache.devices.data = data;
    cache.devices.timestamp = Date.now();

    res.json({ ...data, cached: false });
  } catch (error) {
    console.error('Error fetching device data:', error);
    res.status(500).json({
      error: 'Failed to fetch device data',
      message: error.message
    });
  }
});

// Endpoint to check cache status
app.get('/api/cache-status', (req, res) => {
  res.json({
    plants: {
      hasCachedData: !!cache.plants.data,
      cacheAge: cache.plants.timestamp ? Math.floor((Date.now() - cache.plants.timestamp) / 1000) : null,
      isValid: isCacheValid(cache.plants)
    },
    devices: {
      hasCachedData: !!cache.devices.data,
      cacheAge: cache.devices.timestamp ? Math.floor((Date.now() - cache.devices.timestamp) / 1000) : null,
      isValid: isCacheValid(cache.devices)
    }
  });
});

// Serve the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Growatt Dashboard server running on http://localhost:${PORT}`);
  console.log('Press Ctrl+C to stop the server');
});
