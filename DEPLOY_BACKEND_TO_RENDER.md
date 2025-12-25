# Deploy SINDH Backend to Render

## Prerequisites

- GitHub account with SINDHv2 repository
- Render account (free tier works)
- MongoDB Atlas account (or other MongoDB hosting)

## Step 1: Prepare MongoDB Database

### Option A: MongoDB Atlas (Recommended)

1. Go to https://www.mongodb.com/cloud/atlas
2. Sign up or log in
3. Create new cluster (free M0 tier)
4. Wait 5-10 minutes for cluster creation
5. Click "Connect" → "Connect your application"
6. Copy connection string:
   ```
   mongodb+srv://username:password@cluster.mongodb.net/sindh
   ```
7. Replace `<password>` with your database password
8. Replace `<dbname>` with `sindh`

### Option B: Render PostgreSQL (Alternative)

Note: Current backend uses MongoDB. If switching to PostgreSQL, need to update models and queries.

## Step 2: Push Code to GitHub

```bash
cd c:/Users/AMAR/SINDHv2/SINDHbackend
git add .
git commit -m "Update CORS for mobile app support"
git push origin main
```

## Step 3: Create Render Web Service

1. **Go to Render Dashboard:**
   - Visit https://dashboard.render.com
   - Click "New +" → "Web Service"

2. **Connect Repository:**
   - Click "Connect account" (GitHub)
   - Authorize Render to access repositories
   - Select `SINDHv2` repository
   - Select `SINDHbackend` directory (if monorepo)

3. **Configure Service:**
   - **Name:** `sindh-backend`
   - **Region:** Choose closest to your users
   - **Branch:** `main` or `master`
   - **Root Directory:** `SINDHbackend` (if monorepo)
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free (or paid for better performance)

4. **Add Environment Variables:**
   Click "Advanced" → "Add Environment Variable":
   
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = `mongodb+srv://...` (from Step 1)
   - `JWT_SECRET` = Generate random string (e.g., `openssl rand -base64 32`)
   - `ALLOWED_ORIGINS` = (optional, for additional origins)

5. **Configure Health Check:**
   - **Health Check Path:** `/api/health`
   - This matches the endpoint in `index.js` line 64

6. **Deploy:**
   - Click "Create Web Service"
   - Wait 5-10 minutes for deployment
   - Watch logs for errors

## Step 4: Verify Deployment

### Check Deployment Status

1. **In Render Dashboard:**
   - Go to your service
   - Check "Events" tab for deployment status
   - Should show "Deploy succeeded"

2. **Check Logs:**
   - Click "Logs" tab
   - Look for:
     ```
     ✅ Server running on port 10000
     🌐 Environment: production
     🔗 Allowed CORS origins: [...]
     🎉 Your service is live!
     ```

### Test Health Endpoint

```bash
# Test from command line
curl http://localhost:10000/api/health

# Expected response:
{
  "status": "ok",
  "services": {
    "database": "connected",
    "server": "running"
  },
  "environment": "production"
}
```

### Test from Browser

1. Open: http://localhost:10000/api/health
2. Should see JSON response
3. If you see "Not Found" → Check root directory setting
4. If you see "Service Unavailable" → Check logs for errors

## Step 5: Test API Endpoints

### Test Worker Registration

```bash
curl -X POST http://localhost:10000/api/workers/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Worker",
    "phone": "9876543210",
    "age": 25,
    "aadharNumber": "123456789012",
    "skills": ["Construction"],
    "location": {
      "village": "Test Village",
      "district": "Test District",
      "state": "Test State"
    },
    "language": "English",
    "experience_years": 2
  }'
```

### Test Jobs Endpoint

```bash
curl http://localhost:10000/api/jobs
```

## Step 6: Configure Auto-Deploy

1. **In Render Dashboard:**
   - Go to service settings
   - Enable "Auto-Deploy"
   - Select branch: `main`

2. **Now every push to main will auto-deploy:**
   ```bash
   git push origin main
   # Render automatically deploys
   ```

## Troubleshooting

### Issue: "Service Unavailable"

**Cause:** Backend crashed or failed to start

**Solution:**
1. Check Render logs for errors
2. Common issues:
   - Missing `MONGODB_URI` environment variable
   - Invalid MongoDB connection string
   - Port binding issues (Render sets PORT automatically)
   - Missing dependencies in `package.json`

### Issue: "Database connection failed"

**Cause:** MongoDB URI incorrect or database not accessible

**Solution:**
1. Verify MongoDB Atlas cluster is running
2. Check IP whitelist in MongoDB Atlas (allow 0.0.0.0/0 for Render)
3. Verify connection string format
4. Test connection string locally first

### Issue: "CORS errors in mobile app"

**Cause:** CORS not configured for mobile origins

**Solution:**
1. Verify CORS changes from previous steps are deployed
2. Check Render logs for CORS rejection messages
3. Test health endpoint from mobile app
4. Ensure `origin` function allows no-origin requests

### Issue: "Render service sleeps after 15 minutes"

**Cause:** Free tier limitation

**Solution:**
1. Upgrade to paid plan ($7/month) for always-on service
2. Or accept 30-second cold start on first request
3. Or use external service to ping health endpoint every 10 minutes

## Step 7: Update Frontend Configuration

After backend is deployed and verified:

1. **Frontend already configured correctly:**
   - `api.js` uses `http://localhost:10000/api`
   - Mobile detection routes to production backend
   - No changes needed

2. **Rebuild Android app:**
   ```bash
   cd c:/Users/AMAR/SINDHv2/SINDH-frontend
   npm run build
   npx cap sync android
   ```

3. **Test from Android app:**
   - Open app in Android Studio
   - Check Logcat for API requests
   - Should see: `http://localhost:10000/api/...`
   - Should NOT see: `http://localhost:10000/api/...`

## Monitoring

### Check Service Health

- Render Dashboard → Your Service → Metrics
- Shows: CPU usage, memory, response times
- Free tier: Limited metrics
- Paid tier: Full metrics and alerts

### Check Logs

- Render Dashboard → Your Service → Logs
- Real-time log streaming
- Filter by severity (info, warn, error)
- Download logs for analysis

### Set Up Alerts (Paid Tier)

- Render Dashboard → Your Service → Alerts
- Configure alerts for:
  - Service down
  - High error rate
  - High response time
  - High memory usage

## Cost Estimation

### Free Tier
- **Cost:** $0/month
- **Limitations:**
  - Service sleeps after 15 minutes of inactivity
  - 750 hours/month (shared across all services)
  - Limited bandwidth
  - No custom domains

### Starter Plan
- **Cost:** $7/month
- **Benefits:**
  - Always-on (no sleep)
  - Faster builds
  - More bandwidth
  - Custom domains
  - Better support

## Next Steps

1. ✅ Backend deployed and running
2. ✅ Health endpoint verified
3. ✅ CORS configured for mobile
4. ⏭️ Rebuild Android app (see REBUILD_ANDROID_APP.md)
5. ⏭️ Test connection from mobile app
6. ⏭️ Deploy to production

## Resources

- [Render Documentation](https://render.com/docs)
- [Node.js on Render](https://render.com/docs/deploy-node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Health Checks](https://render.com/docs/health-checks)
- [MongoDB Atlas](https://www.mongodb.com/docs/atlas/)
