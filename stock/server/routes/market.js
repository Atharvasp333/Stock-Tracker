const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');

const router = express.Router();

// Predefined list of popular stocks for market overview
const POPULAR_STOCKS = [
  'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
  'INFY', 'TCS.NS', 'RELIANCE.NS', 'HDFCBANK.NS', 'ICICIBANK.NS'
];

// Get live market data for popular stocks
router.get('/live', auth, async (req, res) => {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ message: 'Finnhub API key not configured' });
    }

    const promises = POPULAR_STOCKS.map(async (symbol) => {
      try {
        const [quoteResponse, profileResponse] = await Promise.all([
          axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`),
          axios.get(`https://finnhub.io/api/v1/stock/profile2?symbol=${symbol}&token=${apiKey}`)
        ]);

        if (quoteResponse.data.c === 0) {
          return null; // Skip invalid symbols
        }

        return {
          symbol,
          name: profileResponse.data.name || symbol,
          logo: profileResponse.data.logo || null,
          currentPrice: quoteResponse.data.c,
          highPrice: quoteResponse.data.h,
          lowPrice: quoteResponse.data.l,
          previousClose: quoteResponse.data.pc,
          change: quoteResponse.data.c - quoteResponse.data.pc,
          changePercent: ((quoteResponse.data.c - quoteResponse.data.pc) / quoteResponse.data.pc) * 100,
          marketCap: profileResponse.data.marketCapitalization || null,
          industry: profileResponse.data.finnhubIndustry || null
        };
      } catch (error) {
        console.error(`Error fetching data for ${symbol}:`, error.message);
        return null;
      }
    });

    const results = await Promise.all(promises);
    const validResults = results.filter(result => result !== null);

    res.json(validResults);
  } catch (error) {
    console.error('Market data error:', error.message);
    res.status(500).json({ message: 'Failed to fetch market data' });
  }
});

// Search for stocks
router.get('/search/:query', auth, async (req, res) => {
  try {
    const { query } = req.params;
    const apiKey = process.env.FINNHUB_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ message: 'Finnhub API key not configured' });
    }

    const response = await axios.get(
      `https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`
    );

    // Filter and format results
    const results = response.data.result
      .filter(stock => stock.type === 'Common Stock')
      .slice(0, 10)
      .map(stock => ({
        symbol: stock.symbol,
        description: stock.description,
        displaySymbol: stock.displaySymbol
      }));

    res.json(results);
  } catch (error) {
    console.error('Stock search error:', error.message);
    res.status(500).json({ message: 'Failed to search stocks' });
  }
});

// Get top gainers and losers
router.get('/movers', auth, async (req, res) => {
  try {
    const apiKey = process.env.FINNHUB_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ message: 'Finnhub API key not configured' });
    }

    // Fetch data for popular stocks and calculate movers
    const promises = POPULAR_STOCKS.map(async (symbol) => {
      try {
        const response = await axios.get(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${apiKey}`);
        
        if (response.data.c === 0) return null;

        const changePercent = ((response.data.c - response.data.pc) / response.data.pc) * 100;
        
        return {
          symbol,
          currentPrice: response.data.c,
          change: response.data.c - response.data.pc,
          changePercent
        };
      } catch (error) {
        return null;
      }
    });

    const results = await Promise.all(promises);
    const validResults = results.filter(result => result !== null);

    // Sort by change percentage
    const gainers = validResults
      .filter(stock => stock.changePercent > 0)
      .sort((a, b) => b.changePercent - a.changePercent)
      .slice(0, 5);

    const losers = validResults
      .filter(stock => stock.changePercent < 0)
      .sort((a, b) => a.changePercent - b.changePercent)
      .slice(0, 5);

    res.json({ gainers, losers });
  } catch (error) {
    console.error('Market movers error:', error.message);
    res.status(500).json({ message: 'Failed to fetch market movers' });
  }
});

module.exports = router;