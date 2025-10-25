import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  PieChart, 
  RefreshCw,
  Filter,
  Award,
  AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const EnhancedDashboard = () => {
  const [portfolioData, setPortfolioData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('symbol');
  const [filterBy, setFilterBy] = useState('all');
  const [refreshing, setRefreshing] = useState(false);



  useEffect(() => {
    fetchPortfolioData();
    // Set up periodic refresh every 30 seconds
    const interval = setInterval(fetchPortfolioData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setRefreshing(true);
      const response = await axios.get('/portfolio/live');
      setPortfolioData(response.data);
    } catch (error) {
      toast.error('Failed to fetch portfolio data');
      console.error('Portfolio fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const getMergedStockData = (stock) => {
    // Return stock data as-is since we're not using WebSocket anymore
    return stock;
  };

  const getSortedAndFilteredStocks = () => {
    if (!portfolioData?.liveData) return [];
    
    let stocks = portfolioData.liveData.map(getMergedStockData);
    
    // Apply filter
    if (filterBy === 'gainers') {
      stocks = stocks.filter(stock => (stock.profitLossPercent || 0) > 0);
    } else if (filterBy === 'losers') {
      stocks = stocks.filter(stock => (stock.profitLossPercent || 0) < 0);
    }
    
    // Apply sort
    stocks.sort((a, b) => {
      switch (sortBy) {
        case 'gainPercent':
          return (b.profitLossPercent || 0) - (a.profitLossPercent || 0);
        case 'lossPercent':
          return (a.profitLossPercent || 0) - (b.profitLossPercent || 0);
        case 'value':
          return (b.currentValue || 0) - (a.currentValue || 0);
        case 'symbol':
        default:
          return a.symbol.localeCompare(b.symbol);
      }
    });
    
    return stocks;
  };

  const generateMiniChartData = (stock) => {
    // Generate mock 7-day trend data (in real app, this would come from historical API)
    const days = 7;
    const basePrice = stock.buyPrice;
    const currentPrice = stock.currentPrice || stock.buyPrice;
    const data = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const randomVariation = (Math.random() - 0.5) * 0.1; // ±5% variation
      const price = i === 0 ? currentPrice : basePrice * (1 + randomVariation);
      data.push(price);
    }
    
    return {
      labels: Array.from({ length: days }, (_, i) => `Day ${i + 1}`),
      datasets: [
        {
          data,
          borderColor: (stock.profitLossPercent || 0) >= 0 ? '#10B981' : '#EF4444',
          backgroundColor: (stock.profitLossPercent || 0) >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
        }
      ]
    };
  };

  const miniChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => `$${context.parsed.y.toFixed(2)}`
        }
      }
    },
    scales: {
      x: { display: false },
      y: { display: false }
    },
    elements: {
      point: { radius: 0 }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const summary = portfolioData?.summary || {};
  const sortedStocks = getSortedAndFilteredStocks();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Enhanced Dashboard</h1>
          <div className="flex items-center mt-2 space-x-4">
            <span className="text-sm text-gray-500">
              Last updated: {new Date().toLocaleTimeString()}
            </span>
          </div>
        </div>
        <button
          onClick={fetchPortfolioData}
          disabled={refreshing}
          className="btn-secondary flex items-center"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Portfolio Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${summary.totalCurrentValue?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-gray-100 rounded-lg">
              <PieChart className="h-6 w-6 text-gray-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Invested</p>
              <p className="text-2xl font-bold text-gray-900">
                ${summary.totalInvested?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${(summary.totalProfitLoss || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {(summary.totalProfitLoss || 0) >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Profit/Loss</p>
              <p className={`text-2xl font-bold ${(summary.totalProfitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${summary.totalProfitLoss?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${(summary.totalProfitLossPercent || 0) >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {(summary.totalProfitLossPercent || 0) >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Return %</p>
              <p className={`text-2xl font-bold ${(summary.totalProfitLossPercent || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {summary.totalProfitLossPercent?.toFixed(2) || '0.00'}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Portfolio Insights */}
      {summary.bestPerformer && summary.worstPerformer && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="card bg-green-50 border-green-200">
            <div className="flex items-center">
              <Award className="h-6 w-6 text-green-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-green-800">Best Performer</p>
                <p className="text-lg font-bold text-green-900">{summary.bestPerformer?.symbol || 'N/A'}</p>
              </div>
            </div>
          </div>
          
          <div className="card bg-red-50 border-red-200">
            <div className="flex items-center">
              <AlertTriangle className="h-6 w-6 text-red-600 mr-3" />
              <div>
                <p className="text-sm font-medium text-red-800">Needs Attention</p>
                <p className="text-lg font-bold text-red-900">{summary.worstPerformer?.symbol || 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Sort Controls */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center">
          <Filter className="h-4 w-4 mr-2 text-gray-500" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="input w-auto"
          >
            <option value="symbol">Sort by Symbol</option>
            <option value="gainPercent">Sort by Gain %</option>
            <option value="lossPercent">Sort by Loss %</option>
            <option value="value">Sort by Value</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <select
            value={filterBy}
            onChange={(e) => setFilterBy(e.target.value)}
            className="input w-auto"
          >
            <option value="all">All Stocks</option>
            <option value="gainers">Gainers Only</option>
            <option value="losers">Losers Only</option>
          </select>
        </div>
      </div>

      {/* Stock Performance Cards */}
      {sortedStocks.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedStocks.map((stock) => {
            // Ensure stock is a valid object with required properties
            if (!stock || typeof stock !== 'object' || !stock.symbol) {
              console.warn('Invalid stock object:', stock);
              return null;
            }
            
            return (
            <div key={stock._id} className="card hover:shadow-lg transition-shadow duration-200">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{stock.symbol}</h3>
                  <p className="text-sm text-gray-600">{stock.quantity} shares</p>
                </div>
                <div className={`px-2 py-1 rounded text-xs font-medium ${
                  (stock.profitLossPercent || 0) >= 0 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {(stock.profitLossPercent || 0) >= 0 ? '+' : ''}
                  {stock.profitLossPercent?.toFixed(2) || '0.00'}%
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Buy Price</p>
                  <p className="text-sm font-medium">${stock.buyPrice?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Price</p>
                  <p className="text-sm font-medium">${stock.currentPrice?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Invested</p>
                  <p className="text-sm font-medium">${stock.invested?.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Current Value</p>
                  <p className="text-sm font-medium">${stock.currentValue?.toFixed(2)}</p>
                </div>
              </div>

              {/* Mini Chart */}
              <div className="h-16 mb-4">
                <Line data={generateMiniChartData(stock)} options={miniChartOptions} />
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-gray-500">P&L</p>
                  <p className={`text-sm font-bold ${
                    (stock.profitLoss || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(stock.profitLoss || 0) >= 0 ? '+' : ''}${stock.profitLoss?.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  {stock.highPrice && stock.lowPrice && (
                    <span>
                      H: ${stock.highPrice.toFixed(2)} L: ${stock.lowPrice.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            );
          })}
        </div>
      ) : (
        <div className="card text-center py-12">
          <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stocks in portfolio</h3>
          <p className="text-gray-600 mb-4">Add some stocks to your portfolio to see detailed analytics</p>
          <a href="/portfolio" className="btn-primary">
            Add Stocks
          </a>
        </div>
      )}
    </div>
  );
};

export default EnhancedDashboard;