import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, TrendingUp, TrendingDown } from 'lucide-react';
import toast from 'react-hot-toast';

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [stockPrices, setStockPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingStock, setEditingStock] = useState(null);
  const [formData, setFormData] = useState({
    symbol: '',
    quantity: '',
    buyPrice: ''
  });

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      
      const portfolioResponse = await axios.get('/portfolio');
      const portfolioData = portfolioResponse.data;
      setPortfolio(portfolioData);

      if (portfolioData.stocks.length > 0) {
        const symbols = portfolioData.stocks.map(stock => stock.symbol);
        const pricesResponse = await axios.post('/stocks/quotes', { symbols });
        
        const pricesMap = {};
        pricesResponse.data.forEach(stock => {
          if (!stock.error) {
            pricesMap[stock.symbol] = stock;
          }
        });
        setStockPrices(pricesMap);
      }
    } catch (error) {
      toast.error('Failed to fetch portfolio data');
      console.error('Portfolio fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddStock = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('/portfolio/stocks', {
        symbol: formData.symbol.toUpperCase(),
        quantity: parseFloat(formData.quantity),
        buyPrice: parseFloat(formData.buyPrice)
      });
      
      toast.success('Stock added successfully');
      setShowAddModal(false);
      setFormData({ symbol: '', quantity: '', buyPrice: '' });
      fetchPortfolioData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add stock');
    }
  };

  const handleEditStock = async (e) => {
    e.preventDefault();
    
    try {
      await axios.put(`/portfolio/stocks/${editingStock._id}`, {
        quantity: parseFloat(formData.quantity),
        buyPrice: parseFloat(formData.buyPrice)
      });
      
      toast.success('Stock updated successfully');
      setEditingStock(null);
      setFormData({ symbol: '', quantity: '', buyPrice: '' });
      fetchPortfolioData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update stock');
    }
  };

  const handleDeleteStock = async (stockId) => {
    if (!window.confirm('Are you sure you want to delete this stock?')) return;
    
    try {
      await axios.delete(`/portfolio/stocks/${stockId}`);
      toast.success('Stock deleted successfully');
      fetchPortfolioData();
    } catch (error) {
      toast.error('Failed to delete stock');
    }
  };

  const openAddModal = () => {
    setFormData({ symbol: '', quantity: '', buyPrice: '' });
    setShowAddModal(true);
  };

  const openEditModal = (stock) => {
    setFormData({
      symbol: stock.symbol,
      quantity: stock.quantity.toString(),
      buyPrice: stock.buyPrice.toString()
    });
    setEditingStock(stock);
  };

  const closeModals = () => {
    setShowAddModal(false);
    setEditingStock(null);
    setFormData({ symbol: '', quantity: '', buyPrice: '' });
  };

  const calculateStockMetrics = (stock) => {
    if (!stock || typeof stock !== 'object') return null;
    
    const currentPrice = stockPrices[stock.symbol]?.currentPrice || stock.buyPrice || 0;
    const quantity = parseFloat(stock.quantity) || 0;
    const buyPrice = parseFloat(stock.buyPrice) || 0;
    const invested = quantity * buyPrice;
    const currentValue = quantity * currentPrice;
    const profitLoss = currentValue - invested;
    const profitLossPercent = invested > 0 ? (profitLoss / invested) * 100 : 0;

    return {
      currentPrice,
      invested,
      currentValue,
      profitLoss,
      profitLossPercent
    };
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Portfolio</h1>
        <button
          onClick={openAddModal}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Stock
        </button>
      </div>

      {/* Portfolio Table */}
      {portfolio && portfolio.stocks.length > 0 ? (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Symbol
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Buy Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Invested
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Value
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P&L
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {portfolio.stocks.map((stock) => {
                  // Ensure stock is a valid object
                  if (!stock || typeof stock !== 'object' || !stock.symbol) {
                    console.warn('Invalid stock object:', stock);
                    return null;
                  }
                  
                  const metrics = calculateStockMetrics(stock);
                  if (!metrics) return null;
                  
                  return (
                    <tr key={stock._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{stock.symbol}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{stock.quantity}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${stock.buyPrice.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${metrics.currentPrice.toFixed(2)}</div>
                        {stockPrices[stock.symbol] && (
                          <div className={`text-xs flex items-center ${
                            stockPrices[stock.symbol].change >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {stockPrices[stock.symbol].change >= 0 ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {stockPrices[stock.symbol].changePercent.toFixed(2)}%
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${metrics.invested.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">${metrics.currentValue.toFixed(2)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ${metrics.profitLoss.toFixed(2)}
                        </div>
                        <div className={`text-xs ${
                          metrics.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          ({metrics.profitLossPercent.toFixed(2)}%)
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(stock)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteStock(stock._id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <div className="text-gray-400 mb-4">
            <Plus className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stocks in portfolio</h3>
          <p className="text-gray-600 mb-4">Add your first stock to get started</p>
          <button onClick={openAddModal} className="btn-primary">
            Add Stock
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {(showAddModal || editingStock) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingStock ? 'Edit Stock' : 'Add New Stock'}
              </h3>
              
              <form onSubmit={editingStock ? handleEditStock : handleAddStock} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Symbol</label>
                  <input
                    type="text"
                    className="input mt-1"
                    placeholder="e.g., AAPL, TSLA"
                    value={formData.symbol}
                    onChange={(e) => setFormData({...formData, symbol: e.target.value})}
                    required
                    disabled={editingStock}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantity</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="input mt-1"
                    placeholder="Number of shares"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: e.target.value})}
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
                    value={formData.buyPrice}
                    onChange={(e) => setFormData({...formData, buyPrice: e.target.value})}
                    required
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                  >
                    {editingStock ? 'Update' : 'Add'} Stock
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

export default Portfolio;