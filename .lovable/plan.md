

# Fix Google Auth Error

## Problem
Clicking "Continue with Google" throws a React error because `GoogleIcon` and `AppleIcon` are plain function components used as children of shadcn's `Button`. Under the hood, Radix UI's `Slot` component tries to forward a ref to these SVG components, which fails because they don't accept refs.

## Fix (1 file, ~10 lines changed)

### `src/pages/Auth.tsx`

**Lines 1, 12-38**: Add `forwardRef` import and wrap both icon components:

```typescript
import { useState, useEffect, forwardRef } from 'react';

const GoogleIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
  <svg ref={ref} className="h-5 w-5" viewBox="0 0 24 24" {...props}>
    {/* ...4 existing path elements unchanged... */}
  </svg>
));
GoogleIcon.displayName = 'GoogleIcon';

const AppleIcon = forwardRef<SVGSVGElement, React.SVGProps<SVGSVGElement>>((props, ref) => (
  <svg ref={ref} className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" {...props}>
    {/* ...existing path element unchanged... */}
  </svg>
));
AppleIcon.displayName = 'AppleIcon';
```

No other files need to change. The OAuth flow logic itself (lines 548-566) is correct -- `signInWithOAuth` with `provider: 'google'` and `redirectTo` pointing to `/auth/callback`.

## GitHub Sync Clarification

Lovable cannot pull branches or trigger re-syncs from within the editor. If merged changes from GitHub are not appearing:

1. Check **Project Settings > GitHub** to confirm which branch Lovable is tracking
2. If the tracked branch has the merged commits but they're not showing, push a trivial commit (e.g., add a newline to README) from GitHub/CLI to re-trigger the webhook
3. If the changes are on a different branch than what Lovable tracks, merge that branch into the tracked one

## Post-Fix Verification
1. Click "Continue with Google" -- should redirect to Google consent screen without errors
2. Verify no console warnings about forwardRef
3. Test email/password and demo account login still work

