

# Comprehensive Auth, Dashboard UX, and Onboarding Improvements

## Overview
Five areas of work across 4 existing files and 2 new components to improve the sign-in experience, dashboard accessibility, and new user onboarding.

---

## 1. Auth Page Enhancements (src/pages/Auth.tsx)

### Email Validation
- Add real-time email validation using a regex pattern
- Show a green checkmark icon when valid, red X when invalid (only after user starts typing)
- Display inline error text below the input for invalid emails

### Password Strength Indicator (Sign Up mode only)
- Add a `getPasswordStrength()` helper that returns weak/medium/strong based on length, mixed case, numbers, and special characters
- Render a colored progress bar below the password field: red (weak), yellow (medium), green (strong)
- Show text label beside the bar

### Per-Button Loading States
- Replace single `isLoading` boolean with an object: `{ form: false, google: false, apple: false, demo: false }`
- Each button shows its own spinner independently
- All buttons disabled when any action is in progress

### Forgot Password Prominence
- Change from `text-xs text-primary hover:underline` to a styled Button with `variant="link"` and larger text
- Use cyan/primary color with an icon (KeyRound)

### Success Message After Sign Up
- Already partially implemented; ensure the toast fires with a 2-second delay before redirect to `/onboarding`

---

## 2. Dashboard Header User Menu (src/components/layout/LayoutShell.tsx)

### New User Profile Dropdown in Header
- Replace the static user profile display (lines 464-475) with an interactive dropdown menu using shadcn DropdownMenu
- Dropdown contents:
  - User name and email (non-clickable label)
  - Subscription tier badge (PRO/FREE/ENTERPRISE)
  - Profile link (to /settings)
  - Settings link (to /settings)
  - Billing link (to /settings/billing)
  - Separator
  - Sign Out button (destructive red styling)
- This gives users instant access to essential controls without scrolling the sidebar

### Import Additions
- Add DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger from shadcn
- Add User, CreditCard icons (CreditCard already imported)

---

## 3. Auth Callback Improvements (src/pages/AuthCallback.tsx)

### Better Loading State
- Replace simple spinner with a branded loading card showing the LithiumBuy logo, animated progress bar, and "Completing authentication..." text
- Add step indicators: "Verifying credentials...", "Setting up session...", "Redirecting..."

### Error State with Retry
- Show a card with error icon, specific error message, and two buttons: "Try Again" (navigates to /auth) and "Contact Support"
- Provider-specific error messages (detect "google" or "apple" in the error string)

### First-Time User Detection
- After successful session establishment, check if user has an organization via a quick Supabase query
- If no org found, redirect to `/onboarding` instead of `/dashboard`
- Store `is_new_user` flag in sessionStorage for the welcome modal

---

## 4. Welcome Modal (NEW: src/components/onboarding/WelcomeModal.tsx)

### Component Design
- A shadcn Dialog that shows on first visit to the dashboard after sign-up
- Checks `localStorage.getItem('lithiumbuy_welcome_seen')` to avoid repeat shows
- Also checks `sessionStorage.getItem('is_new_user')` set by AuthCallback
- Contents:
  - Sparkles icon with gradient background
  - "Welcome to LithiumBuy!" heading
  - 2-3 sentence platform intro
  - "Take a Quick Tour" button (navigates to /onboarding with tour step)
  - "Skip for Now" button (closes modal, sets localStorage flag)
- Sets `localStorage.setItem('lithiumbuy_welcome_seen', 'true')` on dismiss

---

## 5. Onboarding Checklist (NEW: src/components/onboarding/OnboardingChecklist.tsx)

### Component Design
- A Card component rendered on the Dashboard page for users who haven't completed all steps
- Checks completion via user profile data and org membership
- Checklist items:
  1. "Complete your profile" -- links to /settings, checked if user has `full_name` in metadata
  2. "Explore the marketplace" -- links to /marketplace, checked via localStorage flag
  3. "Create your first RFQ" -- links to /rfqs, checked if user has any RFQs in the database
- Shows a progress bar (0/3, 1/3, etc.)
- "Dismiss" button that hides permanently via localStorage
- Integrated into Dashboard.tsx above the KPI grid for new users

---

## Files Modified

| File | Changes |
|------|---------|
| `src/pages/Auth.tsx` | Email validation, password strength, per-button loading, forgot password styling |
| `src/components/layout/LayoutShell.tsx` | Replace static user profile with DropdownMenu in header |
| `src/pages/AuthCallback.tsx` | Branded loading, error retry, first-time user redirect |
| `src/pages/Dashboard.tsx` | Import and render WelcomeModal + OnboardingChecklist |
| `src/components/onboarding/WelcomeModal.tsx` | NEW -- welcome dialog for first-time users |
| `src/components/onboarding/OnboardingChecklist.tsx` | NEW -- getting started checklist card |
| `src/components/onboarding/index.ts` | Add exports for new components |

---

## Technical Notes

- All new components use shadcn/ui primitives (Dialog, Card, Progress, DropdownMenu, Badge)
- No new dependencies required -- everything uses existing shadcn and Lucide icons
- localStorage keys: `lithiumbuy_welcome_seen`, `lithiumbuy_marketplace_visited`, `lithiumbuy_checklist_dismissed`
- The DropdownMenu in the header uses `bg-popover` for solid background (no transparency issues)
- Password strength logic: weak (<8 chars), medium (8+ with mixed case or numbers), strong (12+ with upper, lower, number, special)

