import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Brain, 
  Send, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  AlertCircle,
  Sparkles,
  MessageSquare,
  DollarSign,
  Target,
  Shield
} from 'lucide-react';
import toast from 'react-hot-toast';

const EnhancedAIInsights = () => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const suggestedQueries = [
    "Summarize my portfolio performance this week",
    "Which stock should I watch today?",
    "How risky is my current portfolio?",
    "Should I rebalance my portfolio?",
    "What are my top gainers and losers?",
    "Generate a weekly portfolio report",
    "Analyze my portfolio diversification",
    "What's my portfolio's risk level?",
    "Should I buy more of any stock?",
    "Market outlook for my holdings"
  ];

  const quickInsights = [
    {
      icon: BarChart3,
      title: "Portfolio Analysis",
      query: "Provide a detailed analysis of my current portfolio performance including strengths and weaknesses"
    },
    {
      icon: Target,
      title: "Investment Strategy",
      query: "Based on my current holdings, what investment strategy would you recommend going forward?"
    },
    {
      icon: Shield,
      title: "Risk Assessment",
      query: "Analyze the risk level of my portfolio and suggest ways to optimize risk-return balance"
    },
    {
      icon: TrendingUp,
      title: "Growth Opportunities",
      query: "Identify potential growth opportunities and sectors I should consider for diversification"
    }
  ];

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setInitialLoading(true);
      const response = await axios.get('/portfolio/live');
      setPortfolioData(response.data);
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
      timestamp: new Date() 
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setLoading(true);

    try {
      const response = await axios.post('/ai/insights', {
        query: message
      });

      const aiMessage = { 
        type: 'ai', 
        content: response.data.insight, 
        timestamp: new Date(),
        portfolioSummary: response.data.portfolioSummary
      };
      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to get AI insights');
      const errorMessage = { 
        type: 'error', 
        content: 'Sorry, I couldn\'t process your request. Please try again.', 
        timestamp: new Date() 
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

  const handleQuickInsight = (insight) => {
    sendMessage(insight.query);
  };

  const formatMessage = (content) => {
    // Simple markdown-like formatting
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const summary = portfolioData?.summary || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Brain className="h-8 w-8 text-primary-600 mr-3" />
            AI Portfolio Assistant
          </h1>
          <p className="text-gray-600 mt-1">Get intelligent, personalized insights about your investments</p>
        </div>
        <div className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-yellow-500" />
          <span className="text-sm text-gray-600">Powered by Gemini AI</span>
        </div>
      </div>

      {!portfolioData || portfolioData.liveData?.length === 0 ? (
        <div className="card text-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No portfolio data available</h3>
          <p className="text-gray-600 mb-4">Add some stocks to your portfolio to get personalized AI insights</p>
          <a href="/portfolio" className="btn-primary">
            Add Stocks to Portfolio
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Portfolio Summary Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Portfolio Overview */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2" />
                Portfolio Overview
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Value:</span>
                  <span className="font-medium text-lg">
                    ${summary.totalCurrentValue?.toFixed(2) || '0.00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total Invested:</span>
                  <span className="font-medium">
                    ${summary.totalInvested?.toFixed(2) || '0.00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">P&L:</span>
                  <span className={`font-medium ${
                    (summary.totalProfitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(summary.totalProfitLoss || 0) >= 0 ? '+' : ''}${summary.totalProfitLoss?.toFixed(2) || '0.00'}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Return:</span>
                  <span className={`font-medium ${
                    (summary.totalProfitLossPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(summary.totalProfitLossPercent || 0) >= 0 ? '+' : ''}{summary.totalProfitLossPercent?.toFixed(2) || '0.00'}%
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Holdings:</span>
                  <span className="font-medium">{summary.stockCount || 0} stocks</span>
                </div>
              </div>

              {summary.bestPerformer && summary.worstPerformer && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Best Performer:</span>
                    <span className="font-medium text-green-600">{summary.bestPerformer?.symbol || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Needs Attention:</span>
                    <span className="font-medium text-red-600">{summary.worstPerformer?.symbol || 'N/A'}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Insights */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Insights</h3>
              <div className="space-y-2">
                {quickInsights.map((insight, index) => {
                  const Icon = insight.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => handleQuickInsight(insight)}
                      className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors flex items-center"
                      disabled={loading}
                    >
                      <Icon className="h-4 w-4 mr-3 text-primary-600" />
                      <span className="text-sm font-medium">{insight.title}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Suggested Questions */}
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Suggested Questions</h3>
              <div className="space-y-2">
                {suggestedQueries.slice(0, 6).map((query, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestedQuery(query)}
                    className="w-full text-left p-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                    disabled={loading}
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="lg:col-span-3">
            <div className="card h-[600px] flex flex-col">
              <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  AI Assistant Chat
                </h3>
                <div className="flex items-center text-sm text-gray-500">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                  Portfolio-aware AI
                </div>
              </div>
              
              {/* Messages */}
              <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <Brain className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                    <h4 className="text-lg font-medium text-gray-700 mb-2">
                      Welcome to your AI Portfolio Assistant!
                    </h4>
                    <p className="text-gray-600 mb-4">
                      I have access to your real-time portfolio data and can provide personalized insights.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-md mx-auto">
                      <button
                        onClick={() => sendMessage("Analyze my portfolio performance")}
                        className="btn-primary text-sm"
                      >
                        Analyze Performance
                      </button>
                      <button
                        onClick={() => sendMessage("What should I do with my portfolio?")}
                        className="btn-secondary text-sm"
                      >
                        Get Recommendations
                      </button>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] px-4 py-3 rounded-lg ${
                          message.type === 'user'
                            ? 'bg-primary-600 text-white'
                            : message.type === 'error'
                            ? 'bg-red-100 text-red-800 border border-red-200'
                            : 'bg-gray-100 text-gray-800 border border-gray-200'
                        }`}
                      >
                        {message.type === 'ai' && (
                          <div className="flex items-center mb-2">
                            <Brain className="h-4 w-4 mr-2 text-primary-600" />
                            <span className="text-xs font-medium text-primary-600">AI Assistant</span>
                          </div>
                        )}
                        <div 
                          className="text-sm whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: formatMessage(message.content) }}
                        />
                        <div className="flex items-center justify-between mt-2">
                          <p className="text-xs opacity-70">
                            {message.timestamp.toLocaleTimeString()}
                          </p>
                          {message.portfolioSummary && (
                            <div className="flex items-center text-xs opacity-70">
                              <DollarSign className="h-3 w-3 mr-1" />
                              Portfolio data included
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-800 px-4 py-3 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                        <span className="text-sm">AI is analyzing your portfolio...</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 pt-4">
                <form onSubmit={handleSubmit} className="flex space-x-3">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask me anything about your portfolio..."
                    className="flex-1 input"
                    disabled={loading}
                  />
                  <button
                    type="submit"
                    disabled={loading || !inputMessage.trim()}
                    className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send
                  </button>
                </form>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  {suggestedQueries.slice(6, 10).map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestedQuery(query)}
                      className="text-xs px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors"
                      disabled={loading}
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EnhancedAIInsights;