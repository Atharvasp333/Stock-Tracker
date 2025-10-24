const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const Portfolio = require('../models/Portfolio');

const router = express.Router();

// Generate AI insights with live portfolio data
router.post('/insights', auth, async (req, res) => {
  try {
    const { query } = req.body;

    // Fetch user's portfolio with live data
    const userPortfolio = await Portfolio.findOne({ userId: req.user._id });
    if (!userPortfolio || userPortfolio.stocks.length === 0) {
      return res.json({
        insight: "I notice you don't have any stocks in your portfolio yet. Consider adding some stocks to get personalized insights about your investments. You can start by exploring the Market page to find stocks that match your investment goals."
      });
    }

    // Fetch live stock data for portfolio
    const apiKey = process.env.FINNHUB_API_KEY;
    const portfolioWithLiveData = await Promise.all(
      userPortfolio.stocks.map(async (stock) => {
        try {
          if (!apiKey) {
            return {
              symbol: stock.symbol,
              quantity: stock.quantity,
              buyPrice: stock.buyPrice,
              currentPrice: stock.buyPrice,
              change: 0,
              changePercent: 0
            };
          }

          const response = await axios.get(
            `https://finnhub.io/api/v1/quote?symbol=${stock.symbol}&token=${apiKey}`
          );

          const currentPrice = response.data.c || stock.buyPrice;
          const change = currentPrice - (response.data.pc || stock.buyPrice);
          const changePercent = response.data.pc ? (change / response.data.pc) * 100 : 0;

          const invested = stock.quantity * stock.buyPrice;
          const currentValue = stock.quantity * currentPrice;
          const profitLoss = currentValue - invested;
          const profitLossPercent = (profitLoss / invested) * 100;

          return {
            symbol: stock.symbol,
            quantity: stock.quantity,
            buyPrice: stock.buyPrice,
            currentPrice,
            change,
            changePercent,
            invested,
            currentValue,
            profitLoss,
            profitLossPercent
          };
        } catch (error) {
          console.error(`Error fetching live data for ${stock.symbol}:`, error.message);
          return {
            symbol: stock.symbol,
            quantity: stock.quantity,
            buyPrice: stock.buyPrice,
            currentPrice: stock.buyPrice,
            change: 0,
            changePercent: 0
          };
        }
      })
    );

    // Calculate portfolio metrics
    const totalInvested = portfolioWithLiveData.reduce((sum, stock) => sum + (stock.invested || 0), 0);
    const totalCurrentValue = portfolioWithLiveData.reduce((sum, stock) => sum + (stock.currentValue || 0), 0);
    const totalProfitLoss = totalCurrentValue - totalInvested;
    const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    const bestPerformer = portfolioWithLiveData.reduce((best, stock) =>
      (stock.profitLossPercent || 0) > (best.profitLossPercent || 0) ? stock : best
    );

    const worstPerformer = portfolioWithLiveData.reduce((worst, stock) =>
      (stock.profitLossPercent || 0) < (worst.profitLossPercent || 0) ? stock : worst
    );

    // Create detailed context for AI
    const context = `
PORTFOLIO ANALYSIS REQUEST

Current Portfolio Holdings:
${portfolioWithLiveData.map(stock =>
      `• ${stock.symbol}: ${stock.quantity} shares
    - Buy Price: $${stock.buyPrice?.toFixed(2)}
    - Current Price: $${stock.currentPrice?.toFixed(2)}
    - Daily Change: ${stock.change >= 0 ? '+' : ''}${stock.change?.toFixed(2)} (${stock.changePercent?.toFixed(2)}%)
    - Position Value: $${stock.currentValue?.toFixed(2)}
    - P&L: ${stock.profitLoss >= 0 ? '+' : ''}$${stock.profitLoss?.toFixed(2)} (${stock.profitLossPercent?.toFixed(2)}%)`
    ).join('\n')}

Portfolio Summary:
- Total Invested: $${totalInvested.toFixed(2)}
- Current Value: $${totalCurrentValue.toFixed(2)}
- Total P&L: ${totalProfitLoss >= 0 ? '+' : ''}$${totalProfitLoss.toFixed(2)} (${totalProfitLossPercent.toFixed(2)}%)
- Best Performer: ${bestPerformer.symbol} (${bestPerformer.profitLossPercent?.toFixed(2)}%)
- Worst Performer: ${worstPerformer.symbol} (${worstPerformer.profitLossPercent?.toFixed(2)}%)
- Number of Holdings: ${portfolioWithLiveData.length}

User Question: "${query}"

Please provide specific, actionable insights based on this real-time portfolio data. Include:
1. Direct answers to the user's question
2. Performance analysis with specific numbers
3. Risk assessment if relevant
4. Actionable recommendations
5. Market context where appropriate

Keep the response conversational but professional, and use the actual data provided.
`;

    let aiResponse;

    // Try Gemini first
    if (process.env.GEMINI_API_KEY) {
      try {
        const response = await axios.post(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent',
          {
            contents: [{
              parts: [{
                text: context
              }]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800
            }
          },
          {
            headers: {
              'x-goog-api-key': process.env.GEMINI_API_KEY,
              'Content-Type': 'application/json'
            }
          }
        );

        aiResponse = response.data.candidates[0].content.parts[0].text;
      } catch (error) {
        console.error('Gemini API error:', error.message);
        console.error('Full error:', error.response?.data || error);
      }
    }

    // Fallback to OpenAI
    if (!aiResponse && process.env.OPENAI_API_KEY) {
      try {
        const response = await axios.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'system',
                content: 'You are an expert financial advisor providing personalized investment insights. Use the provided real-time portfolio data to give specific, actionable advice. Be conversational but professional.'
              },
              {
                role: 'user',
                content: context
              }
            ],
            max_tokens: 800,
            temperature: 0.7
          },
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        aiResponse = response.data.choices[0].message.content;
      } catch (error) {
        console.error('OpenAI API error:', error.message);
      }
    }

    if (!aiResponse) {
      return res.status(500).json({
        message: 'AI service unavailable. Please configure GEMINI_API_KEY or OPENAI_API_KEY.'
      });
    }

    res.json({
      insight: aiResponse,
      portfolioSummary: {
        totalInvested,
        totalCurrentValue,
        totalProfitLoss,
        totalProfitLossPercent,
        bestPerformer: bestPerformer.symbol,
        worstPerformer: worstPerformer.symbol,
        stockCount: portfolioWithLiveData.length
      }
    });
  } catch (error) {
    console.error('AI insights error:', error.message);
    res.status(500).json({ message: 'Failed to generate insights' });
  }
});

module.exports = router;