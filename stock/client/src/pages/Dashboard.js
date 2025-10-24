import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Pie, Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from 'chart.js';
import { TrendingUp, TrendingDown, DollarSign, PieChart } from 'lucide-react';
import toast from 'react-hot-toast';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title
);

const Dashboard = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [stockPrices, setStockPrices] = useState({});
  const [loading, setLoading] = useState(true);
  const [portfolioStats, setPortfolioStats] = useState({
    totalValue: 0,
    totalInvested: 0,
    totalProfitLoss: 0,
    totalProfitLossPercent: 0
  });

  useEffect(() => {
    fetchPortfolioData();
  }, []);

  const fetchPortfolioData = async () => {
    try {
      setLoading(true);
      
      // Fetch portfolio
      const portfolioResponse = await axios.get('/portfolio');
      const portfolioData = portfolioResponse.data;
      setPortfolio(portfolioData);

      if (portfolioData.stocks.length > 0) {
        // Fetch live prices for all stocks
        const symbols = portfolioData.stocks.map(stock => stock.symbol);
        const pricesResponse = await axios.post('/stocks/quotes', { symbols });
        
        const pricesMap = {};
        pricesResponse.data.forEach(stock => {
          if (!stock.error) {
            pricesMap[stock.symbol] = stock;
          }
        });
        setStockPrices(pricesMap);

        // Calculate portfolio stats
        calculatePortfolioStats(portfolioData.stocks, pricesMap);
      }
    } catch (error) {
      toast.error('Failed to fetch portfolio data');
      console.error('Portfolio fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePortfolioStats = (stocks, prices) => {
    let totalValue = 0;
    let totalInvested = 0;

    stocks.forEach(stock => {
      const currentPrice = prices[stock.symbol]?.currentPrice || stock.buyPrice;
      const invested = stock.quantity * stock.buyPrice;
      const currentValue = stock.quantity * currentPrice;
      
      totalInvested += invested;
      totalValue += currentValue;
    });

    const totalProfitLoss = totalValue - totalInvested;
    const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;

    setPortfolioStats({
      totalValue,
      totalInvested,
      totalProfitLoss,
      totalProfitLossPercent
    });
  };

  const getPieChartData = () => {
    if (!portfolio || portfolio.stocks.length === 0) return null;

    const data = portfolio.stocks.map(stock => {
      const currentPrice = stockPrices[stock.symbol]?.currentPrice || stock.buyPrice;
      return {
        label: stock.symbol,
        value: stock.quantity * currentPrice
      };
    });

    return {
      labels: data.map(item => item.label),
      datasets: [
        {
          data: data.map(item => item.value),
          backgroundColor: [
            '#3B82F6',
            '#10B981',
            '#F59E0B',
            '#EF4444',
            '#8B5CF6',
            '#06B6D4',
            '#84CC16',
            '#F97316'
          ],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    };
  };

  const getLineChartData = () => {
    // Mock historical data for demonstration
    const labels = ['1M ago', '3W ago', '2W ago', '1W ago', 'Today'];
    const data = [
      portfolioStats.totalInvested * 0.95,
      portfolioStats.totalInvested * 0.98,
      portfolioStats.totalInvested * 1.02,
      portfolioStats.totalInvested * 0.99,
      portfolioStats.totalValue
    ];

    return {
      labels,
      datasets: [
        {
          label: 'Portfolio Value',
          data,
          borderColor: '#3B82F6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
          fill: true
        }
      ]
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
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <button
          onClick={fetchPortfolioData}
          className="btn-secondary"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="p-2 bg-primary-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Value</p>
              <p className="text-2xl font-bold text-gray-900">
                ${portfolioStats.totalValue.toFixed(2)}
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
                ${portfolioStats.totalInvested.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${portfolioStats.totalProfitLoss >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {portfolioStats.totalProfitLoss >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Profit/Loss</p>
              <p className={`text-2xl font-bold ${portfolioStats.totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                ${portfolioStats.totalProfitLoss.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${portfolioStats.totalProfitLossPercent >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              {portfolioStats.totalProfitLossPercent >= 0 ? (
                <TrendingUp className="h-6 w-6 text-green-600" />
              ) : (
                <TrendingDown className="h-6 w-6 text-red-600" />
              )}
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Return %</p>
              <p className={`text-2xl font-bold ${portfolioStats.totalProfitLossPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {portfolioStats.totalProfitLossPercent.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      {portfolio && portfolio.stocks.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Distribution</h3>
            <div className="h-64">
              <Pie 
                data={getPieChartData()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom'
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Portfolio Performance</h3>
            <div className="h-64">
              <Line 
                data={getLineChartData()} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      display: false
                    }
                  },
                  scales: {
                    y: {
                      beginAtZero: false
                    }
                  }
                }}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="card text-center py-12">
          <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No stocks in portfolio</h3>
          <p className="text-gray-600 mb-4">Add some stocks to your portfolio to see analytics</p>
          <a href="/portfolio" className="btn-primary">
            Add Stocks
          </a>
        </div>
      )}
    </div>
  );
};

export default Dashboard;