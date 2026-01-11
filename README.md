# LithiumBuy - B2B Lithium Trading Platform

**Multi-Tenant SaaS Marketplace for Institutional Lithium Procurement**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

---

## 🎯 Overview

LithiumBuy is a next-generation B2B marketplace connecting lithium buyers (Tesla, Panasonic, Rio Tinto) with global suppliers (Albemarle, SQM, Livent). Built with enterprise-grade security, multi-tenancy, and real-time collaboration.

### Key Features

- **🏢 Multi-Tenant Architecture**: Organization-based isolation with RLS
- **🔐 Supabase Auth**: Secure authentication with JWT-based access control
- **⚡ Real-Time Updates**: Live bid tracking, deal notifications, price feeds
- **📱 PWA Ready**: Installable, offline-capable mobile experience
- **🤖 AI-Powered**: Intelligent matching, price forecasting, TeleBuy video
- **🌍 Global Scale**: Support for international trading, multiple currencies
- **📊 Analytics**: Advanced market insights and procurement analytics

---

## 📋 Documentation Index

### 🚀 Deployment & Setup
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** - Complete Vercel deployment guide with environment variables
- **[ARCHITECTURAL_REVIEW.md](./ARCHITECTURAL_REVIEW.md)** - Principal-level architecture review and uplift plan
- **[QUICK_START.md](./QUICK_START.md)** - 30-minute setup guide

### 📖 Development Guides
- **[MVP_COMPLETE_PLAN.md](./MVP_COMPLETE_PLAN.md)** - Complete phase-by-phase implementation plan
- **[PHASE_5_7_READY.md](./PHASE_5_7_READY.md)** - Ready-to-execute tasks for Phases 5-7
- **[PICA_OS_WORKFLOW.md](./PICA_OS_WORKFLOW.md)** - Accelerated development with PicaOS orchestration

### 🔧 Technical Reference
- **[BACKEND_VERIFICATION.md](./BACKEND_VERIFICATION.md)** - Complete backend audit (52 tables, 24 RPCs)
- **[SKILLS.md](./SKILLS.md)** - API reference with all RPC functions
- **[MVP_STATUS.md](./MVP_STATUS.md)** - Progress tracker

---

## 🏗️ Tech Stack

### Frontend
- **React 19.2.0** - Latest React with concurrent features
- **TypeScript** - Type-safe development
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - High-quality UI components
- **React Query** - Server state management
- **React Router v6** - Client-side routing

### Backend
- **Supabase (PostgreSQL)** - Serverless Postgres database
- **Row Level Security (RLS)** - Org-based data isolation
- **Realtime Subscriptions** - Live data updates
- **Edge Functions** - Deno-powered serverless functions
- **Storage** - Document and file management

### Auth & Security
- **Supabase Auth** - Built-in authentication with email/password, magic links, OAuth
- **JWT** - Token-based authentication with automatic session management
- **RLS Policies** - Database-level org isolation
- **Authenticated RPC** - All writes go through authenticated Supabase client
- **HTTPS** - TLS 1.3 encryption

### Infrastructure
- **Vercel** - Edge deployment, CDN, automatic scaling
- **GitHub** - Version control, CI/CD
- **PicaOS** - AI-powered development orchestration

---

## 🚀 Quick Start

### Prerequisites

```bash
Node.js 18.x or higher
npm or bun
Git
Supabase account (free tier)
Vercel account (free tier)
```

### Local Development

```bash
# Clone repository
git clone https://github.com/yourusername/institutional-canvas.git
cd institutional-canvas

# Install dependencies
npm install
# or
bun install

# Copy environment variables
cp .env.example .env.local

# Update .env.local with your credentials (see VERCEL_DEPLOYMENT.md)

# Start development server
npm run dev
# or
bun dev
```

Visit http://localhost:5173

### Environment Variables

See **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** for complete list.

**Required variables**:
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

---

## 🎯 Current Status

### ✅ Completed
- [x] Supabase Auth + OrganizationContext integration
- [x] Onboarding flow (create/join org)
- [x] Purchase order management
- [x] Team management with invites
- [x] Protected routes + Org switcher
- [x] Authenticated RPC chain (all services)
- [x] TeleBuy video negotiation system
- [x] Real-time subscriptions

### 🔄 Remaining
- [ ] Run TeleBuy database migration
- [ ] PWA configuration
- [ ] Unit tests
- [ ] Production deployment

**Progress**: 85% Complete

See **[ARCHITECTURAL_REVIEW.md](./ARCHITECTURAL_REVIEW.md)** for detailed implementation roadmap.

---

## 🚀 Vercel Deployment

### Environment Variables for Vercel

Add these in **Project Settings** → **Environment Variables**:

| Variable | Value | Required |
|----------|-------|----------|
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | ✅ Yes |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | ✅ Yes |

**Important**: 
- Set variables for **Production**, **Preview**, and **Development** environments
- Configure Supabase Auth redirect URLs in Supabase Dashboard → Authentication → URL Configuration

See **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** for complete deployment guide.

### Quick Deploy

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy to production
vercel --prod
```

---

## 🤖 PicaOS Accelerated Development

LithiumBuy uses **PicaOS** to orchestrate multiple AI agents for **2x faster development**.

### Agent Roles
- **Lovable**: Frontend (React, UI, forms, styling)
- **Warp**: Backend (verification, deployment, documentation)
- **Cursor**: Complex logic (TypeScript, optimization, security)

### Quick Setup

```bash
# Install PicaOS CLI
npm install -g @picaos/cli

# Initialize project
cd institutional-canvas
pica init

# Connect agents
pica agent add lovable
pica agent add warp
pica agent add cursor

# Set project context
pica context add MVP_COMPLETE_PLAN.md
pica context add BACKEND_VERIFICATION.md
pica context add PHASE_5_7_READY.md
pica context add VERCEL_DEPLOYMENT.md

# Start Phase 5 (automated)
pica run phase-5
```

### Performance Metrics

**Without PicaOS (Manual)**:
- Phase 5-7: ~4 hours (sequential tasks)

**With PicaOS (Automated)**:
- Phase 5-7: ~2 hours (parallel execution + auto-test + auto-deploy)

**Speed Improvement**: 2x faster

See **[PICA_OS_WORKFLOW.md](./PICA_OS_WORKFLOW.md)** for complete orchestration guide.

---

## 📊 API Reference

### Organizations
```typescript
get_my_organizations()              // List user's orgs
create_organization(params)         // Create new org
invite_org_member(orgId, email)     // Invite team member
claim_org_membership(orgId, token)  // Join org via invite
get_org_members(orgId)              // List org members
```

### Purchases
```typescript
create_purchase(params)             // Create PO (PO-2025-NNNNNN)
list_purchases()                    // List org purchases
get_purchase(poNumber)              // Get single PO
update_purchase_status(poNumber)    // Update PO status
```

### RFQs
```typescript
list_rfqs()                         // List org RFQs
create_rfq(params)                  // Create new RFQ
```

### Bids
```typescript
submit_bid(params)                  // Submit bid on RFQ
withdraw_bid(bidId)                 // Withdraw bid
```

### Deals
```typescript
create_deal(params)                 // Award deal to bid
update_deal_status(dealId, status)  // Update deal status
respond_to_offer(dealId, decision)  // Accept/reject deal
```

See **[SKILLS.md](./SKILLS.md)** for complete API documentation with TypeScript signatures.

---

## 🏢 Multi-Tenant Architecture

### Organization Types
- **Buyers**: Tesla, Panasonic, Rio Tinto (create RFQs, award deals, create POs)
- **Suppliers**: Albemarle, SQM, Livent (submit bids, respond to deals)
- **Admins**: Platform operators (manage all orgs)

### Data Isolation
All data is isolated by `org_id` using Supabase RLS:
```sql
-- Example policy
CREATE POLICY "users_see_only_their_org_data"
ON rfqs FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM org_members 
    WHERE user_id = current_sub()
  )
);
```

### Org Switching
Users can belong to multiple organizations:
```typescript
const { currentOrg, organizations, switchOrg } = useOrganization();

// Switch between Tesla and Rio Tinto
switchOrg('rio-tinto-uuid');
```

---

## 📞 Support

**Documentation**: See `/docs` folder  
**Backend Status**: [BACKEND_VERIFICATION.md](./BACKEND_VERIFICATION.md)  
**Deployment Guide**: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)  
**Development Workflow**: [PICA_OS_WORKFLOW.md](./PICA_OS_WORKFLOW.md)

**Project Maintainer**: @paco  
**Repository**: https://github.com/yourusername/institutional-canvas

---

## 📄 License

Proprietary - All Rights Reserved

---

## 🎉 Acknowledgments

- **Lovable** - Frontend development acceleration
- **Warp** - Terminal + backend tooling
- **Cursor** - AI-powered code editor
- **Supabase** - Auth + Database infrastructure
- **Vercel** - Edge deployment

---

**Built with ❤️ for institutional lithium trading**

🚀 **Ready to ship the MVP!**
