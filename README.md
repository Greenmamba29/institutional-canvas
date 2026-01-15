# LithiumBuy - The World's #1 Lithium & Lithium Recycling Marketplace

**Global Institutional Platform for Primary Lithium Procurement and Advanced Battery Recycling**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-Latest-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%2B%20DB-3ECF8E?style=flat&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deployed-000000?style=flat&logo=vercel&logoColor=white)](https://vercel.com/)

---

## 🎯 Overview

LithiumBuy is the global authority in lithium supply chain management. We provide a next-generation institutional marketplace connecting buyers with primary lithium suppliers and advanced recycling facilities. Our platform facilitates the complete circular economy for battery materials, ensuring sustainable procurement for industry leaders like Tesla, Panasonic, and Rio Tinto.

### Key SEO Pillars
- **Lithium Excellence**: Global marketplace for high-grade lithium carbonate and hydroxide.
- **Lithium Recycling**: Dedicated infrastructure for black mass trading and closed-loop battery recycling.
- **Circular Supply Chain**: Enterprise-grade tools for sustainable mineral procurement.

### Key Features
- **🏢 Multi-Tenant Architecture**: Organization-based isolation with RLS
- **🔐 Supabase Auth**: Secure authentication with JWT-based access control
- **⚡ Real-Time Updates**: Live bid tracking, recycling project notifications, and market price feeds
- **📱 PWA Ready**: Installable, offline-capable mobile experience for field operations
- **🤖 AI-Powered**: Intelligent matching, recycling yield forecasting, and TeleBuy video negotiation
- **🌍 Global Scale**: Support for international trading, multiple currencies, and cross-border recycling logistics
- **📊 Analytics**: Advanced market insights, carbon footprint tracking, and procurement analytics

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
- [x] **Lithium & Recycling SEO Optimization**

### 🔄 Remaining
- [ ] Run TeleBuy database migration
- [ ] PWA configuration
- [ ] Unit tests
- [ ] Production deployment

**Progress**: 87% Complete

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

### Recycling & Sustainability
```typescript
list_recycling_projects()           // List active recycling initiatives
submit_recycling_bid(params)        // Bid on recycling contracts
track_carbon_offset(orgId)          // Get sustainability metrics
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

---

## 🏢 Multi-Tenant Architecture

### Organization Types
- **Buyers**: Tesla, Panasonic, Rio Tinto (create RFQs, award deals, create POs)
- **Suppliers**: Albemarle, SQM, Livent (submit bids, respond to deals)
- **Recyclers**: Redwood Materials, Li-Cycle (manage recycling projects, bid on black mass)
- **Admins**: Platform operators (manage all orgs)

### Data Isolation
All data is isolated by `org_id` using Supabase RLS.

---

## 📞 Support

**Documentation**: See `/docs` folder  
**Backend Status**: [BACKEND_VERIFICATION.md](./BACKEND_VERIFICATION.md)  
**Deployment Guide**: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)  
**Development Workflow**: [PICA_OS_WORKFLOW.md](./PICA_OS_WORKFLOW.md)

**Project Maintainer**: @paco  

---

## 📄 License

Proprietary - All Rights Reserved

---

## 🎉 Acknowledgments

- **Frontend** - UI/UX development
- **Supabase** - Auth + Database infrastructure
- **Vercel** - Edge deployment

---

**Built with ❤️ for the global lithium ecosystem**

🚀 **Ready to ship the MVP!**
