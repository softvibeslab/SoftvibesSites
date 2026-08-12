# Business Model: Hermes SaaS + Revenue Share

**Estratega**: Account Strategist  
**Fecha**: 2026-08-06  
**Horizonte**: 12 meses (Q1-Q4 2026)  
**TAM**: $1M+ por vertical post-RE

---

## Modelo de Negocio Recomendado

### Estructura Híbrida: SaaS + Revenue Share + Embedded

```
┌─────────────────────────────────────────────────────────────┐
│                    HERMES SaaS PLATFORM                      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  TIER 1: Operador Junior              $1.5K/mes per seat   │
│    • Read-only: inspect, research, analyze                  │
│    • No deploy authority                                     │
│    • Suitable: Assistants, Analysts                          │
│                                                               │
│  TIER 2: Operador Senior              $4K/mes per seat     │
│    • Full: create, adapt, maintain, publish                 │
│    • Deploy authority + approval signing                     │
│    • Suitable: Project leads, Founders                       │
│                                                               │
│  TIER 3: Enterprise (5+ operators)    Custom pricing        │
│    • Dedicated support                                        │
│    • Priority queue                                          │
│    • Custom workflows                                        │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                      REVENUE SHARE                            │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  If customer ARR grows >40% in 18 months → 8% of revenue   │
│                                                               │
│  Example: Agency builds 20 sites → $1M ARR:                  │
│    • Annual SaaS fees (3 operators × $4K × 12): $144K      │
│    • Revenue share (8% × $1M): $80K                          │
│    • Total Year 2: $224K                                    │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│         EMBEDDED: MenuVibes Integration (Internal)           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  • Hermes as feature in MenuVibes                            │
│  • "Annual refresh" workflow for 50+ restaurant clients      │
│  • Drives MenuVibes upsell (new sites ≈ higher NRR)        │
│  • No separate charge (bundled in MenuVibes)                 │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

**Why this structure**:
- **SaaS** = Predictable MRR (baseline)
- **Revenue share** = Incentives aligned (we grow when customer grows)
- **Embedded** = Viral adoption in MenuVibes without sales friction

---

## 12-Month Roadmap

### PHASE 1: Foundation (Q1-Q2, Now)

**Weeks 1-2: Fix Critical Gaps**
- Pre-commit hooks + gitleaks (stop secrets leaking)
- HMAC-signed approvals (trazabilidad)
- Rollback automation (5 min RTO)

**Weeks 3-6: DX Improvements**
- Interactive `guide` (reduce 35 min → 10 min)
- Error prioritization (reduce re-runs 3.2x → 1.5x)
- VS Code integration ($schema autocomplete)

**Weeks 7-8: Observability**
- CloudWatch audit log (every approval, deploy, error)
- Dashboard: "Deployments today", "Operators activity"
- Runbook: Incident response (SLA 5-15 min containment)

**Deliverables**: 
- ✅ Operator handbook (training ready)
- ✅ Audit trail (audit-ready)
- ✅ 3 certified internal operators
- ✅ Zero contaminación incidents

**Go/No-Go Gate**: Can you onboard a new operator in <4 hours and have them deploy safely?

---

### PHASE 2: First External Customer (Q3, Sep-Nov)

**Target**: Boutique real estate agency
- 5-15 sitios/año (current output: 2-3)
- $80K ARR per client (50+ properties under mgmt)
- High review density (testimonials, ratings)
- Pain point: "Building 20 property pages takes 60 days; we need 10"

**Execution Model**:
```
Month 1 (Sep): Discovery + Co-Execution
  • Audit their current workflow (manual Figma → HTML)
  • Identify 3 quick wins (template, CMS, automation)
  • Build 5 properties together (they observe)
  • Operator certification: their team learns Hermes
  • Cost to them: $8K (pilot)

Month 2 (Oct): Handoff + Training
  • Their operator trains on 10 sites solo
  • We QA 100% (they deploy with our approval)
  • They get sign-off authority (lower lift)
  • Cost to them: $4K (1 month retainer)

Month 3+ (Nov onward): Autonomy
  • They deploy 20+ sites/month autonomously
  • We provide: retainer support ($4K/mo) + per-site ($800)
  • Revenue share kicks in if they grow to $300K+ ARR
  • Cost to them: $4K + (~$8K variable) = $12K/mo baseline
```

**Revenue Math**:
- Pilot month: $8K (one-time)
- Month 2-12: $4K × 11 = $44K
- Per-site variable: ~$6-8K × 3-4 sites/month × 11 months = $198K-264K
- Year 1 total from 1 customer: ~$250-316K gross

**Success Metrics**:
- [ ] 10 sites deployed in Month 1
- [ ] 100% client satisfaction (NPS >50)
- [ ] <2 hours turnaround on QA
- [ ] Zero data contamination or security incidents
- [ ] Customer commits to 3-year renewal

---

### PHASE 3: Scale to 3-5 Customers (Q4, Dec-Feb)

**Parallel plays**:
1. **Food & Beverage agency** (Tacos/restaurants; MenuVibes cross-sell)
2. **Legal practices** (firm directory, lawyer bios; high review-density)
3. **Dental & Medical** (practice sites; compliant scheduling)

**Operator hiring**: Bring on 1-2 junior operators (contract or FTE)
- They handle Tier 1 (inspect, research, create).
- You + senior operator handle Tier 2 (publish, outreach).

**Revenue Target**: $15K MRR ($180K run rate)

---

## Financial Projections

### Year 1 (2026)

| Phase | Q1 | Q2 | Q3 | Q4 | YTD |
|-------|-----|-----|-------|-------|--------|
| **SaaS (MRR)** | Internal | Internal | $8K | $16K | $24K |
| **Per-project** | 0 | 0 | $6K | $18K | $24K |
| **Revenue share** | 0 | 0 | 0 | $2K | $2K |
| **Total** | 0 | 0 | $14K | $36K | $50K |

*(Note: Internal operator costs not deducted; focus on top-line)*

### Year 2 (2027, Projected)

| Scenario | Conservative | Moderate | Aggressive |
|----------|---|---|---|
| **Customers** | 3 | 5 | 8 |
| **SaaS (operators × pricing)** | $48K | $84K | $132K |
| **Per-project revenue** | $120K | $240K | $384K |
| **Revenue share (8% × ARR)** | $96K | $280K | $480K |
| **Total ARR** | $264K | $604K | $996K |

**Breakeven**: ~Q3 2027 (assuming typical SaaS CAC payback 12-15 months)

---

## Competitive Differentiation

### vs. Webflow / Framer
- ❌ They are no-code platforms; Hermes is no-code operations
- ✅ Hermes: human-in-loop, auditable, secure for multi-tenant
- ✅ Hermes: knowledge graph embeds domain (real estate, F&B, etc)

### vs. Zapier / Make (automation)
- ❌ They do task automation; Hermes does complex decision workflows
- ✅ Hermes: gates human approval for risky changes
- ✅ Hermes: templates for entire vertical (not just tasks)

### vs. Generic AI Agent (Claude, ChatGPT)
- ❌ Generic agents can hallucinate, mix clients, miss security gates
- ✅ Hermes: deterministic context (project-id, family, variables)
- ✅ Hermes: audit trail + HMAC signatures
- ✅ Hermes: trained on 46 real projects (not synthetic)

### vs. Internal Team
- ✅ Hermes: 3x faster (20 sites/month vs. 6-8 manual)
- ✅ Hermes: zero client contamination (vs. copy-paste errors)
- ✅ Hermes: senior devs freed for $10K/mo projects

**Defensibility Moat**: Knowledge graph + audit trail + trained operators (not replicable in a weekend)

---

## Go-to-Market: First Customer

### Positioning

**For agency founder**:
> "Launch 20 property pages per month instead of 3, with zero copy-paste errors. Your best junior dev becomes a quality reviewer instead of typing HTML."

**For their client (property owner)**:
> "Your listing is live in 2 days (not 2 weeks). Template = faster + consistent branding."

### Sales Play (8-week cycle)

**Week 1: Discovery Call** (Founder + Ops Lead)
- Pain: How many sites/month? How long each?
- Constraint: Budget? Timeline? Team size?
- Goal: Is there a 2-3x efficiency gap?

**Week 2-3: Co-Execution Pilot** ($8K for 5 sites)
- We build 3 sites together (they watch + learn)
- They build 2 sites (we QA)
- Outcome: Is 20 sites/month possible?

**Week 4-5: Proposal + Contract**
- Retainer: $4K/mo (support + new workflows)
- Per-site: $800/site (or $8K bulk = 10 sites)
- Performance bonus: If ARR > $300K in 18 months, we take 8% rev share

**Week 6-8: Onboarding + Operator Cert**
- Train their lead operator (20 hours)
- Cert: They can deploy solo (with optional QA)
- Setup: Github, Hostinger, CI/CD, audit log

**Target Signed**: Commitment for 3-year (not just month-to-month)

---

## Success Metrics by Phase

### Q1-Q2: Foundation
- ❌ Operator can onboard in <4 hours without escalation
- ❌ Zero secrets leaked to Git
- ❌ Rollback < 5 minutes if deploy breaks

### Q3: First Customer
- ❌ First customer signs (signed contract)
- ❌ Pilot (5 sites) deployed in Month 1
- ❌ NPS > 50 (would recommend)
- ❌ Customer commits to 3-year renewal

### Q4: Scale to 3+
- ❌ 3-5 customers active
- ❌ $15K MRR run rate
- ❌ Operator utilization > 70%
- ❌ Revenue share kicking in (1-2 customers growing)

---

## Pricing Logic

### Why $4K/mo for senior operator?

```
Your cost basis (rough):
  - Senior dev salary: $80K/year = $6.7K/mo (all-in)
  - They operate 10-15 customers
  - Per-customer allocated cost: $450-670/mo
  - Margin: 80% ($3.3-3.5K gross)

Customer value:
  - Without Hermes: 1 dev builds 2-3 sites/month = $15-30K/mo
  - With Hermes: 1 dev (junior) reviews 20 sites/month = $50-100K/mo
  - ROI: 6x for customer, pays $4K/mo = 6 month payback
```

### Tiered Pricing Future

```
TIER 1 (Junior, read-only):       $1.5K/mo
TIER 2 (Senior, full access):     $4K/mo
TIER 3 (Enterprise, 5+ seats):    $15K/mo (20% discount)
```

---

## Risk & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|---|---|---|
| First customer slow to adopt | 40% | High | Co-execute Month 1-2; make success tangible |
| Operator leaves mid-contract | 20% | Medium | Train 2 junior ops in parallel; cross-train |
| New competitor (Webflow) enters | 30% | Medium | Focus on audit trail + knowledge graph (defensible) |
| Legal/compliance blocking | 10% | High | Compliance audit early (SOC 2 roadmap Q4) |

---

## Next Steps

1. **This week**: Pitch first customer (outline pilot)
2. **Next week**: Schedule discovery call
3. **Week 3**: Co-execute 5-site pilot
4. **Week 4+**: Close 3-year contract

