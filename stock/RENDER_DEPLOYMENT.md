# Render Deployment Guide

This application is configured for unified deployment on Render where both the React client and Express server run together.

## Architecture

- **Single Web Service**: Both frontend and backend on one server
- **Production Mode**: Server serves the built React app as static files
- **API Routes**: All API calls go to `/api/*` endpoints
- **No CORS Issues**: Everything runs on the same domain

## Quick Deploy

### Option 1: Using Render Dashboard

1. Push your code to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click "New +" → "Web Service"
4. Connect your GitHub repository
5. Use these settings:
   - **Build Command**: `npm run render-build`
   - **Start Command**: `npm start`
   - **Environment**: Node
6. Add environment variables (see below)
7. Click "Create Web Service"

### Option 2: Using render.yaml (Blueprint)

1. The `render.yaml` file is already configured
2. Push to GitHub
3. Go to Render Dashboard → "New +" → "Blueprint"
4. Connect your repository
5. Render will auto-detect the `render.yaml` file
6. Add your environment variables
7. Deploy!

## Required Environment Variables

Add these in the Render dashboard under "Environment":

```
NODE_ENV=production
PORT=10000
MONGODB_URI=your_mongodb_atlas_connection_string
JWT_SECRET=your_strong_random_secret
FINNHUB_API_KEY=your_finnhub_api_key
GEMINI_API_KEY=your_gemini_api_key
```

### Getting MongoDB Atlas URI

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Click "Connect" → "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your database user password
6. Use this as your `MONGODB_URI`

## Testing Locally in Production Mode

Before deploying, test the production build locally:

```bash
# Build the client
npm run render-build

# Start in production mode
set NODE_ENV=production
npm start
```

Visit http://localhost:5000 (note: not 3000!)

## Post-Deployment

After deployment:
- Your app will be at: `https://your-app-name.onrender.com`
- API endpoints: `https://your-app-name.onrender.com/api/*`
- Health check: `https://your-app-name.onrender.com/api/health`

## Free Tier Notes

- Free tier spins down after 15 minutes of inactivity
- First request after spin-down takes ~30 seconds
- Upgrade to paid tier for always-on service

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify build command runs locally: `npm run render-build`

### App Won't Start
- Check environment variables are set correctly
- Verify MongoDB URI is accessible from Render
- Check logs in Render dashboard

### 404 Errors
- Ensure `NODE_ENV=production` is set
- Verify client build exists in `client/build`

### API Errors
- Check API keys are valid
- Verify MongoDB connection
- Check Render logs for specific errors
