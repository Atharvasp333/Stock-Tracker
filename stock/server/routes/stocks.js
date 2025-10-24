const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');

const router = express.Router();

// Get stock quote from Finnhub
router.get('/quote/:symbol', auth, async (req, res) => {
  try {
    const { symbol } = req.params;
    const apiKey = process.env.FINNHUB_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ message: 'Finnhub API key not configured' });
    }

    const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
    
    if (response.data.c === 0) {
      return res.status(404).json({ message: 'Stock symbol not found' });
    }

    res.json({
      symbol,
      currentPrice: response.data.c,
      highPrice: response.data.h,
      lowPrice: response.data.l,
      previousClose: response.data.pc,
      change: response.data.c - response.data.pc,
      changePercent: ((response.data.c - response.data.pc) / response.data.pc) * 100
    });
  } catch (error) {
    console.error('Stock API error:', error.message);
    res.status(500).json({ message: 'Failed to fetch stock data' });
  }
});

// Get multiple stock quotes
router.post('/quotes', auth, async (req, res) => {
  try {
    const { symbols } = req.body;
    const apiKey = process.env.FINNHUB_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ message: 'Finnhub API key not configured' });
    }

    const promises = symbols.map(async (symbol) => {
      try {
        const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
        return {
          symbol,
          currentPrice: response.data.c,
          highPrice: response.data.h,
          lowPrice: response.data.l,
          previousClose: response.data.pc,
          change: response.data.c - response.data.pc,
          changePercent: ((response.data.c - response.data.pc) / response.data.pc) * 100
        };
      } catch (error) {
        return {
          symbol,
          error: 'Failed to fetch data'
        };
      }
    });

    const results = await Promise.all(promises);
    res.json(results);
  } catch (error) {
    console.error('Stocks API error:', error.message);
    res.status(500).json({ message: 'Failed to fetch stock data' });
  }
});

module.exports = router;