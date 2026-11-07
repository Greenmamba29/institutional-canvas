# Onboarding CRO: Enterprise Execution Path

## 1) Install the skill (single source of truth)

```bash
npx skills add https://github.com/coreyhaines31/marketingskills --skill onboarding-cro
```

## 2) Enterprise rollout path

### Phase A — Alignment (Week 0)
- Name an executive owner (Growth or Product).
- Define one activation KPI (example: `% of new signups completing first value action in 24h`).
- Freeze one baseline window (last 30 days) so future gains are measurable.

### Phase B — Discovery + Baseline (Week 1)
- Confirm the product-marketing context before recommendations:
  - `.agents/product-marketing-context.md`
  - fallback: `.claude/product-marketing-context.md`
- Document three essentials:
  1. **Product context** (B2B/B2C, ICP, promise)
  2. **Activation definition** (the exact “aha moment”)
  3. **Current funnel state** (signup -> first session -> first value)
- Identify top 3 onboarding drop-off points by segment.

### Phase C — Fast experiments (Weeks 2–4)
- Launch 3 high-impact tests in parallel:
  1. **Time-to-value compression** (fewer steps to first value)
  2. **Guided setup** (wizard/checklist with clear next action)
  3. **Contextual nudges** (triggered prompts/email/in-app)
- Use one experiment template for every test:
  - Hypothesis
  - Audience
  - Primary metric (activation)
  - Secondary guardrail (conversion/churn/support load)
  - Stop/go decision date

### Phase D — Scale winners (Weeks 5–8)
- Keep only tests with clear positive lift and no major guardrail regressions.
- Convert winners into default onboarding flows.
- Add lifecycle reinforcement (D1/D3/D7 messages mapped to incomplete steps).

## 3) Operating cadence (what “perfect path” looks like)

### Weekly activation review (30 min)
- Review activation rate, time-to-aha, and drop-offs.
- Decide: kill, keep, or scale each experiment.
- Assign one owner and one deadline per decision.

### Monthly executive checkpoint (45 min)
- Report baseline vs current activation and retention deltas.
- Translate lift into revenue impact (pipeline velocity or expansion likelihood).
- Approve next month’s experiment budget and priority segments.

## 4) Prompt template for your internal team

Use this with the installed skill to keep outputs consistent:

```text
Act as our onboarding CRO lead.
First, read .agents/product-marketing-context.md (or .claude/product-marketing-context.md if needed).
Then provide:
1) Our activation definition and aha moment,
2) A 30-day experiment roadmap,
3) The top 3 friction points and fixes,
4) KPI targets with weekly checkpoints.
If context is missing, ask only the minimum questions needed.
```

## 5) Non-negotiables for enterprise quality
- One activation metric owner.
- One canonical event taxonomy in analytics.
- One decision log for every onboarding test.
- No experiment runs without a pre-defined success threshold.

---

If you want, the next step is for me to generate a **company-specific 30/60/90-day onboarding CRO plan** using your exact funnel stages and activation events.
