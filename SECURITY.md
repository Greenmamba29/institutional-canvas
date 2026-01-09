# Security - Key Rotation Checklist

⚠️ **CRITICAL**: The following credentials were previously exposed in the repository and should be considered compromised. Rotate immediately.

## Exposed Credentials (MUST ROTATE)

### 1. ElevenLabs API Key
- **Status**: 🔴 COMPROMISED
- **Action Required**: Regenerate key
- **Steps**:
  1. Go to [ElevenLabs Dashboard](https://elevenlabs.io/app/settings/api-keys)
  2. Revoke the old key: `6673fad2d3c0a1...` (first 14 chars shown)
  3. Generate a new API key
  4. Add to Supabase Edge Function secrets (NOT frontend)

### 2. Auth0 Client Credentials  
- **Status**: 🔴 COMPROMISED
- **Action Required**: Regenerate or rotate client
- **Steps**:
  1. Go to [Auth0 Dashboard](https://manage.auth0.com/)
  2. Navigate to Applications → Your App
  3. Rotate the client credentials
  4. Update environment variables

### 3. Airtable API Key
- **Status**: ⚠️ Placeholder (if real, rotate)
- **Action Required**: Verify and rotate if real
- **Steps**:
  1. Go to [Airtable Account](https://airtable.com/account)
  2. Regenerate personal access token
  3. Add to Supabase Edge Function secrets

## Safe Credentials (No Rotation Needed)

### Supabase Anon Key
- **Status**: ✅ SAFE (public by design)
- The anon key is designed to be public and is protected by Row Level Security (RLS)
- No rotation required

## Environment Variable Security

### Frontend (Safe to Expose)
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_ELEVENLABS_AGENT_ID=agent-id-only-no-api-key
```

### Server-Side Only (NEVER in Frontend)
These must ONLY be in Supabase Edge Function secrets or server environment:
- `ELEVENLABS_API_KEY`
- `OPENAI_API_KEY`  
- `AIRTABLE_API_KEY`
- Database passwords
- Any private/secret keys

## How to Add Secrets to Supabase Edge Functions

```bash
# Via CLI
supabase secrets set ELEVENLABS_API_KEY=your-new-key

# Via Dashboard
# Go to: Project Settings → Edge Functions → Secrets
```

## Verification Checklist

- [ ] Old ElevenLabs API key revoked
- [ ] New ElevenLabs API key generated and added to Edge Functions
- [ ] Auth0 credentials rotated (if applicable)
- [ ] Airtable API key rotated (if real)
- [ ] `.env` file is NOT tracked in git
- [ ] All secrets verified in Supabase dashboard
- [ ] Frontend code verified to NOT contain API keys

## Git History Note

The `.env` file has been removed from the repository. To clean git history completely:

```bash
# Option 1: BFG Repo Cleaner (recommended)
bfg --delete-files .env

# Option 2: git filter-repo
git filter-repo --path .env --invert-paths

# After either option, force push:
git push --force-with-lease
```

---

**Last Updated**: 2025-01-09
**Security Contact**: security@lithiumbuy.com
