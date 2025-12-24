# LithiumBuy - Vercel Deployment Guide

**Last Updated**: 2024-12-24  
**Status**: Production Ready

---

## 🚀 Quick Deploy

### Step 1: Connect Repository to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository: `institutional-canvas`
3. Configure project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

### Step 2: Add Environment Variables

Go to **Project Settings** → **Environment Variables** and add:

```bash
# ===================================
# Auth0 Configuration (REQUIRED)
# ===================================
VITE_AUTH0_DOMAIN=dev-vbox82zyf82ityy0.us.auth0.com
VITE_AUTH0_CLIENT_ID=YnXqFAVjFUcmqeJUZgvbyFzK35A4mBzW
VITE_AUTH0_AUDIENCE=https://api.lithiumbuy.com

# ===================================
# Supabase Configuration (REQUIRED)
# ===================================
VITE_SUPABASE_URL=https://vuekwckknfjivjighhfd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ1ZWt3Y2trbmZqaXZqaWdoaGZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5OTEyNjUsImV4cCI6MjA1MDU2NzI2NX0.8kE5RaGP4qAKPnw3L1a2O-TuIcKvRMqo4hgkxXr_Nsg

# ===================================
# Production URLs (Auto-configured)
# ===================================
# These will be auto-set by Vercel:
# VERCEL_URL (e.g., lithiumbuy.vercel.app)
# VERCEL_GIT_COMMIT_SHA
# VERCEL_GIT_COMMIT_REF
```

**Important Notes**:
- Set all variables for **Production**, **Preview**, and **Development** environments
- Never commit these to git (they're in `.gitignore`)
- Vercel encrypts all environment variables

### Step 3: Update Auth0 Callback URLs

After deployment, update Auth0 with your production URLs:

1. Go to: https://manage.auth0.com/dashboard/us/dev-vbox82zyf82ityy0/applications
2. Click your application
3. Add to **Allowed Callback URLs**:
   ```
   https://lithiumbuy.vercel.app/callback
   https://www.lithiumbuy.com/callback
   https://your-vercel-url.vercel.app/callback
   ```

4. Add to **Allowed Logout URLs**:
   ```
   https://lithiumbuy.vercel.app
   https://www.lithiumbuy.com
   https://your-vercel-url.vercel.app
   ```

5. Add to **Allowed Web Origins**:
   ```
   https://lithiumbuy.vercel.app
   https://www.lithiumbuy.com
   https://your-vercel-url.vercel.app
   ```

6. Click **Save Changes**

### Step 4: Deploy

```bash
# Trigger deployment
git push origin main
```

Vercel will automatically:
- Install dependencies
- Run build
- Deploy to production
- Generate preview URLs for PRs

---

## 📋 Environment Variables Reference

### Required Variables

| Variable | Value | Environment | Description |
|----------|-------|-------------|-------------|
| `VITE_AUTH0_DOMAIN` | `dev-vbox82zyf82ityy0.us.auth0.com` | All | Auth0 tenant domain |
| `VITE_AUTH0_CLIENT_ID` | `YnXqFAVjFUcmqeJUZgvbyFzK35A4mBzW` | All | Auth0 application client ID |
| `VITE_AUTH0_AUDIENCE` | `https://api.lithiumbuy.com` | All | Auth0 API identifier (optional) |
| `VITE_SUPABASE_URL` | `https://vuekwckknfjivjighhfd.supabase.co` | All | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbG...` | All | Supabase anonymous key (public) |

### Auto-Configured by Vercel

| Variable | Description |
|----------|-------------|
| `VERCEL_URL` | Deployment URL (e.g., `lithiumbuy-abc123.vercel.app`) |
| `VERCEL_ENV` | Environment: `production`, `preview`, or `development` |
| `VERCEL_GIT_COMMIT_SHA` | Git commit hash |
| `VERCEL_GIT_COMMIT_REF` | Git branch name |

---

## 🔧 Vercel Configuration

### vercel.json (Optional)

Create `vercel.json` in project root for advanced configuration:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "vite",
  "regions": ["iad1"],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

### Build Settings

**Framework**: Vite  
**Build Command**: `npm run build`  
**Output Directory**: `dist`  
**Install Command**: `npm install`  
**Development Command**: `npm run dev`

**Node Version**: 18.x (auto-detected from package.json)

---

## 🌐 Custom Domain Setup

### Add Custom Domain

1. Go to **Project Settings** → **Domains**
2. Click **Add Domain**
3. Enter: `lithiumbuy.com`
4. Vercel will provide DNS records

### Configure DNS

Add these records at your domain registrar:

```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### SSL Certificate

Vercel automatically provisions SSL certificates via Let's Encrypt (usually takes 1-2 minutes).

---

## 🔄 CI/CD Pipeline

Vercel automatically deploys on:

- **Production**: Push to `main` branch
- **Preview**: Open/update pull request
- **Development**: Push to any other branch

### Deployment Flow

```
1. git push origin main
   ↓
2. Vercel detects commit
   ↓
3. Installs dependencies (npm install)
   ↓
4. Runs build (npm run build)
   ↓
5. Deploys to production
   ↓
6. Sends deployment notification
   ↓
7. Purges CDN cache
```

### Preview Deployments

Every PR gets a unique preview URL:
```
https://lithiumbuy-pr-123-username.vercel.app
```

Share this URL for testing before merging to production.

---

## 🧪 Testing Deployment

### 1. Check Build Logs

```bash
# View deployment logs
vercel logs <deployment-url>
```

### 2. Verify Environment Variables

Create test script: `scripts/check-env.js`

```javascript
console.log('Environment Check:');
console.log('Auth0 Domain:', import.meta.env.VITE_AUTH0_DOMAIN ? '✅' : '❌');
console.log('Auth0 Client ID:', import.meta.env.VITE_AUTH0_CLIENT_ID ? '✅' : '❌');
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌');
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌');
```

### 3. Test Production

Visit your deployment URL and verify:
- [ ] Page loads without errors
- [ ] Login redirects to Auth0
- [ ] Auth0 redirects back to app
- [ ] Dashboard loads with org context
- [ ] Real-time updates work
- [ ] All API calls succeed

---

## 🚨 Troubleshooting

### Build Fails

**Error**: `Cannot find module 'X'`
```bash
# Solution: Ensure all dependencies are in package.json
npm install X --save
git add package.json package-lock.json
git commit -m "Add missing dependency"
git push
```

**Error**: `Build exceeded memory limit`
```json
// Add to vercel.json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "maxLambdaSize": "50mb"
      }
    }
  ]
}
```

### Auth0 Redirect Issues

**Error**: `Callback URL not allowed`
```
Solution: Add your Vercel URL to Auth0 Allowed Callback URLs
```

**Error**: `CORS error when calling Auth0`
```
Solution: Add your Vercel URL to Auth0 Allowed Web Origins
```

### Environment Variables Not Loading

**Error**: `import.meta.env.VITE_XXX is undefined`
```bash
# Solution: Ensure variable name starts with VITE_
# Redeploy after adding/updating variables
vercel --prod
```

### 404 on Page Refresh

**Error**: Direct navigation to `/dashboard` returns 404
```json
// Add to vercel.json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

---

## 📊 Performance Optimization

### Enable Caching

```json
// vercel.json
{
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Enable Compression

Vercel automatically compresses:
- HTML, CSS, JS with Brotli + Gzip
- Images with automatic optimization
- Fonts with optimal caching

### Image Optimization

Use Vercel Image Optimization:

```typescript
import Image from 'next/image'; // If using Next.js

// Or for Vite:
<img 
  src="/icon-512.png" 
  width="512" 
  height="512" 
  loading="lazy" 
  decoding="async" 
/>
```

---

## 🔐 Security Best Practices

### Environment Variables

✅ **Do**:
- Use `VITE_` prefix for public variables
- Store secrets in Vercel environment variables
- Rotate keys regularly
- Use different keys for dev/staging/prod

❌ **Don't**:
- Commit `.env` files to git
- Share keys in Slack/email
- Use production keys in development
- Expose private keys in client code

### Headers

Security headers are configured in `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Referrer-Policy: strict-origin-when-cross-origin`

### HTTPS

- All traffic automatically redirected to HTTPS
- HSTS enabled by default
- TLS 1.3 supported

---

## 📚 Useful Commands

### Deploy from CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod

# Deploy to preview
vercel

# List deployments
vercel ls

# View logs
vercel logs

# Rollback to previous deployment
vercel rollback <deployment-url>
```

### Environment Variables

```bash
# List all environment variables
vercel env ls

# Add environment variable
vercel env add VITE_API_KEY

# Remove environment variable
vercel env rm VITE_API_KEY

# Pull environment variables to local
vercel env pull .env.local
```

---

## 🎉 Post-Deployment Checklist

- [ ] All environment variables added to Vercel
- [ ] Auth0 callback URLs updated with production URL
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate issued (automatic)
- [ ] Test login flow on production
- [ ] Test multi-tenant functionality
- [ ] Test real-time updates
- [ ] Test PWA installation
- [ ] Monitor deployment logs for errors
- [ ] Set up Vercel Analytics (optional)
- [ ] Configure alerts for deployment failures

---

## 📞 Support

**Vercel Documentation**: https://vercel.com/docs  
**Auth0 Documentation**: https://auth0.com/docs  
**Supabase Documentation**: https://supabase.com/docs

**Project Maintainer**: @paco  
**Repository**: https://github.com/yourusername/institutional-canvas
