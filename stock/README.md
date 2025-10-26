# 📊 Enhanced AI Stock Portfolio Tracker

A full-stack responsive web application for tracking stock portfolios with real-time data, advanced dashboard interactivity, live market monitoring, and AI-powered portfolio insights.

## ✨ Enhanced Features

### 🚀 **NEW: Advanced Dashboard**
- **📊 Interactive Stock Cards**: Individual performance cards with mini sparkline charts
- **🎯 Portfolio Insights**: Best/worst performers, total P&L, and key metrics
- **🔄 Real-time Updates**: WebSocket-powered live price updates every 30 seconds
- **🎛️ Smart Filtering**: Sort by gain/loss percentage, value, or symbol
- **📈 Mini Charts**: 7-day trend visualization for each stock
- **💡 Hover Tooltips**: Daily highs/lows and detailed metrics

### 📈 **NEW: Live Market Page**
- **🌐 Market Overview**: Real-time prices for popular stocks (AAPL, TSLA, AMZN, etc.)
- **🔍 Stock Search**: Find and add new stocks to your portfolio
- **📊 Top Movers**: Live gainers and losers with percentage changes
- **🟢🔴 Color Indicators**: Visual price movement indicators
- **➕ Quick Add**: Add stocks directly from market page to portfolio
- **🔄 WebSocket Integration**: Live streaming price updates

### 🤖 **NEW: Enhanced AI Assistant**
- **🧠 Portfolio-Aware AI**: Gemini AI with access to your real-time portfolio data
- **💬 Chat Interface**: Interactive conversation with contextual responses
- **📊 Smart Insights**: Personalized analysis based on your actual holdings
- **🎯 Quick Actions**: Pre-built analysis buttons for common queries
- **📈 Performance Context**: AI responses include specific P&L numbers and percentages
- **🔄 Live Data Integration**: AI uses current market prices for accurate analysis

### ⚡ **Real-time Infrastructure**
- **🔌 WebSocket Server**: Live price streaming from Finnhub API
- **💾 Smart Caching**: 5-minute price cache to optimize API usage
- **🔄 Auto-refresh**: Periodic updates every 30 seconds
- **📡 Connection Status**: Live connection indicators throughout the app

## 🛠 Tech Stack

### Frontend
- React.js 18
- Tailwind CSS
- Chart.js & React-Chart.js-2
- **NEW: React Query** for data caching and synchronization
- **NEW: WebSocket Client** for real-time updates
- Axios for HTTP requests
- React Router DOM
- Lucide React (icons)
- React Hot Toast

### Backend
- Node.js & Express.js
- MongoDB with Mongoose
- **NEW: WebSocket Server (ws)** for real-time price streaming
- **NEW: Node-Cache** for intelligent price caching
- JWT Authentication
- bcryptjs for password hashing
- Finnhub API for stock data and WebSocket streaming
- Enhanced Gemini/OpenAI API integration with portfolio context

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Finnhub API key (free at https://finnhub.io)
- Gemini or OpenAI API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd stock-portfolio-tracker
   ```

2. **Install dependencies**
   ```bash
   npm run install-all
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   MONGODB_URI=mongodb://localhost:27017/stock-portfolio
   JWT_SECRET=your_jwt_secret_key_here
   FINNHUB_API_KEY=your_finnhub_api_key_here
   GEMINI_API_KEY=your_gemini_api_key_here
   # OR
   OPENAI_API_KEY=your_openai_api_key_here
   PORT=5000
   ```

4. **Start the application**
   
   For development (runs both client and server):
   ```bash
   npm run dev
   ```

   This will start:
   - Backend server on http://localhost:5000
   - Frontend on http://localhost:3000
   
   For production testing (unified server):
   ```bash
   npm run render-build
   NODE_ENV=production npm start
   ```
   Then visit http://localhost:5000

## 📁 Project Structure

```
stock-portfolio-tracker/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/          # Page components
│   │   ├── context/        # React context
│   │   └── App.js
│   └── package.json
├── server/                 # Express backend
│   ├── routes/             # API routes
│   ├── controllers/        # Route handlers
│   ├── models/             # MongoDB models
│   ├── middleware/         # Custom middleware
│   └── server.js
├── .env.example           # Environment template
└── package.json           # Root package.json
```

## 🔑 API Keys Setup

### Finnhub API (Required)
1. Visit https://finnhub.io
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add to `.env` as `FINNHUB_API_KEY`

### AI API (Choose One)

#### Option 1: Google Gemini (Recommended)
1. Visit https://makersuite.google.com/app/apikey
2. Create a new API key
3. Add to `.env` as `GEMINI_API_KEY`

#### Option 2: OpenAI
1. Visit https://platform.openai.com/api-keys
2. Create a new API key
3. Add to `.env` as `OPENAI_API_KEY`

## 🎨 UI Design

The application follows a minimal, professional design with:
- **Color Palette**: White, gray, black, and blue accent
- **Typography**: Clean, readable fonts
- **Layout**: Sidebar navigation with main content area
- **Components**: Cards with soft shadows and rounded corners
- **Responsive**: Mobile-friendly design

## 📊 Enhanced Features Overview

### 🚀 Enhanced Dashboard
- **Interactive Stock Cards**: Individual performance tracking with mini charts
- **Real-time Metrics**: Live P&L, current prices, and percentage changes
- **Portfolio Insights**: Best/worst performers and key statistics
- **Smart Filtering**: Sort by performance, value, or alphabetically
- **Mini Sparklines**: 7-day trend visualization for each holding
- **Live Connection Status**: WebSocket connection indicators

### 📈 Live Market Page
- **Market Overview**: Real-time data for popular stocks
- **Stock Search**: Find and research new investment opportunities
- **Top Movers**: Live gainers and losers with visual indicators
- **Quick Portfolio Addition**: Add stocks directly from market data
- **Company Information**: Names, logos, and market data
- **Live Price Streaming**: WebSocket-powered real-time updates

### 💼 Enhanced Portfolio Management
- **Live Data Integration**: Real-time price updates for all holdings
- **Advanced Metrics**: Detailed P&L calculations with live prices
- **Performance Tracking**: Historical buy prices vs. current market values
- **Quick Actions**: Edit, delete, and manage positions efficiently
- **Portfolio Summary**: Total invested, current value, and overall performance

### 🤖 AI-Powered Insights
- **Portfolio-Aware Analysis**: AI with access to your real-time data
- **Contextual Responses**: Specific insights based on your actual holdings
- **Interactive Chat**: Natural language queries with intelligent responses
- **Quick Insight Buttons**: Pre-built analysis for common questions
- **Performance Context**: AI includes specific numbers and percentages
- **Smart Recommendations**: Personalized advice based on your portfolio

## 🔧 Development

### Running Individual Services

**Backend only:**
```bash
cd server
npm run dev
```

**Frontend only:**
```bash
cd client
npm start
```

### Building for Production

**Frontend:**
```bash
cd client
npm run build
```

## 🚀 Deployment on Render

This application is configured for unified deployment on Render (both client and server together).

### Steps to Deploy:

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push origin main
   ```

2. **Create a new Web Service on Render**
   - Go to https://render.com
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure the service:
     - **Name**: stock-portfolio-tracker
     - **Environment**: Node
     - **Build Command**: `npm run render-build`
     - **Start Command**: `npm start`
     - **Instance Type**: Free (or your preferred tier)

3. **Add Environment Variables**
   In the Render dashboard, add these environment variables:
   ```
   NODE_ENV=production
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret_key
   FINNHUB_API_KEY=your_finnhub_api_key
   GEMINI_API_KEY=your_gemini_api_key
   PORT=10000
   ```

4. **Deploy**
   - Click "Create Web Service"
   - Render will automatically build and deploy your app
   - Your app will be available at: `https://your-app-name.onrender.com`

### Notes:
- The server serves the React build in production
- Both frontend and backend run on the same domain
- No CORS issues since everything is on one server
- Free tier may spin down after inactivity (takes ~30s to wake up)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

If you encounter any issues:
1. Check the console for error messages
2. Verify your API keys are correct
3. Ensure MongoDB is running
4. Check network connectivity for API calls

## 🔮 Future Enhancements

- [ ] **Historical Charts**: Advanced charting with 1D, 1W, 1M, 1Y views
- [ ] **News Integration**: Stock-specific news and market sentiment
- [ ] **Portfolio Analytics**: Risk analysis, correlation matrices, and diversification metrics
- [ ] **Alerts System**: Price alerts and portfolio notifications
- [ ] **Export Features**: PDF reports and CSV data export
- [ ] **Dark Mode**: Toggle between light and dark themes
- [ ] **Watchlist**: Track stocks without adding to portfolio
- [ ] **Multi-currency**: Support for international markets
- [ ] **Options Trading**: Track options positions and Greeks
- [ ] **Dividend Tracking**: Monitor dividend income and yield