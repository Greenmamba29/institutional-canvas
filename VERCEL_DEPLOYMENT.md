# LithiumBuy - Vercel Deployment Guide

**Last Updated**: January 11, 2026  
**Status**: Production Ready  
**Authentication**: Supabase Auth (Native)

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
# Supabase Configuration (REQUIRED)
# ===================================
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

**Important Notes**:
- Set all variables for **Production**, **Preview**, and **Development** environments
- Never commit these to git (they're in `.gitignore`)
- Vercel encrypts all environment variables

### Step 3: Configure Supabase Auth URLs

After deployment, update Supabase Auth with your production URLs:

1. Go to: https://supabase.com/dashboard/project/YOUR_PROJECT/auth/url-configuration
2. Add to **Site URL**:
   ```
   https://your-app.vercel.app
   ```

3. Add to **Redirect URLs**:
   ```
   https://your-app.vercel.app/**
   https://www.yourdomain.com/**
   ```

4. Click **Save**

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
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | All | Supabase project URL |
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

### vercel.json

The project includes a `vercel.json` with security headers and SPA rewrites:

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
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ],
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
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

---

## 🧪 Testing Deployment

### 1. Check Build Logs

```bash
# View deployment logs
vercel logs <deployment-url>
```

### 2. Verify Environment Variables

Open browser devtools console and check:

```javascript
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL ? '✅' : '❌');
console.log('Supabase Key:', import.meta.env.VITE_SUPABASE_ANON_KEY ? '✅' : '❌');
```

### 3. Test Production

Visit your deployment URL and verify:
- [ ] Page loads without errors
- [ ] Login redirects to Supabase Auth
- [ ] Auth redirects back to app
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

### Auth Redirect Issues

**Error**: `Invalid redirect URL`
```
Solution: Add your Vercel URL to Supabase Auth Redirect URLs
Dashboard → Authentication → URL Configuration
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
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ]
}
```

### Compression

Vercel automatically compresses:
- HTML, CSS, JS with Brotli + Gzip
- Images with automatic optimization
- Fonts with optimal caching

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
- [ ] Supabase Auth redirect URLs updated
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate issued (automatic)
- [ ] Test login flow on production
- [ ] Test multi-tenant functionality
- [ ] Test real-time updates
- [ ] Test TeleBuy video sessions
- [ ] Monitor deployment logs for errors
- [ ] Set up Vercel Analytics (optional)

---

## 📞 Support

**Vercel Documentation**: https://vercel.com/docs  
**Supabase Documentation**: https://supabase.com/docs

**Project Maintainer**: @paco  
**Repository**: https://github.com/yourusername/institutional-canvas
