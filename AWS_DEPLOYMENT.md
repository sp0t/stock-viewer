# AWS + Vercel Deployment Guide

This guide will help you deploy:
- **Backend**: AWS EC2/Lightsail instance
- **Frontend**: Vercel

## Prerequisites

1. AWS Account (EC2 free tier or Lightsail)
2. Vercel Account (free)
3. Domain name (optional, but recommended)

---

## Part 1: Deploy Backend to AWS

### Step 1: Create AWS Instance

#### Option A: EC2 (Free Tier - 12 months)
1. Go to AWS Console → EC2
2. Launch Instance
3. Choose: **Ubuntu Server 22.04 LTS** (free tier eligible)
4. Instance Type: **t2.micro** (free tier)
5. Configure Security Group:
   - SSH (22) - Your IP
   - HTTP (80) - 0.0.0.0/0
   - HTTPS (443) - 0.0.0.0/0
   - Custom TCP (4000) - 0.0.0.0/0 (for backend API)
6. Launch and download key pair (.pem file)

#### Option B: Lightsail ($3.50/month)
1. Go to AWS Lightsail
2. Create Instance
3. Choose: **Node.js** or **Ubuntu**
4. Select plan: **$3.50/month**
5. Create instance

### Step 2: Connect to Instance

```bash
# For EC2
ssh -i your-key.pem ubuntu@your-ec2-ip

# For Lightsail
ssh -i your-key.pem ubuntu@your-lightsail-ip
```

### Step 3: Install Node.js

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 4: Install PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### Step 5: Clone and Setup Project

```bash
# Install git if needed
sudo apt install git -y

# Clone your repository
git clone https://github.com/your-username/Stock_viewer.git
cd Stock_viewer

# Install dependencies
npm install

# Build frontend (for serving static files)
npm run build
```

### Step 6: Configure Environment Variables

```bash
# Create .env file
nano .env
```

Add:
```
PORT=4000
NODE_ENV=production
FRONTEND_URL=https://your-vercel-app.vercel.app
```

### Step 7: Start Backend with PM2

```bash
# Start the server
pm2 start server.js --name stock-viewer-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions it provides
```

### Step 8: Install and Configure Nginx (Optional but Recommended)

```bash
# Install Nginx
sudo apt install nginx -y

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/stock-viewer
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com;  # or your EC2 public IP

    # Backend API
    location /api {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Upload endpoint
    location /upload {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        client_max_body_size 10M;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:4000;
    }

    # Frontend static files (if serving from same instance)
    location / {
        root /home/ubuntu/Stock_viewer/dist;
        try_files $uri $uri/ /index.html;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/stock-viewer /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 9: Get Your Backend URL

- **EC2**: `http://your-ec2-public-ip:4000` or `http://your-domain.com`
- **Lightsail**: `http://your-lightsail-ip:4000` or `http://your-domain.com`

---

## Part 2: Deploy Frontend to Vercel

### Step 1: Push Code to GitHub

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 3: Set Environment Variables

In Vercel project settings → Environment Variables:

```
VITE_UPLOAD_API_URL=https://your-aws-backend-url/api/upload
```

Or if using direct port:
```
VITE_UPLOAD_API_URL=http://your-ec2-ip:4000/upload
```

### Step 4: Deploy

Click "Deploy" and wait for build to complete.

---

## Part 3: Update Frontend Code

Update `src/App.jsx` to use environment variable:

The code already uses:
```javascript
const UPLOAD_API_URL = import.meta.env.VITE_UPLOAD_API_URL || "http://localhost:4000/upload";
```

So it will automatically use the Vercel environment variable in production.

---

## Part 4: CORS Configuration

Make sure your AWS backend allows requests from Vercel:

In `server.js`, update CORS:
```javascript
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://your-vercel-app.vercel.app';
```

---

## Testing

1. **Backend**: Visit `http://your-aws-ip:4000/health` - should return `{"status":"ok"}`
2. **Frontend**: Visit your Vercel URL
3. **Upload**: Test file upload from frontend

---

## Troubleshooting

### Backend not accessible
- Check Security Group rules (ports 80, 443, 4000)
- Check firewall: `sudo ufw status`
- Check PM2: `pm2 logs stock-viewer-backend`

### CORS errors
- Update `FRONTEND_URL` in backend `.env`
- Restart PM2: `pm2 restart stock-viewer-backend`

### File upload fails
- Check file permissions: `chmod 755 public`
- Check disk space: `df -h`
- Check PM2 logs: `pm2 logs`

---

## Security Recommendations

1. **Use HTTPS**: Set up SSL certificate (Let's Encrypt is free)
2. **Firewall**: Only open necessary ports
3. **SSH Keys**: Use key-based authentication, disable password login
4. **Environment Variables**: Never commit `.env` file
5. **Regular Updates**: `sudo apt update && sudo apt upgrade`

---

## Cost Estimate

- **EC2 t2.micro**: Free for 12 months, then ~$8-15/month
- **Lightsail**: $3.50/month
- **Vercel**: Free (hobby plan)
- **Total**: $0-15/month depending on AWS choice

---

## Next Steps

1. Set up domain name (optional)
2. Configure SSL/HTTPS
3. Set up automated backups
4. Monitor with PM2: `pm2 monit`

