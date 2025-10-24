const express = require('express');
const axios = require('axios');
const Portfolio = require('../models/Portfolio');
const auth = require('../middleware/auth');

const router = express.Router();

// Get user portfolio
router.get('/', auth, async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.user._id });
    
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.user._id, stocks: [] });
      await portfolio.save();
    }

    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Add stock to portfolio
router.post('/stocks', auth, async (req, res) => {
  try {
    const { symbol, quantity, buyPrice } = req.body;

    let portfolio = await Portfolio.findOne({ userId: req.user._id });
    
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.user._id, stocks: [] });
    }

    // Check if stock already exists
    const existingStockIndex = portfolio.stocks.findIndex(stock => stock.symbol === symbol.toUpperCase());
    
    if (existingStockIndex !== -1) {
      // Update existing stock
      const existingStock = portfolio.stocks[existingStockIndex];
      const totalQuantity = existingStock.quantity + quantity;
      const avgBuyPrice = ((existingStock.quantity * existingStock.buyPrice) + (quantity * buyPrice)) / totalQuantity;
      
      portfolio.stocks[existingStockIndex].quantity = totalQuantity;
      portfolio.stocks[existingStockIndex].buyPrice = avgBuyPrice;
    } else {
      // Add new stock
      portfolio.stocks.push({
        symbol: symbol.toUpperCase(),
        quantity,
        buyPrice
      });
    }

    await portfolio.save();
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update stock in portfolio
router.put('/stocks/:id', auth, async (req, res) => {
  try {
    const { quantity, buyPrice } = req.body;
    const stockId = req.params.id;

    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    const stock = portfolio.stocks.id(stockId);
    if (!stock) {
      return res.status(404).json({ message: 'Stock not found' });
    }

    stock.quantity = quantity;
    stock.buyPrice = buyPrice;

    await portfolio.save();
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete stock from portfolio
router.delete('/stocks/:id', auth, async (req, res) => {
  try {
    const stockId = req.params.id;

    const portfolio = await Portfolio.findOne({ userId: req.user._id });
    
    if (!portfolio) {
      return res.status(404).json({ message: 'Portfolio not found' });
    }

    portfolio.stocks.pull(stockId);
    await portfolio.save();
    
    res.json(portfolio);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get portfolio with live prices
router.get('/live', auth, async (req, res) => {
  try {
    let portfolio = await Portfolio.findOne({ userId: req.user._id });
    
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.user._id, stocks: [] });
      await portfolio.save();
    }

    if (portfolio.stocks.length === 0) {
      return res.json({ portfolio, liveData: [] });
    }

    // Fetch live prices for all stocks
    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ message: 'Finnhub API key not configured' });
    }

    const promises = portfolio.stocks.map(async (stock) => {
      try {
        const response = await axios.get(
          `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${apiKey}`
        );

        if (response.data.c === 0) {
          return {
            ...stock.toObject(),
            currentPrice: stock.buyPrice,
            change: 0,
            changePercent: 0,
            error: 'No live data available'
          };
        }

        const currentPrice = response.data.c;
        const change = currentPrice - response.data.pc;
        const changePercent = (change / response.data.pc) * 100;
        
        const invested = stock.quantity * stock.buyPrice;
        const currentValue = stock.quantity * currentPrice;
        const profitLoss = currentValue - invested;
        const profitLossPercent = (profitLoss / invested) * 100;

        return {
          ...stock.toObject(),
          currentPrice,
          change,
          changePercent,
          invested,
          currentValue,
          profitLoss,
          profitLossPercent,
          highPrice: response.data.h,
          lowPrice: response.data.l,
          previousClose: response.data.pc
        };
      } catch (error) {
        console.error(`Error fetching live data for ${stock.symbol}:`, error.message);
        return {
          ...stock.toObject(),
          currentPrice: stock.buyPrice,
          change: 0,
          changePercent: 0,
          error: 'Failed to fetch live data'
        };
      }
    });

    const liveData = await Promise.all(promises);

    // Calculate portfolio totals
    const totalInvested = liveData.reduce((sum, stock) => sum + (stock.invested || 0), 0);
    const totalCurrentValue = liveData.reduce((sum, stock) => sum + (stock.currentValue || 0), 0);
    const totalProfitLoss = totalCurrentValue - totalInvested;
    const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    // Find best and worst performing stocks
    const validStocks = liveData.filter(stock => !stock.error);
    const bestPerformer = validStocks.length > 0 
      ? validStocks.reduce((best, stock) => 
          (stock.profitLossPercent || 0) > (best.profitLossPercent || 0) ? stock : best
        )
      : null;
    
    const worstPerformer = validStocks.length > 0
      ? validStocks.reduce((worst, stock) => 
          (stock.profitLossPercent || 0) < (worst.profitLossPercent || 0) ? stock : worst
        )
      : null;

    res.json({
      portfolio,
      liveData,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalProfitLoss,
        totalProfitLossPercent,
        bestPerformer,
        worstPerformer,
        stockCount: portfolio.stocks.length
      }
    });
  } catch (error) {
    console.error('Portfolio live data error:', error.message);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;