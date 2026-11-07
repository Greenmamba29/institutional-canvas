# Supabase Authentication Configuration for LithiumBuy

**Project URL**: https://vuekwckknfjivjighhfd.supabase.co  
**Production Domain**: https://lithiumbuy.com  
**Updated**: January 4, 2026

---

## 🔐 Required Supabase Auth Settings

### 1. Site URL Configuration

**Navigate to**: Supabase Dashboard → Authentication → URL Configuration

**Site URL** (Primary redirect after authentication):
```
https://lithiumbuy.com
```

### 2. Redirect URLs (Allow List)

Add these URLs to allow authentication from all routes:

```
https://lithiumbuy.com/**
https://lithiumbuy.com/callback
https://lithiumbuy.com/auth/callback
http://localhost:5173/**
http://localhost:5173/callback
```

**Important**: The `**` wildcard allows authentication from any route on your domain.

---

## 🌐 Auth0 Configuration

**Domain**: `dev-vbox82zyf82ityy0.us.auth0.com`  
**Client ID**: `YnXqFAVjFUcmqeJUZgvbyFzK35A4mBzW`

### Allowed Callback URLs

Add these in Auth0 Dashboard → Applications → LithiumBuy → Settings:

```
https://lithiumbuy.com/callback
https://lithiumbuy.com/auth/callback
https://lithiumbuy.com
http://localhost:5173/callback
http://localhost:5173
```

### Allowed Logout URLs

```
https://lithiumbuy.com
https://lithiumbuy.com/
http://localhost:5173
```

### Allowed Web Origins

```
https://lithiumbuy.com
http://localhost:5173
```

---

## 📝 Manual Configuration Steps

Since MCP tools may not have direct access to Supabase Auth settings, follow these steps:

### Step 1: Configure Supabase

1. Go to: https://supabase.com/dashboard/project/vuekwckknfjivjighhfd
2. Navigate to: **Authentication** → **URL Configuration**
3. Set **Site URL**: `https://lithiumbuy.com`
4. Under **Redirect URLs**, add:
   - `https://lithiumbuy.com/**`
   - `http://localhost:5173/**`
5. Click **Save**

### Step 2: Configure Auth0

1. Go to: https://manage.auth0.com/dashboard/us/dev-vbox82zyf82ityy0
2. Navigate to: **Applications** → **Applications** → **LithiumBuy**
3. Scroll to **Application URIs**
4. Update:
   - **Allowed Callback URLs**: Add `https://lithiumbuy.com/callback`
   - **Allowed Logout URLs**: Add `https://lithiumbuy.com`
   - **Allowed Web Origins**: Add `https://lithiumbuy.com`
5. Scroll down and click **Save Changes**

### Step 3: Verify Environment Variables

Check that `.env` or `.env.local` has:

```bash
VITE_AUTH0_DOMAIN=dev-vbox82zyf82ityy0.us.auth0.com
VITE_AUTH0_CLIENT_ID=YnXqFAVjFUcmqeJUZgvbyFzK35A4mBzW
VITE_AUTH0_AUDIENCE=https://api.lithiumbuy.com
VITE_SUPABASE_URL=https://vuekwckknfjivjighhfd.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## 🧪 Testing Authentication

### Test on Production

1. Visit: https://lithiumbuy.com
2. Click "Login" or "Sign Up"
3. Complete Auth0 authentication
4. Should redirect back to `https://lithiumbuy.com/callback`
5. Then redirect to dashboard or intended route
6. Verify you're logged in (check for user menu/profile)

### Test Locally

1. Start dev server: `npm run dev`
2. Visit: http://localhost:5173
3. Test same login flow
4. Should redirect to `http://localhost:5173/callback`

---

## 🐛 Troubleshooting

### Issue: "Redirect URI mismatch" error

**Cause**: The callback URL isn't in the allowed list

**Fix**: 
1. Check the exact URL in the error message
2. Add that exact URL to Auth0 Allowed Callback URLs
3. Make sure there's no trailing slash mismatch

### Issue: User can't login on lithiumbuy.com

**Cause**: Site URL in Supabase doesn't match production domain

**Fix**:
1. Set Supabase Site URL to `https://lithiumbuy.com`
2. Add `https://lithiumbuy.com/**` to Redirect URLs
3. Clear browser cache and try again

### Issue: CORS errors

**Cause**: Web Origins not configured in Auth0

**Fix**:
1. Add `https://lithiumbuy.com` to Allowed Web Origins in Auth0
2. Make sure there's no `www.` subdomain conflict

---

## 🔄 Quick Command Reference

### Check current Supabase config (via API):

```bash
curl -X GET 'https://vuekwckknfjivjighhfd.supabase.co/auth/v1/settings' \
  -H "apikey: YOUR_ANON_KEY"
```

### Test Auth0 connection:

```bash
curl -X GET 'https://dev-vbox82zyf82ityy0.us.auth0.com/.well-known/openid-configuration'
```

---

## ✅ Configuration Checklist

- [ ] Supabase Site URL set to `https://lithiumbuy.com`
- [ ] Supabase Redirect URLs include `https://lithiumbuy.com/**`
- [ ] Auth0 Callback URLs include `https://lithiumbuy.com/callback`
- [ ] Auth0 Logout URLs include `https://lithiumbuy.com`
- [ ] Auth0 Web Origins include `https://lithiumbuy.com`
- [ ] Environment variables are correct
- [ ] Tested login on production
- [ ] Tested login locally

---

## 📚 Related Documentation

- `BACKEND_VERIFICATION.md` - Backend setup and testing
- `LITHIUMBUY_AUTH_SETUP.md` - Complete auth setup guide
- `.env.example` - Environment variable reference

**Configuration Guide By**: Warp AI Agent  
**Last Updated**: January 4, 2026
