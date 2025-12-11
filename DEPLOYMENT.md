# Deployment Guide for Render

This guide will walk you through deploying your Stock Viewer application to Render.

## Prerequisites

1. A GitHub account
2. Your project pushed to a GitHub repository
3. A Render account (sign up at https://render.com - it's free)

## Step 1: Prepare Your Repository

1. Make sure all your code is committed and pushed to GitHub:
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

## Step 2: Deploy Backend (API Server)

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Sign up or log in

2. **Create New Web Service**
   - Click "New +" button
   - Select "Web Service"

3. **Connect Repository**
   - Click "Connect account" if you haven't connected GitHub
   - Authorize Render to access your repositories
   - Select your repository
   - Click "Connect"

4. **Configure Backend Service**
   - **Name**: `stock-viewer-api` (or any name you prefer)
   - **Environment**: `Node`
   - **Region**: Choose closest to you (e.g., `Oregon (US West)`)
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: Leave empty (or `./` if needed)
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`

5. **Add Environment Variables**
   - Click "Advanced" → "Add Environment Variable"
   - Add:
     - Key: `NODE_ENV`, Value: `production`
     - Key: `PORT`, Value: `10000` (Render sets this automatically, but good to have)

6. **Add Persistent Disk (Important for File Storage)**
   - Scroll down to "Disk"
   - Click "Add Disk"
   - Name: `stock-viewer-disk`
   - Mount Path: `/opt/render/project/src/public`
   - Size: `1 GB` (free tier allows up to 1GB)
   - Click "Create Disk"

7. **Deploy**
   - Click "Create Web Service"
   - Wait for deployment to complete (5-10 minutes)
   - **Copy the service URL** (e.g., `https://stock-viewer-api.onrender.com`)
   - This is your backend URL!

## Step 3: Deploy Frontend (Static Site)

1. **Create New Static Site**
   - In Render dashboard, click "New +"
   - Select "Static Site"

2. **Connect Repository**
   - Select the same repository
   - Click "Connect"

3. **Configure Frontend**
   - **Name**: `stock-viewer-frontend` (or any name)
   - **Branch**: `main`
   - **Root Directory**: Leave empty
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`

4. **Add Environment Variable**
   - Click "Add Environment Variable"
   - Key: `VITE_UPLOAD_API_URL`
   - Value: `https://YOUR-BACKEND-URL.onrender.com/upload`
     - Replace `YOUR-BACKEND-URL` with your actual backend URL from Step 2
   - Example: `https://stock-viewer-api.onrender.com/upload`

5. **Deploy**
   - Click "Create Static Site"
   - Wait for deployment (3-5 minutes)
   - Your frontend will be live!

## Step 4: Update Backend CORS (If Needed)

If you encounter CORS issues:

1. Go to your backend service in Render
2. Click "Environment"
3. Add environment variable:
   - Key: `FRONTEND_URL`
   - Value: Your frontend URL (e.g., `https://stock-viewer-frontend.onrender.com`)

4. Update `server.js` to use this:
   ```javascript
   const FRONTEND_URL = process.env.FRONTEND_URL || '*';
   app.use((req, res, next) => {
     res.header('Access-Control-Allow-Origin', FRONTEND_URL);
     // ... rest of CORS code
   });
   ```

## Step 5: Test Your Deployment

1. Visit your frontend URL
2. Navigate to `/admin` route
3. Try uploading an XLSX file
4. Verify the file is saved and data loads correctly

## Troubleshooting

### Backend Issues:
- **Port Error**: Render automatically sets PORT, but ensure your server.js uses `process.env.PORT || 4000`
- **File Upload Fails**: Check that the disk is mounted correctly at `/opt/render/project/src/public`
- **CORS Errors**: Update CORS settings as described in Step 4

### Frontend Issues:
- **API Not Found**: Verify `VITE_UPLOAD_API_URL` environment variable is set correctly
- **Build Fails**: Check that all dependencies are in `package.json`

### File Storage:
- Files are stored on the persistent disk
- Free tier: 1GB storage limit
- Files persist across deployments

## Custom Domain (Optional)

1. Go to your service settings
2. Click "Custom Domains"
3. Add your domain
4. Follow DNS configuration instructions

## Monitoring

- View logs in Render dashboard
- Check service health status
- Monitor disk usage

## Cost

- **Free Tier**: 
  - 750 hours/month (enough for 24/7 operation)
  - 1GB disk storage
  - 512MB RAM
  - Sleeps after 15 minutes of inactivity (wakes on first request)

## Notes

- Free tier services sleep after inactivity but wake automatically
- First request after sleep may take 30-60 seconds
- Consider upgrading to paid tier for production use (no sleep, better performance)

