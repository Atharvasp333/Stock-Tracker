const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');
const NodeCache = require('node-cache');
const axios = require('axios');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const authRoutes = require('./routes/auth');
const portfolioRoutes = require('./routes/portfolio');
const stockRoutes = require('./routes/stocks');
const aiRoutes = require('./routes/ai');
const marketRoutes = require('./routes/market');

const app = express();
const server = http.createServer(app);

// Cache for stock prices (5 minute TTL)
const priceCache = new NodeCache({ stdTTL: 300 });

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Middleware
app.use(limiter);
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/portfolio', portfolioRoutes);
app.use('/api/stocks', stockRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/market', marketRoutes);

// WebSocket server for real-time stock updates
const wss = new WebSocket.Server({ server });

// Store connected clients
const clients = new Set();

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  clients.add(ws);

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'subscribe' && data.symbols) {
        // Store subscribed symbols for this client
        ws.subscribedSymbols = data.symbols;
        console.log('Client subscribed to:', data.symbols);
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
    clients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clients.delete(ws);
  });
});

// Function to broadcast stock updates to all connected clients
const broadcastStockUpdate = (symbol, data) => {
  const message = JSON.stringify({
    type: 'stockUpdate',
    symbol,
    data
  });

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN && 
        client.subscribedSymbols && 
        client.subscribedSymbols.includes(symbol)) {
      client.send(message);
    }
  });
};

// Periodic stock price updates (every 30 seconds)
const updateStockPrices = async () => {
  try {
    // Get all unique symbols from connected clients
    const allSymbols = new Set();
    clients.forEach(client => {
      if (client.subscribedSymbols) {
        client.subscribedSymbols.forEach(symbol => allSymbols.add(symbol));
      }
    });

    if (allSymbols.size === 0) return;

    const symbols = Array.from(allSymbols);
    console.log('Updating prices for:', symbols);

    // Fetch prices from Finnhub
    const promises = symbols.map(async (symbol) => {
      try {
        const cachedPrice = priceCache.get(symbol);
        if (cachedPrice) {
          broadcastStockUpdate(symbol, cachedPrice);
          return;
        }

        const response = await axios.get(
          `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_KEY}`
        );

        if (response.data.c && response.data.c > 0) {
          const stockData = {
            symbol,
            currentPrice: response.data.c,
            highPrice: response.data.h,
            lowPrice: response.data.l,
            previousClose: response.data.pc,
            change: response.data.c - response.data.pc,
            changePercent: ((response.data.c - response.data.pc) / response.data.pc) * 100,
            timestamp: new Date().toISOString()
          };

          priceCache.set(symbol, stockData);
          broadcastStockUpdate(symbol, stockData);
        }
      } catch (error) {
        console.error(`Error fetching price for ${symbol}:`, error.message);
      }
    });

    await Promise.all(promises);
  } catch (error) {
    console.error('Error in updateStockPrices:', error);
  }
};

// Start periodic updates
setInterval(updateStockPrices, 30000); // Every 30 seconds

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/stock-portfolio')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});