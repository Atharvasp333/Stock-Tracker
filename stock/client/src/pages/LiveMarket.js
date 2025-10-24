import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  RefreshCw,
  Activity,
  DollarSign,
  BarChart3
} from 'lucide-react';
import toast from 'react-hot-toast';
import useWebSocket from '../hooks/useWebSocket';

const LiveMarket = () => {
  const [marketData, setMarketData] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [movers, setMovers] = useState({ gainers: [], losers: [] });
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [addStockForm, setAddStockForm] = useState({
    quantity: '',
    buyPrice: ''
  });

  // WebSocket for live updates
  const symbols = marketData.map(stock => stock.symbol);
  const { stockData: liveStockData, isConnected } = useWebSocket(null, symbols);

  useEffect(() => {
    fetchMarketData();
    fetchMovers();
    // Refresh market data every 60 seconds
    const interval = setInterval(() => {
      fetchMarketData();
      fetchMovers();
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchMarketData = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get('/market/live');
      setMarketData(response.data);
    } catch (error) {
      toast.error('Failed to fetch market data');
      console.error('Market data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchMovers = async () => {
    try {
      const response = await axios.get('/market/movers');
      setMovers(response.data);
    } catch (error) {
      console.error('Movers data error:', error);
    }
  };

  const searchStocks = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await axios.get(`/market/search/${encodeURIComponent(query)}`);
      setSearchResults(response.data);
    } catch (error) {
      toast.error('Failed to search stocks');
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    searchStocks(searchQuery);
  };

  const getMergedStockData = (stock) => {
    const liveData = liveStockData[stock.symbol];
    if (liveData) {
      return {
        ...stock,
        currentPrice: liveData.currentPrice,
        change: liveData.change,
        changePercent: liveData.changePercent,
        isLive: true
      };
    }
    return { ...stock, isLive: false };
  };

  const openAddModal = (stock) => {
    setSelectedStock(stock);
    setAddStockForm({ quantity: '', buyPrice: stock.currentPrice?.toFixed(2) || '' });
    setShowAddModal(true);
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setSelectedStock(null);
    setAddStockForm({ quantity: '', buyPrice: '' });
  };

  const addToPortfolio = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/portfolio/stocks', {
        symbol: selectedStock.symbol,
        quantity: parseFloat(addStockForm.quantity),
        buyPrice: parseFloat(addStockForm.buyPrice)
      });
      
      toast.success(`${selectedStock.symbol} added to portfolio`);
      closeAddModal();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add stock to portfolio');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Market</h1>
          <div className="flex items-center mt-2 space-x-4">
            <div className={`flex items-center text-sm ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
              <Activity className={`w-4 h-4 mr-2 ${isConnected ? 'animate-pulse' : ''}`} />
              {isConnected ? 'Live Updates Active' : 'Live Updates Disconnected'}
            </div>
            <span className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        <button
          onClick={fetchMarketData}
          disabled={refreshing}
          className="btn-secondary flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search Bar */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex space-x-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search stocks (e.g., AAPL, Tesla, Microsoft)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={searching}
            className="btn-primary"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </form>

        {/* Search Results */}
        {searchResults.length > 0 && (
          <div className="mt-4 border-t pt-4">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Search Results</h3>
            <div className="space-y-2">
              {searchResults.map((stock, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{stock.symbol}</p>
                    <p className="text-sm text-gray-600">{stock.description}</p>
                  </div>
                  <button
                    onClick={() => openAddModal(stock)}
                    className="btn-primary text-sm"
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Market Movers */}
      {(movers.gainers.length > 0 || movers.losers.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Gainers */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
              Top Gainers
            </h3>
            <div className="space-y-3">
              {movers.gainers.map((stock, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{stock.symbol}</p>
                    <p className="text-sm text-gray-600">${stock.currentPrice.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-green-600 font-medium">+{stock.changePercent.toFixed(2)}%</p>
                    <p className="text-sm text-green-600">+${stock.change.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Losers */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingDown className="h-5 w-5 text-red-600 mr-2" />
              Top Losers
            </h3>
            <div className="space-y-3">
              {movers.losers.map((stock, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{stock.symbol}</p>
                    <p className="text-sm text-gray-600">${stock.currentPrice.toFixed(2)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-red-600 font-medium">{stock.changePercent.toFixed(2)}%</p>
                    <p className="text-sm text-red-600">${stock.change.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Market Overview */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          Market Overview
        </h3>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 font-medium text-gray-900">Symbol</th>
                <th className="text-left py-3 px-4 font-medium text-gray-900">Company</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Price</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Change</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Change %</th>
                <th className="text-right py-3 px-4 font-medium text-gray-900">Action</th>
              </tr>
            </thead>
            <tbody>
              {marketData.map((stock) => {
                const mergedStock = getMergedStockData(stock);
                return (
                  <tr key={stock.symbol} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-900">{stock.symbol}</span>
                        {mergedStock.isLive && (
                          <div className="ml-2 w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-gray-600 text-sm">{stock.name || stock.symbol}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className="font-medium text-gray-900">
                        ${mergedStock.currentPrice?.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-medium ${
                        (mergedStock.change || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {(mergedStock.change || 0) >= 0 ? '+' : ''}${mergedStock.change?.toFixed(2) || '0.00'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className={`inline-flex items-center px-2 py-1 rounded text-sm font-medium ${
                        (mergedStock.changePercent || 0) >= 0 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {(mergedStock.changePercent || 0) >= 0 ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {(mergedStock.changePercent || 0) >= 0 ? '+' : ''}
                        {mergedStock.changePercent?.toFixed(2) || '0.00'}%
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => openAddModal(mergedStock)}
                        className="btn-primary text-sm"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add to Portfolio Modal */}
      {showAddModal && selectedStock && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Add {selectedStock.symbol} to Portfolio
              </h3>
              
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Price:</span>
                  <span className="font-medium">${selectedStock.currentPrice?.toFixed(2)}</span>
                </div>
                {selectedStock.changePercent && (
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-sm text-gray-600">Today's Change:</span>
                    <span className={`text-sm font-medium ${
                      selectedStock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {selectedStock.changePercent >= 0 ? '+' : ''}{selectedStock.changePercent.toFixed(2)}%
                    </span>
                  </div>
                )}
              </div>
              
              <form onSubmit={addToPortfolio} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input mt-1"
                    placeholder="Number of shares"
                    value={addStockForm.quantity}
                    onChange={(e) => setAddStockForm({...addStockForm, quantity: e.target.value})}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Buy Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input mt-1"
                    placeholder="Price per share"
                    value={addStockForm.buyPrice}
                    onChange={(e) => setAddStockForm({...addStockForm, buyPrice: e.target.value})}
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeAddModal}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    Add to Portfolio
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveMarket;