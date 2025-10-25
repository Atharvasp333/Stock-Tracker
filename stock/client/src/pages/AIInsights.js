import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Brain, Send, BarChart3, TrendingUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const AIInsights = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [stockPrices, setStockPrices] = useState({});
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const suggestedQueries = [
    "Summarize my portfolio performance this week",
    "Which stock performed best?",
    "Should I rebalance my portfolio?",
    "How risky is my current portfolio?",
    "What are the top gainers and losers?",
    "Generate a weekly portfolio report"
  ];

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setInitialLoading(true);
      
      // Use the enhanced portfolio endpoint that includes live data
      const portfolioResponse = await axios.get('/portfolio/live');
      const portfolioData = portfolioResponse.data;
      
      // The live endpoint returns { portfolio, liveData, summary }
      setPortfolio(portfolioData.portfolio);
      
      // Convert live data to the format expected by the component
      if (portfolioData.liveData && portfolioData.liveData.length > 0) {
        const pricesMap = {};
        portfolioData.liveData.forEach(stock => {
          pricesMap[stock.symbol] = {
            currentPrice: stock.currentPrice,
            change: stock.change,
            changePercent: stock.changePercent
          };
        });
        setStockPrices(pricesMap);
      }
    } catch (error) {
      toast.error('Failed to fetch portfolio data');
      console.error('Portfolio fetch error:', error);
    } finally {
      setInitialLoading(false);
    }
  };

  const sendMessage = async (message = inputMessage) => {
    if (!message.trim()) return;

    const userMessage = { 
      type: 'user', 
      content: message, 
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      // The enhanced AI endpoint now fetches portfolio data itself
      const response = await axios.post('/ai/insights', {
        query: message
      });

      const aiMessage = { 
        type: 'ai', 
        content: response.data.insight || 'No insight available', 
        timestamp: new Date().toISOString(),
        portfolioSummary: response.data.portfolioSummary || null
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to get AI insights');
      const errorMessage = { 
        type: 'error', 
        content: 'Sorry, I couldn\'t process your request. Please try again.', 
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  const handleSuggestedQuery = (query) => {
    sendMessage(query);
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">AI Insights</h1>
          <p className="text-gray-600 mt-1">Get intelligent analysis of your portfolio performance</p>
        </div>
        <Brain className="h-8 w-8 text-primary-600" />
      </div>

      {!portfolio || !portfolio.stocks || portfolio.stocks.length === 0 ? (
        <div className="card text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolio data</h3>
          <p className="text-gray-600 mb-4">Add some stocks to your portfolio to get AI insights</p>
          <a href="/portfolio" className="btn-primary">
            Add Stocks
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Portfolio Summary */}
          <div className="lg:col-span-1">
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Portfolio Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Stocks:</span>
                  <span className="text-sm font-medium">{portfolio.stocks?.length || 0}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Value:</span>
                  <span className="text-sm font-medium">
                    ${(portfolio.stocks || []).reduce((total, stock) => {
                      if (!stock || !stock.symbol) return total;
                      const currentPrice = stockPrices[stock.symbol]?.currentPrice || stock.buyPrice || 0;
                      return total + ((stock.quantity || 0) * currentPrice);
                    }, 0).toFixed(2)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Invested:</span>
                  <span className="text-sm font-medium">
                    ${(portfolio.stocks || []).reduce((total, stock) => {
                      if (!stock || !stock.symbol) return total;
                      return total + ((stock.quantity || 0) * (stock.buyPrice || 0));
                    }, 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">Top Holdings:</h4>
                <div className="space-y-2">
                  {portfolio.stocks && portfolio.stocks.slice(0, 3).map(stock => {
                    if (!stock || !stock.symbol) return null;
                    
                    const currentPrice = stockPrices[stock.symbol]?.currentPrice || stock.buyPrice || 0;
                    const value = (stock.quantity || 0) * currentPrice;
                    
                    return (
                      <div key={stock._id || stock.symbol} className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">{stock.symbol}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">${value.toFixed(2)}</div>
                          {stockPrices[stock.symbol] && stockPrices[stock.symbol].changePercent !== undefined && (
                            <div className={`text-xs flex items-center ${
                              (stockPrices[stock.symbol].change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              <TrendingUp className="h-3 w-3 mr-1" />
                              {stockPrices[stock.symbol].changePercent.toFixed(2)}%
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Suggested Queries */}
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Questions</h3>
              <div className="space-y-2">
                {suggestedQueries.map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuery(query)}
                    className="w-full text-left p-3 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-2">
            <div className="card h-96 flex flex-col">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">AI Assistant</h3>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Ask me anything about your portfolio!</p>
                    <p className="text-sm mt-2">Try: "How is my portfolio performing?"</p>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-primary-600 text-white'
                            : message.type === 'error'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">
                          {message.content}
                        </p>
                        {message.portfolioSummary && (
                          <div className="mt-2 text-xs border-t pt-2">
                            <div>Total Value: ${message.portfolioSummary.totalCurrentValue?.toFixed(2)}</div>
                            <div>Total P&L: ${message.portfolioSummary.totalProfitLoss?.toFixed(2)} ({message.portfolioSummary.totalProfitLossPercent?.toFixed(2)}%)</div>
                          </div>
                        )}
                        <p className="text-xs mt-1 opacity-70">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                        <span className="text-sm">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSubmit} className="flex space-x-2">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Ask about your portfolio..."
                  className="flex-1 input"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !inputMessage.trim()}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInsights;